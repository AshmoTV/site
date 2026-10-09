import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { boot } from '../core/app.js';
import '../styles/lab.css';
import { site, bySection, media, mediaHTML, projectUrl, esc, TYPE_LABEL } from '../core/content.js';
import { pageHead, projectCard, stats, marquee, arrowIcon, pad } from '../core/components.js';
import { playNow } from '../core/media.js';

gsap.registerPlugin(Flip);

const main = document.getElementById('main');
const lab = bySection('lab');

/* ------------------------------------------------------------ data */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'lora', label: 'LoRAs' },
  { id: 'exploration', label: 'Explorations' },
  { id: 'experiment', label: 'Experiments' },
  { id: 'tool', label: 'AI Tools' },
];
const count = (type) => (type === 'all' ? lab.length : lab.filter((p) => p.type === type).length);

const srcOf = (ref) => (typeof ref === 'string' ? ref : ref?.src);
// a YouTube cover that is one of the project's shorts is vertical content
const isShortCover = (p) => (p.sections || []).some((s) => s.layout === 'shorts' && (s.media || []).some((m) => srcOf(m) === srcOf(p.cover)));

// cover orientation drives the slot each card gets in the editorial grid
function orient(p) {
  if (isShortCover(p)) return 'P';
  const m = media(p.cover);
  if (!m) return 'L';
  const r = m.w / m.h;
  return r > 1.15 ? 'L' : r < 0.9 ? 'P' : 'S';
}

const loras = lab.filter((p) => p.type === 'lora');
const isHF = (u = '') => /huggingface\.co/i.test(u);
const hfCount = loras.reduce((n, p) => n + (p.links || []).filter((l) => isHF(l.url)).length, 0);
const hfProfile = site.socials?.find((s) => isHF(s.url));

// unique tools + models across the lab ("Wan 2.2 (Video)" → "Wan 2.2"; case-insensitive dedupe)
function toolbox() {
  const seen = new Map();
  const add = (raw, kind) => {
    const name = String(raw).replace(/\s*\([^)]*\)/g, '').replace(/^built with\s+/i, '').trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key)) seen.set(key, { name, kind });
  };
  lab.forEach((p) => {
    (p.models || []).forEach((m) => add(m, 'model'));
    (p.tools || []).forEach((t) => add(t, 'tool'));
  });
  return [...seen.values()];
}
const kit = toolbox();
const kitModels = kit.filter((k) => k.kind === 'model').length;
const kitTools = kit.length - kitModels;

const filterFromURL = () => {
  const f = new URLSearchParams(location.search).get('filter');
  return FILTERS.some((x) => x.id === f) ? f : 'all';
};
let active = filterFromURL();

const posterOf = (ref) => (typeof ref === 'string' && /\.mp4$/i.test(ref) ? ref.replace(/\.mp4$/i, '.jpg') : ref);

/* ------------------------------------------------------------ markup */
main.innerHTML = `
  ${pageHead({
    index: '02',
    eyebrow: 'AI Lab — research & development',
    title: 'AI <em class="t-serif accent">Lab</em>',
    intro: 'An ongoing space for research, experimentation and workflow development at the intersection of motion design and generative systems — integrating AI image and video tools into professional pipelines with control, repeatability and visual consistency.',
  })}

  <section class="lab-stats container" aria-label="The lab in numbers">
    <div class="lab-stats__bar t-mono" data-reveal="0.4"><span>Index</span><span class="t-muted">${pad(lab.length)} entries</span></div>
    ${stats([
      { value: String(count('lora')), label: 'LoRA projects' },
      { value: String(count('exploration')), label: 'Explorations' },
      { value: String(count('experiment')), label: 'Experiments' },
      { value: String(count('tool')), label: 'AI tools' },
    ])}
  </section>

  <section class="lab-index container" aria-labelledby="lab-index-title" data-lab-index>
    <h2 id="lab-index-title" class="sr-only">Lab projects</h2>
    <div class="lab-filter" data-filterbar>
      <div class="lab-filter__btns" role="group" aria-label="Filter projects by type">
        <span class="lab-filter__pill" aria-hidden="true"></span>
        ${FILTERS.map((f) => `
          <button class="lab-filter__btn" type="button" data-filter="${f.id}" aria-pressed="${f.id === active}" aria-controls="lab-grid">
            <span>${f.label}</span><span class="lab-filter__n">${pad(count(f.id))}</span>
          </button>`).join('')}
      </div>
      <p class="lab-filter__status t-mono" aria-live="polite"><span data-shown>${pad(count(active))}</span><span class="t-muted"> / ${pad(lab.length)} shown</span></p>
    </div>

    <div class="lab-grid" id="lab-grid" data-grid>
      ${lab.map((p, i) => `
        <div class="lab-cell" data-type="${esc(p.type)}" data-o="${orient(p)}">
          ${projectCard(p, i, { ratio: '4/5', cursor: 'Explore' })}
        </div>`).join('')}
    </div>
  </section>

  <section class="registry section container" aria-labelledby="registry-title">
    <div class="section-head">
      <div>
        <p class="t-label">Trained models — index</p>
        <h2 class="t-h2" id="registry-title" data-split>Model <em class="t-serif accent">registry</em></h2>
      </div>
      <p class="registry__lede t-muted" data-reveal>Every LoRA in the lab and the base model it was trained for. Public weights link straight to Hugging Face.</p>
    </div>
    <div class="registry__term" data-reveal>
      <div class="registry__prompt t-mono" aria-hidden="true">
        <span><span class="accent">›</span> ls ./models --type=lora<span class="registry__caret"></span></span>
        <span class="t-muted">${pad(loras.length)} rows · ${pad(hfCount)} public</span>
      </div>
      <table class="registry__table" role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">#</th>
            <th scope="col" role="columnheader">Name</th>
            <th scope="col" role="columnheader">Base model</th>
            <th scope="col" role="columnheader">Type</th>
            <th scope="col" role="columnheader">Links</th>
          </tr>
        </thead>
        <tbody role="rowgroup" data-registry>
          ${loras.map((p, i) => registryRow(p, i)).join('')}
        </tbody>
      </table>
      <p class="registry__end t-mono"><span aria-hidden="true">— end of registry —</span>${hfProfile ? `<a class="link-row" href="${esc(hfProfile.url)}" target="_blank" rel="noopener">${esc(hfProfile.url.replace(/^https?:\/\/(www\.)?/, ''))}${arrowIcon}</a>` : ''}</p>
    </div>
  </section>
  <div class="reg-follower" data-reg-follower aria-hidden="true">
    ${loras.map((p) => mediaHTML(p.cover, { fit: 'cover', ratio: '16/10', cls: 'reg-follower__item', alt: '' })).join('')}
  </div>

  <section class="toolbox section--tight" aria-labelledby="toolbox-title">
    <div class="container toolbox__head">
      <p class="t-label" id="toolbox-title">Toolbox</p>
      <p class="t-mono t-muted">${pad(kitModels)} models · ${pad(kitTools)} tools across the lab</p>
    </div>
    <div aria-hidden="true">
      ${marquee(kit.map((k) => `<span class="toolbox__k">${k.kind}</span>${esc(k.name)}`), { cls: 'toolbox__marquee', speed: 45 })}
    </div>
    <ul class="sr-only">${kit.map((k) => `<li>${esc(k.name)} (${k.kind})</li>`).join('')}</ul>
  </section>

  <section class="lab-cta section container" aria-label="Keep exploring">
    <p class="t-label">Keep exploring</p>
    <div class="lab-cta__grid" data-stagger>
      <a class="lab-cta__card spot" href="gallery.html" data-spotlight data-cursor="Archive">
        <span class="lab-cta__idx t-mono">01 / Archive</span>
        <span class="lab-cta__title t-h2">The <em class="t-serif accent">archive</em></span>
        <span class="lab-cta__foot"><span class="t-muted">Loops, stills and fragments from the motion archive.</span>${arrowIcon}</span>
      </a>
      <a class="lab-cta__card spot" href="work.html" data-spotlight data-cursor="Work">
        <span class="lab-cta__idx t-mono">02 / Work</span>
        <span class="lab-cta__title t-h2">Selected <em class="t-serif accent">work</em></span>
        <span class="lab-cta__foot"><span class="t-muted">Brand films, product launches and global campaigns.</span>${arrowIcon}</span>
      </a>
    </div>
  </section>
`;

function registryRow(p, i) {
  const base = (p.models || [])[0] || '—';
  const hf = (p.links || []).filter((l) => isHF(l.url));
  const links = hf.length
    ? hf.map((l) => {
      const slug = l.url.replace(/\/+$/, '').split('/').pop();
      return `<a class="registry__chip" href="${esc(l.url)}" target="_blank" rel="noopener" aria-label="${esc(l.label || `${p.title} on Hugging Face`)}" data-cursor="Hugging Face"><span class="registry__hf">HF</span><span class="registry__slug">${esc(slug)}</span>${arrowIcon}</a>`;
    }).join('')
    : `<span class="registry__chip registry__chip--view" aria-hidden="true">View${arrowIcon}</span>`;
  const thumb = mediaHTML(posterOf(p.cover), { gl: false, fit: 'cover', ratio: '1/1', alt: '' }).replace('<figure ', '<figure data-lb-handled ');
  return `
    <tr class="registry__row" role="row" data-index="${i}">
      <td class="registry__idx" role="cell">${pad(i + 1)}</td>
      <td class="registry__name" role="cell">
        <span class="registry__thumb" aria-hidden="true">${thumb}</span>
        <a href="${projectUrl(p)}" data-pt-label="${esc(p.title)}" data-cursor="Open">${esc(p.title)}</a>
      </td>
      <td class="registry__model" role="cell">${esc(base)}</td>
      <td class="registry__type" role="cell">${esc(TYPE_LABEL[p.type] || p.type)}${p.draft ? ' <span class="chip chip--draft">Draft</span>' : ''}</td>
      <td class="registry__links" role="cell">${links}</td>
    </tr>`;
}

/* ------------------------------------------------------------ grid rhythm */
// Rows are packed to 12 columns from the *visible* cards, so the rhythm stays tidy after every filter.
//   tall rows  (≈5 col-units high): portrait 4 cols @ 4/5 · landscape 8 cols @ 16/10
//   short rows (≈3.75 units high):  two landscapes, 6 + 6 @ 16/10
// Featured landscapes get the 8-col slot; DOM order is never changed.
const grid = document.querySelector('[data-grid]');
const cells = [...grid.children];
const model = cells.map((el, k) => ({ el, p: lab[k], o: el.dataset.o }));

function plan(list) {
  const slots = new Map();
  const set = (c, span, ar) => slots.set(c, { span, ar });
  let i = 0;
  while (i < list.length) {
    const start = i;
    const a = list[i], b = list[i + 1];
    if (!b) {
      set(a, a.o === 'L' ? 8 : 4, a.o === 'L' ? '16/10' : '4/5');
      i += 1;
    } else if (a.o === 'L') {
      if (b.o !== 'L') { set(a, 8, '16/10'); set(b, 4, '4/5'); }
      else if (b.p.featured && !a.p.featured) { set(a, 4, '4/5'); set(b, 8, '16/10'); }
      else if (a.p.featured && !b.p.featured) { set(a, 8, '16/10'); set(b, 4, '4/5'); }
      else { set(a, 6, '16/10'); set(b, 6, '16/10'); }
      i += 2;
    } else {
      set(a, 4, '4/5');
      if (b.o === 'L') { set(b, 8, '16/10'); i += 2; }
      else {
        set(b, 4, '4/5');
        const c = list[i + 2];
        if (c) { set(c, 4, '4/5'); i += 3; } else i += 2;
      }
    }
    // an unfinished last row of two 4-col cards widens to 6 + 6
    if (i >= list.length && i - start === 2 && slots.get(list[start]).span + slots.get(list[start + 1]).span === 8) {
      set(list[start], 6, '1/1'); set(list[start + 1], 6, '1/1');
    }
  }
  return slots;
}

function applyLayout(filter) {
  const visible = model.filter((c) => filter === 'all' || c.p.type === filter);
  const slots = plan(visible);
  model.forEach((c) => {
    const s = slots.get(c);
    c.el.classList.toggle('is-out', !s);
    if (s) {
      c.el.style.setProperty('--span', s.span);
      c.el.style.setProperty('--ar', s.ar);
      c.el.dataset.span = s.span;
    }
  });
  return visible.length;
}

// first paint happens before boot so the page enters in the right state
applyLayout(active);
// card text fades up; the media itself is revealed by the WebGL wipe
grid.querySelectorAll('.card__meta').forEach((m) => m.setAttribute('data-reveal', ''));

/* ------------------------------------------------------------ boot */
const app = await boot('lab');
const { touch, reduced, lenis } = app;

/* ---------- filter bar ---------- */
const bar = document.querySelector('[data-filterbar]');
const btns = [...bar.querySelectorAll('[data-filter]')];
const pill = bar.querySelector('.lab-filter__pill');
const shown = bar.querySelector('[data-shown]');
let flip = null;

function movePill(animate = true) {
  const btn = btns.find((b) => b.dataset.filter === active);
  if (!btn) return;
  const vars = { x: btn.offsetLeft, width: btn.offsetWidth };
  if (animate && !reduced) gsap.to(pill, { ...vars, duration: 0.7, ease: 'expo.out', overwrite: true });
  else gsap.set(pill, vars);
}
movePill(false);
addEventListener('resize', () => movePill(false));

function setFilter(next) {
  if (next === active) return;
  active = next;
  btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === active)));
  movePill();

  const url = new URL(location.href);
  if (active === 'all') url.searchParams.delete('filter');
  else url.searchParams.set('filter', active);
  history.replaceState(history.state, '', url);

  const state = Flip.getState(cells);
  flip?.progress(1);
  const h0 = grid.offsetHeight;
  const n = applyLayout(active);
  shown.textContent = pad(n);
  const h1 = grid.offsetHeight;

  const figs = (els) => els.map((el) => el.querySelector('.media')).filter(Boolean);
  const d = reduced ? 0 : 1;
  flip = Flip.from(state, {
    duration: 0.9 * d,
    ease: 'expo.inOut',
    absoluteOnLeave: true,
    scale: false,
    stagger: 0.012 * d,
    onEnter: (els) => gsap.fromTo([...els, ...figs(els)], { opacity: 0, '--gl-alpha': 0 }, { opacity: 1, '--gl-alpha': 1, duration: 0.6 * d, delay: 0.35 * d, ease: 'power2.out' }),
    onLeave: (els) => gsap.to([...els, ...figs(els)], { opacity: 0, '--gl-alpha': 0, duration: 0.35 * d, ease: 'power2.in' }),
    onComplete: () => {
      model.forEach(({ el }) => {
        const on = !el.classList.contains('is-out');
        gsap.set([el, el.querySelector('.media')], { opacity: on ? 1 : 0, '--gl-alpha': on ? 1 : 0 });
      });
      app.refresh(grid);
      ScrollTrigger.refresh();
    },
  });
  // smooth the section height so the content below doesn't jump
  if (d && h0 !== h1) flip.fromTo(grid, { height: h0 }, { height: h1, duration: 0.9, ease: 'expo.inOut', clearProps: 'height' }, 0);

  // when the bar is stuck, bring the top of the grid back into view
  const top = grid.getBoundingClientRect().top;
  if (top < 0) {
    const y = scrollY + top - bar.offsetHeight - parseFloat(getComputedStyle(bar).top || 0) - 24;
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
}
btns.forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
// arrow keys move focus between filters
bar.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const i = btns.indexOf(document.activeElement);
  if (i < 0) return;
  btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length].focus();
  e.preventDefault();
});
// stronger glass once the bar sticks under the nav
ScrollTrigger.create({
  trigger: '[data-lab-index]',
  start: () => `top ${parseFloat(getComputedStyle(bar).top) + 1}px`,
  end: 'bottom top',
  invalidateOnRefresh: true,
  toggleClass: { targets: bar, className: 'is-stuck' },
});

/* ---------- registry: whole row opens the project; floating preview on desktop ---------- */
const reg = document.querySelector('[data-registry]');
reg.addEventListener('click', (e) => {
  if (e.target.closest('a')) return;
  e.target.closest('.registry__row')?.querySelector('.registry__name a')?.click();
});

const follower = document.querySelector('[data-reg-follower]');
const fItems = [...follower.children];
if (!touch) {
  fItems.forEach((it) => it.style.setProperty('--gl-alpha', 0));
  const fx = gsap.quickTo(follower, 'x', { duration: 0.7, ease: 'power3' });
  const fy = gsap.quickTo(follower, 'y', { duration: 0.7, ease: 'power3' });
  let cur = -1;
  const show = (i) => {
    if (i === cur) return;
    cur = i;
    fItems.forEach((it, j) => {
      const on = j === i;
      gsap.to(it, { '--gl-alpha': on ? 1 : 0, opacity: on ? 1 : 0, duration: 0.45, ease: 'power2.out', overwrite: true });
      if (on) playNow(it.querySelector('video'));
    });
  };
  let placed = false;
  reg.addEventListener('pointermove', (e) => {
    if (!placed) { gsap.set(follower, { x: e.clientX, y: e.clientY }); placed = true; }
    fx(e.clientX); fy(e.clientY);
  });
  reg.querySelectorAll('.registry__row').forEach((row) => row.addEventListener('pointerenter', () => show(+row.dataset.index)));
  reg.addEventListener('pointerleave', () => show(-1));
  // the pointer can stay still while the wheel scrolls the table away
  lenis?.on('scroll', () => {
    if (cur < 0) return;
    const r = reg.getBoundingClientRect();
    const x = gsap.getProperty(follower, 'x'), y = gsap.getProperty(follower, 'y');
    if (y < r.top || y > r.bottom || x < r.left || x > r.right) show(-1);
  });
}

app.refresh(main);
