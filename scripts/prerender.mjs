import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/ideas-library',
  '/help',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/ip-protection',
];

async function prerender() {
  console.log('Starting prerender...');

  // Use the already-built client HTML as the template so it contains
  // hashed asset paths, NOT the dev-only /src/main.tsx reference.
  const builtClientHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(builtClientHtml)) {
    throw new Error('dist/index.html not found — run vite build first');
  }
  const template = fs.readFileSync(builtClientHtml, 'utf-8');

  // Spin up a Vite SSR server only to execute the server-side render.
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });

  for (const route of PUBLIC_ROUTES) {
    try {
      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
      const { html: appHtml, css } = await render(route);

      // Each page must point its canonical / og:url at ITSELF, not the homepage.
      // Use the trailing-slash form Netlify actually serves (dir/index.html), so
      // Google indexes the 200 URL and doesn't see a redirect.
      const canonical = `https://bethra.co${route === '/' ? '/' : `${route}/`}`;
      const html = template
        .replace('<!--app-html-->', appHtml)
        .replace('<!--app-head-->', css)
        .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`);

      const outDir = route === '/' ? distDir : path.join(distDir, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      console.log(`  Prerendered ${route}`);
    } catch (err) {
      console.error(`  Failed to prerender ${route}:`, err.stack || err.message);
    }
  }

  await vite.close();
  console.log('Prerender complete.');
}

prerender().catch(err => {
  console.error(err);
  process.exit(1);
});
