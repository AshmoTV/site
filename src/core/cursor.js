// Custom cursor, magnetic elements, spotlight cards and CSS tilt.
import gsap from 'gsap';
import { themeColors } from './theme.js';

const hoverCapable = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export function initCursor() {
  if (!hoverCapable()) return null;
  const root = document.createElement('div');
  root.className = 'cursor';
  root.innerHTML = '<div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div>';
  document.body.append(root);
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');
  const label = root.querySelector('.cursor__label');
  document.documentElement.classList.add('has-cursor');

  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });

  addEventListener('pointermove', (e) => {
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    root.classList.remove('is-hidden');
  }, { passive: true });
  document.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  addEventListener('pointerdown', () => root.classList.add('is-down'));
  addEventListener('pointerup', () => root.classList.remove('is-down'));

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) motionPath(root);

  let current = null;
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, input, textarea, select, label');
    if (t === current) return;
    current = t;
    const text = t?.closest('[data-cursor]')?.dataset.cursor;
    root.classList.toggle('is-link', !!t && !text);
    root.classList.toggle('is-label', !!text);
    if (text) label.textContent = text;
    if (t?.matches('input, textarea')) root.classList.add('is-text'); else root.classList.remove('is-text');
  });

  return {
    set(text) {
      root.classList.toggle('is-label', !!text);
      if (text) label.textContent = text;
    },
  };
}

/**
 * After Effects-style motion path: the pointer leaves a dotted path with keyframe
 * squares and bezier handles on the newest keyframe. Invisible when the pointer rests.
 */
function motionPath(root) {
  const cv = document.createElement('canvas');
  cv.className = 'cursor__path';
  root.prepend(cv);
  const ctx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 2);
  const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  size();
  addEventListener('resize', size);
  let mx = -100, my = -100;
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  const pts = [];
  const KEY_EVERY = 6;
  let C = themeColors();
  document.addEventListener('ashmo:theme', (e) => (C = e.detail.colors));
  let frame = 0;
  gsap.ticker.add(() => {
    frame++;
    pts.push({ x: mx, y: my, k: frame % KEY_EVERY === 0 });
    if (pts.length > 34) pts.shift();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (len < 24 || root.classList.contains('is-label')) return;
    const fade = Math.min(1, (len - 24) / 160);
    // dotted path
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2, yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.setLineDash([1.5, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${C.textRgb},${0.38 * fade})`;
    ctx.stroke();
    ctx.setLineDash([]);
    // keyframes
    let newest = null;
    pts.forEach((p, i) => {
      if (!p.k) return;
      const a = (i / pts.length) * fade;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = `rgba(${C.accentRgb},${a})`;
      ctx.fillStyle = `rgba(${C.bgRgb},${a})`;
      ctx.fillRect(-3, -3, 6, 6);
      ctx.strokeRect(-3, -3, 6, 6);
      ctx.restore();
      newest = i;
    });
    // bezier handles on the newest keyframe
    if (newest != null && newest > 0 && newest < pts.length - 1) {
      const p = pts[newest], a = pts[newest - 1], b = pts[newest + 1];
      let tx = b.x - a.x, ty = b.y - a.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx = (tx / tl) * 22; ty = (ty / tl) * 22;
      ctx.strokeStyle = `rgba(${C.softRgb},${0.6 * fade})`;
      ctx.fillStyle = `rgba(${C.softRgb},${0.8 * fade})`;
      ctx.beginPath();
      ctx.moveTo(p.x - tx, p.y - ty);
      ctx.lineTo(p.x + tx, p.y + ty);
      ctx.stroke();
      [[-1], [1]].forEach(([s]) => { ctx.beginPath(); ctx.arc(p.x + tx * s, p.y + ty * s, 2, 0, Math.PI * 2); ctx.fill(); });
    }
  });
}

/** Elements that lean towards the pointer. data-magnetic="0.35" sets strength. */
export function initMagnetic(root = document) {
  if (!hoverCapable()) return;
  root.querySelectorAll('[data-magnetic]:not([data-magnetic-ready])').forEach((el) => {
    el.dataset.magneticReady = '';
    const s = parseFloat(el.dataset.magnetic) || 0.3;
    const inner = el.querySelector('[data-magnetic-inner]');
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const ix = inner && gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const iy = inner && gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2), my = e.clientY - (r.top + r.height / 2);
      x(mx * s); y(my * s);
      if (inner) { ix(mx * s * 0.5); iy(my * s * 0.5); }
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); if (inner) { ix(0); iy(0); } });
  });
}

/** [data-spotlight]: sets --mx/--my (px) for a radial highlight that follows the pointer. */
export function initSpotlight(root = document) {
  root.querySelectorAll('[data-spotlight]:not([data-spot-ready])').forEach((el) => {
    el.dataset.spotReady = '';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/** [data-tilt]: CSS 3D tilt (for non-WebGL elements). data-tilt="8" = max degrees. */
export function initTilt(root = document) {
  if (!hoverCapable()) return;
  root.querySelectorAll('[data-tilt]:not([data-tilt-ready])').forEach((el) => {
    el.dataset.tiltReady = '';
    const max = parseFloat(el.dataset.tilt) || 8;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      rx(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
      ry(((e.clientX - r.left) / r.width - 0.5) * max * 2);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
