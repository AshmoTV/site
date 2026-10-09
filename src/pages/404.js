import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { boot } from '../core/app.js';
import '../styles/404.css';
import { arrowIcon } from '../core/components.js';

gsap.registerPlugin(ScrambleTextPlugin);

const main = document.getElementById('main');

main.innerHTML = `
  <section class="nf" data-nf>
    <div class="nf__hud container t-mono">
      <span class="nf__rec"><span class="nf__recdot" aria-hidden="true"></span>Error — frame not found</span>
      <span class="nf__tc">TC <span data-tc>00:00:00:00</span></span>
    </div>

    <div class="nf__body container">
      <h1 class="nf__num t-display" data-nf-num data-text="404" aria-label="404" data-cursor="Glitch">
        <span class="nf__digits" data-nf-digits aria-hidden="true">404</span>
      </h1>
      <p class="nf__line t-h2" data-reveal="0.2">This frame <em class="t-serif accent">didn’t</em> render.</p>
      <p class="nf__sub t-muted" data-reveal="0.35">The page you’re after has moved, or never made it out of the queue. The rest of the reel is a click away.</p>
      <div class="nf__actions" data-reveal="0.45">
        <a class="btn btn--accent" href="index.html" data-magnetic="0.25"><span>Back home</span>${arrowIcon}</a>
        <a class="btn" href="work.html" data-magnetic="0.25"><span>Work</span>${arrowIcon}</a>
        <a class="btn" href="lab.html" data-magnetic="0.25"><span>AI Lab</span>${arrowIcon}</a>
      </div>
    </div>

    <div class="nf__foot container t-mono t-muted">
      <span>Render queue — 0 frames</span>
      <span>Status <span class="accent">404</span></span>
    </div>
    <div class="nf__sweep" aria-hidden="true"></div>
  </section>
`;

const app = await boot('404');
const { reduced, touch } = app;

const root = document.querySelector('[data-nf]');
const num = root.querySelector('[data-nf-num]');
const digits = root.querySelector('[data-nf-digits]');
const tc = root.querySelector('[data-tc]');

if (!reduced) {
  // scramble / glitch loop on the giant numerals
  const CHARS = '0123456789#%&?!/<>+=';
  const glitch = (duration = 0.9) => {
    num.classList.add('is-glitch');
    gsap.killTweensOf(digits, 'scrambleText');
    gsap.to(digits, {
      duration, ease: 'none',
      scrambleText: { text: '404', chars: CHARS, speed: 0.7, revealDelay: duration * 0.22, tweenLength: false },
      onUpdate: () => { num.dataset.text = digits.textContent; },
      onComplete: () => { num.dataset.text = '404'; num.classList.remove('is-glitch'); },
    });
  };
  const loop = () => { glitch(gsap.utils.random(0.7, 1.2)); gsap.delayedCall(gsap.utils.random(2.4, 4.6), loop); };
  app.entered.then(() => {
    glitch(1.6);
    gsap.fromTo(digits, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out' });
    gsap.delayedCall(3.6, loop);
  });
  num.addEventListener('click', () => glitch(1));

  // pointer: numerals tilt towards the cursor and the colour channels split along its direction
  if (!touch) {
    gsap.set(num, { transformPerspective: 1100 });
    const rx = gsap.quickTo(num, 'rotationX', { duration: 0.9, ease: 'power3' });
    const ry = gsap.quickTo(num, 'rotationY', { duration: 0.9, ease: 'power3' });
    const split = gsap.quickTo(num, '--split', { duration: 0.6, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      ry(nx * 10); rx(-ny * 8);
      split(nx * 26);
    }, { passive: true });
  }

  // running timecode (24 fps)
  let frames = 0, last = 0;
  gsap.ticker.add((time) => {
    if (time - last < 1 / 24) return;
    last = time;
    frames++;
    const f = frames % 24, s = Math.floor(frames / 24) % 60, m = Math.floor(frames / 1440) % 60, h = Math.floor(frames / 86400);
    tc.textContent = [h, m, s, f].map((n) => String(n).padStart(2, '0')).join(':');
  });
} else {
  root.classList.add('is-static');
}

app.refresh(main);
