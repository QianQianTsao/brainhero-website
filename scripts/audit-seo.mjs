import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://brainhero.app";
const translations = JSON.parse(await readFile(path.join(root, "src/locales.json"), "utf8"));
const seoKeywords = JSON.parse(await readFile(path.join(root, "src/seo-keywords.json"), "utf8"));
const locales = Object.keys(translations);
const searchLocale = locale => locale === "es-419" ? "es-MX" : locale;
const sentenceCase = (value, locale) => value.replace(/^./u, character => character.toLocaleUpperCase(locale));
const urlPath = locale => locale === "en" ? "/" : `/${locale.toLowerCase()}/`;
const expectedHreflangs = new Set([...locales.map(searchLocale), "x-default"]);
const errors = [];

const count = (text, pattern) => [...text.matchAll(pattern)].length;
const requireMatch = (html, pattern, label, file) => {
  const value = html.match(pattern)?.[1];
  if (!value) errors.push(`${file}: missing ${label}`);
  return value;
};
const hasType = (node, type) => Array.isArray(node?.["@type"]) ? node["@type"].includes(type) : node?.["@type"] === type;

for (const locale of locales) {
  const relativeFile = locale === "en" ? "index.html" : `${locale.toLowerCase()}/index.html`;
  const file = path.join(root, relativeFile);
  const directory = path.dirname(file);
  const html = await readFile(file, "utf8");
  const canonical = `${siteUrl}${urlPath(locale)}`;
  const seo = seoKeywords[locale];
  const brandName = locale === "zh-Hans" ? "脑英雄" : ["zh-Hant", "zh-HK"].includes(locale) ? "腦英雄" : "BrainHero";
  const seoHeading = sentenceCase(seo.primary, locale);
  const expectedTitle = `${brandName} — ${seoHeading}`;

  if (!html.includes(`<html lang="${locale}"`)) errors.push(`${relativeFile}: incorrect html lang`);
  if (count(html, /<title>[^<]+<\/title>/g) !== 1) errors.push(`${relativeFile}: title must be present exactly once`);
  if (!html.includes(`<title>${expectedTitle}</title>`)) errors.push(`${relativeFile}: title does not target the market primary query`);
  if (!html.includes(`<h2 id="answers-title">${seoHeading}</h2>`)) errors.push(`${relativeFile}: visible primary-query heading mismatch`);
  if (/<meta\s+name=["']keywords["']/i.test(html)) errors.push(`${relativeFile}: obsolete meta keywords tag must not be used`);
  requireMatch(html, /<meta name="description" content="([^"]+)">/, "meta description", relativeFile);
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) errors.push(`${relativeFile}: incorrect self-canonical`);
  if (!html.includes(`<meta property="og:url" content="${canonical}">`)) errors.push(`${relativeFile}: incorrect og:url`);
  for (const property of ["og:title", "og:description", "og:image", "og:image:alt"]) {
    if (!html.includes(`<meta property="${property}"`)) errors.push(`${relativeFile}: missing ${property}`);
  }
  for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) {
    if (!html.includes(`<meta name="${name}"`)) errors.push(`${relativeFile}: missing ${name}`);
  }

  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
  const actualHreflangs = new Set(alternates.map(match => match[1]));
  if (alternates.length !== expectedHreflangs.size ||
      [...expectedHreflangs].some(hreflang => !actualHreflangs.has(hreflang))) {
    errors.push(`${relativeFile}: incomplete or duplicate hreflang cluster`);
  }
  if (alternates.some(match => !match[2].startsWith("https://"))) errors.push(`${relativeFile}: hreflang URL is not absolute HTTPS`);
  if (!alternates.some(match => match[1] === searchLocale(locale) && match[2] === canonical)) {
    errors.push(`${relativeFile}: missing self hreflang`);
  }
  if (actualHreflangs.has("es-419")) errors.push(`${relativeFile}: Google does not support es-419 hreflang; use es-MX`);

  if (count(html, /<h1(?:\s|>)/g) !== 1) errors.push(`${relativeFile}: expected one h1`);
  if (count(html, /<article id="faq-\d+"/g) !== translations[locale].faq.length) errors.push(`${relativeFile}: visible FAQ count mismatch`);
  if (/\{\{[A-Za-z]/.test(html)) errors.push(`${relativeFile}: unresolved template placeholder`);

  const jsonText = requireMatch(html, /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/, "JSON-LD", relativeFile);
  if (jsonText) {
    try {
      const graph = JSON.parse(jsonText)["@graph"];
      const website = graph.find(node => hasType(node, "WebSite"));
      const webpage = graph.find(node => hasType(node, "WebPage"));
      const organization = graph.find(node => hasType(node, "Organization"));
      const image = graph.find(node => hasType(node, "ImageObject"));
      const app = graph.find(node => hasType(node, "SoftwareApplication"));
      const faq = graph.find(node => hasType(node, "FAQPage"));
      if (!website || !webpage || !organization || !image || !app || !faq) errors.push(`${relativeFile}: incomplete JSON-LD graph`);
      if (webpage?.url !== canonical || webpage?.inLanguage !== locale) errors.push(`${relativeFile}: WebPage locale or URL mismatch`);
      if (webpage?.name !== expectedTitle || webpage?.keywords?.[0] !== seo.primary) errors.push(`${relativeFile}: WebPage keyword targeting mismatch`);
      if (!app?.name || app?.offers?.price !== 0 || app?.applicationCategory !== "GameApplication") errors.push(`${relativeFile}: incomplete SoftwareApplication required data`);
      if (app?.keywords?.length !== 1 + seo.secondary.length || app?.keywords?.[0] !== seo.primary) errors.push(`${relativeFile}: SoftwareApplication keyword set mismatch`);
      if (app?.mainEntityOfPage?.["@id"] !== `${canonical}#webpage`) errors.push(`${relativeFile}: app is not linked to WebPage`);
      if (faq?.mainEntity?.length !== translations[locale].faq.length) errors.push(`${relativeFile}: FAQ JSON-LD count mismatch`);
    } catch (error) {
      errors.push(`${relativeFile}: invalid JSON-LD (${error.message})`);
    }
  }

  const languageLinks = [...html.matchAll(/<a lang="([^"]+)" hreflang="([^"]+)" href="([^"]+)" data-file-href="([^"]+)"/g)];
  if (languageLinks.length !== locales.length) errors.push(`${relativeFile}: language menu count mismatch`);
  for (const [, linkedLocale, hreflang, href, fileHref] of languageLinks) {
    if (hreflang !== searchLocale(linkedLocale)) errors.push(`${relativeFile}: invalid menu hreflang for ${linkedLocale}`);
    if (href !== `${siteUrl}${urlPath(linkedLocale)}`) errors.push(`${relativeFile}: menu link is not canonical for ${linkedLocale}`);
    if (!existsSync(path.resolve(directory, fileHref))) errors.push(`${relativeFile}: direct-file link does not resolve (${fileHref})`);
  }

  for (const match of html.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)) {
    const reference = match[1];
    if (/^(?:https?:|\/\/|mailto:)/.test(reference)) continue;
    if (!existsSync(path.resolve(directory, reference.split("?")[0]))) errors.push(`${relativeFile}: local asset does not resolve (${reference})`);
  }
}

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const lastmod = JSON.parse(await readFile(path.join(root, "src/lastmod.json"), "utf8"));
if (count(sitemap, /<loc>/g) !== locales.length) errors.push("sitemap.xml: canonical URL count mismatch");
if (sitemap.includes('hreflang="es-419"')) errors.push("sitemap.xml: unsupported es-419 hreflang");
if (!sitemap.includes('hreflang="es-MX" href="https://brainhero.app/es-419/"')) errors.push("sitemap.xml: missing es-MX mapping");
for (const locale of locales) {
  if (!sitemap.includes(`<loc>${siteUrl}${urlPath(locale)}</loc>`)) errors.push(`sitemap.xml: missing ${locale} canonical`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod[locale]?.lastmod ?? "")) errors.push(`src/lastmod.json: invalid date for ${locale}`);
  if (!sitemap.includes(`<lastmod>${lastmod[locale]?.lastmod}</lastmod>`)) errors.push(`sitemap.xml: lastmod mismatch for ${locale}`);
}

const robots = await readFile(path.join(root, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) errors.push("robots.txt: incorrect sitemap URL");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`SEO/AEO audit passed for ${locales.length} locales.`);
console.log("Validated canonicals, hreflang reciprocity, metadata, semantic headings, visible FAQs, JSON-LD, sitemap, and direct-file paths.");
