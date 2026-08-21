# BrainHero Website

Clean, fast, conversion-focused landing for **BrainHero: Brain Training** (iOS).

- **Live:** add your domain via GitHub Pages (see below), then point DNS.
- **Stack:** pure static HTML/CSS/JS — no build step, instant deploys, great Lighthouse score.
- **App:** https://apps.apple.com/us/app/brainhero-brain-training/id6779550221

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push to GitHub (already done).
2. Repo → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `/(root)` → Save.
3. **Custom domain:** Settings → Pages → Custom domain → enter your domain (e.g. `brainhero.kai7.app`) → Save.
4. DNS at your registrar:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - or `CNAME` → `<username>.github.io` (if using subdomain)
5. Wait for DNS check, then enable **Enforce HTTPS**.

## SEO / AEO

- Title + meta description aligned to App Store copy (no medical claims)
- OG + Twitter cards, canonical, sitemap, robots
- JSON-LD: `SoftwareApplication` + `FAQPage` (AEO) + `Organization`
- Semantic headings, FAQ structured data, fast static assets

## Assets

- `assets/screenshots/` — 7 App Store screenshots (official)
- `assets/icons/app-icon.jpg` — app icon
- `assets/generated/*.png` — AI-generated category visuals + Nori mascot cutouts (background removed via `rembg`)

## License

© 2026 kai7.app
