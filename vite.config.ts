import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  server: {
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  ssr: {
    noExternal: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled', '@emotion/server', '@emotion/cache'],
    resolve: {
      conditions: ['import', 'module-sync', 'module', 'browser', 'default'],
    },
  },
  resolve: {
    conditions: ['import', 'module', 'browser', 'default'],
    alias: {
      // fileURLToPath (NOT URL.pathname) — .pathname keeps percent-encoding
      // (%20, %7E), which breaks fs reads when the project path has spaces.
      'react-router-dom': fileURLToPath(new URL('./node_modules/react-router-dom/dist/index.mjs', import.meta.url)),
      '@emotion/cache': fileURLToPath(new URL('./node_modules/@emotion/cache/dist/emotion-cache.esm.js', import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    // recharts (the 'charts' chunk, ~430 KB raw) is only used by lazy-loaded
    // admin pages, but Vite was emitting a <link rel="modulepreload"> for it on
    // every page — so public visitors eagerly downloaded a charting library they
    // never use. Drop it from the preload list; the dynamic import on admin
    // chart pages still fetches it on demand.
    modulePreload: {
      resolveDependencies: (_filename: string, deps: string[]) =>
        deps.filter((dep) => !dep.includes('charts-')),
    },
    rollupOptions: {
      output: {
        // Function form (not object) to avoid the circular chunk that a plain
        // object map produced: `jsxImportSource: '@emotion/react'` makes emotion's
        // jsx-runtime a dependency of every module, so putting @emotion in a
        // SEPARATE chunk from react created a mui-core <-> react-vendor cycle.
        // At runtime that cycle initialized react-dom before react's internals
        // existed → "Cannot read properties of undefined (reading
        // '__CLIENT_INTERNALS_...')" → the whole app failed to mount (blank/
        // prerender-only, no routing). Keep react + react-dom + router + emotion
        // in ONE chunk so their init order is guaranteed; MUI depends on that
        // chunk one-directionally, so no cycle.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (id.includes('@emotion')) return 'react-vendor';
          if (id.includes('@mui/icons-material')) return 'mui-icons';
          if (id.includes('@mui')) return 'mui-core';
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'charts';
          if (id.includes('@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
  },
})
