/// <reference types="vitest/config" />
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],
        // Skip caching Firebase URLs to ensure real-time updates work
        navigateFallbackDenylist: [/^\/api\//, /firestore\.googleapis\.com/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Explicitly exclude Firebase Firestore from caching
            urlPattern: /^https:\/\/firestore\.googleapis\.com\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    // Add this to accept external connections
    port: 5173,
  },
  test: {
    // Test environment configuration
    environment: "jsdom",
    setupFiles: ["./src/vitest.setup.ts"],

    // Global test utilities
    globals: true,

    // Use single worker to minimize memory usage
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
        execArgv: ["--max-old-space-size=4096"],
      },
    },

    // File patterns
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/e2e/**",
      "**/test-utils/**",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/vitest.setup.ts",
        "src/**/__tests__/**",
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Reporter configuration
    reporters: ["verbose"],

    // Test timeout - reduce for faster failure detection
    testTimeout: 5000,

    // Retry failed tests
    retry: 1,

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
  },
});
