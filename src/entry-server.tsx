import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ReviewProvider } from './contexts/ReviewContext';
import theme from './theme';
import { Writable } from 'node:stream';

// Eager imports of public pages only (no lazy/Suspense needed for SSR)
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import IdeasLibraryPage from './pages/IdeasLibraryPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import IpProtectionPage from './pages/IpProtectionPage';

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/ideas-library" element={<IdeasLibraryPage />} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/ip-protection" element={<IpProtectionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export async function render(url: string): Promise<{ html: string; css: string }> {
  // RTL cache so prerendered first-paint CSS matches the client (see rtlCache.ts).
  const cache = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin], prepend: true });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  const tree = (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AdminAuthProvider>
            <ReviewProvider userId={null}>
              <StaticRouter location={url}>
                <PublicRoutes />
              </StaticRouter>
            </ReviewProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );

  const appHtml = await renderToStringAsync(tree);
  const chunks = extractCriticalToChunks(appHtml);
  const css = constructStyleTagsFromChunks(chunks);

  return { html: appHtml, css };
}

function renderToStringAsync(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = '';
    const writable = new Writable({
      write(chunk, _enc, cb) {
        html += chunk.toString();
        cb();
      },
    });

    const { pipe } = renderToPipeableStream(element, {
      onShellReady() {
        pipe(writable);
      },
      onShellError(err) {
        reject(err);
      },
      onError(err) {
        console.warn('SSR render warning:', err);
      },
    });

    writable.on('finish', () => resolve(html));
    writable.on('error', reject);
  });
}
