// Themes: mode (dark "Lab" | light "Paper") × accent (Ember | Acid | Ion | Ultraviolet).
// The choice is stored per visitor and applied before first paint by a tiny inline
// script in every page's <head>; this module handles the switcher UI and broadcasts
// an `ashmo:theme` event so WebGL layers can animate to the new palette.
import gsap from 'gsap';

export const MODES = [
  { id: 'dark', label: 'Lab', hint: 'Dark' },
  { id: 'light', label: 'Paper', hint: 'Light' },
];
export const ACCENTS = [
  { id: 'ember', label: 'Ember', swatch: '#ff5a1f' },
  { id: 'acid', label: 'Acid', swatch: '#c6ff3d' },
  { id: 'ion', label: 'Ion', swatch: '#2ee6ff' },
  { id: 'uv', label: 'Ultraviolet', swatch: '#9b6bff' },
];
const KEY = 'ashmo-theme';

export function getTheme() {
  const d = document.documentElement.dataset;
  return { mode: d.mode === 'light' ? 'light' : 'dark', accent: ACCENTS.some((a) => a.id === d.accent) ? d.accent : 'ember' };
}

/** Resolved palette from CSS custom properties (the single source of truth). */
export function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    light: getTheme().mode === 'light',
    accent: v('--accent'), accentSoft: v('--accent-soft'), bg: v('--bg'), text: v('--text'),
    accentRgb: v('--accent-rgb'), textRgb: v('--text-rgb'), bgRgb: v('--bg-rgb'), softRgb: hexToRgb(v('--accent-soft')),
  };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export function setTheme(next) {
  const t = { ...getTheme(), ...next };
  const html = document.documentElement;
  html.classList.add('theme-anim');
  html.dataset.mode = t.mode;
  html.dataset.accent = t.accent;
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* private mode */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.mode === 'light' ? '#f1ede4' : '#07070a');
  clearTimeout(setTheme.timer);
  setTheme.timer = setTimeout(() => html.classList.remove('theme-anim'), 700);
  document.dispatchEvent(new CustomEvent('ashmo:theme', { detail: { ...t, colors: themeColors() } }));
  syncSwitchers();
}

/* ---------------- switcher UI ---------------- */
export function themeSwitcherHTML() {
  return `
  <div class="theme" data-theme-root>
    <button class="theme__btn" aria-haspopup="true" aria-expanded="false" aria-label="Change theme" data-magnetic="0.3" data-cursor="Theme">
      <span class="theme__swatch" aria-hidden="true"></span>
    </button>
    <div class="theme__pop" role="dialog" aria-label="Theme" hidden>
      <p class="theme__label t-mono">Mode</p>
      <div class="theme__modes" role="group" aria-label="Mode">
        ${MODES.map((m) => `<button class="theme__mode" data-mode-set="${m.id}" aria-pressed="false">
          <span class="theme__mode-chip theme__mode-chip--${m.id}" aria-hidden="true"></span><span>${m.label}</span><span class="t-muted">${m.hint}</span></button>`).join('')}
      </div>
      <p class="theme__label t-mono">Accent</p>
      <div class="theme__accents" role="group" aria-label="Accent colour">
        ${ACCENTS.map((a) => `<button class="theme__accent" data-accent-set="${a.id}" aria-pressed="false" aria-label="${a.label}" style="--sw:${a.swatch}">
          <span class="theme__dot" aria-hidden="true"></span><span class="theme__name t-mono">${a.label}</span></button>`).join('')}
      </div>
    </div>
  </div>`;
}

function syncSwitchers() {
  const t = getTheme();
  document.querySelectorAll('[data-mode-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modeSet === t.mode)));
  document.querySelectorAll('[data-accent-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.accentSet === t.accent)));
}

export function initThemeSwitcher() {
  syncSwitchers();
  document.querySelectorAll('[data-theme-root]').forEach((root) => {
    const btn = root.querySelector('.theme__btn');
    const pop = root.querySelector('.theme__pop');
    const open = (on) => {
      btn.setAttribute('aria-expanded', String(on));
      if (on) {
        pop.hidden = false;
        gsap.fromTo(pop, { opacity: 0, y: -8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out' });
        gsap.fromTo(pop.querySelectorAll('button'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: 'expo.out' });
      } else {
        gsap.to(pop, { opacity: 0, y: -6, duration: 0.2, onComplete: () => (pop.hidden = true) });
      }
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); open(pop.hidden); });
    pop.addEventListener('click', (e) => {
      e.stopPropagation();
      const m = e.target.closest('[data-mode-set]');
      const a = e.target.closest('[data-accent-set]');
      if (m) setTheme({ mode: m.dataset.modeSet });
      if (a) setTheme({ accent: a.dataset.accentSet });
    });
    document.addEventListener('click', () => !pop.hidden && open(false));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { open(false); btn.focus(); } });
  });
}
