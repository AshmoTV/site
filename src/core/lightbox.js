// Fullscreen media viewer. lightbox.open(items, index) where items come from
// content.toLightbox() / content.media(). Keyboard, swipe, prev/next.
import gsap from 'gsap';
import { esc } from './content.js';

export function createLightbox(lenis) {
  const el = document.createElement('div');
  el.className = 'lb';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Media viewer');
  el.hidden = true;
  el.innerHTML = `
    <div class="lb__backdrop"></div>
    <div class="lb__stage"></div>
    <button class="lb__nav lb__nav--prev" aria-label="Previous" data-cursor="Prev"></button>
    <button class="lb__nav lb__nav--next" aria-label="Next" data-cursor="Next"></button>
    <div class="lb__bar">
      <span class="lb__count t-mono"></span>
      <span class="lb__caption"></span>
      <button class="lb__close t-mono" aria-label="Close" data-magnetic>Close <span aria-hidden="true">✕</span></button>
    </div>`;
  document.body.append(el);
  const stage = el.querySelector('.lb__stage');
  const count = el.querySelector('.lb__count');
  const caption = el.querySelector('.lb__caption');
  let items = [], index = 0, open = false, lastFocus = null, lenisWasRunning = true;

  function render(dir = 0) {
    const m = items[index];
    let html = '';
    if (m.type === 'video') html = `<video src="${m.url}" poster="${m.poster}" autoplay muted loop playsinline controls></video>`;
    else if (m.type === 'youtube') html = `<div class="lb__frame"><iframe src="${m.embed}" title="${esc(m.caption || 'Video')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
    else html = `<img src="${m.url}" alt="${esc(m.caption || m.title || '')}">`;
    const node = document.createElement('div');
    node.className = 'lb__item';
    node.innerHTML = html;
    const old = stage.firstElementChild;
    stage.append(node);
    if (old) gsap.to(old, { opacity: 0, x: -60 * dir, duration: 0.4, ease: 'power2.in', onComplete: () => old.remove() });
    gsap.fromTo(node, { opacity: 0, x: 80 * dir, scale: dir ? 1 : 0.94 }, { opacity: 1, x: 0, scale: 1, duration: 0.7, ease: 'expo.out' });
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    caption.textContent = m.caption || m.title || '';
    el.classList.toggle('is-single', items.length < 2);
  }

  const go = (d) => { if (items.length > 1) { index = (index + d + items.length) % items.length; render(d); } };

  function show(list, i = 0) {
    items = list; index = i;
    lastFocus = document.activeElement;
    el.hidden = false;
    open = true;
    lenisWasRunning = lenis ? !lenis.isStopped : false;
    lenis?.stop();
    document.documentElement.classList.add('lb-open');
    gsap.fromTo(el, { clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: 0.8, ease: 'expo.inOut' });
    render(0);
    el.querySelector('.lb__close').focus({ preventScroll: true });
  }

  function hide() {
    if (!open) return;
    open = false;
    gsap.to(el, {
      clipPath: 'inset(50% 0 50% 0)', duration: 0.6, ease: 'expo.inOut',
      onComplete: () => { el.hidden = true; stage.innerHTML = ''; },
    });
    if (lenisWasRunning) lenis?.start();
    document.documentElement.classList.remove('lb-open');
    lastFocus?.focus?.({ preventScroll: true });
  }

  el.querySelector('.lb__close').addEventListener('click', hide);
  el.querySelector('.lb__backdrop').addEventListener('click', hide);
  el.querySelector('.lb__nav--prev').addEventListener('click', () => go(-1));
  el.querySelector('.lb__nav--next').addEventListener('click', () => go(1));
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  let sx = null;
  el.addEventListener('pointerdown', (e) => (sx = e.clientX));
  el.addEventListener('pointerup', (e) => {
    if (sx != null && Math.abs(e.clientX - sx) > 60) go(e.clientX < sx ? 1 : -1);
    sx = null;
  });

  return { open: show, close: hide };
}
