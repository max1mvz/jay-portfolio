# Jay Lovete — Portfolio Website

An elegant, animated portfolio for **Ernesto "Jay" Lovete Jr.**,
Senior Graphic Designer (Amazon brand specialist).

Dark editorial aesthetic · WebGL "undertones" shader background · scroll-snap
navigation with replay reveals · brand-based portfolio · cinematic scroll pages ·
fully responsive.

## Files

```
index.html          — homepage (hero + browse-by-brand grid + about/services/contact)
brand.html          — per-brand page (?key=…): infographics viewer + A+/storefront
cinematic.html      — Three.js cinematic scroll experience
cinema/             — "The Reel": frame-scrubbed cinematic site (scroll-cinematic build)
monogram/           — MONOGRAM, the official CMS (see below)
data/*.json         — all editable content (brands, home copy, site/contact)
images/             — media library
js/content.js       — data-driven rendering (brand grid, brand pages, hero columns)
js/main.js          — interactions, reveals, cursor, nav
js/shader-bg.js     — animated WebGL background
css/styles.css      — main styling · css/case.css — brand/case pages · css/cinematic.css
```

Legacy craft pages (`storefronts.html`, `aplus.html`, `infographics.html`,
`ease.html`, …) still exist but are no longer linked from the nav.

## Run it locally

```powershell
.\start-website.bat        # or: python -m http.server 4321
```
Open **http://localhost:4321**

## Edit content — MONOGRAM (the official CMS)

All content is edited through **Monogram**, a zero-dependency self-hosted CMS
built for this portfolio (`monogram/`).

```powershell
cd monogram
node server.js             # or double-click monogram\Launch Monogram.bat
```
Open **http://localhost:4707** — edits autosave straight into `data/*.json`
and are live on the site immediately (refresh to see them).

| Admin section    | Edits                                   |
|------------------|-----------------------------------------|
| Brands           | Portfolio grid + each brand's Storefront / A+ / Infographics sections |
| Home page        | SEO, nav labels, hero, about + stats, services, contact, footer |
| Site & contact   | Name, email, phone, socials              |
| Media            | `images/` — drag-and-drop upload         |

Safety: Monogram snapshots all data files to `monogram/backups/` on every start
and keeps a last-known-good copy before every save.

## Publish (free options)

- **Netlify / Vercel / Cloudflare Pages:** drag-and-drop this folder or connect the repo.
- **GitHub Pages:** push and enable Pages.

No build step — plain HTML/CSS/JS. (Monogram is a local editing tool; don't
deploy `monogram/` publicly without adding a password gate.)

## Accessibility & performance
- Respects `prefers-reduced-motion` everywhere (snap, reveals, shader, carousels).
- Custom cursor and heavy effects are desktop-only.
- Animated background pauses when the tab is hidden.
