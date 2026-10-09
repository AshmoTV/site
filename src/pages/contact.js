import gsap from 'gsap';
import { boot } from '../core/app.js';
import '../styles/contact.css';
import { site, esc } from '../core/content.js';
import { arrowIcon, pad } from '../core/components.js';
import { isWorkingHours, toast } from '../core/layout.js';

const main = document.getElementById('main');

const PROJECT_TYPES = ['AI pipeline / LoRA training', 'Motion design', 'Creative production', 'Consulting', 'Other'];
const ACTIVE_SOCIALS = ['X', 'Discord'];
const waLabel = site.whatsapp.replace(/^https?:\/\//, '');

const copyIcon = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';

const word = (w) => `<span class="talk__word" aria-hidden="true">${[...w].map((c) => `<span class="talk__l${c === '’' ? ' is-mark' : ''}">${c}</span>`).join('')}</span>`;

/* ------------------------------------------------------------------ markup */
main.innerHTML = `
  <header class="ct-hero container">
    <div class="page-head__eyebrow t-mono"><span class="accent">05</span><span>Contact</span><hr class="rule"></div>
    <div class="talk-wrap">
      <h1 class="talk" data-talk aria-label="Let’s talk">${word('Let’s')}${word('talk')}</h1>
    </div>
    <div class="ct-hero__foot">
      <p class="t-lead ct-hero__lead" data-reveal="0.3">Interested in collaborations, consulting, or experimental projects? Feel free to reach out.</p>
      <p class="ct-hero__avail t-mono" data-reveal="0.45"><span class="status-dot" aria-hidden="true"></span>${esc(site.availability)}</p>
    </div>
  </header>

  <section class="rows container" aria-label="Direct contact">
    <ul class="crow-list">
      <li class="crow" data-cursor="Write">
        <span class="crow__idx t-mono" aria-hidden="true">${pad(1)}</span>
        <span class="crow__label t-mono">Email</span>
        <a class="crow__value crow__link" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
        <span class="crow__acts">
          <button type="button" class="crow__copy t-mono" data-copy="${esc(site.email)}" data-cursor="Copy" aria-label="Copy email address">${copyIcon}<span>Copy</span></button>
          ${arrowIcon}
        </span>
      </li>
      <li class="crow" data-cursor="Call">
        <span class="crow__idx t-mono" aria-hidden="true">${pad(2)}</span>
        <span class="crow__label t-mono">Phone</span>
        <a class="crow__value crow__link" href="${esc(site.phoneHref)}">${esc(site.phone)}</a>
        <span class="crow__acts">${arrowIcon}</span>
      </li>
      <li class="crow" data-cursor="Chat">
        <span class="crow__idx t-mono" aria-hidden="true">${pad(3)}</span>
        <span class="crow__label t-mono">WhatsApp</span>
        <a class="crow__value crow__link" href="${esc(site.whatsapp)}" target="_blank" rel="noopener">Message on WhatsApp</a>
        <span class="crow__acts"><span class="crow__meta t-mono">${esc(waLabel)}</span>${arrowIcon}</span>
      </li>
      <li class="crow crow--static">
        <span class="crow__idx t-mono" aria-hidden="true">${pad(4)}</span>
        <span class="crow__label t-mono">Working hours</span>
        <span class="crow__value">${esc(site.hours)}</span>
        <span class="crow__acts crow__acts--status t-mono">
          <span class="crow__clock"><span data-clock="seconds"></span> IST</span>
          <span class="crow__status"><span class="status-dot" data-status-dot aria-hidden="true"></span><span data-status role="status">Online now</span></span>
        </span>
      </li>
    </ul>
  </section>

  <section class="socials section--tight container" aria-labelledby="soc-h">
    <div class="section-head">
      <h2 class="t-h2" id="soc-h" data-split>Find me <em class="t-serif">elsewhere</em></h2>
      <p class="t-muted socials__note" data-reveal>Mostly active on Discord and X.</p>
    </div>
    <ul class="soc-grid" data-stagger>
      ${site.socials.map((s, i) => `
        <li>
          <a class="soc" href="${esc(s.url)}" target="_blank" rel="noopener" data-cursor="Open">
            <span class="soc__top">
              <span class="soc__meta"><span class="soc__idx t-mono">${pad(i + 1)}</span>${ACTIVE_SOCIALS.includes(s.label) ? '<span class="chip chip--accent soc__chip">Most active</span>' : ''}</span>
              ${arrowIcon}
            </span>
            <span class="soc__label">${esc(s.label)}</span>
            <span class="soc__handle t-mono">${esc(s.handle)}</span>
          </a>
        </li>`).join('')}
    </ul>
  </section>

  <section class="compose section container" id="message" aria-labelledby="compose-h">
    <div class="compose__grid grid-12">
      <div class="compose__intro">
        <p class="t-label">Message composer</p>
        <h2 class="t-h2" id="compose-h" data-split>Tell me about <em class="t-serif">your</em> project</h2>
        <p class="t-muted compose__lede" data-reveal>A few lines is plenty — what you’re making, the timeline, and anything you’d like to explore together.</p>
      </div>
      <form class="compose__form" data-form novalidate autocomplete="on">
        <div class="field" data-field="name">
          <label for="f-name" class="t-mono">Your name</label>
          <input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="f-name-err" placeholder="Jane Doe">
          <p class="field__err t-mono" id="f-name-err" role="alert"></p>
        </div>
        <div class="field" data-field="email">
          <label for="f-email" class="t-mono">Your email</label>
          <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="f-email-err" placeholder="jane@studio.com">
          <p class="field__err t-mono" id="f-email-err" role="alert"></p>
        </div>
        <fieldset class="field field--types" data-field="type" aria-describedby="f-type-err">
          <legend class="t-mono">Project type</legend>
          <div class="chips types">
            ${PROJECT_TYPES.map((t, i) => `
              <label class="pick" data-cursor="Select">
                <input type="radio" name="type" value="${esc(t)}" ${i === 0 ? 'required' : ''}>
                <span class="chip">${esc(t)}</span>
              </label>`).join('')}
          </div>
          <p class="field__err t-mono" id="f-type-err" role="alert"></p>
        </fieldset>
        <div class="field" data-field="message">
          <label for="f-message" class="t-mono">Message</label>
          <textarea id="f-message" name="message" rows="5" required aria-describedby="f-message-err" placeholder="What are you working on?"></textarea>
          <p class="field__err t-mono" id="f-message-err" role="alert"></p>
        </div>
        <div class="compose__actions">
          <button type="submit" class="btn btn--accent" data-magnetic="0.25" data-cursor="Compose"><span>Compose email</span>${arrowIcon}</button>
          <p class="compose__hint t-mono t-muted">This opens your email app with the message ready to send — nothing is sent from this page.</p>
        </div>
        <p class="compose__status" data-form-status role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>
`;

/* ------------------------------------------------------------------ boot */
const app = await boot('contact');

/* ---------- live working-hours status ---------- */
const dot = document.querySelector('[data-status-dot]');
const statusText = document.querySelector('[data-status]');
function updateStatus() {
  const on = isWorkingHours();
  dot.classList.toggle('is-off', !on);
  statusText.textContent = on ? 'Online now' : 'Offline — replies next working day';
}
updateStatus();
setInterval(updateStatus, 30000);

/* ---------- headline: letters respond to the pointer ---------- */
initTalk();

function initTalk() {
  const root = document.querySelector('[data-talk]');
  const letters = [...root.querySelectorAll('.talk__l')];
  const N = letters.length;
  const { reduced } = app;

  // resting profile: heavy + wide at both edges, lighter through the middle (also the static look)
  const REST_W = [125, 116, 108, 100, 100, 104, 112, 120, 125];
  const REST_G = [880, 700, 540, 420, 700, 420, 600, 780, 900];
  const restW = (i) => REST_W[i % REST_W.length];
  const restG = (i) => REST_G[i % REST_G.length];
  const PEAK = { w: 125, g: 900 };
  // letter colours follow the theme (text colour at rest, accent near the pointer)
  let INK, HOT;
  const readInk = () => {
    const cs = getComputedStyle(document.documentElement);
    const rgb = (n) => cs.getPropertyValue(n).split(',').map((v) => parseFloat(v));
    INK = rgb('--text-rgb'); HOT = rgb('--accent-rgb');
  };
  readInk();
  document.addEventListener('ashmo:theme', () => {
    readInk();
    letters.forEach((l, i) => {
      if (l.classList.contains('is-mark')) return;
      const m = Math.min(1, (cur?.[i]?.c || 0) * 1.15);
      l.style.color = `rgb(${INK.map((v, j) => Math.round(v + (HOT[j] - v) * m)).join(',')})`;
    });
  });
  const write = (el, w, g) => { el.style.fontVariationSettings = `'wdth' ${w.toFixed(1)}, 'wght' ${Math.round(g)}`; };

  const cur = letters.map((_, i) => ({ w: restW(i), g: restG(i), c: 0 }));
  letters.forEach((l, i) => write(l, cur[i].w, cur[i].g));

  // intro: letters rise out of the mask
  gsap.set(letters, { yPercent: 112 });
  app.entered.then(() => gsap.to(letters, {
    yPercent: 0, duration: reduced ? 0.01 : 1.4, ease: 'expo.out', stagger: reduced ? 0 : 0.05, delay: 0.05,
    onComplete: () => root.classList.add('is-ready'),
  }));

  if (reduced) return;

  let px = -9999, py = -9999;
  let presence = 0;      // 0..1 — how "engaged" the pointer is with the headline
  let targetPresence = 0;
  let visible = true;
  let dirty = true;
  let settled = false;
  let touchDown = false;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; dirty = true; }).observe(root);

  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && !touchDown) return;
    px = e.clientX; py = e.clientY; dirty = true;
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { px = py = -9999; dirty = true; });
  addEventListener('blur', () => { px = py = -9999; dirty = true; });
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  addEventListener('resize', () => { dirty = true; });
  // touch: respond to a finger resting / dragging on the headline
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    touchDown = true; px = e.clientX; py = e.clientY; dirty = true;
  });
  const release = (e) => { if (e.pointerType === 'touch') { touchDown = false; px = py = -9999; dirty = true; } };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  const lerp = (a, b, t) => a + (b - a) * t;
  gsap.ticker.add((_, dtMs) => {
    if (!visible || (!dirty && settled)) return;
    dirty = false;
    const dt = Math.min(dtMs, 64) / 1000;
    const k = 1 - Math.exp(-dt * 9);

    // read first, write after (one layout per frame)
    const hr = root.getBoundingClientRect();
    const rects = letters.map((l) => l.getBoundingClientRect());
    const cx = hr.left + hr.width / 2, cy = hr.top + hr.height / 2;
    const R = Math.max(hr.width * 0.3, 160);

    // engagement: pointer inside / near the band of the headline
    const dy = Math.abs(py - cy) - hr.height / 2;
    targetPresence = px < -9000 || Math.abs(px - cx) > hr.width / 2 + 120 ? 0 : Math.min(1, Math.max(0, 1 - dy / (hr.height * 1.1)));
    presence = lerp(presence, targetPresence, 1 - Math.exp(-dt * 6));

    let delta = 0;
    letters.forEach((l, i) => {
      const r = rects[i];
      const d = Math.hypot(px - (r.left + r.width / 2), (py - (r.top + r.height / 2)) * 0.55);
      const f = presence * Math.exp(-((d / R) ** 2) * 2.4);
      const farW = Math.max(62, restW(i) - 26 * presence);
      const farG = Math.max(200, restG(i) - 150 * presence);
      const tw = lerp(farW, PEAK.w, f), tg = lerp(farG, PEAK.g, f);
      const s = cur[i];
      delta = Math.max(delta, Math.abs(tw - s.w), Math.abs(tg - s.g) / 8, Math.abs(f - s.c) * 10);
      s.w = lerp(s.w, tw, k); s.g = lerp(s.g, tg, k); s.c = lerp(s.c, f, k);
    });
    letters.forEach((l, i) => {
      const s = cur[i];
      write(l, s.w, s.g);
      if (!l.classList.contains('is-mark')) {
        const m = Math.min(1, s.c * 1.15);
        l.style.color = `rgb(${INK.map((v, j) => Math.round(lerp(v, HOT[j], m))).join(',')})`;
      }
    });
    settled = delta < 0.04 && Math.abs(presence - targetPresence) < 0.002;
    if (!settled) dirty = true;
  });
}

/* ---------- message composer -> mailto ---------- */
const form = document.querySelector('[data-form]');
const statusEl = document.querySelector('[data-form-status]');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const VALIDATORS = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Please tell me your name.'),
  email: (v) => (EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email so I can reply.'),
  type: (v) => (v ? '' : 'Pick the closest project type.'),
  message: (v) => (v.trim().length >= 10 ? '' : 'A few words about the project, please (10+ characters).'),
};

const read = () => {
  const d = new FormData(form);
  return { name: d.get('name') || '', email: d.get('email') || '', type: d.get('type') || '', message: d.get('message') || '' };
};

function check(name, values = read()) {
  const field = form.querySelector(`[data-field="${name}"]`);
  const msg = VALIDATORS[name](values[name]);
  const err = field.querySelector('.field__err');
  err.textContent = msg;
  field.classList.toggle('is-invalid', !!msg);
  field.querySelectorAll('input, textarea').forEach((el) => (msg ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid')));
  return !msg;
}

// once a field has been flagged, re-check it live so the error clears as soon as it's fixed
form.addEventListener('input', (e) => {
  const field = e.target.closest('[data-field]');
  if (field?.classList.contains('is-invalid')) check(field.dataset.field);
  statusEl.innerHTML = '';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const values = read();
  const bad = Object.keys(VALIDATORS).filter((n) => !check(n, values));
  if (bad.length) {
    form.querySelector(`[data-field="${bad[0]}"]`).querySelector('input, textarea').focus();
    statusEl.textContent = '';
    return;
  }
  const subject = `Project enquiry — ${values.type}`;
  const body = [
    'Hi Ashish,', '', values.message.trim(), '', '—', values.name.trim(), values.email.trim(), `Project type: ${values.type}`,
  ].join('\r\n');
  const url = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  toast('Opening your email app…');
  statusEl.innerHTML = `Your email app should open with the message ready to send. Nothing happened? <button type="button" class="link" data-copy="${esc(site.email)}">Copy my address</button> and write from any inbox.`;
  location.href = url;
});

app.refresh(main);
