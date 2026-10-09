// Declarative scroll/text animations. Add the attribute, call initReveal(root).
//   data-split            headline chars rise out of a mask when scrolled into view
//   data-split="words"    same, per word
//   data-reveal           fade + rise; data-reveal="0.2" adds delay
//   data-stagger          children of this element reveal one after another
//   data-scrub-words      words light up as you scroll through the paragraph
//   data-count            numbers count up ("500+", "20+" keep their suffix)
//   data-scramble         text scrambles on hover (nav links, labels)
//   data-parallax="0.15"  moves at a different speed than the scroll
//   data-marquee          infinite ticker; speeds up / reverses with scroll
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const once = (el, key) => (el.dataset[key] ? false : (el.dataset[key] = '1'));

export function initReveal(root = document, { reduced = false, lenis } = {}) {
  if (reduced) {
    root.querySelectorAll('[data-reveal],[data-stagger] > *').forEach((el) => (el.style.opacity = 1));
    return;
  }

  root.querySelectorAll('[data-split]').forEach((el) => {
    if (!once(el, 'splitReady')) return;
    const type = el.dataset.split === 'words' ? 'words' : 'chars';
    const split = SplitText.create(el, { type: 'lines,words,chars', mask: 'lines', linesClass: 'split-line' });
    const targets = split[type];
    gsap.from(targets, {
      yPercent: 115, rotate: type === 'chars' ? 6 : 3, duration: 1.3, ease: 'expo.out',
      stagger: type === 'chars' ? 0.022 : 0.06,
      delay: parseFloat(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  root.querySelectorAll('[data-reveal]').forEach((el) => {
    if (!once(el, 'revealReady')) return;
    gsap.fromTo(el, { y: 48, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: parseFloat(el.dataset.reveal) || 0,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  root.querySelectorAll('[data-stagger]').forEach((el) => {
    if (!once(el, 'staggerReady')) return;
    gsap.fromTo(el.children, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  root.querySelectorAll('[data-scrub-words]').forEach((el) => {
    if (!once(el, 'scrubReady')) return;
    const split = SplitText.create(el, { type: 'words', wordsClass: 'scrub-word' });
    gsap.fromTo(split.words, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });

  root.querySelectorAll('[data-count]').forEach((el) => {
    if (!once(el, 'countReady')) return;
    const m = el.textContent.trim().match(/^([\d.]+)(.*)$/);
    if (!m) return;
    const end = parseFloat(m[1]), suffix = m[2], o = { v: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(o, {
      v: end, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = `${Math.round(o.v)}${suffix}`),
    });
  });

  root.querySelectorAll('[data-parallax]').forEach((el) => {
    if (!once(el, 'parallaxReady')) return;
    const s = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { yPercent: -s * 100 }, {
      yPercent: s * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  initScramble(root);
  initMarquee(root, lenis);
}

export function initScramble(root = document) {
  root.querySelectorAll('[data-scramble]').forEach((el) => {
    if (!once(el, 'scrambleReady')) return;
    const text = el.textContent;
    const target = el.closest('a, button') || el;
    target.addEventListener('pointerenter', () => {
      gsap.to(el, { duration: 0.6, scrambleText: { text, chars: '01<>/_*#+=', speed: 0.6, revealDelay: 0.1 } });
    });
  });
}

export function initMarquee(root = document, lenis) {
  root.querySelectorAll('[data-marquee]').forEach((el) => {
    if (!once(el, 'marqueeReady')) return;
    const track = el.querySelector('.marquee__track');
    if (!track) return;
    // duplicate content so it loops seamlessly
    track.innerHTML += track.innerHTML;
    const base = parseFloat(el.dataset.marquee) || 60; // px per second
    const reverse = el.hasAttribute('data-reverse') ? -1 : 1;
    let x = 0, dir = 1, boost = 0;
    gsap.ticker.add((_, dt) => {
      const half = track.scrollWidth / 2;
      if (!half) return;
      const v = lenis?.velocity || 0;
      if (Math.abs(v) > 0.5) dir = Math.sign(v);
      boost += (Math.min(Math.abs(v) * 0.6, 30) - boost) * 0.08;
      x -= ((base * dt) / 1000) * (1 + boost) * dir * reverse;
      x = ((x % half) + half) % half - half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  });
}
