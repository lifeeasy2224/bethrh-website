import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  jsonLd?: object | object[];
}

const BASE_URL = 'https://bethra.co';

// Public pages are prerendered as folders (e.g. /pricing/index.html), so the
// host serves them at the trailing-slash URL and redirects the bare path there.
// Canonical and og:url must use the slash form or Google sees a redirect.
// Keep in sync with PUBLIC_ROUTES in scripts/prerender.mjs.
const PRERENDERED_PATHS = new Set([
  '/pricing',
  '/ideas-library',
  '/help',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/ip-protection',
]);

function canonicalUrl(path: string) {
  return `${BASE_URL}${PRERENDERED_PATHS.has(path) ? `${path}/` : path}`;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSEO({ title, description, canonicalPath, jsonLd }: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes('Bethra') ? title : `${title} | Bethra`;
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);

    if (canonicalPath !== undefined) {
      setLink('canonical', canonicalUrl(canonicalPath));
      setMeta('og:url', canonicalUrl(canonicalPath), 'property');
    }

    // JSON-LD structured data
    const existing = document.querySelectorAll('script[data-seo="json-ld"]');
    existing.forEach(el => el.remove());

    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      schemas.forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', 'json-ld');
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.querySelectorAll('script[data-seo="json-ld"]').forEach(el => el.remove());
    };
  }, [title, description, canonicalPath, jsonLd]);
}
