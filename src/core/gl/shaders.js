// GLSL shared by the WebGL layers.

export const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* ---------- media planes ---------- */
export const planeVert = /* glsl */ `
uniform vec2 uVel;
uniform float uHover;
uniform vec2 uMouse;
uniform vec2 uSize;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  // bend with scroll / drag velocity (in pixels, independent of plane size)
  p.y -= sin(uv.x * 3.14159) * clamp(uVel.y, -90., 90.) * .55 / uSize.y;
  p.x += sin(uv.y * 3.14159) * clamp(uVel.x, -90., 90.) * .55 / uSize.x;
  // soft bulge under the pointer
  float d = distance(uv, uMouse);
  p.z += uHover * smoothstep(.75, 0., d) * 28.;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

export const planeFrag = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uTexSize;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uHover;
uniform float uReveal;
uniform float uRadius;
uniform float uAlpha;
uniform float uMute;
uniform float uTime;
uniform vec4 uCrop;
uniform vec3 uAccent;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec2 cover(vec2 uv){
  float rs = uSize.x / uSize.y, ri = uTexSize.x / uTexSize.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.) : vec2(1., ri / rs);
  return (uv - .5) * s + .5;
}
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - r; }
void main(){
  // ---- diffusion-style reveal: latent noise -> coarse blocks -> sharp frame (stepped like a sampler)
  float r = uReveal;
  float blockPx = mix(64., 1., pow(smoothstep(0., .94, r), .7));
  vec2 cells = max(uSize / blockPx, vec2(1.));
  vec2 cell = floor(vUv * cells);
  vec2 uv = blockPx > 1.5 ? (cell + .5) / cells : vUv;

  float d = distance(vUv, uMouse);
  float near = smoothstep(.5, 0., d) * uHover;
  // zoom + parallax towards the pointer
  uv = (uv - .5) * (1. - .07 * uHover) + .5 + (uMouse - .5) * .025 * uHover;
  // liquid ripple around the pointer
  vec2 dir = normalize(vUv - uMouse + 1e-4);
  uv -= dir * near * .03 * (.6 + .4 * sin(d * 28. - uTime * 5.));
  vec2 tuv = uCrop.xy + cover(uv) * uCrop.zw;
  // chromatic split from velocity + pointer
  float shift = clamp(length(uVel) * .00035, 0., .018) + near * .006;
  vec2 off = vec2(shift, shift * .25);
  vec3 col;
  col.r = texture2D(uTex, tuv + off).r;
  col.g = texture2D(uTex, tuv).g;
  col.b = texture2D(uTex, tuv - off).b;
  // optional muted rest state that blooms into colour on hover
  float l = dot(col, vec3(.299, .587, .114));
  col = mix(col, mix(vec3(l), col, .25) * .7, uMute * (1. - uHover));

  // latent noise (per block, re-rolled every sampler step)
  float seed = floor(r * 24.);
  vec3 latent = vec3(hash(cell + seed), hash(cell + seed + 7.1), hash(cell + seed + 3.7));
  latent = mix(vec3(dot(latent, vec3(.333))), latent, .55) * vec3(1., .78, .7);
  col = mix(latent * .9, col, smoothstep(.08, .72, r));
  // ember scan line sweeping through while it denoises
  col = mix(col, uAccent, smoothstep(.012, 0., abs(vUv.y - fract(r * 2.6))) * (1. - smoothstep(.6, 1., r)));
  float a = smoothstep(0., .05, r);

  // rounded corners
  vec2 px = (vUv - .5) * uSize;
  float sd = sdRound(px, uSize * .5, uRadius);
  a *= 1. - smoothstep(-1., .5, sd);
  gl_FragColor = vec4(col, a * uAlpha);
}`;

/* ---------- background: smoke + interactive dot grid ---------- */
export const bgVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

/* smoke is soft, so it renders into a low-resolution buffer (the expensive noise part) */
export const smokeFrag = /* glsl */ `
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec3 uAccent;
uniform vec3 uBase;
uniform vec3 uCool;
uniform float uLight;
varying vec2 vUv;
${noise}
float fbm(vec3 p){ float a = .5, s = 0.; for(int i = 0; i < 3; i++){ s += a * snoise(p); p *= 2.02; a *= .5; } return s; }
void main(){
  vec2 uv = vec2(vUv.x, 1. - vUv.y) * uRes / uRes.y;
  vec3 q = vec3(uv * 1.2, uTime * .04);
  q.y += uScroll * .00025;
  float w = fbm(q + fbm(q + vec3(0., 0., uTime * .03)) * .8);
  vec3 col = uBase;
  col = mix(col, uAccent, smoothstep(.1, .9, w) * mix(.06, .085, uLight));
  col = mix(col, uCool, smoothstep(.3, 1., -w) * mix(.02, .04, uLight));
  gl_FragColor = vec4(col, 1.);
}`;

/* full-resolution composite: smoke texture + pointer glow + interactive dot grid (cheap) */
export const bgFrag = /* glsl */ `
uniform sampler2D uSmoke;
uniform vec2 uRes;
uniform vec2 uMouse;     // px, top-left origin
uniform float uScroll;
uniform float uEnergy;   // pointer speed
uniform vec3 uAccent;
uniform vec3 uInk;       // dot colour (text colour of the theme)
uniform float uLight;
uniform float uGrid;     // grid visibility
varying vec2 vUv;
void main(){
  vec2 frag = vec2(vUv.x, 1. - vUv.y) * uRes;            // css px, top-left
  vec3 col = texture2D(uSmoke, vUv).rgb;
  float dm = distance(frag, uMouse);
  float glow = exp(-dm * dm / (2. * pow(260. + uEnergy * 120., 2.))) * (.09 + uEnergy * .06);
  col = mix(col, uAccent, glow * mix(1., .9, uLight));
  float cell = 28.;
  vec2 g = frag;
  vec2 toM = g - uMouse;
  float lens = exp(-dot(toM, toM) / (2. * 150. * 150.));
  g += normalize(toM + 1e-4) * lens * 18.;
  g.y += mod(uScroll * .35, cell);
  vec2 c = mod(g, cell) - cell * .5;
  float dotR = .75 + lens * 1.2;
  float dots = 1. - smoothstep(dotR - .6, dotR + .6, length(c));
  col = mix(col, mix(uInk, uAccent, lens), dots * (mix(.035, .085, uLight) + lens * .95) * uGrid);
  vec2 vv = vUv - .5;
  col *= 1. - dot(vv, vv) * mix(.9, .22, uLight);
  gl_FragColor = vec4(col, 1.);
}`;
