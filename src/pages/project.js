import gsap from 'gsap';
import { boot } from '../core/app.js';
import '../styles/project.css';
import { bySection, getProject, media, mediaHTML, projectUrl, esc, rich, toLightbox, TYPE_LABEL } from '../core/content.js';
import { projectCard, stats, arrowIcon, pad } from '../core/components.js';
import { playNow } from '../core/media.js';

const main = document.getElementById('main');
const id = new URLSearchParams(location.search).get('id');
const p = id ? getProject(id) : null;

const SECTION = {
  lab: { label: 'AI Lab', href: 'lab.html', all: 'All lab projects' },
  work: { label: 'Work', href: 'work.html', all: 'All work' },
};
const backIcon = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
const srcOf = (ref) => (typeof ref === 'string' ? ref : ref?.src);
const isExt = (u = '') => /^https?:/i.test(u);
const typeChip = (q) => `<span class="chip chip--accent">${esc(TYPE_LABEL[q.type] || q.type)}</span>${q.draft ? '<span class="chip chip--draft">Draft</span>' : ''}`;
// a YouTube cover that is also one of the project's shorts is vertical content
const isShortCover = (q) => (q.sections || []).some((s) => s.layout === 'shorts' && (s.media || []).some((m) => srcOf(m) === srcOf(q.cover)));
const linkRow = (l) => `<a class="link-row" href="${esc(l.url)}"${isExt(l.url) ? ' target="_blank" rel="noopener"' : ''}><span>${esc(l.label || l.url)}</span>${arrowIcon}</a>`;

let app;
if (!p) {
  renderMissing();
  app = await boot('project');
  app.refresh(main);
} else {
  renderProject(p);
  app = await boot(p.section === 'work' ? 'work' : 'lab');
  wireProject(p);
  app.refresh(main);
}

/* ================================================================ not found */
function renderMissing() {
  document.title = 'Project not found — AshmoTV';
  const picks = [...bySection('lab').filter((q) => q.featured).slice(0, 2), bySection('work').find((q) => q.featured)].filter(Boolean);
  main.innerHTML = `
    <section class="pj-missing container">
      <div class="page-head__eyebrow t-mono"><span class="accent">404</span><span>Project not found</span><hr class="rule"></div>
      <h1 class="t-display" data-split>Not <em class="t-serif accent">found</em></h1>
      <p class="pj-missing__text t-lead" data-reveal="0.3">${id ? `There’s no project with the id <span class="pj-missing__id t-mono">${esc(id)}</span>.` : 'No project was specified in the link.'} It may have been renamed or moved.</p>
      <div class="pj-missing__actions" data-reveal="0.45">
        <a class="btn btn--accent" href="lab.html" data-magnetic><span>AI Lab</span>${arrowIcon}</a>
        <a class="btn" href="work.html" data-magnetic><span>Work</span>${arrowIcon}</a>
        <a class="link-row t-mono" href="index.html"><span>Home</span>${arrowIcon}</a>
      </div>
    </section>
    ${picks.length ? `
    <section class="pj-picks section--tight container" aria-labelledby="picks-title">
      <p class="t-label" id="picks-title">Start here instead</p>
      <div class="pj-picks__grid">${picks.map((q, i) => projectCard(q, i, { ratio: '4/3', cursor: 'Open' })).join('')}</div>
    </section>` : ''}`;
}

/* ================================================================ project */
function renderProject(p) {
  const sec = SECTION[p.section] || SECTION.lab;
  const list = bySection(p.section);
  const idx = list.findIndex((q) => q.id === p.id);
  const next = list.length > 1 ? list[(idx + 1) % list.length] : null;
  const secs = (p.sections || []).filter((s) => s && (s.title || (s.media || []).length));
  const body = (p.body || []).filter(Boolean);

  document.title = `${p.title} — AshmoTV`;
  setMeta('meta[name="description"]', p.summary);
  setMeta('meta[property="og:title"]', `${p.title} — AshmoTV`);
  setMeta('meta[property="og:description"]', p.summary);

  // --- meta grid (only present fields)
  const ul = (arr) => `<ul class="pj-meta__list">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const meta = [
    p.roles?.length && ['Role', ul(p.roles)],
    p.client && ['Client', esc(p.client)],
    p.year && ['Year', esc(p.year)],
    p.tools?.length && ['Tools', ul(p.tools)],
    p.models?.length && ['Models', ul(p.models)],
    p.links?.length && ['Links', `<div class="pj-meta__links">${p.links.map(linkRow).join('')}</div>`],
  ].filter(Boolean);

  // --- cover
  const cm = media(p.cover);
  const yt = cm?.type === 'youtube';
  const short = yt && isShortCover(p);
  const ratio = short ? 9 / 16 : yt ? 16 / 9 : cm ? cm.w / cm.h : 16 / 9;
  const coverOpts = short ? { fit: 'cover', ratio: '9/16' } : yt ? { fit: 'cover', ratio: '16/9' } : { fit: 'natural' };
  const cover = cm ? mediaHTML(cm, { ...coverOpts, cursor: yt ? 'Play' : 'View', alt: p.caption || p.title }).replace('<figure ', '<figure data-lb-handled ') : '';

  // --- internal links → related projects (e.g. a tool that lives inside another project's pipeline)
  const related = (p.links || [])
    .map((l) => /project\.html\?id=([^&#]+)/.exec(l.url || '')?.[1])
    .filter(Boolean)
    .map((rid) => getProject(decodeURIComponent(rid)))
    .filter((q) => q && q.id !== p.id);

  main.innerHTML = `
  <article class="pj">
    <header class="pj-head container">
      <div class="pj-head__bar t-mono" data-reveal>
        <a class="pj-back" href="${sec.href}" data-cursor="Back" data-pt-label="${esc(sec.label)}">${backIcon}<span>${esc(sec.label)}</span></a>
        ${idx >= 0 ? `<span class="pj-head__pos">${pad(idx + 1)} <span class="t-muted">/ ${pad(list.length)}</span></span>` : ''}
        <span class="chips pj-head__chips">${typeChip(p)}</span>
        ${p.client || p.year ? `<span class="pj-head__client">${[p.client, p.year].filter(Boolean).map(esc).join(' · ')}</span>` : ''}
      </div>
      <h1 class="pj-title t-h1" data-split>${esc(p.title)}</h1>
      ${p.summary ? `<p class="pj-lead t-lead" data-reveal="0.35">${esc(p.summary)}</p>` : ''}
    </header>

    ${meta.length || p.stats?.length ? `
    <section class="pj-meta container" aria-label="Project details">
      ${meta.length ? `<dl class="pj-meta__grid" data-stagger>
        ${meta.map(([k, v]) => `<div class="pj-meta__item"><dt class="t-label">${k}</dt><dd>${v}</dd></div>`).join('')}
      </dl>` : ''}
      ${p.stats?.length ? `<div class="pj-stats">${stats(p.stats)}</div>` : ''}
    </section>` : ''}

    ${cover ? `
    <section class="pj-cover container" aria-label="Cover">
      <div class="pj-cover__frame" style="--r:${ratio.toFixed(4)}" role="button" tabindex="0" data-cover aria-label="${yt ? 'Play video' : 'View full screen'}: ${esc(p.caption || p.title)}">${cover}</div>
      <p class="pj-cover__cap media-caption">
        <span>${p.caption ? `<span class="accent">Fig. 00</span> — ${esc(p.caption)}` : '<span class="accent">Fig. 00</span> — Cover'}</span>
        <span class="t-muted">${yt ? 'Play film' : 'View full screen'}</span>
      </p>
    </section>` : ''}

    ${body.length ? `
    <section class="pj-body section container" aria-label="Overview">
      <aside class="pj-body__aside">
        <div class="pj-body__sticky">
          <p class="t-label">Overview</p>
          ${secs.length ? `
          <nav class="pj-toc" aria-label="On this page">
            <p class="pj-toc__head t-mono">Contents</p>
            <ol>${secs.map((s, i) => `<li><a href="#section-${i + 1}" data-toc><span class="t-mono">${pad(i + 1)}</span><span>${esc(s.title || `Section ${i + 1}`)}</span></a></li>`).join('')}</ol>
          </nav>` : ''}
        </div>
      </aside>
      <div class="pj-body__main">
        <p class="pj-statement" data-scrub-words>${rich(body[0])}</p>
        ${body.length > 1 ? `<div class="pj-prose prose" data-reveal>${body.slice(1).map((t) => `<p>${rich(t)}</p>`).join('')}</div>` : ''}
      </div>
    </section>` : ''}

    ${secs.map((s, i) => sectionHTML(s, i)).join('')}

    ${related.length ? `
    <section class="pj-related section--tight container" aria-labelledby="related-title">
      <div class="pj-related__label">
        <p class="t-label" id="related-title">In context</p>
        <p class="t-muted">Where this fits in a larger pipeline.</p>
      </div>
      <div class="pj-related__cards">${related.map((q, i) => projectCard(q, i, { ratio: '16/10', cursor: 'Open' })).join('')}</div>
    </section>` : ''}
  </article>

  ${next ? nextHTML(next, list, sec) : `
  <section class="pj-next pj-next--solo container">
    <a class="btn" href="${sec.href}" data-magnetic><span>${esc(sec.all)}</span>${arrowIcon}</a>
  </section>`}`;
}

function setMeta(sel, val) {
  if (val) document.querySelector(sel)?.setAttribute('content', val);
}

function sectionHTML(s, si) {
  const items = (s.media || []).filter(Boolean);
  const layout = ['wide', 'stack', 'shorts'].includes(s.layout) ? s.layout : 'grid';
  const n = items.length;
  // small sets (≤4) sit in a plain row grid, one column per item; larger sets flow as masonry columns
  const cls = layout === 'grid' ? (n <= 4 ? `pj-grid pj-grid--row pj-grid--${n}` : 'pj-grid pj-grid--masonry') : `pj-${layout}`;
  const num = si + 1;
  return `
  <section class="pj-sec container pj-sec--${layout}" id="section-${num}" data-sec="${si}" aria-labelledby="section-${num}-title">
    <header class="pj-sec__head">
      <span class="pj-sec__idx t-mono"><span class="accent">${pad(num)}</span></span>
      <div class="pj-sec__titles">
        <h2 class="pj-sec__title" id="section-${num}-title" data-split="words">${esc(s.title || `Section ${num}`)}</h2>
        ${s.text ? `<p class="pj-sec__text t-muted" data-reveal="0.15">${esc(s.text)}</p>` : ''}
      </div>
      ${n ? `<span class="pj-sec__count t-mono">${pad(n)} ${n === 1 ? 'item' : 'items'}</span>` : ''}
    </header>
    ${n ? `<div class="pj-sec__media ${cls}">${items.map((r, i) => itemHTML(r, i, n, layout, s)).join('')}</div>` : ''}
  </section>`;
}

function itemHTML(ref, i, n, layout, s) {
  const m = media(ref);
  if (!m) return '';
  const yt = m.type === 'youtube';
  const opts = layout === 'shorts' ? { fit: 'cover', ratio: '9/16' } : yt ? { fit: 'cover', ratio: '16/9' } : { fit: 'natural' };
  const label = m.caption || s.title || 'Media';
  const fig = mediaHTML(m, {
    ...opts,
    cursor: yt ? 'Play' : 'View',
    tilt: layout === 'grid' || layout === 'shorts',
    alt: `${label} — ${i + 1} of ${n}`,
  }).replace('<figure ', '<figure data-lb-handled ');
  return `
    <div class="pj-item" role="button" tabindex="0" data-i="${i}" aria-label="${yt ? 'Play' : 'View'} ${esc(label)} (${i + 1} of ${n})">
      ${fig}
      ${m.caption ? `<p class="media-caption">${esc(m.caption)}</p>` : ''}
    </div>`;
}

function nextHTML(next, list, sec) {
  const ni = list.indexOf(next);
  return `
  <section class="pj-next" aria-labelledby="next-title">
    <div class="container">
      <div class="pj-next__bar">
        <p class="t-label" id="next-title">Next project</p>
        <span class="t-mono t-muted">${pad(ni + 1)} / ${pad(list.length)}</span>
      </div>
      <a class="pj-next__link" href="${projectUrl(next)}" data-cursor="Next" data-pt-label="${esc(next.title)}" data-next>
        <span class="pj-next__media" data-next-media aria-hidden="true">${mediaHTML(next.cover, { fit: 'cover', ratio: '16/10', alt: '' })}</span>
        <span class="pj-next__title">${esc(next.title)}</span>
        <span class="pj-next__meta">
          <span class="chips">${typeChip(next)}</span>
          ${next.summary ? `<span class="pj-next__sum t-muted">${esc(next.summary)}</span>` : ''}
          <span class="pj-next__arrow">${arrowIcon}</span>
        </span>
      </a>
      <div class="pj-next__foot">
        <a class="btn" href="${sec.href}" data-magnetic><span>${esc(sec.all)}</span>${arrowIcon}</a>
        <a class="link-row t-mono" href="${sec.href === 'lab.html' ? 'work.html' : 'lab.html'}"><span>${sec.href === 'lab.html' ? 'Work' : 'AI Lab'}</span>${arrowIcon}</a>
      </div>
    </div>
  </section>`;
}

/* ================================================================ interactions */
function wireProject(p) {
  const { lightbox, lenis, touch, reduced } = app;
  const secs = (p.sections || []).filter((s) => s && (s.title || (s.media || []).length));

  // section media → lightbox with every item of that section
  const openItem = (item) => {
    const s = secs[+item.closest('[data-sec]').dataset.sec];
    const items = toLightbox(s.media.filter(Boolean)).map((m) => ({ ...m, caption: m.caption || s.title }));
    lightbox.open(items, +item.dataset.i);
  };
  const openCover = () => lightbox.open([{ ...media(p.cover), caption: p.caption || p.title }], 0);
  const activate = (target) => {
    const item = target.closest('.pj-item');
    if (item) { openItem(item); return true; }
    if (target.closest('[data-cover]')) { openCover(); return true; }
    return false;
  };
  main.addEventListener('click', (e) => { if (!e.target.closest('a')) activate(e.target); });
  main.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.pj-item, [data-cover]')) {
      e.preventDefault();
      activate(e.target);
    }
  });

  // contents → smooth scroll to the section
  main.querySelectorAll('[data-toc]').forEach((a) => a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = -(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76) - 12;
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(history.state, '', a.getAttribute('href'));
  }));

  // next project: cover fades in on hover and drifts with the pointer
  const link = main.querySelector('[data-next]');
  if (link && !touch) {
    const wrap = link.querySelector('[data-next-media]');
    const fig = wrap.querySelector('.media');
    gsap.set(fig, { '--gl-alpha': 0, opacity: 0 });
    const qx = gsap.quickTo(wrap, 'x', { duration: 0.9, ease: 'power3' });
    const qy = gsap.quickTo(wrap, 'y', { duration: 0.9, ease: 'power3' });
    const fade = (on) => gsap.to(fig, { '--gl-alpha': on ? 1 : 0, opacity: on ? 1 : 0, duration: on ? 0.6 : 0.4, ease: 'power2.out', overwrite: true });
    link.addEventListener('pointerenter', () => { fade(true); playNow(fig.querySelector('video')); });
    link.addEventListener('pointerleave', () => { fade(false); qx(0); qy(0); });
    link.addEventListener('pointermove', (e) => {
      const r = link.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width * 0.72)) * 0.18);
      qy((e.clientY - (r.top + r.height / 2)) * 0.25);
    });
    link.addEventListener('focus', () => fade(true));
    link.addEventListener('blur', () => fade(false));
  }
}
