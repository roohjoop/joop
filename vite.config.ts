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

// Plugin to handle /api/verify-developer in development
function devApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if ((url === '/api/verify-developer' || url === '/jop/api/verify-developer') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const email = (data.email || '').trim().toLowerCase();
              const code = (data.code || '').trim();
              const allowedEmails = ['roohjoop@gmail.com', 'roohpro1@gmail.com', 'roohpro9@gmail.com'];
              const validCode = process.env.VITE_ADMIN_SECURITY_CODE || '5030775';
              const isValid = code === validCode && (allowedEmails.includes(email) || !email);
              
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: isValid, valid: isValid }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid payload' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareWorkerPlugin(), devApiPlugin()],
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
