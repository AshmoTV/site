// Site chrome shared by every page: nav, fullscreen menu, footer, page transitions, clock.
import gsap from 'gsap';
import { site, esc } from './content.js';
import { themeSwitcherHTML } from './theme.js';

export const NAV = [
  { id: 'work', label: 'Work', href: 'work.html' },
  { id: 'lab', label: 'AI Lab', href: 'lab.html' },
  { id: 'gallery', label: 'Archive', href: 'gallery.html' },
  { id: 'about', label: 'About', href: 'about.html' },
  { id: 'contact', label: 'Contact', href: 'contact.html' },
];

const arrow = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

export function istTime(withSeconds = false) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), hour12: false, timeZone: site.timezone,
  }).format(new Date());
}

export function isWorkingHours() {
  const h = +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: site.timezone }).format(new Date());
  return h >= 9 && h < 18;
}

/** Keeps every [data-clock] element ticking in IST. */
export function startClocks() {
  const tick = () => document.querySelectorAll('[data-clock]').forEach((el) => {
    el.textContent = istTime(el.dataset.clock === 'seconds');
  });
  tick();
  setInterval(tick, 1000);
}

function navHTML(page) {
  return `
  <a class="skip" href="#main">Skip to content</a>
  <header class="nav" data-nav>
    <a class="nav__logo" href="index.html" aria-label="${esc(site.brand)} — home" data-magnetic="0.25">
      <img src="brand/logo.png" alt="${esc(site.brand)}" width="72" height="48">
    </a>
    <nav class="nav__links" aria-label="Primary">
      ${NAV.map((n, i) => `<a href="${n.href}" class="nav__link${n.id === page ? ' is-active' : ''}"${n.id === page ? ' aria-current="page"' : ''}>
        <span class="nav__idx">0${i + 1}</span><span data-scramble>${n.label}</span></a>`).join('')}
    </nav>
    <div class="nav__meta t-mono">
      <span class="status-dot" aria-hidden="true"></span><span>${esc(site.availability)}</span>
      <span class="nav__clock"><span data-clock></span> IST</span>
    </div>
    ${themeSwitcherHTML()}
    <button class="nav__burger" aria-label="Open menu" aria-expanded="false" data-magnetic="0.3"><span></span><span></span></button>
  </header>
  <div class="menu" hidden>
    <div class="menu__inner container">
      <nav class="menu__links" aria-label="Menu">
        ${[{ id: 'home', label: 'Home', href: 'index.html' }, ...NAV].map((n, i) => `
          <a href="${n.href}" class="menu__link${n.id === page ? ' is-active' : ''}"><span class="t-mono">0${i}</span><span class="menu__label">${n.label}</span></a>`).join('')}
      </nav>
      <div class="menu__foot t-mono">
        <a href="mailto:${site.email}">${esc(site.email)}</a>
        <div class="menu__socials">${site.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</div>
      </div>
    </div>
  </div>`;
}

function footerHTML() {
  const year = new Date().getFullYear();
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer__cta">
        <p class="t-mono t-muted" data-reveal>Have a project, a pipeline or a wild idea?</p>
        <a class="footer__big" href="contact.html" data-cursor="Let's talk">
          <span data-split>Let’s build</span>
          <span data-split class="t-serif accent">what’s next</span>
        </a>
      </div>
      <div class="footer__grid" data-stagger>
        <div>
          <p class="t-label">Email</p>
          <button class="footer__email" data-copy="${site.email}" data-cursor="Copy">${esc(site.email)}</button>
        </div>
        <div>
          <p class="t-label">Elsewhere</p>
          <ul class="footer__list">${site.socials.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener" class="link-row"><span>${esc(s.label)}</span>${arrow}</a></li>`).join('')}</ul>
        </div>
        <div>
          <p class="t-label">Local time</p>
          <p class="footer__time"><span data-clock="seconds"></span> <span class="t-muted">IST</span></p>
          <p class="t-muted">${esc(site.location)}</p>
        </div>
        <div>
          <p class="t-label">Index</p>
          <ul class="footer__list">${NAV.map((n) => `<li><a href="${n.href}" class="link-row"><span>${n.label}</span>${arrow}</a></li>`).join('')}</ul>
        </div>
      </div>
      <div class="footer__bottom t-mono">
        <span>© ${year} ${esc(site.brand)} — ${esc(site.name)}</span>
        <span class="t-muted">Built with Three.js · GSAP</span>
        <button class="footer__top" data-top data-magnetic>Back to top ↑</button>
      </div>
    </div>
    <div class="footer__mark" aria-hidden="true">${esc(site.brand.toUpperCase())}</div>
  </footer>`;
}

export function renderChrome(page, { footer = true } = {}) {
  document.body.insertAdjacentHTML('afterbegin', navHTML(page));
  if (footer) document.getElementById('main').insertAdjacentHTML('afterend', footerHTML());
  document.body.insertAdjacentHTML('beforeend', `
    <div class="pt" aria-hidden="true"><div class="pt__panel"></div><div class="pt__panel pt__panel--accent"></div>
      <div class="pt__card"><span class="pt__title"></span></div>
      <div class="pt__label t-mono">
        <span class="pt__dot"></span><span>Rendering</span><span class="pt__text">Loading</span>
        <span class="pt__frames">0000</span><span class="pt__of">/ 0048</span><span class="pt__bar"><i></i></span>
      </div></div>
    <div class="toast t-mono" role="status" aria-live="polite"></div>`);
}

export function toast(msg) {
  const t = document.querySelector('.toast');
  t.textContent = msg;
  gsap.killTweensOf(t);
  gsap.fromTo(t, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out' });
  gsap.to(t, { opacity: 0, y: 10, delay: 1.8, duration: 0.4 });
}

export function initChrome({ lenis }) {
  // hide nav on scroll down, show on scroll up
  const nav = document.querySelector('[data-nav]');
  let last = 0;
  const onScroll = (y) => {
    nav.classList.toggle('is-scrolled', y > 40);
    if (!document.documentElement.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > last && y > 300);
    last = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  // mobile / overlay menu
  const burger = document.querySelector('.nav__burger');
  const menu = document.querySelector('.menu');
  const links = menu.querySelectorAll('.menu__link');
  const toggle = (open) => {
    burger.setAttribute('aria-expanded', open);
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      lenis?.stop();
      gsap.fromTo(menu, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' });
      gsap.fromTo(links, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.9, ease: 'expo.out', delay: 0.25 });
    } else {
      lenis?.start();
      gsap.to(menu, { clipPath: 'circle(0% at 100% 0%)', duration: 0.6, ease: 'expo.inOut', onComplete: () => (menu.hidden = true) });
    }
  };
  burger.addEventListener('click', () => toggle(burger.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true' && toggle(false));

  // copy email
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Email copied to clipboard'); }
    catch { location.href = `mailto:${b.dataset.copy}`; }
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-top]')) lenis ? lenis.scrollTo(0, { duration: 2 }) : scrollTo({ top: 0, behavior: 'smooth' });
  });

  startClocks();
}

/* ---------------- page transitions: "render queue" title card ---------------- */
const KEY = 'ashmo-pt';

export function pageEnter(label) {
  const pt = document.querySelector('.pt');
  const panels = pt.querySelectorAll('.pt__panel');
  const fromNav = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  document.documentElement.classList.remove('pt-in');
  if (!fromNav) { pt.style.display = 'none'; return Promise.resolve(); }
  const name = label || fromNav;
  pt.querySelector('.pt__text').textContent = name;
  pt.querySelector('.pt__title').textContent = name;
  pt.querySelector('.pt__frames').textContent = '0048';
  gsap.set(pt.querySelector('.pt__bar i'), { scaleX: 1 });
  gsap.set(panels, { clipPath: 'inset(0% 0 0% 0)' });
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: () => { pt.style.display = 'none'; resolve(); } })
      .to([pt.querySelector('.pt__label'), pt.querySelector('.pt__card')], { opacity: 0, duration: 0.3 })
      .to(pt.querySelector('.pt__title'), { yPercent: -40, duration: 0.6, ease: 'expo.in' }, 0)
      .to([...panels].reverse(), { clipPath: 'inset(0% 0 100% 0)', duration: 0.9, ease: 'expo.inOut', stagger: 0.08 }, 0.1);
  });
}

export function initLinkTransitions() {
  const pt = document.querySelector('.pt');
  const panels = pt.querySelectorAll('.pt__panel');
  let leaving = false;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      if (url.hash) return;
      e.preventDefault();
      return;
    }
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    const name = a.dataset.ptLabel || a.textContent.trim().replace(/\s+/g, ' ').replace(/^0\d\s*/, '').slice(0, 40) || 'Loading';
    sessionStorage.setItem(KEY, name);
    pt.style.display = '';
    pt.querySelector('.pt__text').textContent = name;
    pt.querySelector('.pt__title').textContent = name;
    const frames = pt.querySelector('.pt__frames');
    const f = { v: 0 };
    gsap.set(panels, { clipPath: 'inset(100% 0 0% 0)' });
    gsap.set([pt.querySelector('.pt__label'), pt.querySelector('.pt__card')], { opacity: 0 });
    gsap.set(pt.querySelector('.pt__title'), { yPercent: 60 });
    gsap.set(pt.querySelector('.pt__bar i'), { scaleX: 0 });
    const tl = gsap.timeline()
      .to(panels, { clipPath: 'inset(0% 0 0% 0)', duration: 0.7, ease: 'expo.inOut', stagger: 0.08 })
      .to([pt.querySelector('.pt__label'), pt.querySelector('.pt__card')], { opacity: 1, duration: 0.25 }, '-=0.35')
      .to(pt.querySelector('.pt__title'), { yPercent: 0, duration: 0.7, ease: 'expo.out' }, '<')
      .to(f, { v: 48, duration: 0.45, ease: 'steps(48)', onUpdate: () => (frames.textContent = String(Math.round(f.v)).padStart(4, '0')) }, '<')
      .to(pt.querySelector('.pt__bar i'), { scaleX: 1, duration: 0.45, ease: 'steps(12)' }, '<');
    // navigate when the "render" completes — on a clock, so a busy frame can never stretch it
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('ashmo:leave'));
      location.href = url.href;
    }, tl.duration() * 1000);
  });
  // back/forward cache: never show a stuck overlay
  addEventListener('pageshow', (e) => { if (e.persisted) { pt.style.display = 'none'; leaving = false; } });
}
