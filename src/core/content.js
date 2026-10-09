// Content layer — every page reads projects / archive / site data through here.
import projectsRaw from '../content/projects.json';
import galleryRaw from '../content/gallery.json';
import manifest from '../content/media.json';
import site from '../content/site.json';

export { site };
export const DEV = import.meta.env.DEV;

/** Drafts are visible while running `npm run dev`, never in the built site. */
export const projects = projectsRaw.filter((p) => DEV || !p.draft);
export const gallery = galleryRaw;

export const TYPE_LABEL = {
  lora: 'LoRA',
  exploration: 'Exploration',
  experiment: 'Experiment',
  tool: 'AI Tool',
  campaign: 'Campaign',
  'ai-campaign': 'AI-led Campaign',
  'product-launch': 'Product Launch',
  'brand-film': 'Brand Film',
  'content-series': 'Content Series',
};

export const bySection = (section) => projects.filter((p) => p.section === section);
export const getProject = (id) => projects.find((p) => p.id === id);
export const projectUrl = (p) => `project.html?id=${encodeURIComponent(p.id)}`;

/**
 * Normalises a media reference from the JSON files into a descriptor.
 * Accepts "folder/file.mp4", "folder/file.jpg", "youtube:ID", or { src, caption, ... }.
 */
export function media(ref) {
  if (!ref) return null;
  const obj = typeof ref === 'string' ? { src: ref } : { ...ref };
  const s = obj.src;
  if (s.startsWith('youtube:')) {
    const id = s.slice(8);
    return {
      ...obj, type: 'youtube', id, w: 16, h: 9,
      embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      // 1280px, bar-free; when a video has no HD thumbnail the engine/app fall back to hqdefault
      thumb: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      thumbLo: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://youtu.be/${id}`,
    };
  }
  if (/^https?:/.test(s)) return { ...obj, type: /\.mp4$/i.test(s) ? 'video' : 'image', url: s, w: obj.w || 16, h: obj.h || 9 };
  const info = manifest[s] || {};
  if (DEV && !manifest[s]) console.warn(`[content] media not found: ${s} — run "npm run media"`);
  if (/\.mp4$/i.test(s)) {
    return { ...obj, type: 'video', url: `media/${s}`, poster: `media/${s.replace(/\.mp4$/i, '.jpg')}`, w: info.w || 16, h: info.h || 9 };
  }
  return { ...obj, type: 'image', url: `media/${s}`, w: info.w || 16, h: info.h || 9 };
}

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Paragraph text with [label](url) links. */
export const rich = (s = '') =>
  esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const ext = /^https?:/.test(u);
    return `<a class="link" href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });

/**
 * Markup for one media item. Every page uses this so WebGL, lazy video and the
 * lightbox all work the same way.
 *  opts.gl      — render through WebGL (distortion / hover) when available (default true)
 *  opts.fit     — 'cover' crops to opts.ratio, 'natural' keeps the media's own aspect ratio
 *  opts.ratio   — forced aspect ratio e.g. '16/10' (with fit 'cover')
 *  opts.cursor  — custom cursor label on hover
 *  opts.tilt    — GL plane tilts towards the pointer
 *  opts.mute    — muted/desaturated until hovered (GL only)
 *  opts.attrs   — extra raw attributes for the <figure>, e.g. 'data-lb-handled'
 */
export function mediaHTML(ref, opts = {}) {
  const m = typeof ref === 'object' && ref?.type ? ref : media(ref);
  if (!m) return '';
  const { gl = true, fit = 'natural', ratio, cursor, tilt = false, mute = false, cls = '', attrs: extra = '', alt = m.caption || m.title || '' } = opts;
  const ar = fit === 'cover' && ratio ? ratio : `${m.w}/${m.h}`;
  const attrs = [
    `class="media media--${m.type} ${cls}"`,
    `style="aspect-ratio:${ar}"`,
    gl ? 'data-gl' : '',
    tilt ? 'data-gl-tilt' : '',
    mute ? 'data-gl-mute' : '',
    cursor ? `data-cursor="${esc(cursor)}"` : '',
    extra,
  ].filter(Boolean).join(' ');
  let inner;
  if (m.type === 'video') {
    inner = `<video data-src="${m.url}" data-poster="${m.poster}" muted loop playsinline preload="none" aria-label="${esc(alt)}"></video>`;
  } else if (m.type === 'youtube') {
    inner = `<span class="media__yt"><img src="${m.thumb}" alt="${esc(alt)}" loading="lazy" crossorigin="anonymous" data-yt-thumb="${m.id}"></span>
      <span class="media__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>`;
  } else {
    inner = `<img src="${m.url}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  }
  return `<figure ${attrs}>${inner}</figure>`;
}

/** Turn a list of refs into lightbox items. */
export const toLightbox = (refs) => refs.map((r) => (typeof r === 'object' && r?.type ? r : media(r))).filter(Boolean);
