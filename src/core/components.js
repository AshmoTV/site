// Reusable markup builders shared across pages.
import { site, media, mediaHTML, projectUrl, esc, TYPE_LABEL } from './content.js';

export const arrowIcon = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
export const pad = (n) => String(n).padStart(2, '0');

/** Standard project card (cover media + title + summary). */
export function projectCard(p, i = 0, { ratio = '4/3', fit = 'cover', showSummary = true, cursor = 'Open', mute = false } = {}) {
  const tags = [TYPE_LABEL[p.type] || p.type, p.draft ? 'Draft' : null].filter(Boolean);
  return `
  <a class="card" href="${projectUrl(p)}" data-pt-label="${esc(p.title)}">
    <div class="card__media">
      ${mediaHTML(p.cover, { fit, ratio, cursor, tilt: true, mute, alt: p.title })}
      <div class="card__tags">${tags.map((t) => `<span class="chip${t === 'Draft' ? ' chip--draft' : ''}">${esc(t)}</span>`).join('')}</div>
    </div>
    <div class="card__meta">
      <div>
        <h3 class="card__title">${esc(p.title)}</h3>
        ${showSummary && p.summary ? `<p class="card__sub">${esc(p.summary)}</p>` : ''}
      </div>
      <span class="card__idx">${pad(i + 1)}</span>
    </div>
  </a>`;
}

/** Inner-page header. title may contain <em class="t-serif">…</em>. */
export function pageHead({ eyebrow, title, intro, index }) {
  return `
  <header class="page-head container">
    <div class="page-head__eyebrow t-mono">${index ? `<span class="accent">${esc(index)}</span>` : ''}<span>${esc(eyebrow)}</span><hr class="rule"></div>
    <h1 class="t-display" data-split>${title}</h1>
    ${intro ? `<p class="page-head__intro t-lead" data-reveal="0.3">${intro}</p>` : ''}
  </header>`;
}

/** Infinite ticker. items: array of strings. */
export function marquee(items, { cls = '', speed = 60, reverse = false } = {}) {
  const inner = items.map((t) => `<span class="marquee__item">${t}<span class="marquee__sep">✦</span></span>`).join('');
  return `<div class="marquee ${cls}" data-marquee="${speed}"${reverse ? ' data-reverse' : ''}><div class="marquee__track">${inner}</div></div>`;
}

/** Client logo wall with spotlight hover. */
export function clientWall() {
  return `
  <ul class="clients" data-stagger>
    ${site.clients.map((c) => `
      <li class="clients__cell spot" data-spotlight>
        <img src="${c.logo}" alt="${esc(c.name)}" loading="lazy">
        <span class="clients__name t-mono">${esc(c.name)}</span>
      </li>`).join('')}
  </ul>`;
}

/** Stats row: [{value:'500+', label:'localized assets'}] — numbers count up. */
export function stats(list = []) {
  if (!list.length) return '';
  return `<dl class="stats">${list.map((s) => `
    <div class="stats__item"><dt class="stats__value" data-count>${esc(s.value)}</dt><dd class="t-mono t-muted">${esc(s.label)}</dd></div>`).join('')}</dl>`;
}

export { media, mediaHTML };
