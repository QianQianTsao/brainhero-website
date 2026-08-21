import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://brainhero.app";
const template = await readFile(path.join(root, "src/index.template.html"), "utf8");
const translations = JSON.parse(await readFile(path.join(root, "src/locales.json"), "utf8"));

const localeMeta = {
  en: { path: "", name: "English", og: "en_US" },
  ar: { name: "العربية", og: "ar_SA", dir: "rtl" },
  ca: { name: "Català", og: "ca_ES" },
  "zh-HK": { name: "中文（香港）", og: "zh_HK" },
  "zh-Hans": { name: "简体中文", og: "zh_CN" },
  "zh-Hant": { name: "繁體中文", og: "zh_TW" },
  hr: { name: "Hrvatski", og: "hr_HR" },
  cs: { name: "Čeština", og: "cs_CZ" },
  da: { name: "Dansk", og: "da_DK" },
  nl: { name: "Nederlands", og: "nl_NL" },
  fi: { name: "Suomi", og: "fi_FI" },
  fr: { name: "Français", og: "fr_FR" },
  "fr-CA": { name: "Français (Canada)", og: "fr_CA" },
  de: { name: "Deutsch", og: "de_DE" },
  el: { name: "Ελληνικά", og: "el_GR" },
  he: { name: "עברית", og: "he_IL", dir: "rtl" },
  hi: { name: "हिन्दी", og: "hi_IN" },
  hu: { name: "Magyar", og: "hu_HU" },
  id: { name: "Bahasa Indonesia", og: "id_ID" },
  it: { name: "Italiano", og: "it_IT" },
  ja: { name: "日本語", og: "ja_JP" },
  ko: { name: "한국어", og: "ko_KR" },
  lt: { name: "Lietuvių", og: "lt_LT" },
  ms: { name: "Bahasa Melayu", og: "ms_MY" },
  nb: { name: "Norsk bokmål", og: "nb_NO" },
  pl: { name: "Polski", og: "pl_PL" },
  "pt-BR": { name: "Português (Brasil)", og: "pt_BR" },
  "pt-PT": { name: "Português (Portugal)", og: "pt_PT" },
  ro: { name: "Română", og: "ro_RO" },
  ru: { name: "Русский", og: "ru_RU" },
  sk: { name: "Slovenčina", og: "sk_SK" },
  sl: { name: "Slovenščina", og: "sl_SI" },
  es: { name: "Español", og: "es_ES" },
  "es-419": { name: "Español (Latinoamérica)", og: "es_419" },
  "es-US": { name: "Español (Estados Unidos)", og: "es_US" },
  sv: { name: "Svenska", og: "sv_SE" },
  th: { name: "ไทย", og: "th_TH" },
  tr: { name: "Türkçe", og: "tr_TR" },
  uk: { name: "Українська", og: "uk_UA" },
  vi: { name: "Tiếng Việt", og: "vi_VN" }
};

const expectedLocales = Object.keys(localeMeta);
const actualLocales = Object.keys(translations);
if (expectedLocales.some(locale => !translations[locale]) || actualLocales.some(locale => !localeMeta[locale])) {
  throw new Error("src/locales.json and localeMeta must contain the same locales");
}

const urlPath = locale => locale === "en" ? "/" : `/${locale.toLowerCase()}/`;
const localPagePath = (currentLocale, linkedLocale) => {
  if (currentLocale === "en") {
    return linkedLocale === "en" ? "./index.html" : `./${linkedLocale.toLowerCase()}/index.html`;
  }
  return linkedLocale === currentLocale ? "./index.html" :
    linkedLocale === "en" ? "../index.html" : `../${linkedLocale.toLowerCase()}/index.html`;
};
const escapeHtml = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const alternateLinks = expectedLocales
  .map(locale => `  <link rel="alternate" hreflang="${locale}" href="${siteUrl}${urlPath(locale)}">`)
  .concat(`  <link rel="alternate" hreflang="x-default" href="${siteUrl}/">`)
  .join("\n");

for (const locale of expectedLocales) {
  const strings = translations[locale];
  const meta = localeMeta[locale];
  const brandName = locale === "zh-Hans" ? "脑英雄" :
    ["zh-Hant", "zh-HK"].includes(locale) ? "腦英雄" : "BrainHero";
  const canonicalUrl = `${siteUrl}${urlPath(locale)}`;
  const languageLinks = expectedLocales.map(linkedLocale => {
    const linked = localeMeta[linkedLocale];
    const active = linkedLocale === locale ? ' aria-current="page"' : "";
    return `            <a lang="${linkedLocale}" hreflang="${linkedLocale}" href="${localPagePath(locale, linkedLocale)}"${active}>${escapeHtml(linked.name)}</a>`;
  }).join("\n");
  const faqCards = strings.faq.map(({ question, answer }) =>
    `          <article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`
  ).join("\n");
  const availabilityHtml = escapeHtml(strings.availability)
    .replaceAll("iPhone", '<bdi dir="ltr">iPhone</bdi>')
    .replaceAll("iOS 17+", '<bdi dir="ltr">iOS 17+</bdi>');
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${canonicalUrl}#website`,
        url: canonicalUrl,
        name: brandName,
        alternateName: `${brandName} ${strings.brandTagline}`,
        description: strings.metaDescription,
        inLanguage: locale,
        publisher: { "@id": `${siteUrl}/#organization` }
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "kai7.app",
        url: "https://www.kai7.app/",
        brand: { "@type": "Brand", name: brandName },
        logo: { "@type": "ImageObject", url: `${siteUrl}/assets/icons/app-icon.jpg`, width: 1024, height: 1024 }
      },
      {
        "@type": ["SoftwareApplication", "MobileApplication"],
        "@id": `${canonicalUrl}#app`,
        name: `${brandName}: ${strings.brandTagline}`,
        alternateName: brandName,
        url: canonicalUrl,
        description: strings.metaDescription,
        inLanguage: locale,
        applicationCategory: "GameApplication",
        applicationSubCategory: "Brain Training",
        operatingSystem: "iOS 17.0 or later",
        availableOnDevice: "iPhone",
        image: `${siteUrl}/assets/icons/app-icon.jpg`,
        screenshot: [
          `${siteUrl}/assets/screenshots/02-brainhero-daily.jpg`,
          `${siteUrl}/assets/screenshots/03-brainhero-memory.jpg`,
          `${siteUrl}/assets/screenshots/04-brainhero-logic.jpg`
        ],
        offers: { "@type": "Offer", price: 0, priceCurrency: "USD", availability: "https://schema.org/InStock" },
        installUrl: "https://apps.apple.com/app/brainhero-brain-training/id6779550221",
        downloadUrl: "https://apps.apple.com/app/brainhero-brain-training/id6779550221",
        author: { "@id": `${siteUrl}/#organization` },
        publisher: { "@id": `${siteUrl}/#organization` }
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        inLanguage: locale,
        mainEntity: strings.faq.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer }
        }))
      }
    ]
  }, null, 2).split("\n").map(line => `  ${line}`).join("\n");

  const replacements = {
    ...strings,
    brandName,
    locale,
    dir: meta.dir ?? "ltr",
    ogLocale: meta.og,
    canonicalUrl,
    alternateLinks,
    structuredData,
    languageLinks,
    faqCards,
    availabilityHtml,
    currentLanguage: meta.name,
    urlLocale: locale.toLowerCase(),
    homePath: "./index.html",
    assetPrefix: locale === "en" ? "." : ".."
  };
  const rawKeys = new Set(["alternateLinks", "structuredData", "languageLinks", "faqCards", "availabilityHtml"]);
  const html = template.replace(/{{([A-Za-z0-9]+)}}/g, (_, key) => {
    if (!(key in replacements)) throw new Error(`Missing ${key} for ${locale}`);
    return rawKeys.has(key) ? replacements[key] : escapeHtml(replacements[key]);
  });

  const outputDirectory = locale === "en" ? root : path.join(root, locale.toLowerCase());
  if (locale !== "en") {
    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });
  }
  await writeFile(path.join(outputDirectory, "index.html"), html);
}

const sitemapAlternates = expectedLocales.map(locale =>
  `    <xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}${urlPath(locale)}" />`
).concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/" />`).join("\n");
const lastModified = new Date().toISOString().slice(0, 10);
const sitemapEntries = expectedLocales.map(locale => {
  const image = locale === "en" ? `\n    <image:image>\n      <image:loc>${siteUrl}/assets/generated/phone-hero-v2.png</image:loc>\n      <image:title>BrainHero Daily Challenge on iPhone</image:title>\n      <image:caption>BrainHero daily brain-training games for memory, logic, math, focus and reaction.</image:caption>\n    </image:image>` : "";
  return `  <url>\n    <loc>${siteUrl}${urlPath(locale)}</loc>\n    <lastmod>${lastModified}</lastmod>\n${sitemapAlternates}${image}\n  </url>`;
}).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapEntries}\n</urlset>\n`;
await writeFile(path.join(root, "sitemap.xml"), sitemap);

console.log(`Built ${expectedLocales.length} localized pages and sitemap.xml`);
