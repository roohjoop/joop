/**
 * Cloudflare Pages Functions - Catch-all Route Handler
 * 
 * Automatically detected and compiled by Cloudflare Pages build system.
 * Bridges Cloudflare Pages native Functions with src/worker.ts logic.
 */

import worker from '../src/worker';

export const onRequest = async (context: {
  request: Request;
  env: Record<string, any>;
  next: (req?: Request) => Promise<Response>;
}) => {
  // Wrap context.next so worker's env.ASSETS can transparently fetch static files
  const envWithAssets = {
    ...context.env,
    ASSETS: {
      fetch: (req: Request) => context.next(req),
    },
  };

  return worker.fetch(context.request, envWithAssets);
};
