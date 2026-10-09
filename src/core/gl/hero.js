// Home hero: a particle sculpture that morphs between shapes, swirls with
// curl noise, is pushed around by the pointer and scatters as you scroll away.
import * as THREE from 'three';
import gsap from 'gsap';
import { noise } from './shaders.js';

const vert = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aRand;
uniform float uMorph;
uniform float uTime;
uniform float uScatter;
uniform float uSize;
uniform float uPixel;
uniform vec3 uPointer;
uniform float uPush;
varying float vRand;
varying float vGlow;
${noise}
void main(){
  vRand = aRand;
  float m = smoothstep(aRand * .45, aRand * .45 + .55, uMorph);
  vec3 p = mix(aFrom, aTo, m);
  // mid-morph turbulence
  float turb = sin(m * 3.14159) * 1.2 + .12;
  vec3 q = p * .55 + uTime * .12;
  p += vec3(snoise(q), snoise(q + 17.1), snoise(q + 41.7)) * turb * .35;
  // pointer repulsion
  vec3 toP = p - uPointer;
  float d = length(toP.xy);
  float f = smoothstep(1.6, 0., d) * uPush;
  p += normalize(toP + vec3(0., 0., .001)) * f * .9;
  vGlow = f;
  // scroll scatter
  p += normalize(p + .001) * uScatter * (2. + aRand * 6.);
  p.z += uScatter * aRand * 4.;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (.5 + aRand) * uPixel * (6. / -mv.z);
}`;

const frag = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uWarm;      // light particles on dark, ink particles on paper
uniform float uLight;
uniform float uAlpha;
varying float vRand;
varying float vGlow;
void main(){
  vec2 c = gl_PointCoord - .5;
  float d = length(c);
  float a = smoothstep(.5, 0., d);
  a *= a;
  vec3 col = mix(uAccent, uWarm, smoothstep(.35, 1., vRand));
  col = mix(col, uWarm, vGlow * .6);
  // additive glow on dark grounds, plain ink on paper
  gl_FragColor = mix(vec4(col * a, a * uAlpha), vec4(col, a * uAlpha * .7), uLight);
}`;

function sphere(n) {
  const out = new Float32Array(n * 3);
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
    const R = 2.1 + (Math.random() - 0.5) * 0.08;
    out.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
  }
  return out;
}

function torusKnot(n) {
  const out = new Float32Array(n * 3);
  const p = 2, q = 3;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const r = Math.cos(q * t) + 2;
    const cx = r * Math.cos(p * t), cy = r * Math.sin(p * t), cz = -Math.sin(q * t);
    const a = Math.random() * Math.PI * 2, rad = 0.32 * Math.sqrt(Math.random());
    out.set([(cx + Math.cos(a) * rad) * 0.72, (cy + Math.sin(a) * rad) * 0.72, (cz + Math.cos(a + 1) * rad) * 0.72], i * 3);
  }
  return out;
}

function wave(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * 9, z = (Math.random() - 0.5) * 5;
    const y = Math.sin(x * 1.1) * 0.45 + Math.cos(z * 1.7 + x * 0.4) * 0.35;
    out.set([x, y - 0.2, z], i * 3);
  }
  return out;
}

function text(n, word) {
  const c = document.createElement('canvas');
  const W = 1200, H = 300;
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fs = 210;
  ctx.font = `900 ${fs}px "Archivo Variable", Archivo, "Arial Black", sans-serif`;
  const tw = ctx.measureText(word).width;
  if (tw > W * 0.94) { fs = Math.floor(fs * (W * 0.94) / tw); ctx.font = `900 ${fs}px "Archivo Variable", Archivo, "Arial Black", sans-serif`; }
  ctx.fillText(word, W / 2, H / 2 + 8);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  const out = new Float32Array(n * 3);
  const scale = 7.4 / W;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[Math.floor(Math.random() * pts.length)] || [W / 2, H / 2];
    out.set([(x - W / 2) * scale + (Math.random() - 0.5) * 0.02, -(y - H / 2) * scale, (Math.random() - 0.5) * 0.25], i * 3);
  }
  return out;
}

export class HeroParticles {
  constructor({ count = 26000, word = 'ASHMOTV' } = {}) {
    this.count = count;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.z = 11;
    this.shapes = [sphere(count), text(count, word), torusKnot(count), wave(count)];
    this.names = ['Orb', 'Signal', 'Knot', 'Field'];
    this.index = 0;

    const geo = new THREE.BufferGeometry();
    const rand = new Float32Array(count).map(() => Math.random());
    this.from = new THREE.BufferAttribute(this.shapes[0].slice(), 3);
    this.to = new THREE.BufferAttribute(this.shapes[0].slice(), 3);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aFrom', this.from);
    geo.setAttribute('aTo', this.to);
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

    this.uniforms = {
      uMorph: { value: 1 },
      uTime: { value: 0 },
      uScatter: { value: 0 },
      uSize: { value: 2.2 },
      uPixel: { value: Math.min(devicePixelRatio, 2) },
      uPointer: { value: new THREE.Vector3(99, 99, 0) },
      uPush: { value: 1 },
      uAccent: { value: new THREE.Color(1, 0.35, 0.12) },
      uWarm: { value: new THREE.Color(1, 0.94, 0.89) },
      uLight: { value: 0 },
      uAlpha: { value: 0 },
    };
    this.points = new THREE.Points(geo, new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    }));
    this.points.frustumCulled = false;
    this.group = new THREE.Group();
    this.group.add(this.points);
    this.scene.add(this.group);
    this.rot = { x: 0, y: 0 };
    this.offsetX = 0;
    this.listeners = [];
  }

  intro() {
    gsap.to(this.uniforms.uAlpha, { value: 1, duration: 2.2, ease: 'power2.out' });
    gsap.fromTo(this.uniforms.uScatter, { value: 1.2 }, { value: 0, duration: 2.6, ease: 'expo.out' });
  }

  onChange(fn) { this.listeners.push(fn); }

  /** Called by the engine: share its animated theme palette. */
  usePalette(p) {
    this.uniforms.uAccent.value = p.accent;
    this.uniforms.uWarm.value = p.warm;
    this.uniforms.uLight = p.light;
    this.points.material.uniforms = this.uniforms;
    this.setTheme({ light: p.light.value > 0.5 });
  }

  setTheme(c) {
    const m = this.points.material;
    m.blending = c.light ? THREE.NormalBlending : THREE.AdditiveBlending;
    m.needsUpdate = true;
  }

  morphTo(i) {
    const next = ((i % this.shapes.length) + this.shapes.length) % this.shapes.length;
    if (next === this.index && !this.custom) return;
    this.custom = null;
    this.index = next;
    this.morphInto(this.shapes[next]);
    this.listeners.forEach((fn) => fn(next, this.names[next]));
  }

  /** "Generate" any word out of particles. */
  morphToText(word) {
    const w = word.trim().toUpperCase().slice(0, 14);
    if (!w) return;
    this.custom = w;
    this.index = 1; // text forms settle face-on
    this.morphInto(text(this.count, w));
    this.listeners.forEach((fn) => fn(-1, w));
  }

  morphInto(target) {
    // current visual state (mid-morph included) becomes the new "from"
    const m = this.uniforms.uMorph.value;
    if (m < 1) for (let i = 0; i < this.from.array.length; i++) this.from.array[i] += (this.to.array[i] - this.from.array[i]) * m;
    else this.from.array.set(this.to.array);
    this.from.needsUpdate = true;
    this.to.array.set(target);
    this.to.needsUpdate = true;
    gsap.killTweensOf(this.uniforms.uMorph);
    gsap.fromTo(this.uniforms.uMorph, { value: 0 }, { value: 1, duration: 2.4, ease: 'power3.inOut' });
  }

  next() { this.morphTo(this.custom ? 2 : this.index + 1); }

  setScatter(v) { this.uniforms.uScatter.value = v; }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.position.z = w < 700 ? 17 : 11;
    this.offsetX = w > 1000 ? 1.2 : 0;
    this.camera.updateProjectionMatrix();
  }

  update(t, dt, engine) {
    this.uniforms.uTime.value = t;
    const { width: W, height: H } = engine.size;
    if (!W || !H) return; // hidden tab / zero-size viewport
    const nx = (engine.pointer.sx / W) * 2 - 1, ny = -(engine.pointer.sy / H) * 2 + 1;
    // pointer -> world point on z = 0 plane
    const v = new THREE.Vector3(nx, ny, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
    const dist = -this.camera.position.z / v.z;
    const world = this.camera.position.clone().add(v.multiplyScalar(dist));
    this.group.worldToLocal(world);
    if (Number.isFinite(world.x) && Number.isFinite(world.y)) this.uniforms.uPointer.value.lerp(world, 0.2);
    this.rot.y += (nx * 0.35 - this.rot.y) * 0.04;
    this.rot.x += (-ny * 0.2 - this.rot.x) * 0.04;
    // slow auto-spin; settles face-on while the wordmark is showing
    this.spin = this.spin || 0;
    if (this.index === 1) this.spin += (Math.round(this.spin / (Math.PI * 2)) * Math.PI * 2 - this.spin) * 0.03;
    else this.spin += dt * 0.08;
    this.group.rotation.set(this.rot.x, this.rot.y + this.spin, 0);
    this.group.position.x += (this.offsetX - this.group.position.x) * 0.05;
    this.visible = this.uniforms.uAlpha.value > 0.01 && this.uniforms.uScatter.value < 3;
  }

  render(renderer) {
    if (this.visible) renderer.render(this.scene, this.camera);
  }
}
