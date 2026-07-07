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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'mui-icons': ['@mui/icons-material'],
          'charts': ['recharts'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
