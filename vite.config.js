import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };

const sha = (() => {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; }
})();

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(sha),
    __APP_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  plugins: [
    react(),
    VitePWA({
      // Aggiornamento gestito dall'app (src/lib/update.js): scarica in background e applica in un momento sicuro
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Lunibù',
        short_name: 'Lunibù',
        description: 'Ricerca rapida di dati scientifici per genitori di bambini 0-12 anni',
        id: 'lunibu',
        lang: 'it',
        theme_color: '#23284f',
        background_color: '#edf0f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        categories: ['health', 'lifestyle', 'education'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        // App shell + indici + blocchi di contenuto: tutto disponibile offline.
        // I blocchi vengono comunque caricati in memoria solo quando servono (lazy load).
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        navigateFallback: 'index.html'
      }
    })
  ],
  test: { environment: 'node' }
});
