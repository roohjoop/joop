// src/worker.ts
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (pathname === "/jop/api/verify-developer" || pathname === "/api/verify-developer") {
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const reqEmail = (body?.email || "").trim().toLowerCase();
          const reqCode = (body?.code || "").trim();
          const adminEmail = (env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL || "roohjoop@gmail.com").trim().toLowerCase();
          const adminPin = (env.ADMIN_SECURITY_CODE || env.SECURITY_PIN || env.VITE_ADMIN_SECURITY_CODE || "5030775").trim();
          const allowedAdminEmails = [adminEmail, "roohjoop@gmail.com", "roohpro1@gmail.com", "roohpro9@gmail.com"];
          const isValid = allowedAdminEmails.includes(reqEmail) && reqCode === adminPin;
          return new Response(JSON.stringify({ success: isValid, valid: isValid }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch {
          return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
        }
      }
    }
    if (pathname === "/jop/api/sync-user" || pathname === "/api/sync-user" || pathname === "/api/v1/users/sync") {
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const rawEmail = body?.email || "";
          const cleanEmail = rawEmail.trim().toLowerCase();
          if (!cleanEmail || !cleanEmail.includes("@")) {
            return new Response(JSON.stringify({ success: false, error: "Invalid email address" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          const fullName = (body?.fullName || cleanEmail.split("@")[0]).trim();
          const userRole = body?.userRole || body?.role || "job_seeker";
          const phone = (body?.phoneNumber || body?.phone || "").trim();
          const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
          const clientUa = request.headers.get("user-agent") || "";
          let d1Saved = false;
          if (env.DB) {
            try {
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
              await env.DB.prepare(`
                INSERT INTO jop_subscribers (email, full_name, user_role, phone_number, portal_origin, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, 'jop', ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(email) DO UPDATE SET
                  full_name = COALESCE(excluded.full_name, jop_subscribers.full_name),
                  phone_number = COALESCE(excluded.phone_number, jop_subscribers.phone_number),
                  user_role = COALESCE(excluded.user_role, jop_subscribers.user_role),
                  synced_to_main = 1;
              `).bind(cleanEmail, fullName || null, userRole || "job_seeker", phone || null, clientIp, clientUa).run();
              d1Saved = true;
            } catch (d1Err) {
              console.warn("[Cloudflare D1 Query Notice]:", d1Err);
            }
          }
          const r2 = env.R2_BUCKET || env.ROOH_MEDIA_BUCKET;
          if (r2) {
            try {
              const r2Key = `subscribers/${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
              await r2.put(r2Key, JSON.stringify({
                email: cleanEmail,
                fullName,
                userRole,
                phone,
                portalOrigin: "jop",
                ip: clientIp,
                userAgent: clientUa,
                syncedAt: (/* @__PURE__ */ new Date()).toISOString()
              }), {
                httpMetadata: { contentType: "application/json" }
              });
            } catch (r2Err) {
              console.warn("[Cloudflare R2 Backup Notice]:", r2Err);
            }
          }
          const syncPayload = {
            email: cleanEmail,
            fullName,
            role: userRole,
            phone,
            portal: "jop",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          const dispatchParentSync = fetch("https://roohpro.com/api/v1/users/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(syncPayload)
          }).catch((err) => console.warn("[Parent Sync Background Notice]:", err));
          if (ctx && typeof ctx.waitUntil === "function") {
            ctx.waitUntil(dispatchParentSync);
          }
          return new Response(JSON.stringify({
            success: true,
            d1Saved,
            email: cleanEmail,
            portal: "jop",
            syncedAt: (/* @__PURE__ */ new Date()).toISOString()
          }), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e?.message || "Invalid sync request" }), { status: 400 });
        }
      }
    }
    if (pathname === "/jop/api/health" || pathname === "/api/health" || pathname === "/jop/api/build-status" || pathname === "/api/build-status") {
      let d1Ready = false;
      if (env.DB) {
        try {
          await env.DB.prepare("SELECT 1").run();
          d1Ready = true;
        } catch {
          d1Ready = false;
        }
      }
      return new Response(JSON.stringify({
        status: "healthy",
        platform: "Rooh Pro Jobs (\u0634\u063A\u0644 \u0648\u062A\u0642\u0646\u064A\u0629)",
        environment: env.ENVIRONMENT || "production",
        baseUrl: "https://roohpro.com/jop",
        build: {
          version: "2.5.0",
          engine: "Cloudflare Worker with Static Assets",
          status: "verified_active"
        },
        services: {
          staticAssets: !!env.STATIC_ASSETS,
          databaseD1: d1Ready,
          storageR2: !!env.R2_BUCKET,
          keyValueKV: !!env.ROOH_KV
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }
    if (pathname === "/roohpro-indexnow-key.txt" || pathname === "/jop/roohpro-indexnow-key.txt") {
      return new Response("roohpro-indexnow-key", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }
    if (pathname === "/jop/sitemap.xml" || pathname === "/sitemap.xml") {
      const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }
    if (pathname === "/jop/api/archive-instant" || pathname === "/api/archive-instant") {
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const targetUrl = body?.url || "https://roohpro.com/jop";
          const type = body?.type || "job_listing";
          const pingIndexNow = fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              host: "roohpro.com",
              key: "roohpro-indexnow-key",
              keyLocation: "https://roohpro.com/roohpro-indexnow-key.txt",
              urlList: [targetUrl]
            })
          }).catch((err) => console.warn("IndexNow worker ping notice:", err));
          const pingSitemap = fetch("https://roohpro.com/api/sitemaps/register-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: targetUrl,
              portal: "jop",
              type
            })
          }).catch((err) => console.warn("Central sitemap worker ping notice:", err));
          if (ctx && typeof ctx.waitUntil === "function") {
            ctx.waitUntil(Promise.all([pingIndexNow, pingSitemap]));
          }
          if (env.ROOH_KV) {
            try {
              await env.ROOH_KV.put(`sitemap:${targetUrl}`, JSON.stringify({
                url: targetUrl,
                archivedAt: (/* @__PURE__ */ new Date()).toISOString()
              }), { expirationTtl: 86400 * 60 });
            } catch (kvErr) {
              console.warn("KV sitemap put notice:", kvErr);
            }
          }
          return new Response(JSON.stringify({ success: true, archived: true, url: targetUrl }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch {
          return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
        }
      }
    }
    if (pathname === "/jop/api/notify-admin" || pathname === "/api/notify-admin") {
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const targetEmail = env.ADMIN_EMAIL;
          if (!targetEmail) {
            return new Response(JSON.stringify({ success: false, reason: "ADMIN_EMAIL secret is not configured" }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
          return new Response(JSON.stringify({
            success: true,
            notified: true,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch {
          return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
        }
      }
    }
    if (pathname.startsWith("/jop/api/media/") || pathname.startsWith("/api/media/")) {
      const key = pathname.replace(/^\/(jop\/api|api)\/media\//, "");
      const r2 = env.R2_BUCKET || env.ROOH_MEDIA_BUCKET;
      if (r2 && request.method === "GET") {
        const object = await r2.get(key);
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          headers.set("cache-control", "public, max-age=31536000, immutable");
          return new Response(object.body, { headers });
        }
      }
      if (env.VITE_CF_R2_PUBLIC_URL) {
        return Response.redirect(`${env.VITE_CF_R2_PUBLIC_URL}/${key}`, 302);
      }
    }
    if (pathname === "/jop/api/archive-ping" || pathname === "/api/archive-ping") {
      if (request.method === "POST") {
        try {
          const body = await request.json();
          if (env.ROOH_KV && body?.id) {
            await env.ROOH_KV.put(`archive:${body.id}`, JSON.stringify(body), { expirationTtl: 86400 * 30 });
          }
          return new Response(JSON.stringify({ success: true, received: body }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch {
          return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
        }
      }
    }
    if (pathname.startsWith("/jop/embed/") || pathname.startsWith("/embed/")) {
      const targetId = pathname.replace(/^\/(jop\/embed|embed)\//, "");
      let cachedPost = null;
      if (env.ROOH_KV) {
        try {
          const raw = await env.ROOH_KV.get(`archive:${targetId}`);
          if (raw) cachedPost = JSON.parse(raw);
        } catch {
        }
      }
      const title = cachedPost?.title || decodeURIComponent(targetId) || "\u0625\u0639\u0644\u0627\u0646 \u0645\u0639\u062A\u0645\u062F \u0639\u0628\u0631 \u0645\u0646\u0635\u0629 \u0634\u063A\u0644 \u0648\u062A\u0642\u0646\u064A\u0629";
      const desc = cachedPost?.description || "\u0634\u0627\u0647\u062F \u062A\u0641\u0627\u0635\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0639\u0628\u0631 \u0645\u0646\u0635\u0629 Rooh Pro Jobs";
      const img = cachedPost?.backdropImage || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80";
      const author = cachedPost?.authorName || "\u0645\u0639\u0644\u0646 \u0627\u0644\u0645\u0646\u0635\u0629";
      const targetUrl = `https://roohpro.com/jop#${targetId}`;
      const embedHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | \u0634\u063A\u0644 \u0648\u062A\u0642\u0646\u064A\u0629</title>
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
      <span class="badge">\u0645\u0646\u0635\u0629 \u0634\u063A\u0644 \u0648\u062A\u0642\u0646\u064A\u0629 - Rooh Pro</span>
    </div>
    <div class="content">
      <div class="author">\u0628\u0648\u0627\u0633\u0637\u0629: ${author}</div>
      <h2 class="title">${title}</h2>
      <p class="desc">${desc}</p>
      <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn">\u0639\u0631\u0636 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631</a>
    </div>
  </div>
</body>
</html>`;
      return new Response(embedHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }
    const userAgent = request.headers.get("User-Agent") || "";
    const isBot = /bot|googlebot|crawler|spider|facebookexternalhit|whatsapp|telegram/i.test(userAgent);
    if (isBot || pathname.includes("/privacy") || pathname.includes("/u/")) {
      let customTitle = "\u0634\u063A\u0644 \u0648\u062A\u0642\u0646\u064A\u0629 | \u0645\u0646\u0635\u0629 \u0627\u0644\u0648\u0638\u0627\u0626\u0641 \u0648\u0633\u0648\u0642 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0630\u0643\u064A (roohpro.com/jop)";
      let customDesc = "\u0645\u0646\u0635\u0629 \u0627\u0644\u062A\u0648\u0638\u064A\u0641 \u0648\u0633\u0648\u0642 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0630\u0643\u064A \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0628\u062F\u0648\u0646 \u0648\u0633\u064A\u0637 - \u062A\u0648\u0627\u0635\u0644 \u0641\u0648\u0631\u064A \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628";
      let canonicalUrl = `https://roohpro.com${pathname}`;
      if (pathname.includes("/privacy")) {
        customTitle = "\u0648\u062B\u064A\u0642\u0629 \u0627\u0644\u0633\u064A\u0627\u0633\u0627\u062A \u0648\u0627\u0644\u0640 15 \u0628\u0646\u062F\u0627\u064B \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A\u0629 | \u0634\u063A\u0644 \u0648\u062A\u0642\u0646\u064A\u0629 (roohpro.com/jop)";
        customDesc = "\u0627\u0644\u0648\u062B\u064A\u0642\u0629 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0628\u0646\u0633\u0628\u0629 100% \u0644\u062A\u0646\u0638\u064A\u0645 \u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0646\u0634\u0622\u062A \u0648\u0627\u0644\u0645\u0639\u0644\u0646\u064A\u0646 \u0648\u0627\u0644\u0645\u0647\u0646\u064A\u064A\u0646 \u0648\u0633\u0648\u0642 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u062D\u0631 \u0628\u062F\u0648\u0646 \u0648\u0633\u0637\u0627\u0621.";
        canonicalUrl = "https://roohpro.com/jop/privacy";
      } else if (pathname.includes("/u/")) {
        const username = pathname.split("/u/")[1] || "\u0645\u0639\u0644\u0646";
        customTitle = `\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0647\u0646\u064A \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062A ${decodeURIComponent(username)} | \u0634\u063A\u0644 \u0648\u062A\u0642\u0646\u064A\u0629`;
        customDesc = `\u0627\u0633\u062A\u0639\u0631\u0636 \u0643\u0627\u0641\u0629 \u0627\u0644\u0648\u0638\u0627\u0626\u0641 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u0644\u0645\u0639\u0644\u0646 ${decodeURIComponent(username)} \u0639\u0628\u0631 \u0645\u0646\u0635\u0629 Rooh Pro Jobs.`;
      }
      const assetHandler = env.STATIC_ASSETS || env.ASSETS;
      if (assetHandler) {
        const assetResponse = await assetHandler.fetch(new Request(new URL("/index.html", request.url)));
        let html = await assetResponse.text();
        html = html.replace(/<title>.*?<\/title>/, `<title>${customTitle}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${customDesc}" />`);
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
          }
        });
      }
    }
    const defaultAssetHandler = env.STATIC_ASSETS || env.ASSETS;
    if (defaultAssetHandler) {
      return defaultAssetHandler.fetch(request);
    }
    return new Response("Rooh Pro Jobs Platform Worker Active (roohpro.com/jop)", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};
export {
  worker_default as default
};
