# AshmoTV — portfolio v6

Interactive portfolio for Ashish G. (AshmoTV), built with **Vite + Three.js + GSAP + Lenis**.
Every image and video on the site is rendered through WebGL (hover ripple, scroll-bend, chromatic split),
the home hero is a morphing particle sculpture, and all project pages are generated from JSON —
so adding work never means touching page code.

## Run it

```bash
npm install        # once
npm run dev        # local preview at http://127.0.0.1:5173 (drafts visible here)
npm run build      # production site in dist/ (drafts removed)
npm run preview    # preview the built site
```

Requires Node 18+ and, for the media step, **ffmpeg** on your PATH.

> **Judge speed on the built site, not `npm run dev`.** The dev server serves ~30 unbundled,
> unminified modules (Three.js alone is ~6 MB there) and re-validates them on every page load.
> `npm run build && npm run preview` (http://127.0.0.1:4173) is what visitors actually get.

## Add new work (the 3-step loop)

1. **Drop the media** into `media-src/<folder>/` — GIF, MP4, MOV, WebM, PNG, JPG all work.
   Use a folder per project, e.g. `media-src/lab/my-new-lora/01.gif`.
2. **Convert it:** `npm run media`
   - GIF/video → small looping H.264 `.mp4` + `.jpg` poster in `public/media/…` (same folder structure)
   - images → web `.jpg` (max 1920 px)
   - updates `src/content/media.json` (sizes) and warns about any broken references
3. **Describe it** in `src/content/projects.json` (or `gallery.json` for the Archive). Refer to media by its
   converted path **without** `public/media/`: `"lab/my-new-lora/01.mp4"`.

Then `npm run build` and upload `dist/`.

### Project entry

```jsonc
{
  "id": "my-new-lora",                 // used in the URL: project.html?id=my-new-lora
  "section": "lab",                    // "lab" (AI Lab page) or "work" (Work page)
  "type": "lora",                      // lab: lora | exploration | experiment | tool
                                       // work: ai-campaign | campaign | product-launch | brand-film | content-series
  "featured": true,                    // show on the home page
  "draft": false,                      // true = only visible in `npm run dev`
  "title": "My New LoRA",
  "summary": "One sentence for cards and previews.",
  "cover": "lab/my-new-lora/cover.mp4",   // .mp4 / .jpg path, or "youtube:VIDEO_ID"
  "caption": "Optional line under the cover",
  "client": "HP", "year": "2026",
  "roles": ["Creative Producer"],
  "tools": ["ComfyUI", "AI Toolkit"],
  "models": ["Wan 2.2"],
  "stats": [{ "value": "500+", "label": "assets" }],
  "links": [{ "label": "Hugging Face", "url": "https://huggingface.co/..." }],
  "body": ["Paragraph one. Links work like [this](https://example.com).", "Paragraph two."],
  "sections": [
    { "title": "Explorations", "text": "Optional subtitle",
      "media": ["lab/my-new-lora/01.mp4", { "src": "lab/my-new-lora/02.jpg", "caption": "Reference" }] },
    { "title": "Film", "layout": "wide", "media": ["youtube:VIDEO_ID"] }
  ]
}
```

Section `layout`: omit for a masonry grid · `"wide"` one item per row · `"stack"` very wide strips · `"shorts"` vertical 9:16 videos.
Order in the file = order on the site. Only `id`, `section`, `type`, `title` and `cover` are required.

**Placeholders waiting for you** (drafts, visible only in dev): `tool-draft-1`, `tool-draft-2`, `lora-draft-1`,
`ai-campaign-draft-1`, `ai-campaign-draft-2`. Fill them in and set `"draft": false` (or delete them).

### Archive item (`gallery.json`)
```json
{ "src": "archive/62.mp4", "title": "Optional title" }
```

### Site details (`site.json`)
Email, phone, socials, availability text, showreel (`"youtube:ID"`) and the client logo list
(logos live in `public/brand/clients/` — white on transparent PNG).

## Themes

Visitors pick a **mode** (Lab = dark, Paper = light) and an **accent** (Ember, Acid, Ion, Ultraviolet)
from the swatch button in the nav; the choice is remembered and applied before the first paint.
The site opens in Lab + Ember by default.

All colours live in `src/styles/base.css` (top of the file):
- `:root` = dark palette + Ember; `[data-mode='light']` = Paper palette.
- `[data-accent='…']` = accent colours on dark; `[data-mode='light'][data-accent='…']` = deeper versions for paper.
- The WebGL background, particles and reveal edges read these same tokens and animate when the theme changes.

To add an accent: add the two `[data-accent='name']` rules in `base.css`, then add
`{ id: 'name', label: 'Name', swatch: '#hex' }` to `ACCENTS` in `src/core/theme.js` and the id to the
list in the small inline `<script>` at the top of each `*.html` page.

## Deploy (GitHub Pages → ashmotv.site)

The repo `AshmoTV/site` publishes automatically: **every push to `dev` builds the site and deploys it to
https://ashmotv.site** (workflow: `.github/workflows/deploy.yml`, ~1 minute). `dev` is the default branch;
the previous Mobirise site is preserved untouched on `main`.

```bash
git add -A
git commit -m "Add new LoRA"
git push
```

Watch a deploy: repo → **Actions** tab (or `gh run watch`).

**Roll back to the old Mobirise site** (instant, keeps the domain):
```bash
gh api -X PUT repos/AshmoTV/site/pages -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"
```
Switch back to the new site with `gh api -X PUT repos/AshmoTV/site/pages -f build_type=workflow`.

Other hosts: `dist/` is a plain static site with relative paths (works on Netlify, Vercel, cPanel/FTP, sub-folders).
Commit `public/media/` (the converted files); `media-src/` (originals) is git-ignored.

## Structure

```
*.html                    page shells (index, work, lab, gallery, about, contact, project, 404)
src/pages/*.js            one module per page
src/core/app.js           boot: smooth scroll, WebGL, cursor, nav/footer, transitions
src/core/gl/engine.js     WebGL canvas: background shader + DOM-synced media planes
src/core/gl/hero.js       home particle sculpture
src/core/content.js       content + media helpers
src/styles/base.css       design tokens + shared components
src/content/*.json        ALL the content
scripts/media.mjs         media pipeline (npm run media)
scripts/migrate-from-v5.py  one-time import from the old Mobirise site (already done)
docs/BUILD-BRIEF.md       conventions for developers
```

Accessibility & performance: respects `prefers-reduced-motion`; touch devices get native scrolling with
plain media (WebGL planes are desktop-only); videos load lazily and pause off-screen.
