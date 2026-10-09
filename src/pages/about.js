import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { boot } from '../core/app.js';
import '../styles/about.css';
import { site, rich, esc } from '../core/content.js';
import { marquee, clientWall, arrowIcon, pad, stats } from '../core/components.js';

gsap.registerPlugin(ScrollTrigger);

const main = document.getElementById('main');

/* ------------------------------------------------------------------ copy */
// Ashish's own words — light edits for flow only. `key` is the large scrubbed sentence.
const CHAPTERS = [
  {
    title: 'The intersection of design & technology',
    key: 'Since the beginning of my career, I have been drawn to the space where art meets emerging technology.',
    body: ['That curiosity led me into motion design, drove me to become a self-taught Cinema 4D artist, and continues to place my work at the intersection of traditional craft and generative AI.'],
    extra: 'venn',
  },
  {
    title: 'Versatility & leadership at scale',
    key: 'My career spans the full spectrum of production — from broadcast design and CGI to digital media and global advertising.',
    body: [
      'I have delivered work for national commercials, TV shows, documentaries, short films, and large-scale product launches.',
      'During my time partnering with HP Studios, I led a multidisciplinary team of over 10 artists, delivering hundreds of assets for global campaigns across multiple geographies.',
    ],
    extra: 'stat',
  },
  {
    title: 'The generative workflow',
    key: 'I’ve been actively exploring AI-driven workflows — beginning with early Stable Diffusion and evolving into more advanced animation, control, and compositing pipelines.',
    body: [
      'My interest in AI is centered on integration: combining generative tools with traditional motion design principles to build controllable, repeatable, and production-ready systems.',
      'This research lives in an ongoing [AI Lab](lab.html), where I experiment with workflows, model training, and visual systems that can meaningfully support professional creative work.',
    ],
    extra: 'flow',
  },
  {
    title: 'My approach',
    key: 'I’m drawn to motion that feels intentional — where movement serves ideas and narrative.',
    body: [
      'Whether working on client projects or experimental research, my focus remains on clear visual logic, thoughtful integration of new tools and strong motion fundamentals.',
      'I see AI not as a replacement for craft, but as an evolving extension of the creative process, always guided by artistic intent.',
    ],
    extra: 'principles',
  },
];

const NOW = [
  {
    t: 'AI tools for artists',
    d: 'Building and deploying AI-based creative tools for artists, in partnership with production companies and studios.',
    tag: 'AI Lab — Tools',
    href: 'lab.html?filter=tool',
    cursor: 'Tools',
  },
  {
    t: 'Global AI-led campaigns',
    d: 'Working on commercial campaigns that put generative workflows to use at global scale.',
    tag: 'Selected work',
    href: 'work.html',
    cursor: 'Work',
  },
  {
    t: 'Custom LoRA & model training',
    d: 'Training custom LoRAs and models so generative output stays controllable and repeatable.',
    tag: 'AI Lab — LoRAs',
    href: 'lab.html?filter=lora',
    cursor: 'LoRAs',
  },
];

const SKILLS = [
  { t: 'Motion Design', k: ['2D animation', '3D animation', 'Design', 'Motion graphics', 'VFX'] },
  { t: 'Leadership', k: ['Creative Direction', 'Creative Production', 'Pipeline Development', 'Team Management', 'Global Campaign Delivery'] },
  { t: 'Generative Pipeline', k: ['Generative-AI driven visual content', 'Custom Workflows & Node Dev', 'Custom App Dev', 'LoRA Training'] },
  { t: 'Tools', k: ['After Effects', 'Cinema 4D', 'Redshift', 'Premiere Pro', 'Photoshop', 'Illustrator', 'ComfyUI'] },
];

const TOOLS = SKILLS[3].k;
const FLOW = ['Stable Diffusion', 'Animation', 'Control', 'Compositing', 'Production-ready'];
const PRINCIPLES = ['Clear visual logic', 'Thoughtful integration of new tools', 'Strong motion fundamentals'];

/* ------------------------------------------------------------ chapter extras */
function extra(kind) {
  if (kind === 'venn') {
    return `
    <figure class="venn" data-venn role="img" aria-label="My work sits where traditional craft and generative AI overlap">
      <svg viewBox="0 0 440 230" aria-hidden="true">
        <defs><clipPath id="venn-clip"><circle data-venn-clip cx="160" cy="115" r="96"/></clipPath></defs>
        <circle class="venn__c" data-venn-a cx="160" cy="115" r="96"/>
        <circle class="venn__c" data-venn-b cx="280" cy="115" r="96"/>
        <circle class="venn__x" data-venn-b2 cx="280" cy="115" r="96" clip-path="url(#venn-clip)"/>
        <text class="venn__t" x="116" y="119" text-anchor="middle">Traditional craft</text>
        <text class="venn__t" x="326" y="119" text-anchor="middle">Generative AI</text>
        <text class="venn__t venn__t--x" data-venn-tx x="220" y="119" text-anchor="middle">My work</text>
      </svg>
    </figure>`;
  }
  if (kind === 'stat') {
    return `<div class="chapter__stat">${stats([{ value: '10+', label: 'Artists led — HP Studios partnership' }])}</div>`;
  }
  if (kind === 'flow') {
    return `
    <ol class="flow" data-stagger aria-label="How the workflow evolved">
      ${FLOW.map((f, i) => `<li class="flow__step${i === FLOW.length - 1 ? ' is-last' : ''}"><span class="flow__idx t-mono">${pad(i + 1)}</span><span class="flow__label">${esc(f)}</span></li>`).join('')}
    </ol>`;
  }
  if (kind === 'principles') {
    return `
    <ul class="principles" data-stagger>
      ${PRINCIPLES.map((p, i) => `<li class="principles__item"><span class="t-mono accent">${pad(i + 1)}</span><span>${esc(p)}</span></li>`).join('')}
    </ul>`;
  }
  return '';
}

/* ------------------------------------------------------------------ markup */
main.innerHTML = `
  <header class="about-hero container">
    <div class="about-hero__grid grid-12">
      <div class="about-hero__text">
        <div class="page-head__eyebrow t-mono"><span class="accent">04</span><span>About</span><hr class="rule"></div>
        <h1 class="t-display about-hero__title" data-split>Art <em class="t-serif accent">meets</em> technology</h1>
        <p class="t-lead about-hero__lead" data-reveal="0.3">I’m Ashish — an AI-first 2D/3D motion designer, creative producer and model trainer, exploring the collision of art and emerging technology.</p>
        <dl class="about-hero__meta t-mono" data-reveal="0.45">
          <div><dt class="t-muted">Role</dt><dd>${esc(site.role)}</dd></div>
          <div><dt class="t-muted">Based</dt><dd>${esc(site.location)}</dd></div>
          <div><dt class="t-muted">Status</dt><dd><span class="status-dot" aria-hidden="true"></span>${esc(site.availability)}</dd></div>
        </dl>
      </div>
      <div class="about-hero__media">
        <div class="about__frame">
          <figure class="media about__portrait" data-gl data-gl-tilt data-cursor="Hi!" style="aspect-ratio:2/3"><img src="brand/portrait.jpg" alt="Portrait of ${esc(site.name)}" loading="eager"></figure>
        </div>
        <p class="about__caption t-mono">
          <span>${esc(site.name)}</span>
          <span>${esc(site.location)}</span>
          <span><span data-clock></span> IST</span>
        </p>
      </div>
    </div>
  </header>

  <section class="chapters container" aria-label="Chapters">
    ${CHAPTERS.map((c, i) => `
      <article class="chapter grid-12" data-chapter>
        <header class="chapter__side">
          <span class="chapter__idx" aria-hidden="true">${pad(i + 1)}</span>
          <h2 class="chapter__title t-h3">${esc(c.title)}</h2>
          <span class="chapter__bar" aria-hidden="true"><span data-chapter-bar></span></span>
        </header>
        <div class="chapter__body">
          <p class="chapter__key" data-scrub-words>${esc(c.key)}</p>
          <div class="chapter__prose prose" data-reveal>${c.body.map((p) => `<p>${rich(p)}</p>`).join('')}</div>
          ${extra(c.extra)}
        </div>
      </article>`).join('')}
  </section>

  <section class="now section container">
    <div class="section-head">
      <div>
        <p class="t-label">Current focus</p>
        <h2 class="t-h2" data-split>Right <em class="t-serif">now</em></h2>
      </div>
      <p class="t-muted now__lede" data-reveal>For the last two years I’ve been working with production companies and studios to build and deploy AI-based creative tools for artists, and on global AI-led commercial campaigns.</p>
    </div>
    <div class="now__grid" data-stagger>
      ${NOW.map((n, i) => `
        <a class="now__card spot" href="${n.href}" data-spotlight data-tilt="5" data-cursor="${esc(n.cursor)}" data-pt-label="${esc(n.t)}">
          <span class="now__top"><span class="now__idx t-mono">${pad(i + 1)}</span>${arrowIcon}</span>
          <span class="now__main">
            <span class="now__title t-h3">${esc(n.t)}</span>
            <span class="now__desc t-muted">${esc(n.d)}</span>
          </span>
          <span class="now__tag t-mono">${esc(n.tag)}</span>
        </a>`).join('')}
    </div>
  </section>

  <section class="skills section--tight container" aria-labelledby="skills-h">
    <div class="section-head">
      <h2 class="t-h2" id="skills-h" data-split>Core <em class="t-serif">skills</em></h2>
      <p class="t-muted skills__lede" data-reveal>Four overlapping disciplines — craft, leadership, a generative pipeline and the tools that tie them together.</p>
    </div>
    <div class="skills__grid" data-stagger>
      ${SKILLS.map((s, i) => `
        <article class="skill spot" data-spotlight>
          <header class="skill__head"><span class="t-mono t-muted">${pad(i + 1)}</span><h3 class="t-h3">${esc(s.t)}</h3></header>
          <ul class="chips skill__chips">${s.k.map((k) => `<li class="chip skill__chip" data-magnetic="0.35">${esc(k)}</li>`).join('')}</ul>
        </article>`).join('')}
    </div>
  </section>

  ${marquee(TOOLS.map((t, i) => (i % 2 ? `<em class="t-serif">${esc(t)}</em>` : `<span class="is-outline">${esc(t)}</span>`)), { cls: 'about-marquee', speed: 60 })}

  <section class="brands section container">
    <div class="section-head">
      <h2 class="t-h2" data-split>Brand <em class="t-serif">partners</em></h2>
      <p class="t-muted brands__lede" data-reveal>Commercials, launches and campaigns for global brands — directly and through studios.</p>
    </div>
    ${clientWall()}
  </section>
`;

/* ------------------------------------------------------------------ boot */
const app = await boot('about');
const { reduced, touch } = app;

// portrait: fades in once the page transition is done (the GL plane is faded through --gl-alpha)
if (!reduced) {
  const portrait = document.querySelector('.about__portrait');
  gsap.set(portrait, { opacity: 0, '--gl-alpha': 0 });
  app.entered.then(() => {
    gsap.to(portrait, { opacity: 1, '--gl-alpha': 1, duration: 1.4, ease: 'power2.out', delay: 0.1 });
    document.querySelector('.about__frame').classList.add('is-in');
  });
} else {
  document.querySelector('.about__frame').classList.add('is-in');
}

// chapters: the sticky index lights up and a hairline fills while the chapter is on screen
document.querySelectorAll('[data-chapter]').forEach((ch) => {
  const bar = ch.querySelector('[data-chapter-bar]');
  ScrollTrigger.create({
    trigger: ch, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => ch.classList.toggle('is-active', self.isActive),
  });
  if (reduced) { gsap.set(bar, { scaleX: 1 }); return; }
  gsap.fromTo(bar, { scaleX: 0 }, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: ch, start: 'top 60%', end: 'bottom 60%', scrub: true },
  });
});

// venn: the two circles drift together as the chapter scrolls, forming the intersection
const venn = document.querySelector('[data-venn]');
if (venn && !reduced) {
  const q = (s) => venn.querySelector(s);
  const A = [q('[data-venn-a]'), q('[data-venn-clip]')];
  const B = [q('[data-venn-b]'), q('[data-venn-b2]')];
  const label = q('[data-venn-tx]');
  gsap.set(A, { attr: { cx: 100 } });
  gsap.set(B, { attr: { cx: 340 } });
  gsap.set(label, { opacity: 0 });
  gsap.timeline({ scrollTrigger: { trigger: venn, start: 'top 88%', end: 'bottom 50%', scrub: 0.8 } })
    .to(A, { attr: { cx: 160 }, ease: 'none', duration: 1 }, 0)
    .to(B, { attr: { cx: 280 }, ease: 'none', duration: 1 }, 0)
    .to(label, { opacity: 1, ease: 'none', duration: 0.3 }, 0.7);
}

// skills: chips swell and light up as the pointer approaches (desktop), with a wobble on hover
if (!touch && !reduced) {
  document.querySelectorAll('.skill').forEach((card) => {
    const chips = [...card.querySelectorAll('.skill__chip')];
    const scale = chips.map((c) => gsap.quickTo(c, 'scale', { duration: 0.5, ease: 'power3' }));
    const RANGE = 150;
    card.addEventListener('pointermove', (e) => {
      chips.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        const p = Math.max(0, 1 - d / RANGE);
        scale[i](1 + p * p * 0.2);
        c.style.setProperty('--p', p.toFixed(3));
      });
    });
    card.addEventListener('pointerleave', () => chips.forEach((c, i) => { scale[i](1); c.style.setProperty('--p', 0); }));
    chips.forEach((c) => {
      c.addEventListener('pointerenter', () => gsap.to(c, { rotation: gsap.utils.random(-5, 5), duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' }));
      c.addEventListener('pointerleave', () => gsap.to(c, { rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' }));
    });
  });
}

app.refresh(main);
