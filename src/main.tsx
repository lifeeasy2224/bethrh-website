import React from 'react';
import ReactDOM from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import App from './App';
import { createRtlCache } from './rtlCache';

const root = document.getElementById('root')!;
const rtlCache = createRtlCache();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <CacheProvider value={rtlCache}>
      <App />
    </CacheProvider>
  </React.StrictMode>
);
