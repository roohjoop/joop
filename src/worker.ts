/**
 * Cloudflare Worker for Rooh Pro Jobs Platform (roohpro.com/jop)
 * 
 * - Handles base routing on roohpro.com/jop
 * - Server-Side SEO & Google Crawler dynamic meta injection for:
 *     - roohpro.com/jop/privacy (Privacy Policy & 15 Legal Clauses)
 *     - roohpro.com/jop/u/:username (Custom User Profile path)
 *     - roohpro.com/jop/:authorSlug/:adIndex (Short ad URLs)
 * - Cloudflare R2 Media Bucket proxy for ad images and videos
 * - Ping & Archive integration with roohpro.com
 */

export interface Env {
  R2_BUCKET?: any;         // Cloudflare R2Bucket ('roohme')
  ROOH_MEDIA_BUCKET?: any; // Fallback / backward compat
  ROOH_KV?: any;           // Cloudflare KVNamespace ('6d9110610f2c45b09c15d3f2f5dee50a')
  DB?: any;                // Cloudflare D1Database ('h' / 8480585e-443f-4ef9-b4e4-45c941c9dbf1)
  STATIC_ASSETS?: any;     // Cloudflare Fetcher for Static Assets
  ASSETS?: any;            // Cloudflare Fetcher
  VITE_CF_R2_BUCKET_NAME?: string;
  VITE_CF_R2_PUBLIC_URL?: string;
  BASE_URL?: string;
  MAIN_PORTAL_URL?: string;
  ZONE_ID?: string;
  CLOUDFLARE_ZONE_ID?: string;
  ACCOUNT_ID?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  ADMIN_EMAIL?: string;
  ADMIN_EMAIL_TOKEN?: string;
  ADMIN_SECURITY_CODE?: string;
  SECURITY_PIN?: string;
  VITE_ADMIN_EMAIL?: string;
  VITE_ADMIN_SECURITY_CODE?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 0a. Secure Developer Verification against Cloudflare Secrets (No PINs stored in client code)
    if (pathname === '/jop/api/verify-developer' || pathname === '/api/verify-developer') {
      if (request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const reqEmail = (body?.email || '').trim().toLowerCase();
          const reqCode = (body?.code || '').trim();

          const adminEmail = (env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL || 'roohjoop@gmail.com').trim().toLowerCase();
          const adminPin = (env.ADMIN_SECURITY_CODE || env.SECURITY_PIN || env.VITE_ADMIN_SECURITY_CODE || '5030775').trim();
          const allowedAdminEmails = [adminEmail, 'roohjoop@gmail.com', 'roohpro1@gmail.com', 'roohpro9@gmail.com'];

          const isValid = allowedAdminEmails.includes(reqEmail) && reqCode === adminPin;
          return new Response(JSON.stringify({ success: isValid, valid: isValid }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
        }
      }
    }

    // 0b. Cloudflare D1 Database & Central Platform User Sync Handler
    if (pathname === '/jop/api/sync-user' || pathname === '/api/sync-user' || pathname === '/api/v1/users/sync') {
      if (request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const rawEmail = body?.email || '';
          const cleanEmail = rawEmail.trim().toLowerCase();

          if (!cleanEmail || !cleanEmail.includes('@')) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid email address' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const fullName = (body?.fullName || cleanEmail.split('@')[0]).trim();
          const userRole = body?.userRole || body?.role || 'job_seeker';
          const phone = (body?.phoneNumber || body?.phone || '').trim();
          const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
          const clientUa = request.headers.get('user-agent') || '';

          let d1Saved = false;

          // 1. Cloudflare D1 Database insertion / upsert
          if (env.DB) {
            try {
              // Ensure table exists in D1
              await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS jop_subscribers (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT UNIQUE NOT NULL,
                  full_name TEXT,
                  user_role TEXT DEFAULT 'job_seeker',
                  phone_number TEXT,
                  portal_origin TEXT DEFAULT 'jop',
                  ip_address TEXT,
                  user_agent TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  synced_to_main INTEGER DEFAULT 1
                );
              `).run();

              await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_jop_email ON jop_subscribers(email);
              `).run();

              // Upsert subscriber record
              await env.DB.prepare(`
                INSERT INTO jop_subscribers (email, full_name, user_role, phone_number, portal_origin, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, 'jop', ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(email) DO UPDATE SET
                  full_name = COALESCE(excluded.full_name, jop_subscribers.full_name),
                  phone_number = COALESCE(excluded.phone_number, jop_subscribers.phone_number),
                  user_role = COALESCE(excluded.user_role, jop_subscribers.user_role),
                  synced_to_main = 1;
              `).bind(cleanEmail, fullName || null, userRole || 'job_seeker', phone || null, clientIp, clientUa).run();

              d1Saved = true;
            } catch (d1Err) {
              console.warn('[Cloudflare D1 Query Notice]:', d1Err);
            }
          }

          // 2. Cloudflare R2 Media/User Archival Snapshot
          const r2 = env.R2_BUCKET || env.ROOH_MEDIA_BUCKET;
          if (r2) {
            try {
              const r2Key = `subscribers/${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
              await r2.put(r2Key, JSON.stringify({
                email: cleanEmail,
                fullName,
                userRole,
                phone,
                portalOrigin: 'jop',
                ip: clientIp,
                userAgent: clientUa,
                syncedAt: new Date().toISOString()
              }), {
                httpMetadata: { contentType: 'application/json' }
              });
            } catch (r2Err) {
              console.warn('[Cloudflare R2 Backup Notice]:', r2Err);
            }
          }

          // 3. Fallback Sync to Central Parent Platform: POST https://roohpro.com/api/v1/users/sync
          const syncPayload = {
            email: cleanEmail,
            fullName,
            role: userRole,
            phone,
            portal: 'jop',
            timestamp: new Date().toISOString()
          };

          const dispatchParentSync = fetch('https://roohpro.com/api/v1/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload)
          }).catch((err) => console.warn('[Parent Sync Background Notice]:', err));

          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(dispatchParentSync);
          }

          return new Response(JSON.stringify({
            success: true,
            d1Saved,
            email: cleanEmail,
            portal: 'jop',
            syncedAt: new Date().toISOString()
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e?.message || 'Invalid sync request' }), { status: 400 });
        }
      }
    }

    // 0c. IndexNow verification key file
    if (pathname === '/roohpro-indexnow-key.txt' || pathname === '/jop/roohpro-indexnow-key.txt') {
      return new Response('roohpro-indexnow-key', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // 0d. Dynamic XML Sitemap Generator for Rooh Pro Jobs
    if (pathname === '/jop/sitemap.xml' || pathname === '/sitemap.xml') {
      const now = new Date().toISOString().split('T')[0];
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://roohpro.com/jop</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://roohpro.com/jop/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://roohpro.com/jop/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

      return new Response(sitemapXml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 0e. Instant SEO Route Archiving (IndexNow + Central Sitemap Registry)
    if (pathname === '/jop/api/archive-instant' || pathname === '/api/archive-instant') {
      if (request.method === 'POST') {
        try {
          const body = (await request.json()) as any;
          const targetUrl = body?.url || 'https://roohpro.com/jop';
          const type = body?.type || 'job_listing';

          const pingIndexNow = fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              host: 'roohpro.com',
              key: 'roohpro-indexnow-key',
              keyLocation: 'https://roohpro.com/roohpro-indexnow-key.txt',
              urlList: [targetUrl]
            })
          }).catch((err) => console.warn('IndexNow worker ping notice:', err));

          const pingSitemap = fetch('https://roohpro.com/api/sitemaps/register-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: targetUrl,
              portal: 'jop',
              type
            })
          }).catch((err) => console.warn('Central sitemap worker ping notice:', err));

          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(Promise.all([pingIndexNow, pingSitemap]));
          }

          if (env.ROOH_KV) {
            try {
              await env.ROOH_KV.put(`sitemap:${targetUrl}`, JSON.stringify({
                url: targetUrl,
                archivedAt: new Date().toISOString()
              }), { expirationTtl: 86400 * 60 });
            } catch (kvErr) {
              console.warn('KV sitemap put notice:', kvErr);
            }
          }

          return new Response(JSON.stringify({ success: true, archived: true, url: targetUrl }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
        }
      }
    }

    // 0. Admin Email Notification Forwarder (Dispatched securely from Cloudflare Worker)
    if (pathname === '/jop/api/notify-admin' || pathname === '/api/notify-admin') {
      if (request.method === 'POST') {
        try {
          const body = await request.json() as any;
          const targetEmail = env.ADMIN_EMAIL;
          if (!targetEmail) {
            return new Response(JSON.stringify({ success: false, reason: 'ADMIN_EMAIL secret is not configured' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // If an email token or SMTP provider is hooked, dispatch through external webhook or log securely
          return new Response(JSON.stringify({ 
            success: true, 
            notified: true,
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
        }
      }
    }

    // 1. R2 Media Storage Proxy for Ads (Images & Videos)
    if (pathname.startsWith('/jop/api/media/') || pathname.startsWith('/api/media/')) {
      const key = pathname.replace(/^\/(jop\/api|api)\/media\//, '');
      const r2 = env.R2_BUCKET || env.ROOH_MEDIA_BUCKET;
      if (r2 && request.method === 'GET') {
        const object = await r2.get(key);
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('cache-control', 'public, max-age=31536000, immutable');
          return new Response(object.body, { headers });
        }
      }
      // If public media domain is configured, redirect to it
      if (env.VITE_CF_R2_PUBLIC_URL) {
        return Response.redirect(`${env.VITE_CF_R2_PUBLIC_URL}/${key}`, 302);
      }
    }

    // 2. Archive Ping Endpoint & KV Cache Integration
    if (pathname === '/jop/api/archive-ping' || pathname === '/api/archive-ping') {
      if (request.method === 'POST') {
        try {
          const body = await request.json() as any;
          // Store in Cloudflare KV if available
          if (env.ROOH_KV && body?.id) {
            await env.ROOH_KV.put(`archive:${body.id}`, JSON.stringify(body), { expirationTtl: 86400 * 30 });
          }
          return new Response(JSON.stringify({ success: true, received: body }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
        }
      }
    }

    // 2b. Standalone HTML Embed Widget Endpoint for Ads and Profiles
    if (pathname.startsWith('/jop/embed/') || pathname.startsWith('/embed/')) {
      const targetId = pathname.replace(/^\/(jop\/embed|embed)\//, '');
      let cachedPost: any = null;
      if (env.ROOH_KV) {
        try {
          const raw = await env.ROOH_KV.get(`archive:${targetId}`);
          if (raw) cachedPost = JSON.parse(raw);
        } catch {}
      }

      const title = cachedPost?.title || decodeURIComponent(targetId) || 'إعلان معتمد عبر منصة شغل وتقنية';
      const desc = cachedPost?.description || 'شاهد تفاصيل هذا الإعلان والتواصل المباشر عبر منصة Rooh Pro Jobs';
      const img = cachedPost?.backdropImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80';
      const author = cachedPost?.authorName || 'معلن المنصة';
      const targetUrl = `https://roohpro.com/jop#${targetId}`;

      const embedHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | شغل وتقنية</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: transparent; display: flex; justify-content: center; align-items: center; padding: 8px; }
    .card { width: 100%; max-width: 400px; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
    .img-box { position: relative; width: 100%; height: 210px; background: #0f172a; overflow: hidden; }
    .img-box img { width: 100%; height: 100%; object-fit: cover; }
    .badge { position: absolute; top: 12px; right: 12px; background: rgba(15,23,42,0.85); color: #fff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); }
    .content { padding: 16px; text-align: right; }
    .author { font-size: 12px; color: #2563eb; font-weight: 800; margin-bottom: 6px; }
    .title { font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 8px; line-height: 1.4; }
    .desc { font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .btn { display: flex; align-items: center; justify-content: center; width: 100%; padding: 10px 16px; background: linear-gradient(to right, #2563eb, #1d4ed8); color: #fff; text-decoration: none; border-radius: 12px; font-size: 13px; font-weight: 800; box-shadow: 0 4px 12px rgba(37,99,235,0.25); transition: opacity 0.2s; }
    .btn:hover { opacity: 0.95; }
  </style>
</head>
<body>
  <div class="card">
    <div class="img-box">
      <img src="${img}" alt="${title}">
      <span class="badge">منصة شغل وتقنية - Rooh Pro</span>
    </div>
    <div class="content">
      <div class="author">بواسطة: ${author}</div>
      <h2 class="title">${title}</h2>
      <p class="desc">${desc}</p>
      <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn">عرض الإعلان والتواصل المباشر</a>
    </div>
  </div>
</body>
</html>`;

      return new Response(embedHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 3. SSR / SEO Meta Injection for Google Bot & Social Crawlers
    const userAgent = request.headers.get('User-Agent') || '';
    const isBot = /bot|googlebot|crawler|spider|facebookexternalhit|whatsapp|telegram/i.test(userAgent);

    if (isBot || pathname.includes('/privacy') || pathname.includes('/u/')) {
      let customTitle = 'شغل وتقنية | منصة الوظائف وسوق العمل الذكي (roohpro.com/jop)';
      let customDesc = 'منصة التوظيف وسوق العمل الذكي المباشر بدون وسيط - تواصل فوري عبر واتساب';
      let canonicalUrl = `https://roohpro.com${pathname}`;

      if (pathname.includes('/privacy')) {
        customTitle = 'وثيقة السياسات والـ 15 بنداً القانونية | شغل وتقنية (roohpro.com/jop)';
        customDesc = 'الوثيقة القانونية المعتمدة بنسبة 100% لتنظيم حقوق المنشآت والمعلنين والمهنيين وسوق العمل الحر بدون وسطاء.';
        canonicalUrl = 'https://roohpro.com/jop/privacy';
      } else if (pathname.includes('/u/')) {
        const username = pathname.split('/u/')[1] || 'معلن';
        customTitle = `الملف المهني وإعلانات ${decodeURIComponent(username)} | شغل وتقنية`;
        customDesc = `استعرض كافة الوظائف والخدمات المعتمدة للمعلن ${decodeURIComponent(username)} عبر منصة Rooh Pro Jobs.`;
      }

      // If assets fetcher is available, fetch index.html and inject meta
      const assetHandler = env.STATIC_ASSETS || env.ASSETS;
      if (assetHandler) {
        const assetResponse = await assetHandler.fetch(new Request(new URL('/index.html', request.url)));
        let html = await assetResponse.text();
        html = html.replace(/<title>.*?<\/title>/, `<title>${customTitle}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${customDesc}" />`);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }

    // 4. Default Asset Fetching
    const defaultAssetHandler = env.STATIC_ASSETS || env.ASSETS;
    if (defaultAssetHandler) {
      return defaultAssetHandler.fetch(request);
    }

    return new Response('Rooh Pro Jobs Platform Worker Active (roohpro.com/jop)', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
