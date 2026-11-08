import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Lunibù',
        short_name: 'Lunibù',
        description: 'Risposte basate sulla ricerca per genitori di bambini 0-3 anni',
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
