import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      /*
       * La actualización se descarga en segundo plano,
       * pero no toma control ni recarga la aplicación
       * hasta que el usuario lo confirme.
       */
      registerType: 'prompt',

      /*
      * El service worker se registra manualmente
      * desde AppStatus para poder controlar
      * el aviso de actualización.
      */
      injectRegister: null,

      /*
       * No activamos el service worker durante npm run dev.
       * Así evitamos cachés que interfieran con el desarrollo.
       */
      devOptions: {
        enabled: false,
      },

      /*
       * Archivos públicos que deben formar parte
       * de la aplicación instalada.
       *
       * Por ahora asumimos que estos archivos existen.
       */
      includeAssets: [
        'favicon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
      ],

      manifest: {
        name: 'Pistas Cruzadas',
        short_name: 'Pistas Cruzadas',
        description:
          'Tablero y mazo digital para jugar Pistas Cruzadas en grupo.',

        theme_color: '#e2dcba',
        background_color: '#e2dcba',

        display: 'standalone',

        start_url: '/',
        scope: '/',

        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,json,woff,woff2}',
        ],

        cleanupOutdatedCaches: true,

        /*
         * Como Pistas Cruzadas usa BrowserRouter,
         * cualquier navegación interna debe poder
         * recuperar index.html.
         */
        navigateFallback: '/index.html',
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },

    dedupe: ['react', 'react-dom'],
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/styles/refs" as *;
        `,
      },
    },
  },
});