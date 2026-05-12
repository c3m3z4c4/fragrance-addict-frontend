import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "apple-touch-icon.png",
        "robots.txt",
        "logos/*.png",
      ],
      manifest: {
        name: "Parfumería — Luxury Fragrance Catalog",
        short_name: "Parfumería",
        description: "Discover and explore the world's finest fragrances from prestigious houses.",
        theme_color: "#0E0C12",
        background_color: "#0E0C12",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "es",
        categories: ["lifestyle", "shopping"],
        icons: [
          { src: "/icon-72x72.png",   sizes: "72x72",   type: "image/png" },
          { src: "/icon-96x96.png",   sizes: "96x96",   type: "image/png" },
          { src: "/icon-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
          { src: "/icon-152x152.png", sizes: "152x152", type: "image/png" },
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-384x384.png", sizes: "384x384", type: "image/png" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Explorar marcas",
            short_name: "Marcas",
            description: "Ver todas las marcas de perfumería",
            url: "/brands",
            icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
          },
          {
            name: "Búsqueda",
            short_name: "Buscar",
            description: "Buscar fragancias",
            url: "/?search=1",
            icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
          },
        ],
        screenshots: [
          {
            src: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1080",
            sizes: "1080x1920",
            type: "image/jpeg",
            form_factor: "narrow",
            label: "Catálogo de fragancias",
          },
        ],
      },
      workbox: {
        // Cache brand logos and icons aggressively
        runtimeCaching: [
          {
            urlPattern: /\/logos\/.*\.png$/,
            handler: "CacheFirst",
            options: {
              cacheName: "brand-logos",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.fragranceaddict\.c3m3z4\.dev\/uploads\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "uploaded-logos",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.fragranceaddict\.c3m3z4\.dev\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
