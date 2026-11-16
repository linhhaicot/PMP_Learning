/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base is '/' locally, but '/<repo>/' on GitHub Pages — the deploy workflow
// passes VITE_BASE. vite-plugin-pwa derives the manifest/SW paths from it.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PMLingo — PMP English',
        short_name: 'PMLingo',
        description: 'Học từ vựng & đọc hiểu tiếng Anh phục vụ thi PMP',
        theme_color: '#1e3a8a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache the static data files so the app works fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
