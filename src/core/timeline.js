// Timeline HUD — every page behaves like a composition in an editing timeline.
// A running SMPTE timecode, section "clips" with keyframe diamonds, and a playhead
// you can drag to scrub the page. Sections are auto-detected (main > * with a heading);
// set data-chapter="Label" on a section to name it, or data-chapter="" to skip it.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FPS = 24;
const PX_PER_FRAME = 9;

const tc = (frames) => {
  const f = Math.max(0, Math.round(frames));
  const ff = f % FPS, s = Math.floor(f / FPS), ss = s % 60, m = Math.floor(s / 60) % 60, h = Math.floor(s / 3600);
  return [h, m, ss, ff].map((n) => String(n).padStart(2, '0')).join(':');
};

export function initTimeline({ lenis, page }) {
  const el = document.createElement('div');
  el.className = 'tl';
  el.innerHTML = `
    <div class="tl__tc t-mono"><span class="tl__rec" aria-hidden="true"></span><span data-tc>00:00:00:00</span></div>
    <div class="tl__track" data-cursor="Scrub">
      <div class="tl__ruler"></div>
      <div class="tl__clips"></div>
      <div class="tl__head"><span></span></div>
    </div>
    <div class="tl__meta t-mono"><span>${FPS} fps</span><span class="tl__comp">${page}.comp</span></div>`;
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);

  const tcEl = el.querySelector('[data-tc]');
  const track = el.querySelector('.tl__track');
  const clips = el.querySelector('.tl__clips');
  const head = el.querySelector('.tl__head');
  let chapters = [];

  const limit = () => Math.max(1, (lenis ? lenis.limit : document.documentElement.scrollHeight - innerHeight));
  const scrollY_ = () => (lenis ? lenis.scroll : scrollY);

  function build() {
    const main = document.getElementById('main');
    if (!main) return;
    const total = document.documentElement.scrollHeight;
    const nodes = [...main.children].filter((n) => {
      if (n.dataset.chapter === '') return false;
      const r = n.getBoundingClientRect();
      return r.height > 160 && getComputedStyle(n).display !== 'none' && getComputedStyle(n).position !== 'fixed';
    });
    const text = (e) => e?.textContent.replace(/\s+/g, ' ').trim();
    chapters = nodes.map((n) => {
      const top = n.getBoundingClientRect().top + scrollY_();
      const label = n.dataset.chapter || n.querySelector('[data-chapter]')?.dataset.chapter || text(n.querySelector('h1, h2'))
        || n.getAttribute('aria-label') || text(n.querySelector('.t-label, h3'));
      return label ? { n, top, h: n.offsetHeight, label: label.length > 22 ? `${label.slice(0, 21)}…` : label } : null;
    }).filter(Boolean);
    clips.innerHTML = chapters.map((c, i) => {
      const left = (c.top / total) * 100, width = Math.max((c.h / total) * 100 - 0.25, 0.6);
      return `<div class="tl__clip" style="left:${left}%;width:${width}%" data-i="${i}"><i class="tl__key"></i><span>${String(i + 1).padStart(2, '0')} ${c.label}</span></div>`;
    }).join('');
  }

  function update() {
    const y = scrollY_();
    const p = Math.min(1, y / limit());
    head.style.transform = `translateX(${p * track.clientWidth}px)`;
    tcEl.textContent = tc(y / PX_PER_FRAME);
    const mid = y + innerHeight * 0.4;
    clips.querySelectorAll('.tl__clip').forEach((c, i) => {
      const ch = chapters[i];
      c.classList.toggle('is-active', ch && mid >= ch.top && mid < ch.top + ch.h);
    });
    el.classList.toggle('is-end', p > 0.985);
    // slides in once the opening 'title sequence' (first screen) has played
    el.classList.toggle('is-top', y < innerHeight * 0.55);
  }

  // scrub
  let dragging = false;
  const seek = (e) => {
    const r = track.getBoundingClientRect();
    const p = gsap.utils.clamp(0, 1, (e.clientX - r.left) / r.width);
    if (lenis) lenis.scrollTo(p * limit(), { immediate: dragging, duration: 1.2, force: true });
    else scrollTo({ top: p * limit(), behavior: dragging ? 'auto' : 'smooth' });
  };
  track.addEventListener('pointerdown', (e) => { dragging = true; el.classList.add('is-scrub'); track.setPointerCapture(e.pointerId); seek(e); });
  track.addEventListener('pointermove', (e) => dragging && seek(e));
  track.addEventListener('pointerup', () => { dragging = false; el.classList.remove('is-scrub'); });

  ScrollTrigger.addEventListener('refresh', () => { build(); update(); });
  addEventListener('load', build);
  setTimeout(build, 1200);
  if (lenis) lenis.on('scroll', update); else addEventListener('scroll', update, { passive: true });
  build();
  update();
  gsap.fromTo(el, { yPercent: 160 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', delay: 1 });
  return { rebuild: build, el };
}
