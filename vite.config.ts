import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // we register manually with iframe guard
      devOptions: { enabled: false },
      includeAssets: ["icon-192.png", "robots.txt"],
      manifest: {
        name: "SudaGospel - Gospel Music from South Sudan",
        short_name: "SudaGospel",
        description: "Discover, stream and download gospel music from South Sudan.",
        theme_color: "#DC2626",
        background_color: "#0f0f0f",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-192.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/, /^\/functions/, /\.(mp3|m4a|wav|jpg|jpeg|png|webp)$/],
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.(mp3|m4a|wav|ogg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "sudagospel-audio",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 90 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] },
            },
          },
          {
            urlPattern: /\.(jpg|jpeg|png|webp|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "sudagospel-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/storage/v1/object/public/"),
            handler: "CacheFirst",
            options: {
              cacheName: "sudagospel-supabase-public",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-tabs", "@radix-ui/react-select", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-tooltip"],
          "vendor-motion": ["framer-motion"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
}));
