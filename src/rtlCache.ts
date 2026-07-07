import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

// Emotion cache configured for RTL: stylis-plugin-rtl flips physical CSS
// properties (margin-left ⇄ margin-right, etc.) so MUI renders correctly in
// Arabic. `prefixer` keeps vendor-prefixing. Shared key with the SSR cache in
// entry-server.tsx so first-paint styles match the client.
export function createRtlCache() {
  return createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
    prepend: true,
  });
}
