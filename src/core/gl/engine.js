// WebGL engine: one fixed canvas behind the page.
// - background layer (smoke + interactive dot grid)
// - optional extra layers (e.g. the home hero particles)
// - "media planes": every [data-gl] element is mirrored by a GPU plane that
//   sits exactly on top of it and adds distortion, tilt, ripple and reveal.
import * as THREE from 'three';
import gsap from 'gsap';
import { planeVert, planeFrag, bgVert, bgFrag, smokeFrag } from './shaders.js';
import { themeColors } from '../theme.js';

// colours are read from the CSS theme tokens (sRGB values, used as-is by the shaders)
const css = (hex) => new THREE.Color().setStyle(hex || '#000', THREE.LinearSRGBColorSpace);
const lerp = (a, b, t) => a + (b - a) * t;

class MediaPlane {
  constructor(engine, el, geo) {
    this.engine = engine;
    this.el = el;
    this.video = el.querySelector('video');
    this.img = el.querySelector('img');
    this.hover = 0;
    this.hoverTarget = 0;
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.mouseTarget = new THREE.Vector2(0.5, 0.5);
    this.vel = new THREE.Vector2();
    this.prev = null;
    this.near = false;
    this.ready = false;
    this.tilt = el.hasAttribute('data-gl-tilt');

    this.uniforms = {
      uTex: { value: null },
      uTexSize: { value: new THREE.Vector2(1, 1) },
      uSize: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: this.mouse },
      uVel: { value: this.vel },
      uHover: { value: 0 },
      uReveal: { value: 0 },
      uRadius: { value: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 },
      uAlpha: { value: 1 },
      uMute: { value: el.hasAttribute('data-gl-mute') ? 1 : 0 },
      uTime: { value: 0 },
      uCrop: { value: new THREE.Vector4(0, 0, 1, 1) },
      uAccent: { value: engine.palette.accent },
    };
    this.ytThumb = el.querySelector('img[data-yt-thumb]')?.dataset.ytThumb || null;
    this.ytCropped = false;
    this.material = new THREE.ShaderMaterial({
      vertexShader: planeVert, fragmentShader: planeFrag, uniforms: this.uniforms, transparent: true, depthTest: false,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    engine.scene.add(this.mesh);

    this.onEnter = () => (this.hoverTarget = 1);
    this.onLeave = () => { this.hoverTarget = 0; this.mouseTarget.set(0.5, 0.5); };
    this.onMove = (e) => {
      const r = this.rect || el.getBoundingClientRect();
      this.mouseTarget.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    el.addEventListener('pointerenter', this.onEnter);
    el.addEventListener('pointerleave', this.onLeave);
    el.addEventListener('pointermove', this.onMove);

    // textures load lazily: nothing is fetched / uploaded to the GPU until the figure nears the viewport
    this.io = new IntersectionObserver(([e]) => {
      this.near = e.isIntersecting;
      if (e.isIntersecting && !this.loading) { this.loading = true; this.load(); }
      if (e.isIntersecting && this.ready && !this.revealed) this.reveal();
    }, { rootMargin: '40% 25% 40% 25%' });
    this.io.observe(el);
  }

  load() {
    const { video, img } = this;
    if (video) {
      // poster first, live video texture once frames are available
      const poster = video.getAttribute('poster') || video.dataset.poster;
      if (poster) this.loadImage(poster, false);
      const toVideo = () => {
        if (this.disposed || this.videoTex) return;
        this.videoTex = new THREE.VideoTexture(video);
        this.videoTex.minFilter = THREE.LinearFilter;
        this.videoTex.generateMipmaps = false;
        this.setTexture(this.videoTex, video.videoWidth, video.videoHeight);
      };
      if (video.readyState >= 2) toVideo();
      else video.addEventListener('loadeddata', toVideo, { once: true });
    } else if (img) {
      this.loadImage(img.currentSrc || img.src, true, img.crossOrigin);
    }
  }

  loadImage(src, primary, crossOrigin) {
    const im = new Image();
    if (crossOrigin != null || /^https?:/.test(src)) im.crossOrigin = 'anonymous';
    im.decoding = 'async';
    im.onload = () => {
      if (this.disposed || (this.videoTex && !primary)) return;
      // YouTube has no HD thumbnail for this video (120×90 placeholder): use hqdefault and crop its letterbox bars
      if (this.ytThumb && !this.ytCropped && im.naturalWidth <= 320) {
        this.ytCropped = true;
        this.uniforms.uCrop.value.set(0, 0.125, 1, 0.75);
        im.src = `https://i.ytimg.com/vi/${this.ytThumb}/hqdefault.jpg`;
        return;
      }
      const tex = new THREE.Texture(im);
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      this.imageTex = tex;
      if (!this.videoTex) this.setTexture(tex, im.naturalWidth, im.naturalHeight);
    };
    // CORS or network failure: keep the plain DOM media visible
    im.onerror = () => { if (primary) this.engine.untrack(this.el); };
    im.src = src;
  }

  setTexture(tex, w, h) {
    this.uniforms.uTex.value = tex;
    this.uniforms.uTexSize.value.set(w || 16, (h || 9) * (this.ytCropped ? 0.75 : 1));
    if (!this.ready) {
      this.ready = true;
      this.el.classList.add('is-gl');
      if (this.near) this.reveal();
    }
  }

  reveal() {
    this.revealed = true;
    // stepped like a diffusion sampler: 24 discrete denoising steps
    gsap.to(this.uniforms.uReveal, { value: 1, duration: 1.7, ease: 'steps(24)', delay: 0.05 + Math.random() * 0.15 });
  }

  update(t, dt, scrollVel) {
    const el = this.el;
    if (!this.near || !this.ready || !el.isConnected) { this.mesh.visible = false; this.prev = null; return; }
    const r = el.getBoundingClientRect();
    this.rect = r;
    const { width: W, height: H } = this.engine.size;
    if (r.width < 1 || r.bottom < -100 || r.top > H + 100 || r.right < -100 || r.left > W + 100) {
      this.mesh.visible = false;
      this.prev = null;
      return;
    }
    // own movement (drag canvases, cursor followers) + page scroll speed
    if (this.prev) {
      const k = Math.min(dt * 60, 3);
      const mvx = (r.left - this.prev.x) / k, mvy = (r.top - this.prev.y) / k;
      this.vel.x = lerp(this.vel.x, mvx, 0.25);
      this.vel.y = lerp(this.vel.y, mvy, 0.25);
    }
    this.prev = { x: r.left, y: r.top };

    const alphaVar = el.style.getPropertyValue('--gl-alpha');
    this.uniforms.uAlpha.value = alphaVar === '' ? 1 : parseFloat(alphaVar);

    this.mesh.visible = this.uniforms.uAlpha.value > 0.001;
    this.mesh.position.set(r.left + r.width / 2 - W / 2, -(r.top + r.height / 2) + H / 2, 0);
    this.mesh.scale.set(r.width, r.height, 1);
    this.uniforms.uSize.value.set(r.width, r.height);

    this.hover = lerp(this.hover, this.hoverTarget, 0.08);
    this.mouse.lerp(this.mouseTarget, 0.12);
    this.uniforms.uHover.value = this.hover;
    this.uniforms.uTime.value = t;
    if (this.tilt) {
      this.mesh.rotation.x = lerp(this.mesh.rotation.x, (this.mouse.y - 0.5) * -0.22 * this.hover, 0.1);
      this.mesh.rotation.y = lerp(this.mesh.rotation.y, (this.mouse.x - 0.5) * 0.22 * this.hover, 0.1);
    }
  }

  dispose() {
    this.disposed = true;
    this.io.disconnect();
    this.el.removeEventListener('pointerenter', this.onEnter);
    this.el.removeEventListener('pointerleave', this.onLeave);
    this.el.removeEventListener('pointermove', this.onMove);
    this.el.classList.remove('is-gl');
    this.engine.scene.remove(this.mesh);
    this.material.dispose();
    this.videoTex?.dispose();
    this.imageTex?.dispose();
  }
}

export class Engine {
  constructor({ lenis, lite = false } = {}) {
    this.lenis = lenis;
    this.lite = lite;
    this.planes = new Map();
    this.layers = [];
    this.size = { width: document.documentElement.clientWidth, height: innerHeight };
    this.pointer = { x: innerWidth / 2, y: innerHeight / 2, sx: innerWidth / 2, sy: innerHeight / 2, energy: 0 };

    const canvas = document.createElement('canvas');
    canvas.className = 'gl';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    // media is ≤1920px video/stills: DPR above 1.5 costs fill-rate without visible gain
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 1.25 : 1.5));
    this.renderer.autoClear = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 10, 5000);
    this.geo = new THREE.PlaneGeometry(1, 1, 24, 24);

    const c = themeColors();
    this.palette = {
      accent: css(c.accent), base: css(c.bg), ink: css(c.text),
      cool: css(c.light ? '#4b6fd6' : '#5980ff'), warm: css(c.light ? c.text : '#fff1e4'),
      light: { value: c.light ? 1 : 0 },
    };
    this.initBackground();
    this.resize();
    document.addEventListener('ashmo:theme', (e) => this.setPalette(e.detail.colors));
    addEventListener('resize', () => this.resize());
    // scrollbar appearing/disappearing changes clientWidth without a window resize
    new ResizeObserver(() => document.documentElement.clientWidth !== this.size.width && this.resize()).observe(document.documentElement);
    addEventListener('pointermove', (e) => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; }, { passive: true });
    this.timer = new THREE.Timer();
  }

  initBackground() {
    const SMOKE_SCALE = 0.3; // fraction of CSS resolution — smoke is soft, so this is invisible but ~10-40x cheaper
    this.smokeScale = SMOKE_SCALE;
    this.smokeTarget = new THREE.WebGLRenderTarget(16, 16, { depthBuffer: false, stencilBuffer: false });
    this.smokeUniforms = {
      uRes: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAccent: { value: this.palette.accent },
      uBase: { value: this.palette.base },
      uCool: { value: this.palette.cool },
      uLight: this.palette.light,
    };
    this.bgUniforms = {
      uSmoke: { value: this.smokeTarget.texture },
      uRes: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2() },
      uScroll: { value: 0 },
      uEnergy: { value: 0 },
      uAccent: { value: this.palette.accent },
      uInk: { value: this.palette.ink },
      uLight: this.palette.light,
      uGrid: { value: 1 },
    };
    const quad = (frag, uniforms) => {
      const scene = new THREE.Scene();
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({ vertexShader: bgVert, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false }));
      mesh.frustumCulled = false;
      scene.add(mesh);
      return scene;
    };
    this.bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.smokeScene = quad(smokeFrag, this.smokeUniforms);
    this.bgScene = quad(bgFrag, this.bgUniforms);
  }

  resize() {
    // layout viewport (excludes the scrollbar) so planes line up with getBoundingClientRect
    const w = document.documentElement.clientWidth, h = innerHeight;
    if (!w || !h) return;
    this.size = { width: w, height: h };
    this.renderer.setSize(w, h);
    const dist = 1000;
    this.camera.position.z = dist;
    this.camera.fov = 2 * Math.atan(h / 2 / dist) * (180 / Math.PI);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.bgUniforms.uRes.value.set(w, h);
    this.smokeUniforms.uRes.value.set(w, h);
    this.smokeTarget.setSize(Math.max(2, Math.round(w * this.smokeScale)), Math.max(2, Math.round(h * this.smokeScale)));
    this.layers.forEach((l) => l.resize?.(w, h));
  }

  /** Mirror one element with a WebGL plane. */
  track(el) {
    if (this.planes.has(el)) return;
    this.planes.set(el, new MediaPlane(this, el, this.geo));
  }

  untrack(el) {
    const p = this.planes.get(el);
    if (!p) return;
    p.dispose();
    this.planes.delete(el);
  }

  /** Scan for new [data-gl] elements (call after rendering new markup). */
  refresh(root = document) {
    root.querySelectorAll('[data-gl]').forEach((el) => this.track(el));
    for (const el of this.planes.keys()) if (!el.isConnected) this.untrack(el);
  }

  addLayer(layer) {
    this.layers.push(layer);
    layer.usePalette?.(this.palette);
    layer.resize?.(this.size.width, this.size.height);
  }

  /** Animate every shader to a new theme palette. */
  setPalette(c) {
    const p = this.palette;
    const to = { accent: css(c.accent), base: css(c.bg), ink: css(c.text), cool: css(c.light ? '#4b6fd6' : '#5980ff'), warm: css(c.light ? c.text : '#fff1e4') };
    for (const k of Object.keys(to)) gsap.to(p[k], { r: to[k].r, g: to[k].g, b: to[k].b, duration: 0.8, ease: 'power2.inOut' });
    gsap.to(p.light, { value: c.light ? 1 : 0, duration: 0.8, ease: 'power2.inOut' });
    this.layers.forEach((l) => l.setTheme?.(c));
  }

  setGrid(v) { gsap.to(this.bgUniforms.uGrid, { value: v, duration: 1 }); }

  tick() {
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const t = this.timer.getElapsed();
    const p = this.pointer;
    const px = p.sx, py = p.sy;
    p.sx = lerp(p.sx, p.x, 0.12);
    p.sy = lerp(p.sy, p.y, 0.12);
    const speed = Math.hypot(p.sx - px, p.sy - py);
    p.energy = lerp(p.energy, Math.min(speed / 30, 1), 0.06);

    const scroll = this.lenis ? this.lenis.scroll : scrollY;
    const scrollVel = this.lenis ? this.lenis.velocity : 0;
    const u = this.bgUniforms;
    this.smokeUniforms.uTime.value = t;
    this.smokeUniforms.uScroll.value = scroll;
    u.uMouse.value.set(p.sx, p.sy);
    u.uScroll.value = scroll;
    u.uEnergy.value = p.energy;

    for (const plane of this.planes.values()) plane.update(t, dt, scrollVel);
    for (const l of this.layers) l.update?.(t, dt, this);

    const r = this.renderer;
    // smoke drifts slowly: refresh the low-res buffer every other frame
    if ((this.frame = (this.frame || 0) + 1) % 2 === 1) {
      r.setRenderTarget(this.smokeTarget);
      r.render(this.smokeScene, this.bgCam);
      r.setRenderTarget(null);
    }
    r.clear();
    r.render(this.bgScene, this.bgCam);
    for (const l of this.layers) l.render?.(r);
    r.clearDepth();
    r.render(this.scene, this.camera);
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
