/**
 * SEO, Routing, Short Links, and Google Indexing Dispatcher for Rooh Pro (roohpro.com/jop)
 */

import { archiveRouteInstant, injectGoogleJobsSchema } from '../services/centralSyncService';

export { archiveRouteInstant, injectGoogleJobsSchema };

export const BASE_PLATFORM_URL = 'https://roohpro.com/jop';
export const MAIN_PORTAL_URL = 'https://roohpro.com';
export const ADS_PORTAL_URL = 'https://roohpro.com/AD';

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: object;
}

/**
 * Generate a short, clean slug from a person or company name
 * E.g., "شركة الأهرام للهندسة" -> "alahram", "م. أحمد حسام" -> "ahmed"
 */
export function generateAuthorShortSlug(name: string, fallbackId: string = 'ad'): string {
  if (!name) return fallbackId;
  
  // Clean Arabic / English name to short slug
  const trimmed = name
    .trim()
    .replace(/^(شركة|مكتب|مؤسسة|مهندس|دكتور|استاذ|م\.|د\.|أ\.)\s+/g, '')
    .trim();

  // Transliterate common Arabic names or keep clean chars
  const slug = trimmed
    .toLowerCase()
    .replace(/[^\w\u0621-\u064A\d\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 18);

  return slug || fallbackId;
}

/**
 * Build a concise, memorable short URL for a job ad
 * E.g., roohpro.com/jop/alnoor/1 or roohpro.com/jop/ahmed/2
 */
export function buildShortAdUrl(authorName: string, adIndex: number = 1): string {
  const authorSlug = generateAuthorShortSlug(authorName, 'user');
  return `${BASE_PLATFORM_URL}/${authorSlug}/${adIndex}`;
}

/**
 * Build custom dedicated URL for user profile
 * E.g., roohpro.com/jop/u/ahmed-hossam
 */
export function buildUserProfileUrl(usernameOrSlug: string): string {
  const slug = generateAuthorShortSlug(usernameOrSlug, 'profile');
  return `${BASE_PLATFORM_URL}/u/${slug}`;
}

/**
 * Dedicated Privacy Policy URL for Google Indexing
 * E.g., roohpro.com/jop/privacy
 */
export const PRIVACY_POLICY_URL = `${BASE_PLATFORM_URL}/privacy`;

/**
 * Update document title, meta tags, and JSON-LD structured data dynamically for SEO
 */
export function applyPageSeo(meta: PageMetadata): void {
  try {
    // 1. Title
    document.title = meta.title;

    // 2. Meta description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', meta.description);

    // 3. OpenGraph tags
    const setMetaProperty = (prop: string, val: string) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', val);
    };

    const canonicalUrl = meta.canonicalUrl || BASE_PLATFORM_URL;
    setMetaProperty('og:title', meta.title);
    setMetaProperty('og:description', meta.description);
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:type', meta.ogType || 'website');
    if (meta.ogImage) {
      setMetaProperty('og:image', meta.ogImage);
    }

    // 4. Canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // 5. JSON-LD structured data for Google Rich Results
    let jsonLdScript = document.getElementById('rooh-json-ld');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'rooh-json-ld';
      jsonLdScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLdScript);
    }

    const defaultJsonLd = meta.jsonLd || {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'شغل وتقنية - Rooh Pro Jobs',
      url: BASE_PLATFORM_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_PLATFORM_URL}?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    jsonLdScript.textContent = JSON.stringify(defaultJsonLd);

    // 6. Ping / Dispatch to main portal roohpro.com for cross-domain archiving
    pingMainPortalArchive({
      url: canonicalUrl,
      title: meta.title,
      description: meta.description,
      indexedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[SEO] Failed to update meta tags:', err);
  }
}

/**
 * Dispatch page archive record to main portal roohpro.com
 * Enables the main site roohpro.com to index and catalog all ads, user pages, and policies
 */
export async function pingMainPortalArchive(archivePayload: {
  url: string;
  title: string;
  description: string;
  category?: string;
  indexedAt: string;
}): Promise<void> {
  try {
    // Also save in local archival cache
    const existingRaw = localStorage.getItem('rooh_indexed_pages_cache');
    const existingList: Array<typeof archivePayload> = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Avoid duplicate pings
    if (!existingList.some(item => item.url === archivePayload.url)) {
      existingList.unshift(archivePayload);
      if (existingList.length > 100) existingList.pop();
      localStorage.setItem('rooh_indexed_pages_cache', JSON.stringify(existingList));
    }

    // Ping main portal backend asynchronously
    fetch(`${MAIN_PORTAL_URL}/api/archive-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'roohpro_jobs_applet',
        targetPlatform: 'roohpro.com/jop',
        ...archivePayload
      }),
      mode: 'no-cors' // Safe fire-and-forget
    }).catch(() => {
      // Offline or CORS-safe fallback
    });
  } catch (err) {
    // Non-blocking
  }
}
