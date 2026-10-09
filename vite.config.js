import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const pages = ['index', 'lab', 'work', 'gallery', 'about', 'contact', 'project', 'explorations', '404'];
const root = fileURLToPath(new URL('.', import.meta.url));

// Draft projects are visible in `npm run dev` only — strip them from the production bundle.
const stripDrafts = {
  name: 'strip-drafts',
  apply: 'build',
  enforce: 'pre',
  transform(code, id) {
    if (!id.split('\\').join('/').endsWith('src/content/projects.json')) return null;
    return { code: JSON.stringify(JSON.parse(code).filter((p) => !p.draft)), map: null };
  },
};

// The page module renders the content, so make it render-blocking: the native page transition
// then captures the finished page instead of an empty shell (Vite drops the attribute otherwise).
const renderBlocking = {
  name: 'render-blocking-entry',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => html.replace(/<script type="module"(?![^>]*blocking=)/g, '<script type="module" blocking="render"'),
  },
};

export default defineConfig({
  base: './',
  plugins: [stripDrafts, renderBlocking],
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: { input: Object.fromEntries(pages.map((p) => [p, `${root}${p}.html`])) },
  },
});
