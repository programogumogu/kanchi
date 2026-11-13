import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Scenario image paths were originally stored as `/src/assets/...` URLs. Those
// paths work in some development setups but are not emitted as production
// assets, especially when GitHub Pages serves the app from `/kanchi/`.
const resolveScenarioImageAssets: Plugin = {
  name: 'resolve-scenario-image-assets',
  enforce: 'pre',
  transform(source, id) {
    if (!id.endsWith('/src/data/scenarios.ts')) return null;

    return source.replace(
      /'\/src\/assets\/images\/(district_[^']+\.jpg)'/g,
      (_match, filename: string) => `new URL('../assets/images/${filename}', import.meta.url).href`
    );
  },
};

export default defineConfig(() => {
  return {
    // GitHub Pages serves this project from /kanchi/ rather than the domain root.
    base: '/kanchi/',
    plugins: [resolveScenarioImageAssets, react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
