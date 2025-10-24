import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/officina-tracker/', // GitHub Pages repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      },
      // Ensure Dexie is bundled
      external: []
    },
    // Copy static files to dist
    assetsInclude: ['**/*.json']
  },
  server: {
    port: 3000,
    open: true
  },
  publicDir: 'public',
  // Optimize dependencies to include Dexie
  optimizeDeps: {
    include: ['dexie']
  }
});