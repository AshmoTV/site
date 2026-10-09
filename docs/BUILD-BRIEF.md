# Build brief — AshmoTV portfolio v6

Portfolio for **Ashish G. (AshmoTV)** — AI-first 2D/3D motion designer, creative producer, LoRA/model trainer.
Direction: **dark cinematic lab**. Near-black canvas, warm off-white type, ONE ember accent (`--accent #ff5a1f`).
Everything should feel alive and respond to the mouse, but stay fast, legible and tasteful (Awwwards-level, not gimmicky).

Stack: Vite 8 (multi-page) · Three.js · GSAP 3.15 (ScrollTrigger, SplitText, ScrambleText, Flip are all available, free) · Lenis.
Dev server is ALREADY running at http://127.0.0.1:5173 — do not start another. `npx vite build` must pass.

## Files
```
index.html lab.html work.html gallery.html about.html contact.html project.html explorations.html 404.html  (shells — leave as is)
src/core/app.js         boot(page) → app  (smooth scroll, WebGL engine, cursor, nav/footer, transitions)
src/core/content.js     data + media helpers (READ THIS FIRST)
src/core/components.js  projectCard, pageHead, marquee, clientWall, stats, arrowIcon, pad
src/core/reveal.js      declarative animations (attribute list at top of file)
src/core/cursor.js      cursor, magnetic, spotlight, tilt
src/core/media.js       lazy video, playNow(video)
src/core/layout.js      NAV, istTime(), isWorkingHours(), toast()
src/core/gl/*           WebGL engine — do not modify
src/styles/base.css     design tokens + shared components (READ THIS)
src/pages/home.js + src/styles/home.css   reference implementation — read it to match the patterns/quality
src/content/projects.json gallery.json site.json media.json (generated)
```
**Do not edit** anything in `src/core/`, `src/styles/base.css`, `src/pages/home.js`, `src/styles/home.css`, or the content JSON.
If you believe a core change is needed, describe it precisely in your final report instead.

## Page module contract
```js
import gsap from 'gsap';
import { boot } from '../core/app.js';          // FIRST — base.css must load before page css
import '../styles/<page>.css';                   // page styles AFTER boot import
import { ... } from '../core/content.js';

const main = document.getElementById('main');
main.innerHTML = `...`;                          // render static + data-driven markup
const app = await boot('<page>');                // nav ids: work | lab | gallery | about | contact (others: any string)
// ... page-specific interactions (use app.lenis, app.gl, app.touch, app.reduced, app.lightbox)
app.refresh(main);                               // wires WebGL planes, lazy video, reveals, magnetic, spotlight, tilt
```
After rendering NEW markup later (filters, toggles), call `app.refresh(container)` again (idempotent).

## Media (always via content.js)
- `media(ref)` normalises a JSON media ref → `{type:'video'|'image'|'youtube', url, poster, w, h, caption, embed, thumb, id}`.
- `mediaHTML(ref, { fit:'natural'|'cover', ratio:'16/10', cursor:'View', tilt, mute, gl:true, cls, alt })` → `<figure class="media" data-gl>` markup.
  Videos lazy-load and only play near the viewport. On desktop each `[data-gl]` figure is mirrored by a WebGL plane
  (hover ripple, pointer bulge, scroll-velocity bend, chromatic split, reveal wipe). On touch / reduced motion the plain DOM media shows.
- `toLightbox(refs)` + `app.lightbox.open(items, index)` → fullscreen viewer (keys, swipe, prev/next). YouTube refs embed there.
- A single `.media--youtube` figure opens the lightbox automatically on click. Add `data-lb-handled` to the figure if your page handles clicks itself.
- `rich(text)` renders paragraphs with `[label](url)` links. `esc()` escapes text. `projectUrl(p)` → `project.html?id=…`.
- Drafts (`p.draft`) exist only in dev; show a `<span class="chip chip--draft">Draft</span>` on them.

### WebGL plane rules (important)
- Planes follow `getBoundingClientRect` of the figure: translate/scroll/drag is fine; **never rotate or scale** a `[data-gl]` figure or its ancestors with CSS transforms (use the `tilt` option instead), and never clip them with overflow containers that don't span the viewport.
- To fade a GL figure, animate the CSS variable `--gl-alpha` (0–1) on the figure **as well as** `opacity`.
- Planes copy the figure's border-radius.

## Declarative attributes (handled by app.refresh)
`data-split` (chars rise from mask; `="words"` per word) · `data-reveal` (fade-up; value = delay) · `data-stagger` (children cascade) ·
`data-scrub-words` (words light up while scrolling) · `data-count` (numbers count up, keeps suffix like "500+") · `data-scramble` (hover scramble) ·
`data-parallax="0.15"` · `data-marquee="60"` (with `.marquee__track` child; `components.marquee()` builds it) ·
`data-magnetic="0.3"` · `data-spotlight` (+ class `spot` for the glass card with pointer glow + border light) · `data-tilt="6"` (CSS 3D tilt — NOT on GL figures) ·
`data-cursor="Label"` (cursor turns into an accent disc with that label).

## Design tokens / classes (base.css)
Type: `.t-display .t-h1 .t-h2` (Archivo, wide, uppercase, 800) · `.t-h3` · `.t-lead` · `.t-mono` · `.t-label` (mono with accent dot) ·
`.t-serif` (Instrument Serif italic — use for 1 emphasised word inside headlines, often with `.accent`) · `.t-muted` · `.accent` · `.prose` · `.link`.
Layout: `.container` `.section` `.section--tight` `.section-head` `.grid-12` `.rule` `.page-head` (via `pageHead()`).
Components: `.btn` (`.btn--accent`) `.chip` `.chips` `.link-row` `.card` (via `projectCard`) `.spot` `.stats` `.clients` `.media`.
Tokens: `--bg --surface --surface-2 --line --line-2 --text --muted --dim --accent --accent-soft --accent-rgb --gutter --radius --ease --nav-h --fs-*`.

## Quality bar
- Headline pattern: `<h1 class="t-display" data-split>Selected <em class="t-serif accent">work</em></h1>`.
- Generous spacing, strong grid, mono micro-labels, thin `var(--line)` rules, index numbers (01, 02…).
- Every interactive thing gets a hover state + appropriate `data-cursor` label.
- Responsive: must look intentional at 375px, 768px, 1280px, 1920px. No horizontal page scroll. Touch has no hover — never hide essential info behind hover.
- Accessible: semantic HTML, alt text, buttons are `<button>`, keyboard reachable, visible focus, `aria-*` on toggles. Respect `app.reduced`.
- Copy: never invent facts about Ashish (clients, dates, numbers). Use the JSON content; where a structure needs text that doesn't exist, keep it generic and factual.
- No new npm dependencies. Plain modern JS, no frameworks.

## Verification
1. `cd H:/Claude/website6_0 && npx vite build` passes.
2. Optional browser check: open YOUR OWN tab with `mcp__Claude_Browser__tabs_create` and use only that tabId
   (other agents share the browser). Prefer `read_console_messages` / `get_page_text` / `javascript_tool`; at most 2–3 screenshots.
   If the pane is hidden, requestAnimationFrame is paused — don't wait on animations.
3. Report: files created, what each interaction does, anything you couldn't finish, and any core changes you recommend.
