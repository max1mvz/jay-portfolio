# Jay Lovete — Portfolio Website

An elegant, minimalist, animated portfolio for **Ernesto "Jay" Lovete Jr.**,
Senior Graphic Designer (Amazon brand specialist).

Dark editorial aesthetic · kinetic serif typography · glassmorphism · scroll
animations · custom cursor · fully responsive.

## Files

```
index.html          — homepage structure & copy
storefronts.html / aplus.html / infographics.html — gallery pages (render from data/)
ease.html, optiflow.html, dermtheory.html, …      — case-study pages
data/*.json         — editable content (storefronts, A+, infographics, site/contact)
admin/              — Decap CMS admin (index.html + config.yml)
js/content.js       — renders the gallery pages from data/*.json
js/main.js          — interactions + homepage flagship card
css/styles.css      — all styling, colors, animations
css/case.css        — case-study + gallery page styling
```

## Run it locally

Any static server works. From this folder:

```powershell
python -m http.server 4321
```

Then open http://localhost:4321

## Edit content in the admin (no code)

Storefronts, A+ Content, Infographics, and your site/contact info are now
**data-driven** — the pages render from `data/*.json`, and you edit those through a
visual admin (Decap CMS) with add/edit/delete and image upload.

### Run the admin locally

```powershell
npm install            # first time only — installs the local CMS proxy
.\start-admin.bat      # starts the site + CMS, opens http://localhost:4321/admin/
```

Or manually, in two terminals:

```powershell
npx decap-server        # CMS proxy on http://localhost:8081
python -m http.server 4321
```

Then open **http://localhost:4321/admin/** and click **Login** (the local backend
needs no account). Changes are written straight to the JSON files in `data/` and
images into `images/`.

### What you can edit
Essentially **all copy on the site**:
- **Site & Contact** → `data/site.json`
- **Home Page** → `data/home.json` (hero, about + stats, work + category cards, services, contact, footer)
- **Storefronts** → `data/storefronts.json` (page hero + add/edit/delete cards, covers, links)
- **A+ Content** → `data/aplus.json` (page hero/banner + projects)
- **Infographics** → `data/infographics.json` (page hero/banner, featured card + brand galleries; add more images per brand)
- **Case Studies** → `data/case-studies.json` (ease/optiflow/dermtheory/moonjax/beemo — back link, draft banner, hero + buttons, meta, brief/idea/outcome copy, and anatomy notes & images)

How it works: pages keep their HTML/animations; elements tagged `data-cms="file:path"`
are filled from JSON by `js/content.js` on load. Clearing a field empties/hides it
(e.g. delete a draft banner, or a case study's "View live" button).

> Not yet in the CMS: the homepage flagship work card (still from `js/main.js`),
> decorative marquees, and *creating a brand-new* case-study page (editing existing
> ones is fully supported).

### Going live later
This repo is Git-ready. Push to GitHub, deploy on **Netlify**, and enable
**Identity + Git Gateway** — the same `/admin/` then works on the live site with a
login, and every save becomes a commit that auto-deploys. (The `backend:
git-gateway` block in `admin/config.yml` is already set for this; `local_backend`
is ignored in production.)

## Customize (advanced / by hand)

### Swap in your real project images
Open `js/main.js` and find the `projects` array near the top. Each project
currently uses a colored gradient + monogram placeholder. To use a real
screenshot, add an `img` and update the card markup:

1. Drop your image in a new `images/` folder (e.g. `images/dermtheory.jpg`).
2. In the project object, change the `card__art` line to use your image, e.g.
   replace the gradient `<span class="card__art" style="...">` with
   `<span class="card__art" style="background-image:url('images/dermtheory.jpg');background-size:cover;background-position:center"></span>`
   and remove the `card__monogram` line for that card.
3. Set the project's `url` to its live Amazon storefront link so the card clicks through.

### Edit text
All copy (bio, stats, services, contact) lives in `index.html` — edit directly.

### Change colors
Top of `css/styles.css`, the `:root` block. `--accent` is the bronze; `--ink`
is the background; `--bone` is the text.

## Publish (free options)

- **Netlify / Vercel:** drag-and-drop this folder, or connect a repo.
- **GitHub Pages:** push to a repo, enable Pages on the `main` branch.
- **Cloudflare Pages:** connect repo or direct upload.

No build step is required — it's plain HTML/CSS/JS.

## Accessibility & performance notes
- Respects `prefers-reduced-motion` (animations disable for users who request it).
- Custom cursor and parallax are desktop-only; touch devices get native cursor.
- Fonts loaded from Google Fonts; everything else is self-contained.
