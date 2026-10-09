// Boot sequence shared by every page.
//
//   import { boot } from '../core/app.js';
//   const app = await boot('lab');
//   main.insertAdjacentHTML(...);   // render dynamic content
//   app.refresh();                   // wire WebGL, lazy video, reveals, cursor fx for new markup
// fonts are self-hosted (no third-party request can block the first paint)
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '../styles/base.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSmooth } from './smooth.js';
import { Engine, webglAvailable } from './gl/engine.js';
import { initCursor, initMagnetic, initSpotlight, initTilt } from './cursor.js';
import { initReveal } from './reveal.js';
import { initMedia } from './media.js';
import { createLightbox } from './lightbox.js';
import { renderChrome, initChrome, pageEnter, initLinkTransitions } from './layout.js';
import { media } from './content.js';
import { initTimeline } from './timeline.js';
import { initThemeSwitcher } from './theme.js';

/**
 * Chromium prerenders internal pages when a link is hovered, so navigation is
 * effectively instant (other browsers simply ignore this).
 */
function speculate() {
  if (!HTMLScriptElement.supports?.('speculationrules')) return;
  const s = document.createElement('script');
  s.type = 'speculationrules';
  s.textContent = JSON.stringify({
    prerender: [{ where: { selector_matches: 'a[href$=".html"]:not([target]), a[href*=".html?"]:not([target])' }, eagerness: 'moderate' }],
  });
  document.head.append(s);
}

export async function boot(page, { footer = true, grid = 1 } = {}) {
  performance.mark('boot:start');
  const html = document.documentElement;
  html.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (touch) html.classList.add('is-touch');

  renderChrome(page, { footer });
  const lenis = initSmooth(reduced);

  let gl = null;
  if (webglAvailable() && !reduced) {
    try {
      gl = new Engine({ lenis, lite: touch });
      gl.bgUniforms.uGrid.value = grid;
      let paused = false;
      gsap.ticker.add(() => !paused && gl.tick());
      // the screen is fully covered while leaving: free the GPU/main thread for the next page
      document.addEventListener('ashmo:leave', () => (paused = true));
      addEventListener('pageshow', (e) => e.persisted && (paused = false));
      html.classList.add('has-gl');
    } catch (err) {
      console.warn('WebGL disabled:', err);
      gl = null;
    }
  }

  const cursor = initCursor();
  const lightbox = createLightbox(lenis);
  initChrome({ lenis });
  initThemeSwitcher();
  initLinkTransitions();
  const timeline = touch ? null : initTimeline({ lenis, page });

  // single YouTube thumbnails open in the lightbox unless a page handles them
  document.addEventListener('click', (e) => {
    const fig = e.target.closest('.media--youtube');
    if (!fig || fig.closest('a') || fig.hasAttribute('data-lb-handled')) return;
    const id = fig.querySelector('img')?.src.match(/vi\/([^/]+)\//)?.[1];
    if (id) lightbox.open([media({ src: `youtube:${id}`, caption: fig.dataset.caption })], 0);
  });

  // DOM fallback for YouTube thumbs without an HD version (load events don't bubble: capture)
  document.addEventListener('load', (e) => {
    const im = e.target;
    if (im.tagName === 'IMG' && im.dataset.ytThumb && im.naturalWidth <= 320 && !im.dataset.ytLo) {
      im.dataset.ytLo = '1';
      im.src = `https://i.ytimg.com/vi/${im.dataset.ytThumb}/hqdefault.jpg`;
    }
  }, true);

  // fonts must be ready before SplitText measures lines
  performance.mark('boot:pre-fonts');
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 450))]);
  performance.mark('boot:fonts');

  const app = {
    page, lenis, gl, reduced, touch, cursor, lightbox, timeline,
    /** Wire up everything inside root after rendering new markup. */
    refresh(root = document) {
      initMedia(root);
      // WebGL media planes on desktop only: native touch scrolling can't stay in sync with the canvas
      if (gl && !touch) gl.refresh(root);
      initReveal(root, { reduced, lenis });
      initMagnetic(root);
      initSpotlight(root);
      initTilt(root);
      ScrollTrigger.refresh();
    },
  };
  app.refresh(document);
  if (import.meta.env.DEV) window.__app = app;
  /** Resolves when the page-transition overlay has finished revealing the page. */
  // (a page prerendered on hover only becomes visible when the visitor actually clicks)
  app.entered = document.prerendering
    ? new Promise((r) => document.addEventListener('prerenderingchange', () => r(pageEnter()), { once: true }))
    : pageEnter();
  speculate();
  performance.mark('boot:end');
  app.entered.then(() => performance.mark('entered'));
  addEventListener('load', () => ScrollTrigger.refresh());
  return app;
}
