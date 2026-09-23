import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import * as esbuild from 'esbuild';

// Plugin to automatically bundle Cloudflare Pages _worker.js on every build
function cloudflareWorkerPlugin(): Plugin {
  return {
    name: 'vite-plugin-cloudflare-worker',
    apply: 'build',
    async closeBundle() {
      try {
        console.log('📦 Automatically building Cloudflare Worker (dist/_worker.js)...');
        await esbuild.build({
          entryPoints: ['src/worker.ts'],
          bundle: true,
          outfile: 'dist/_worker.js',
          format: 'esm',
          target: 'es2022',
          platform: 'neutral',
          minify: false,
          sourcemap: false,
        });
        console.log('✅ Cloudflare Worker built successfully at dist/_worker.js');
      } catch (error) {
        console.error('❌ Failed to bundle Cloudflare Worker:', error);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareWorkerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: ['es2015', 'chrome55', 'safari11'],
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
