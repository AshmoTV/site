import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { boot } from '../core/app.js';
import '../styles/work.css';
import { site, bySection, media, mediaHTML, projectUrl, esc, TYPE_LABEL } from '../core/content.js';
import { pageHead, stats, projectCard, arrowIcon, pad } from '../core/components.js';
import { playNow } from '../core/media.js';

gsap.registerPlugin(ScrollTrigger, Flip);

const main = document.getElementById('main');
const list = bySection('work');

const FILTERS = [
  { id: 'ai-campaign', label: 'AI-led campaigns' },
  { id: 'campaign', label: 'Campaigns' },
  { id: 'product-launch', label: 'Product launches' },
  { id: 'brand-film', label: 'Brand films' },
  { id: 'content-series', label: 'Content series' },
];
const filters = FILTERS.filter((f) => list.some((p) => p.type === f.id));
const countOf = (id) => (id === 'all' ? list.length : list.filter((p) => p.type === id).length);

const STATS = [
  { value: '20+', label: 'Countries — Smart Tank launch' },
  { value: '500+', label: 'Localized assets' },
  { value: '15+', label: 'Languages' },
  { value: '10+', label: 'Artists led — HP Studios' },
  { value: '50+', label: 'Feature videos — Intel' },
];

const touchPre = !matchMedia('(hover: hover) and (pointer: fine)').matches;
const narrowMQ = matchMedia('(max-width: 860px)');

/* ---------- view preference (list | grid), persisted ---------- */
const VIEW_KEY = 'ashmo-work-view';
const readView = () => { try { return localStorage.getItem(VIEW_KEY); } catch { return null; } };
const saveView = (v) => { try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage blocked */ } };
const stored = readView();
let view = stored === 'list' || stored === 'grid' ? stored : (touchPre || narrowMQ.matches ? 'grid' : 'list');
let filter = new URLSearchParams(location.search).get('type');
if (!filters.some((f) => f.id === filter)) filter = 'all';

/* ---------- YouTube covers: use the 1280px thumbnail when it exists ----------
   hqdefault (480×360) is letterboxed and soft at large sizes; maxresdefault is
   crisp and bar-free but not guaranteed to exist, so probe it (in parallel with boot). */
const hd = new Set();
const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const probe = (id) => new Promise((resolve) => {
  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => { if (im.naturalWidth > 320) hd.add(id); resolve(); }; // 120×90 = "no thumbnail" placeholder
  im.onerror = () => resolve();
  im.src = ytThumb(id);
});
const ytIds = [...new Set([site.showreel, ...list.map((p) => p.cover)]
  .map((r) => media(r)).filter((m) => m?.type === 'youtube').map((m) => m.id))];
const probes = Promise.race([Promise.all(ytIds.map(probe)), new Promise((r) => setTimeout(r, 1800))]);

/** media() with the HD YouTube thumbnail swapped in when available. */
function hi(ref) {
  const m = media(ref);
  return m?.type === 'youtube' && hd.has(m.id) ? { ...m, thumb: ytThumb(m.id) } : m;
}
/** hqdefault has black bars outside a 16:9 crop. */
const letterboxed = (ref) => { const m = media(ref); return m?.type === 'youtube' && !hd.has(m.id); };

/* ------------------------------------------------------------------ static head (before boot) */
main.innerHTML = `
  ${pageHead({
    index: '01',
    eyebrow: 'Commercial work & campaigns',
    title: 'Selected <em class="t-serif accent">work</em>',
    intro: 'Brand films, product launches and global campaigns — concept, creative production and motion design, leading multidisciplinary teams across geographies.',
  })}
  <section class="wk-stats container" aria-label="In numbers">
    <div class="wk-stats__inner" data-reveal="0.35">${stats(STATS)}</div>
  </section>
  <div data-wk-rest></div>`;

const [app] = await Promise.all([boot('work'), probes]);
const { touch, reduced, lightbox } = app;

/* ------------------------------------------------------------------ data-driven sections */
const typeLabel = (p) => (p.draft ? '<span class="chip chip--draft">Draft</span>' : esc(TYPE_LABEL[p.type] || p.type || ''));
const roles = (p) => esc((p.roles || []).join(' · '));

const rowHTML = (p, i) => `
  <li class="wk-li" data-type="${esc(p.type)}" data-flip-id="row-${esc(p.id)}">
    <a class="wk-row" href="${projectUrl(p)}" data-index="${i}" data-pt-label="${esc(p.title)}" data-cursor="Open">
      <span class="wk-row__idx t-mono">${pad(i + 1)}</span>
      <span class="wk-row__title">${esc(p.title)}</span>
      <span class="wk-row__client t-mono">${esc(p.client || '—')}</span>
      <span class="wk-row__roles t-mono" title="${roles(p)}">${roles(p)}</span>
      <span class="wk-row__type t-mono">${typeLabel(p)}</span>
      <span class="wk-row__thumb">${mediaHTML(hi(p.cover), { gl: false, fit: 'cover', ratio: letterboxed(p.cover) ? '16/9' : '16/10', alt: p.title })}</span>
      ${arrowIcon}
    </a>
  </li>`;

const cellHTML = (p, i) => `
  <div class="wk-cell${letterboxed(p.cover) ? ' is-lb' : ''}" data-type="${esc(p.type)}" data-flip-id="cell-${esc(p.id)}">
    ${projectCard({ ...p, cover: hi(p.cover) }, i, { ratio: '16/10', cursor: 'Open' })}
  </div>`;

const segBtn = (attr, id, pressed, inner) =>
  `<button type="button" class="wk-seg__btn" data-${attr}="${id}" aria-pressed="${pressed}">${inner}</button>`;

const restHTML = `
  <section class="wk-reel container" aria-label="Showreel">
    <div class="wk-reel__frame" data-reel role="button" tabindex="0" aria-label="Play the showreel">
      ${mediaHTML(hi(site.showreel), { fit: 'cover', ratio: '16/9', cursor: 'Play reel', cls: 'wk-reel__media', alt: 'Showreel', attrs: 'data-lb-handled' })}
      <div class="wk-reel__ui" aria-hidden="true">
        <div class="wk-reel__top t-mono"><span><span class="wk-reel__rec"></span>Showreel</span><span>Production · Design · Animation</span></div>
        <span class="wk-reel__title t-display">Play <em class="t-serif accent">reel</em></span>
      </div>
    </div>
    <p class="wk-reel__cap t-mono t-muted" data-reveal>Showreel — selected production, design and animation work</p>
  </section>

  <section class="wk-index section container" aria-labelledby="wk-index-title">
    <div class="section-head">
      <h2 class="t-h2" id="wk-index-title" data-split>Project <em class="t-serif">index</em></h2>
      <p class="wk-total t-mono t-muted" aria-live="polite" data-total></p>
    </div>
    <div class="wk-controls" data-controls>
      <div class="wk-seg wk-filters" role="group" aria-label="Filter projects by type">
        ${[{ id: 'all', label: 'All' }, ...filters].map((f) => segBtn('filter', f.id, f.id === filter,
          `<span>${esc(f.label)}</span><sup class="wk-seg__n">${pad(countOf(f.id))}</sup>`)).join('')}
      </div>
      <div class="wk-seg wk-views" role="group" aria-label="Layout">
        ${segBtn('view', 'list', view === 'list', '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>List</span>')}
        ${segBtn('view', 'grid', view === 'grid', '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg><span>Grid</span>')}
      </div>
    </div>
    <ol class="wk-list" data-list aria-label="Projects">${list.map(rowHTML).join('')}</ol>
    <div class="wk-grid" data-grid role="list" aria-label="Projects">${list.map(cellHTML).join('')}</div>
  </section>
  <div class="wk-follower" data-follower aria-hidden="true">
    ${list.map((p) => mediaHTML(hi(p.cover), { fit: 'cover', ratio: letterboxed(p.cover) ? '16/9' : '16/10', cls: 'wk-follower__item', alt: '' })).join('')}
  </div>`;

const restSlot = main.querySelector('[data-wk-rest]');
restSlot.insertAdjacentHTML('beforebegin', restHTML);
restSlot.remove();

const indexSection = main.querySelector('.wk-index');
const listEl = main.querySelector('[data-list]');
const gridEl = main.querySelector('[data-grid]');
const rows = [...listEl.children];
const cells = [...gridEl.children];
cells.forEach((c) => c.setAttribute('role', 'listitem'));
const totalEl = main.querySelector('[data-total]');
const filterBtns = [...main.querySelectorAll('[data-filter]')];
const viewBtns = [...main.querySelectorAll('[data-view]')];

/* ------------------------------------------------------------------ showreel */
const reelFrame = main.querySelector('[data-reel]');
const openReel = () => lightbox.open([{ ...media(site.showreel), caption: 'Showreel — selected production, design and animation work' }], 0);
reelFrame.addEventListener('click', openReel);
reelFrame.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReel(); }
});

/* ------------------------------------------------------------------ helpers */
const glOf = (els) => els.flatMap((el) => [...el.querySelectorAll('[data-gl]')]);
/** Fade the WebGL planes of els (their --gl-alpha); null when there are none. */
function glFade(els, from, to, vars = {}) {
  const figs = glOf(els);
  if (!figs.length) return null;
  if (from == null) return gsap.to(figs, { '--gl-alpha': to, ...vars });
  return gsap.fromTo(figs, { '--gl-alpha': from }, { '--gl-alpha': to, ...vars });
}
const matches = (el) => filter === 'all' || el.dataset.type === filter;
const visible = (els) => els.filter((el) => !el.classList.contains('is-out'));

/** Sliding accent pill inside a segmented control (Flip re-parent). */
function movePill(group, btn, animate = true) {
  let pill = group.querySelector('.wk-seg__pill');
  const state = pill && animate && !reduced ? Flip.getState(pill) : null;
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'wk-seg__pill';
    pill.setAttribute('aria-hidden', 'true');
  }
  btn.prepend(pill);
  if (state) Flip.from(state, { duration: 0.6, ease: 'expo.inOut' });
}

/** Editorial rhythm: rows alternate wide (16/10) + narrow (8/7) slots of equal height. */
function slotGrid() {
  visible(cells).forEach((c, k) => {
    const wide = (Math.floor(k / 2) % 2 === 0) === (k % 2 === 0);
    c.classList.toggle('is-wide', wide);
    c.classList.toggle('is-narrow', !wide);
  });
}

function updateTotal() {
  const n = visible(view === 'list' ? rows : cells).length;
  totalEl.textContent = n === list.length ? `${pad(n)} projects` : `Showing ${pad(n)} of ${pad(list.length)}`;
}

function wire() {
  app.refresh(indexSection);
  ScrollTrigger.refresh();
}

/* ------------------------------------------------------------------ filtering (Flip) */
let flip = null;

function applyFilter(next, animate = true) {
  filter = next;
  filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === next)));
  movePill(filterBtns[0].parentElement, filterBtns.find((b) => b.dataset.filter === next), animate);
  try {
    const url = new URL(location.href);
    if (next === 'all') url.searchParams.delete('type'); else url.searchParams.set('type', next);
    history.replaceState(history.state, '', url);
  } catch { /* noop */ }

  const active = view === 'list' ? rows : cells;
  const passive = view === 'list' ? cells : rows;
  passive.forEach((el) => el.classList.toggle('is-out', !matches(el)));

  flip?.progress(1);
  const state = animate && !reduced ? Flip.getState(active) : null;
  active.forEach((el) => el.classList.toggle('is-out', !matches(el)));
  slotGrid();
  updateTotal();
  if (!state) {
    gsap.set(visible(active), { opacity: 1 });
    glFade(visible(active), null, 1, { duration: 0 });
    if (animate) wire();
    return;
  }

  flip = Flip.from(state, {
    duration: 0.9,
    ease: 'expo.inOut',
    stagger: 0.025,
    onEnter: (els) => {
      els.forEach((el) => (el.dataset.in = '1'));
      const tl = gsap.timeline()
        .fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.04, delay: 0.25, clearProps: 'transform' }, 0);
      const g = glFade(els, 0, 1, { duration: 0.8, ease: 'power2.out', stagger: 0.04, delay: 0.25 });
      if (g) tl.add(g, 0);
      return tl;
    },
    onLeave: (els) => {
      const tl = gsap.timeline().to(els, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
      const g = glFade(els, null, 0, { duration: 0.35, ease: 'power2.in' });
      if (g) tl.add(g, 0);
      return tl;
    },
    onComplete: wire,
  });
}

filterBtns.forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.filter !== filter) applyFilter(b.dataset.filter);
}));

/* ------------------------------------------------------------------ list / grid toggle */
let swapping = false;

function setView(next) {
  if (swapping || next === view) return;
  const prev = view;
  view = next;
  saveView(next);
  viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === next)));
  movePill(viewBtns[0].parentElement, viewBtns.find((b) => b.dataset.view === next));
  indexSection.dataset.layout = next;
  hideFollower();

  const fromEl = prev === 'list' ? listEl : gridEl;
  const toEl = next === 'list' ? listEl : gridEl;
  const toItems = next === 'list' ? rows : cells;
  toItems.forEach((el) => el.classList.toggle('is-out', !matches(el))); // incoming layout reflects the filter
  slotGrid();

  const swap = () => {
    fromEl.classList.add('is-off');
    toEl.classList.remove('is-off');
    const items = visible(toItems);
    items.forEach((el) => (el.dataset.in = '1'));
    if (!reduced) {
      gsap.fromTo(items, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.05, clearProps: 'transform' });
      glFade(items, 0, 1, { duration: 0.9, ease: 'power2.out', stagger: 0.05 });
    } else {
      gsap.set(items, { opacity: 1 });
      glFade(items, null, 1, { duration: 0 });
    }
    updateTotal();
    wire();
    // keep the controls in view when the new layout is shorter
    const ctrl = main.querySelector('[data-controls]');
    if (indexSection.getBoundingClientRect().top < 0 && ctrl.getBoundingClientRect().top < 0) {
      app.lenis ? app.lenis.scrollTo(indexSection, { offset: -40, duration: 1 }) : indexSection.scrollIntoView({ block: 'start' });
    }
    swapping = false;
  };

  flip?.progress(1);
  if (reduced) { swap(); return; }
  swapping = true;
  const out = visible(prev === 'list' ? rows : cells);
  const tl = gsap.timeline({ onComplete: swap })
    .to(out, { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in', stagger: 0.012 }, 0);
  const g = glFade(out, null, 0, { duration: 0.35, ease: 'power2.in', stagger: 0.012 });
  if (g) tl.add(g, 0);
}

viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

/* ------------------------------------------------------------------ floating preview (list view, desktop) */
const follower = main.querySelector('[data-follower]');
const fItems = [...follower.children];
fItems.forEach((it) => { it.style.setProperty('--gl-alpha', 0); it.style.opacity = 0; });
let shown = -1;

function showFollower(i) {
  if (i === shown) return;
  shown = i;
  fItems.forEach((it, j) => {
    const on = j === i;
    gsap.to(it, { '--gl-alpha': on ? 1 : 0, opacity: on ? 1 : 0, duration: 0.45, ease: 'power2.out', overwrite: true });
    if (on) playNow(it.querySelector('video'));
  });
}
function hideFollower() { showFollower(-1); }

if (!touch) {
  const fx = gsap.quickTo(follower, 'x', { duration: 0.7, ease: 'power3' });
  const fy = gsap.quickTo(follower, 'y', { duration: 0.7, ease: 'power3' });
  const canFollow = () => view === 'list' && !narrowMQ.matches;
  const jump = (e) => { fx(e.clientX, e.clientX); fy(e.clientY, e.clientY); };
  listEl.addEventListener('pointermove', (e) => {
    if (shown < 0) jump(e); // appear in place, then trail the pointer
    else { fx(e.clientX); fy(e.clientY); }
  });
  rows.forEach((li) => {
    const row = li.querySelector('.wk-row');
    row.addEventListener('pointerenter', (e) => {
      if (!canFollow()) return;
      if (shown < 0) jump(e);
      showFollower(+row.dataset.index);
    });
  });
  listEl.addEventListener('pointerleave', hideFollower);
  narrowMQ.addEventListener('change', hideFollower);
}

/* ------------------------------------------------------------------ init */
indexSection.dataset.layout = view;
(view === 'list' ? gridEl : listEl).classList.add('is-off');
applyFilter(filter, false);
movePill(viewBtns[0].parentElement, viewBtns.find((b) => b.dataset.view === view), false);

// first reveal of the active layout as it scrolls in
if (!reduced) {
  const first = visible(view === 'list' ? rows : cells);
  gsap.set(first, { opacity: 0 });
  ScrollTrigger.batch(first, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      const fresh = batch.filter((el) => !el.dataset.in);
      fresh.forEach((el) => (el.dataset.in = '1'));
      gsap.fromTo(fresh, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' });
    },
  });
}

app.refresh(main);
