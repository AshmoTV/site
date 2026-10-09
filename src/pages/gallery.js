import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { boot } from '../core/app.js';
import '../styles/gallery.css';
import { gallery, media, mediaHTML, toLightbox, esc } from '../core/content.js';
import { pageHead, pad } from '../core/components.js';

gsap.registerPlugin(ScrollTrigger);

const main = document.getElementById('main');
const root = document.documentElement;
const items = gallery.map((g) => media(g)).filter(Boolean);
const lbItems = toLightbox(gallery);
const N = items.length;

const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedPre = matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Canvas mode needs a mouse/trackpad, motion and room. */
const canCanvas = () => fine && !reducedPre && innerWidth > 860;

const clamp = (min, v, max) => Math.min(max, Math.max(min, v));
const mod = (a, n) => ((a % n) + n) % n;
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const label = (m, i) => `${pad(i + 1)}${m.title ? ` — ${m.title}` : ''}`;
const alt = (m, i) => m.title || `Archive piece ${pad(i + 1)}`;
const gridIcon = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>';
const canvasIcon = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>';

/* ------------------------------------------------------------------ markup */
function canvasHTML() {
  return `
  <section class="ar" aria-labelledby="ar-title">
    <div class="ar__ui">
      <div class="ar__title">
        <h1 class="ar__h t-display" id="ar-title"><span class="ar__mask"><span>The</span></span> <span class="ar__mask"><em class="t-serif accent">Archive</em></span></h1>
        <p class="ar__sub t-mono">${N} pieces · motion design, direction &amp; visual explorations</p>
      </div>
      <div class="ar__side">
        <div class="ar__map" data-map data-cursor="Jump">
          <canvas aria-hidden="true"></canvas>
          <span class="ar__coords t-mono" data-coords aria-hidden="true"></span>
        </div>
        <p class="ar__hint t-mono"><span class="ar__hint-ico" aria-hidden="true"></span>Drag to explore</p>
        <button type="button" class="btn ar__toggle" data-mode="grid" data-magnetic="0.2"><span>Grid view</span>${gridIcon}</button>
      </div>
    </div>
    <div class="ar__stage" data-stage data-cursor="Drag" role="group" aria-label="Archive canvas — drag, scroll or use the arrow keys to explore">
      ${items.map((m, i) => `
        <a class="ar__item" href="${m.url}" data-i="${i}" draggable="false" aria-label="Open archive piece ${esc(label(m, i))}">
          ${mediaHTML(m, { cursor: 'View', alt: alt(m, i) })}
        </a>`).join('')}
    </div>
    <div class="ar__scrim" aria-hidden="true"></div>
    <div class="ar__tip t-mono" data-tip aria-hidden="true"></div>
  </section>`;
}

function gridHTML() {
  return `
  ${pageHead({
    index: '03',
    eyebrow: 'Archive',
    title: 'The <em class="t-serif accent">Archive</em>',
    intro: 'A curated archive of motion design, creative direction and visual explorations.',
  })}
  <section class="arg container" aria-label="Archive pieces">
    <div class="arg__bar" data-reveal="0.4">
      <p class="t-mono t-muted"><span class="accent">${N}</span> pieces · motion design, direction &amp; visual explorations</p>
      <button type="button" class="btn arg__toggle" data-mode="canvas" data-magnetic="0.2"${canCanvas() ? '' : ' hidden'}><span>Canvas view</span>${canvasIcon}</button>
    </div>
    <ul class="arg__list">
      ${items.map((m, i) => `
        <li class="arg__cell" data-reveal="${((i % 4) * 0.06).toFixed(2)}">
          <a class="arg__link" href="${m.url}" data-i="${i}" aria-label="Open archive piece ${esc(label(m, i))}">
            ${mediaHTML(m, { cursor: 'View', alt: alt(m, i) })}
            <span class="arg__meta t-mono"><span class="accent">${pad(i + 1)}</span>${m.title ? `<span>${esc(m.title)}</span>` : ''}</span>
          </a>
        </li>`).join('')}
    </ul>
  </section>`;
}

function render(next) {
  main.innerHTML = next === 'canvas' ? canvasHTML() : gridHTML();
  const canvas = next === 'canvas';
  root.classList.toggle('ar-lock', canvas);
  document.body.classList.toggle('is-ar-canvas', canvas);
  // canvas pieces start hidden; the intro fades them in (DOM + WebGL plane)
  if (canvas) main.querySelectorAll('.ar__item .media').forEach((f) => { f.style.setProperty('--gl-alpha', 0); f.style.opacity = 0; });
}

/* ------------------------------------------------------------------ boot */
let mode = canCanvas() ? 'canvas' : 'grid';
render(mode);
const app = await boot('gallery');
let teardown = mode === 'canvas' ? initCanvas() : initGrid();
let busy = false;
app.refresh(main);

async function setMode(next, { animate = true } = {}) {
  if (busy || next === mode) return;
  busy = true;
  if (animate && !app.reduced) {
    const figs = [...main.querySelectorAll('[data-gl]')];
    await new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve }).to(main, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 0);
      if (figs.length) tl.to(figs, { '--gl-alpha': 0, duration: 0.45, ease: 'power2.in' }, 0);
    });
  }
  teardown?.();
  teardown = null;
  mode = next;
  if (app.lenis) app.lenis.scrollTo(0, { immediate: true, force: true });
  else scrollTo(0, 0);
  render(next);
  // drop scroll triggers that belonged to the markup we just replaced
  ScrollTrigger.getAll().forEach((st) => { if (st.trigger && !st.trigger.isConnected) st.kill(); });
  teardown = next === 'canvas' ? initCanvas() : initGrid();
  app.refresh(main);
  gsap.to(main, { opacity: 1, duration: app.reduced ? 0 : 0.4, ease: 'power2.out' });
  busy = false;
}

/* ------------------------------------------------------------------ grid mode */
function initGrid() {
  const section = main.querySelector('.arg');
  const toggle = section.querySelector('[data-mode]');
  section.querySelector('.arg__list').addEventListener('click', (e) => {
    const a = e.target.closest('.arg__link');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    app.lightbox.open(lbItems, +a.dataset.i);
  });
  toggle.addEventListener('click', () => setMode('canvas'));
  const onResize = () => { toggle.hidden = !canCanvas(); };
  addEventListener('resize', onResize);
  return () => removeEventListener('resize', onResize);
}

/* ------------------------------------------------------------------ canvas mode */
function initCanvas() {
  const section = main.querySelector('.ar');
  const stage = section.querySelector('[data-stage]');
  const els = [...stage.querySelectorAll('.ar__item')];
  const figs = els.map((el) => el.querySelector('.media'));
  const tip = section.querySelector('[data-tip]');
  const map = section.querySelector('[data-map]');
  const mapCv = map.querySelector('canvas');
  const mapCtx = mapCv.getContext('2d');
  const coords = section.querySelector('[data-coords]');
  // minimap colours follow the theme
  let accent, ink;
  const readColors = () => {
    const cs = getComputedStyle(root);
    accent = cs.getPropertyValue('--accent').trim() || '#ff5a1f';
    ink = cs.getPropertyValue('--text-rgb').trim() || '236, 232, 225';
  };
  readColors();
  document.addEventListener('ashmo:theme', () => { readColors(); S.dirty = true; });
  // WebGL planes (read-only use): reset their motion history while a piece is off-screen,
  // so wrapping round the tile never reads as a huge velocity spike.
  const planes = app.gl?.planes;

  const S = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, W: 1, H: 1, padX: 0, padY: 0, vw: innerWidth, vh: innerHeight, ms: 1, dirty: true, intro: false };
  const P = items.map(() => ({ bx: 0, by: 0, w: 0, h: 0, k: 0, sx: 0, sy: 0, wx: null, wy: null, t: '' }));
  const drag = { on: false, moved: false, x0: 0, y0: 0, lx: 0, ly: 0, lt: 0, vx: 0, vy: 0 };
  let hovered = -1;
  let alive = true;
  let introTl = null;

  app.lenis?.stop();

  /* ----- layout: column masonry tile, larger than the viewport on both axes ----- */
  function pack(colW, gap, vw) {
    const step = colW + gap;
    const cols = Math.max(6, Math.ceil((vw + step) / step));
    const len = new Array(cols).fill(0);
    const members = Array.from({ length: cols }, () => []);
    const hs = items.map((m) => (colW * m.h) / m.w);
    hs.forEach((h, i) => {
      let c = 0;
      for (let j = 1; j < cols; j++) if (len[j] < len[c] - 0.5) c = j;
      members[c].push(i);
      len[c] += h + gap;
    });
    const H = Math.max(...len);
    const rand = mulberry32(61);
    const out = [];
    members.forEach((idx, c) => {
      const extra = (H - len[c]) / Math.max(1, idx.length); // even out column lengths
      let y = rand() * H * 0.3; // column stagger (wraps)
      idx.forEach((i) => { out[i] = { bx: c * step, by: y, w: colW, h: hs[i] }; y += hs[i] + gap + extra; });
    });
    return { W: cols * step, H, step, gap, maxH: Math.max(...hs), out };
  }

  function layout() {
    const vw = innerWidth, vh = innerHeight;
    const gap = Math.round(clamp(28, vw * 0.024, 44));
    let colW = clamp(220, vw * 0.18, 300);
    let res = pack(colW, gap, vw);
    for (let t = 0; t < 24 && res.H < vh + res.maxH + gap; t++) res = pack((colW *= 1.08), gap, vw);
    Object.assign(S, { vw, vh, W: res.W, H: res.H, padX: res.step, padY: res.maxH + res.gap });
    res.out.forEach((o, i) => {
      Object.assign(P[i], o, { wx: null, wy: null, t: '' });
      els[i].style.width = `${o.w}px`;
    });
    sizeMap();
    S.dirty = true;
  }

  /* ----- per-frame placement: every piece wraps independently ----- */
  function place() {
    const { W, H, padX, padY, vw, vh } = S;
    const cx = vw / 2, cy = vh / 2;
    for (let i = 0; i < N; i++) {
      const p = P[i];
      const ux = p.bx + S.x + padX, uy = p.by + S.y + padY;
      const wx = Math.floor(ux / W), wy = Math.floor(uy / H);
      let x = ux - wx * W - padX, y = uy - wy * H - padY;
      if (p.k) { x += (cx - x - p.w / 2) * p.k; y += (cy - y - p.h / 2) * p.k; }
      p.sx = x; p.sy = y;
      if (planes && (wx !== p.wx || wy !== p.wy || x + p.w < 0 || x > vw || y + p.h < 0 || y > vh)) {
        const pl = planes.get(figs[i]);
        if (pl) pl.prev = null;
      }
      p.wx = wx; p.wy = wy;
      const t = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      if (t !== p.t) { els[i].style.transform = t; p.t = t; }
    }
    if (hovered >= 0) {
      const p = P[hovered];
      tip.style.transform = `translate3d(${p.sx.toFixed(1)}px,${(p.sy + p.h + 10).toFixed(1)}px,0)`;
    }
    drawMap();
    coords.textContent = `X ${fmt(-S.x)} · Y ${fmt(-S.y)}`;
  }
  const fmt = (v) => `${v < 0 ? '−' : '+'}${String(Math.abs(Math.round(v))).padStart(4, '0')}`;

  /* ----- minimap ----- */
  const MAP_W = 128;
  function sizeMap() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    S.ms = MAP_W / S.W;
    const h = Math.round(S.H * S.ms);
    mapCv.width = MAP_W * dpr;
    mapCv.height = h * dpr;
    mapCv.style.width = `${MAP_W}px`;
    mapCv.style.height = `${h}px`;
    mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawMap() {
    const { W, H, ms: s, vw, vh } = S;
    const c = mapCtx;
    c.clearRect(0, 0, W * s, H * s);
    for (let i = 0; i < N; i++) {
      const p = P[i];
      const on = p.sx + p.w > 0 && p.sx < vw && p.sy + p.h > 0 && p.sy < vh;
      c.fillStyle = i === hovered ? accent : on ? `rgba(${ink},.7)` : `rgba(${ink},.16)`;
      const y = mod(p.by, H);
      c.fillRect(p.bx * s, y * s, p.w * s, p.h * s);
      if (y + p.h > H) c.fillRect(p.bx * s, (y - H) * s, p.w * s, p.h * s);
    }
    const vx = mod(-S.x, W), vy = mod(-S.y, H);
    c.strokeStyle = accent;
    c.lineWidth = 1;
    for (const ox of [0, -W]) for (const oy of [0, -H]) c.strokeRect((vx + ox) * s + 0.5, (vy + oy) * s + 0.5, vw * s - 1, vh * s - 1);
  }
  map.addEventListener('click', (e) => {
    const r = mapCv.getBoundingClientRect();
    const u = (e.clientX - r.left) / S.ms, v = (e.clientY - r.top) / S.ms;
    let dx = -(u - S.vw / 2) - S.tx;
    let dy = -(v - S.vh / 2) - S.ty;
    dx -= S.W * Math.round(dx / S.W); // shortest way round the tile
    dy -= S.H * Math.round(dy / S.H);
    S.tx += dx; S.ty += dy; S.vx = S.vy = 0;
  });

  /* ----- ticker: inertia + smoothing ----- */
  function tick() {
    const dt = Math.min(gsap.ticker.deltaRatio(60), 3);
    if (!drag.on && (S.vx || S.vy)) {
      S.tx += S.vx * dt; S.ty += S.vy * dt;
      const f = Math.pow(0.935, dt);
      S.vx *= f; S.vy *= f;
      if (Math.abs(S.vx) < 0.05) S.vx = 0;
      if (Math.abs(S.vy) < 0.05) S.vy = 0;
    }
    const dx = S.tx - S.x, dy = S.ty - S.y;
    if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) {
      S.x = S.tx; S.y = S.ty;
      if (!S.dirty && !S.intro) return;
    } else {
      const e = 1 - Math.pow(1 - 0.13, dt);
      S.x += dx * e; S.y += dy * e;
    }
    S.dirty = false;
    place();
  }

  /* ----- input ----- */
  const stop = () => { S.vx = S.vy = 0; };
  function onDown(e) {
    if (e.button !== 0) return;
    Object.assign(drag, { on: true, moved: false, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 });
    stop();
  }
  function onMove(e) {
    if (!drag.on) return;
    const now = performance.now(), dtm = Math.max(1, now - drag.lt);
    const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
    S.tx += dx; S.ty += dy;
    drag.vx = drag.vx * 0.5 + ((dx / dtm) * 16.67) * 0.5;
    drag.vy = drag.vy * 0.5 + ((dy / dtm) * 16.67) * 0.5;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) {
      drag.moved = true;
      stage.classList.add('is-dragging');
      setHover(-1);
    }
  }
  function onUp() {
    if (!drag.on) return;
    drag.on = false;
    stage.classList.remove('is-dragging');
    if (drag.moved && performance.now() - drag.lt < 90) {
      S.vx = clamp(-70, drag.vx, 70);
      S.vy = clamp(-70, drag.vy, 70);
    }
    setTimeout(() => (drag.moved = false), 0); // after the click that follows this pointerup
  }
  function onClick(e) {
    if (drag.moved) { e.preventDefault(); drag.moved = false; return; }
    const a = e.target.closest('.ar__item');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    app.lightbox.open(lbItems, +a.dataset.i);
  }
  const blocked = () => root.classList.contains('lb-open') || root.classList.contains('menu-open');
  function onWheel(e) {
    if (e.ctrlKey || blocked()) return; // pinch-zoom stays native
    e.preventDefault();
    const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
    let dx = e.deltaX * k, dy = e.deltaY * k;
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    S.tx -= dx; S.ty -= dy;
    stop();
  }
  function onKey(e) {
    if (blocked() || e.altKey || e.metaKey || e.ctrlKey) return;
    const d = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!d) return;
    e.preventDefault();
    S.tx += d[0] * 280; S.ty += d[1] * 220;
    stop();
  }
  function setHover(i) {
    if (i === hovered) return;
    hovered = i;
    S.dirty = true;
    if (i < 0) { tip.classList.remove('is-on'); return; }
    const m = items[i];
    tip.innerHTML = `<span class="accent">${pad(i + 1)}</span><span class="t-muted">/ ${pad(N)}</span>${m.title ? `<span class="ar__tip-t">${esc(m.title)}</span>` : ''}`;
    tip.classList.add('is-on');
  }
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('click', onClick);
  stage.addEventListener('dragstart', (e) => e.preventDefault());
  stage.addEventListener('pointerover', (e) => {
    if (drag.moved) return;
    const a = e.target.closest('.ar__item');
    setHover(a ? +a.dataset.i : -1);
  });
  stage.addEventListener('pointerleave', () => setHover(-1));
  // keyboard: bring the focused piece to the centre
  stage.addEventListener('focusin', (e) => {
    const a = e.target.closest('.ar__item');
    if (!a || !a.matches(':focus-visible')) return;
    const p = P[+a.dataset.i];
    S.tx += S.vw / 2 - (p.sx + p.w / 2);
    S.ty += S.vh / 2 - (p.sy + p.h / 2);
    stop();
    setHover(+a.dataset.i);
  });
  stage.addEventListener('focusout', () => setHover(-1));
  section.querySelector('[data-mode]').addEventListener('click', () => setMode('grid'));

  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onUp);
  addEventListener('blur', onUp);
  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('keydown', onKey);

  let rT = 0;
  function onResize() {
    clearTimeout(rT);
    rT = setTimeout(() => {
      if (!canCanvas()) { setMode('grid', { animate: false }); return; }
      // keep the same spot of the tile under the viewport centre
      const fx = (S.vw / 2 - S.x) / S.W, fy = (S.vh / 2 - S.y) / S.H;
      layout();
      S.x = S.tx = S.vw / 2 - fx * S.W;
      S.y = S.ty = S.vh / 2 - fy * S.H;
      place();
    }, 120);
  }
  addEventListener('resize', onResize);

  // the lightbox / menu restart Lenis when they close — keep the page locked
  const mo = new MutationObserver(() => {
    if (!blocked() && app.lenis && !app.lenis.isStopped) app.lenis.stop();
  });
  mo.observe(root, { attributes: true, attributeFilter: ['class'] });

  /* ----- intro: pieces burst out from the centre ----- */
  function intro() {
    place();
    const cx = S.vw / 2, cy = S.vh / 2, maxD = Math.hypot(cx, cy);
    const rest = [];
    const tl = gsap.timeline({ onComplete: () => { S.intro = false; S.dirty = true; } }); // our tick runs before GSAP's, so render the final frame next tick
    P.forEach((p, i) => {
      const inView = p.sx + p.w > -60 && p.sx < S.vw + 60 && p.sy + p.h > -60 && p.sy < S.vh + 60;
      if (!inView) { rest.push(figs[i]); return; }
      const at = 0.1 + (Math.hypot(p.sx + p.w / 2 - cx, p.sy + p.h / 2 - cy) / maxD) * 0.6;
      p.k = 0.88;
      tl.to(p, { k: 0, duration: 1.8, ease: 'expo.out' }, at);
      tl.to(figs[i], { '--gl-alpha': 1, opacity: 1, duration: 0.7, ease: 'power2.out' }, at);
    });
    if (rest.length) gsap.set(rest, { '--gl-alpha': 1, opacity: 1 });
    tl.from(section.querySelectorAll('.ar__mask > *'), { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.08 }, 0.3)
      .from(section.querySelectorAll('.ar__sub, .ar__side > *'), { opacity: 0, y: 16, duration: 1, ease: 'expo.out', stagger: 0.07 }, 0.6);
    S.intro = true;
    return tl;
  }

  layout();
  S.x = S.tx = (S.vw - S.W) / 2;
  S.y = S.ty = (S.vh - S.H) / 2;
  place();
  gsap.ticker.add(tick, false, true); // before the WebGL tick, so planes read this frame's positions
  app.entered.then(() => { if (alive) introTl = intro(); });

  return () => {
    alive = false;
    gsap.ticker.remove(tick);
    introTl?.kill();
    clearTimeout(rT);
    mo.disconnect();
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerup', onUp);
    removeEventListener('pointercancel', onUp);
    removeEventListener('blur', onUp);
    removeEventListener('wheel', onWheel);
    removeEventListener('keydown', onKey);
    removeEventListener('resize', onResize);
    root.classList.remove('ar-lock');
    document.body.classList.remove('is-ar-canvas');
    app.lenis?.start();
  };
}
