#!/usr/bin/env node
/**
 * Media pipeline — `npm run media`
 *
 * 1. Converts everything in media-src/ into web-ready files in public/media/
 *      .gif .mov .webm .mp4  ->  H.264 .mp4 (muted, looping-friendly) + .jpg poster
 *      .png .jpg .jpeg .webp ->  .jpg (max 1920px wide)
 *    Folder structure is kept: media-src/lab/my-lora/01.gif -> public/media/lab/my-lora/01.mp4
 *    Files that are already converted (and unchanged) are skipped.
 * 2. Writes src/content/media.json with the size of every file (used for layout + WebGL).
 * 3. Checks that every media path used in projects.json / gallery.json exists.
 *
 * Requires ffmpeg + ffprobe on PATH.
 */
import { spawn } from 'node:child_process';
import { promises as fs, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SRC = path.join(ROOT, 'media-src');
const OUT = path.join(ROOT, 'public', 'media');
const CONTENT = path.join(ROOT, 'src', 'content');

const VIDEO = new Set(['.gif', '.mov', '.webm', '.mp4', '.m4v']);
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_W = 1920;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}\n${err.slice(-800)}`))));
  });
}

async function walk(dir) {
  if (!existsSync(dir)) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  }));
  return files.flat();
}

const fresh = (src, out) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;
const scale = `scale='trunc(min(iw,${MAX_W})/2)*2':-2`;

async function convert(src) {
  const rel = path.relative(SRC, src);
  const ext = path.extname(src).toLowerCase();
  const base = path.join(OUT, rel.slice(0, -ext.length));
  await fs.mkdir(path.dirname(base), { recursive: true });

  if (VIDEO.has(ext)) {
    const mp4 = base + '.mp4', jpg = base + '.jpg';
    if (fresh(src, mp4) && fresh(src, jpg)) return null;
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-an', '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
      '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', mp4]);
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-frames:v', '1', '-q:v', '3', jpg]);
    return rel;
  }
  if (IMAGE.has(ext)) {
    const jpg = base + '.jpg';
    if (fresh(src, jpg)) return null;
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', scale, '-q:v', '3', jpg]);
    return rel;
  }
  return null;
}

async function pool(items, size, fn) {
  let i = 0, done = 0;
  const workers = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        const r = await fn(item);
        done++;
        if (r) console.log(`  [${done}/${items.length}] ${r}`);
      } catch (e) {
        console.error(`  ✗ ${path.relative(SRC, item)}\n${e.message}`);
      }
    }
  });
  await Promise.all(workers);
}

async function probe(file) {
  const out = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration',
    '-of', 'json', file]);
  const j = JSON.parse(out);
  const s = j.streams?.[0] || {};
  return { w: s.width, h: s.height, d: j.format?.duration ? +(+j.format.duration).toFixed(2) : undefined };
}

async function manifest() {
  const files = (await walk(OUT)).filter((f) => /\.(mp4|jpg)$/i.test(f));
  const map = {};
  await pool(files, os.cpus().length, async (f) => {
    const rel = path.relative(OUT, f).split(path.sep).join('/');
    const { w, h, d } = await probe(f);
    map[rel] = f.endsWith('.mp4') ? { w, h, d } : { w, h };
  });
  const sorted = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
  await fs.writeFile(path.join(CONTENT, 'media.json'), JSON.stringify(sorted, null, 1));
  return sorted;
}

function collectRefs(node, refs = []) {
  if (typeof node === 'string') {
    if (/\.(mp4|jpg)$/i.test(node) && !node.startsWith('http')) refs.push(node);
  } else if (Array.isArray(node)) node.forEach((n) => collectRefs(n, refs));
  else if (node && typeof node === 'object') Object.values(node).forEach((n) => collectRefs(n, refs));
  return refs;
}

const sources = (await walk(SRC)).filter((f) => VIDEO.has(path.extname(f).toLowerCase()) || IMAGE.has(path.extname(f).toLowerCase()));
console.log(`Converting ${sources.length} source files (unchanged files are skipped)…`);
await pool(sources, Math.max(2, Math.floor(os.cpus().length / 2)), convert);

console.log('Writing media manifest…');
const media = await manifest();
console.log(`  ${Object.keys(media).length} files indexed`);

let missing = 0;
for (const file of ['projects.json', 'gallery.json', 'site.json']) {
  const p = path.join(CONTENT, file);
  if (!existsSync(p)) continue;
  for (const ref of collectRefs(JSON.parse(await fs.readFile(p, 'utf8')))) {
    if (!media[ref]) { console.warn(`  ⚠ ${file}: "${ref}" not found in public/media`); missing++; }
  }
}
console.log(missing ? `Done with ${missing} missing reference(s).` : 'Done. All content references resolve.');
