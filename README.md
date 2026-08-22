# BrainHero Website

Official landing page for **BrainHero: Brain Training**, an iPhone app featuring quick daily games for memory, logic, math, focus, and reaction.

The website is built with static HTML, CSS, and JavaScript. It includes a responsive landing page, App Store download call-to-action, custom BrainHero artwork, SEO/AEO metadata, and localized pages for every language supported by the app.

## Build localized pages

Edit the shared template in `src/index.template.html` or translations in `src/locales.json`, then regenerate the committed static pages and sitemap:

```bash
npm run build
```

Run the automated multilingual SEO/AEO checks after content or template changes:

```bash
npm run audit:seo
```

The build tracks a content hash for each locale in `src/lastmod.json`. Sitemap `lastmod` dates only change when the corresponding generated page changes meaningfully.

Market-specific search intent lives in `src/seo-keywords.json`. Each locale has one primary query and a small secondary cluster based on local phrasing and regional search suggestions. The primary query is used in the page title and a visible heading; related terms enrich the structured data and are supported by the localized page copy. Do not add a `meta keywords` tag.

## Local preview

The generated pages are fully static. You can open `index.html` directly in a browser without starting a server; relative asset and language-page links work from both the root page and locale folders.

For an HTTP preview that matches production routing:

```bash
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

## License

© 2026 kai7.app
