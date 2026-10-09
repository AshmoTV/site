import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { boot } from '../core/app.js';
import '../styles/home.css';
import { HeroParticles } from '../core/gl/hero.js';
import { site, bySection, gallery, media, mediaHTML, projectUrl, esc, TYPE_LABEL } from '../core/content.js';
import { projectCard, marquee, clientWall, arrowIcon, pad } from '../core/components.js';
import { playNow } from '../core/media.js';

const main = document.getElementById('main');
const lab = bySection('lab').filter((p) => p.featured);
const work = bySection('work').filter((p) => p.featured || p.draft);
const reel = media(site.showreel);

const CAPABILITIES = [
  { t: 'Motion Design', d: 'End-to-end 2D/3D motion for brand films, product launches and scalable content systems.', k: ['After Effects', 'Cinema 4D', 'Redshift'] },
  { t: 'Creative Direction', d: 'Leading diverse creative teams, managing production pipelines and keeping brands consistent at global scale.', k: ['Team leadership', 'Production', 'Global delivery'] },
  { t: 'AI Innovation', d: 'Integrating generative image and video systems into professional, controllable, repeatable creative workflows.', k: ['ComfyUI', 'WAN', 'Qwen', 'Flux'] },
  { t: 'AI Tools for Artists', d: 'Training custom LoRAs and building tools and pipelines that put generative workflows into artists’ hands.', k: ['LoRA training', 'Custom nodes', 'Python apps'] },
];

main.innerHTML = `
  <section class="hero" data-hero data-chapter="Title sequence">
    <div class="hero__top container t-mono">
      <span>AI-first motion designer</span><span>Creative producer</span><span>Model trainer</span>
    </div>
    <div class="hero__body container">
      <h1 class="hero__title t-display">
        <span class="hero__line" data-hero-line>Designing</span>
        <span class="hero__line" data-hero-line>the <em class="t-serif accent">future</em></span>
        <span class="hero__line" data-hero-line>of motion</span>
      </h1>
      <aside class="hero__form t-mono" aria-live="polite">
        <button class="hero__morph" data-morph data-cursor="Morph">
          <span class="t-muted">Form</span> <span data-form-idx>01</span><span class="t-muted">/04</span>
          <span class="hero__formname" data-form-name>Orb</span>
        </button>
        <form class="hero__prompt" data-prompt autocomplete="off">
          <label for="hero-prompt" class="sr-only">Type a word to generate it with particles</label>
          <span class="hero__caret" aria-hidden="true">›</span>
          <input id="hero-prompt" name="prompt" maxlength="14" placeholder="prompt: type a word" spellcheck="false" data-cursor="Type">
          <button type="submit" data-cursor="Generate" aria-label="Generate">⏎</button>
        </form>
        <span class="t-muted hero__hint">Move to disturb · click to morph · type to generate</span>
      </aside>
    </div>
    <div class="hero__bottom container t-mono">
      <span>${esc(site.name)} — ${esc(site.brand)}</span>
      <span class="hero__scroll"><span class="hero__scrollbar"></span>Scroll to explore</span>
      <span><span data-clock></span> IST</span>
    </div>
  </section>

  <section class="intro section container" data-chapter="Intro">
    <p class="t-label">Hello, I’m Ashish</p>
    <p class="intro__text" data-scrub-words>
      An AI-first motion designer and creative producer. For the last two years I’ve been building and deploying AI-powered creative tools for artists, training custom models, and shaping global AI-led commercial campaigns — always grounded in strong motion fundamentals.
    </p>
    <div class="intro__foot" data-reveal>
      <div class="chips">${['2D / 3D Motion', 'Creative Production', 'LoRA Training', 'ComfyUI Pipelines', 'AI Tools'].map((c) => `<span class="chip">${c}</span>`).join('')}</div>
      <a href="about.html" class="btn" data-magnetic><span>More about me</span>${arrowIcon}</a>
    </div>
  </section>

  ${marquee(['Motion Design', '<em class="t-serif">Creative</em> Production', 'LoRA Training', 'ComfyUI Pipelines', 'AI Tools <em class="t-serif">for</em> Artists', '2D / 3D', 'Global Campaigns'], { cls: 'big-marquee', speed: 70 })}

  <section class="caps section container" data-chapter="Capabilities">
    <div class="section-head">
      <h2 class="t-h2" data-split>What <em class="t-serif">I</em> do</h2>
      <p class="t-muted caps__lede" data-reveal>Craft first, tools second. Four disciplines, one pipeline — from concept and direction to custom-trained models.</p>
    </div>
    <div class="caps__grid" data-stagger>
      ${CAPABILITIES.map((c, i) => `
        <article class="cap spot" data-spotlight data-tilt="5">
          <span class="cap__idx t-mono">${pad(i + 1)}</span>
          <div class="cap__glyph" aria-hidden="true">${glyph(i)}</div>
          <h3 class="t-h3">${c.t}</h3>
          <p class="t-muted">${c.d}</p>
          <div class="chips">${c.k.map((k) => `<span class="chip">${k}</span>`).join('')}</div>
        </article>`).join('')}
    </div>
  </section>

  <section class="labx" data-labx data-chapter="AI Lab">
    <div class="labx__pin">
      <div class="labx__head container">
        <div>
          <p class="t-label">AI Lab — highlights</p>
          <h2 class="t-h2" data-split>Trained, <em class="t-serif">not</em> prompted</h2>
        </div>
        <p class="t-muted labx__lede" data-reveal>Custom LoRAs and multi-stage workflows that make generative video controllable enough for real motion design.</p>
      </div>
      <div class="labx__track" data-labx-track>
        ${lab.map((p, i) => `<div class="labx__item">${projectCard(p, i, { ratio: '4/5', cursor: 'Explore' })}</div>`).join('')}
        <a class="labx__more spot" href="lab.html" data-spotlight data-cursor="Enter">
          <span class="t-mono t-muted">${bySection('lab').length} experiments</span>
          <span class="t-h2">Enter<br>the <em class="t-serif accent">lab</em></span>
          ${arrowIcon}
        </a>
      </div>
      <div class="labx__progress container"><span data-labx-bar></span></div>
    </div>
  </section>

  <section class="works section container" data-chapter="Selected work">
    <div class="section-head">
      <h2 class="t-h2" data-split>Selected <em class="t-serif">work</em></h2>
      <a href="work.html" class="btn" data-magnetic><span>All projects</span>${arrowIcon}</a>
    </div>
    <ol class="works__list" data-works>
      ${work.map((p, i) => `
        <li>
          <a class="works__row" href="${projectUrl(p)}" data-index="${i}" data-pt-label="${esc(p.title)}">
            <span class="works__idx t-mono">${pad(i + 1)}</span>
            <span class="works__title">${esc(p.title)}</span>
            <span class="works__client t-mono">${esc(p.client || '')}</span>
            <span class="works__type t-mono">${p.draft ? '<span class="chip chip--draft">Draft</span>' : esc(TYPE_LABEL[p.type] || '')}</span>
            <span class="works__thumb">${mediaHTML(p.cover, { gl: false, fit: 'cover', ratio: '16/10' })}</span>
            ${arrowIcon}
          </a>
        </li>`).join('')}
    </ol>
  </section>
  <div class="follower" data-follower aria-hidden="true">
    ${work.map((p) => mediaHTML(p.cover, { fit: 'cover', ratio: '16/10', cls: 'follower__item' })).join('')}
  </div>

  <section class="reel section" data-reel data-chapter="Showreel">
    <div class="reel__frame" data-reel-frame data-cursor="Play reel">
      ${mediaHTML(gallery.find((g) => /archive\/26/.test(g.src))?.src || gallery[0].src, { fit: 'cover', ratio: '16/9', cls: 'reel__media' })}
      <div class="reel__ui">
        <span class="t-mono">Showreel</span>
        <span class="reel__title t-display">Play <em class="t-serif accent">reel</em></span>
        <span class="t-mono t-muted">Production · Design · Animation</span>
      </div>
    </div>
  </section>

  <section class="brands section container" data-chapter="Brands">
    <div class="section-head">
      <h2 class="t-h2" data-split>Brands <em class="t-serif">I’ve</em> moved</h2>
      <p class="t-muted" data-reveal>Commercials, launches and campaigns for global brands — at HP Studios I led a multidisciplinary team of 10+ artists delivering hundreds of assets across geographies.</p>
    </div>
    ${clientWall()}
  </section>

  <section class="glimpses section--tight" data-chapter="Archive">
    <div class="container section-head">
      <h2 class="t-h2" data-split>Quick <em class="t-serif">glimpses</em></h2>
      <a href="gallery.html" class="btn" data-magnetic><span>Open the archive</span>${arrowIcon}</a>
    </div>
    ${glimpseRow(gallery.slice(0, 12), false)}
    ${glimpseRow(gallery.slice(30, 42), true)}
  </section>
`;

function glimpseRow(items, reverse) {
  const html = items.map((g) => `<a href="gallery.html" class="glimpse" data-cursor="Archive">${mediaHTML(g.src.replace(/\.mp4$/, '.jpg'), { fit: 'cover', ratio: '16/10' })}</a>`).join('');
  return `<div class="marquee glimpses__row" data-marquee="40"${reverse ? ' data-reverse' : ''}><div class="marquee__track">${html}</div></div>`;
}

function glyph(i) {
  // tiny animated line-art for each capability
  return [
    '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="28"/><circle class="g-orbit" cx="68" cy="40" r="4"/></svg>',
    '<svg viewBox="0 0 80 80"><path d="M12 62 40 18l28 44z"/><path class="g-dash" d="M12 62h56"/></svg>',
    '<svg viewBox="0 0 80 80"><path class="g-wave" d="M6 40c10-18 20-18 30 0s20 18 30 0 10-9 10-9"/></svg>',
    '<svg viewBox="0 0 80 80"><rect x="14" y="14" width="22" height="22" rx="4"/><rect x="44" y="14" width="22" height="22" rx="4"/><rect x="14" y="44" width="22" height="22" rx="4"/><rect class="g-blink" x="44" y="44" width="22" height="22" rx="4"/></svg>',
  ][i];
}

/* ------------------------------------------------------------------ boot */
const app = await boot('home');
const { gl, lenis, touch, reduced } = app;

// hero particle sculpture
let hero = null;
if (gl) {
  hero = new HeroParticles({ count: touch ? 9000 : 26000 });
  gl.addLayer(hero);
  if (import.meta.env.DEV) window.__hero = hero;
  const idx = document.querySelector('[data-form-idx]');
  const name = document.querySelector('[data-form-name]');
  hero.onChange((i, n) => {
    idx.textContent = i < 0 ? 'P→' : pad(i + 1);
    gsap.to(name, { duration: 0.8, scrambleText: { text: i < 0 ? 'Prompt' : n, chars: '01<>/_*#' } });
  });
  let idleUntil = 0;
  document.querySelector('[data-hero]').addEventListener('click', (e) => {
    if (e.target.closest('[data-prompt]')) return;
    hero.next();
    idleUntil = performance.now() + 12000;
  });
  setInterval(() => !document.hidden && performance.now() > idleUntil && hero.next(), 9000);

  // prompt -> particles: "generate" whatever the visitor types
  const form = document.querySelector('[data-prompt]');
  const input = form.querySelector('input');
  const PROMPTS = ['MOTION', 'LORA', 'WAN 2.2', 'COMFYUI', 'HELLO'];
  let pi = 0;
  const ghost = setInterval(() => {
    if (document.activeElement === input || input.value) return;
    input.placeholder = `prompt: ${PROMPTS[pi++ % PROMPTS.length].toLowerCase()}`;
  }, 2600);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = input.value.trim() || PROMPTS[pi % PROMPTS.length];
    hero.morphToText(word);
    idleUntil = performance.now() + 15000;
    input.value = '';
    input.blur();
    clearInterval(ghost);
    input.placeholder = 'prompt: try another word';
  });
  ScrollTrigger.create({
    trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate: (s) => hero.setScatter(s.progress * 2.5),
  });
} else {
  document.querySelector('.hero__form').hidden = true;
}

// preloader on the first visit of the session, then hero intro
async function intro() {
  const first = !sessionStorage.getItem('ashmo-visited');
  sessionStorage.setItem('ashmo-visited', '1');
  if (first && !reduced) await preloader();
  else await app.entered;
  hero?.intro();
  gsap.from('[data-hero-line]', { yPercent: 110, duration: 1.6, ease: 'expo.out', stagger: 0.1 });
  gsap.from('.hero__top > *, .hero__bottom > *, .hero__form', { opacity: 0, y: 16, duration: 1.2, ease: 'expo.out', stagger: 0.06, delay: 0.5 });
}

function preloader() {
  const el = document.createElement('div');
  el.className = 'preloader';
  el.innerHTML = `
    <div class="preloader__lines t-mono">
      <span>› initializing lab</span><span>› loading models</span><span>› calibrating motion</span><span class="accent">› ready</span>
    </div>
    <div class="preloader__count"><span data-count-n>000</span></div>
    <div class="preloader__bar"><span></span></div>`;
  document.body.append(el);
  lenis?.stop();
  const n = el.querySelector('[data-count-n]');
  const o = { v: 0 };
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: () => { el.remove(); lenis?.start(); resolve(); } })
      .from(el.querySelectorAll('.preloader__lines span'), { opacity: 0, x: -10, stagger: 0.32, duration: 0.4 })
      .to(o, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => (n.textContent = String(Math.round(o.v)).padStart(3, '0')) }, 0)
      .to(el.querySelector('.preloader__bar span'), { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=0.15');
  });
}
document.querySelectorAll('[data-hero-line]').forEach((l) => {
  const wrap = document.createElement('span');
  wrap.className = 'hero__mask';
  l.replaceWith(wrap);
  wrap.append(l);
});
intro();

// lab highlights: vertical scroll drives a horizontal track (desktop)
const track = document.querySelector('[data-labx-track]');
const bar = document.querySelector('[data-labx-bar]');
ScrollTrigger.matchMedia({
  '(min-width: 861px)': () => {
    const dist = () => track.scrollWidth - innerWidth + 80;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '[data-labx]', start: 'top top', end: () => `+=${dist()}`, scrub: 0.6, pin: '.labx__pin',
        invalidateOnRefresh: true, onUpdate: (s) => gsap.set(bar, { scaleX: s.progress }),
      },
    });
    return () => tween.kill();
  },
});

// selected work: floating preview follows the pointer
const follower = document.querySelector('[data-follower]');
const items = [...follower.children];
if (!touch) {
  const fx = gsap.quickTo(follower, 'x', { duration: 0.7, ease: 'power3' });
  const fy = gsap.quickTo(follower, 'y', { duration: 0.7, ease: 'power3' });
  const list = document.querySelector('[data-works]');
  const show = (i) => items.forEach((it, j) => {
    const on = j === i;
    it.classList.toggle('is-active', on);
    gsap.to(it, { '--gl-alpha': on ? 1 : 0, opacity: on ? 1 : 0, duration: 0.45, ease: 'power2.out', overwrite: true });
    if (on) playNow(it.querySelector('video'));
  });
  list.addEventListener('pointermove', (e) => {
    fx(e.clientX); fy(e.clientY);
  });
  list.querySelectorAll('.works__row').forEach((row) => row.addEventListener('pointerenter', () => show(+row.dataset.index)));
  list.addEventListener('pointerleave', () => show(-1));
  items.forEach((it) => it.style.setProperty('--gl-alpha', 0));
}

// showreel: grows to full-bleed as it scrolls in, opens the reel on click
const frame = document.querySelector('[data-reel-frame]');
gsap.fromTo(frame, { width: () => (innerWidth > 860 ? '62%' : '88%'), borderRadius: 28 }, {
  width: '100%', borderRadius: 0, ease: 'none',
  scrollTrigger: { trigger: '[data-reel]', start: 'top 85%', end: 'top 10%', scrub: true, invalidateOnRefresh: true },
});
frame.addEventListener('click', () => app.lightbox.open([{ ...reel, caption: 'Showreel — selected production, design and animation work' }], 0));

app.refresh(main);
