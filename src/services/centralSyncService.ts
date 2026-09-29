/**
 * Central Cloudflare D1, R2, Parent Platform (roohpro.com) & Firebase Firestore Synchronization Service
 * 
 * Ensures:
 * 1. Immediate capture of user emails (registration, login, job application, support, newsletter)
 * 2. Instant storage in Firebase Firestore (`jop_subscribers` & `users`)
 * 3. Synchronization to Cloudflare D1 (`jop_subscribers` table)
 * 4. Archival backup in Cloudflare R2 (`roohme` media & user bucket)
 * 5. Background fallback sync to Parent Portal: POST https://roohpro.com/api/v1/users/sync
 * 6. Offline resilience (localStorage queue with automatic drain on reconnection)
 * 7. Instant SEO & Route Archiving via IndexNow & Google Jobs Schema (JSON-LD)
 */

import { saveSubscriberToFirestore, saveUserProfileToFirestore } from '../firebase/services';
import { UserProfile, JobPost } from '../types';

export interface SubscriberPayload {
  email: string;
  fullName?: string;
  userRole?: 'job_seeker' | 'employer' | 'subscriber' | string;
  phoneNumber?: string;
  portalOrigin?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

const OFFLINE_QUEUE_KEY = 'shoghl_offline_subscribers_queue';
const REGISTERED_EMAILS_KEY = 'shoghl_synced_emails_cache';

/**
 * Clean & sanitize email
 */
export function sanitizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const clean = sanitizeEmail(email);
  return clean.length >= 5 && clean.includes('@') && clean.includes('.');
}

/**
 * Retrieve queued offline subscribers
 */
function getOfflineQueue(): SubscriberPayload[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save item into offline queue
 */
function enqueueOfflineSubscriber(payload: SubscriberPayload): void {
  try {
    const queue = getOfflineQueue();
    // Prevent duplicates in queue
    if (!queue.some(item => sanitizeEmail(item.email) === sanitizeEmail(payload.email))) {
      queue.push(payload);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`[Offline Resilience] Enqueued subscriber ${payload.email} for background sync`);
    }
  } catch (err) {
    console.warn('Failed to enqueue offline subscriber:', err);
  }
}

/**
 * Remove an item from the offline queue
 */
function dequeueOfflineSubscriber(email: string): void {
  try {
    const clean = sanitizeEmail(email);
    const queue = getOfflineQueue().filter(item => sanitizeEmail(item.email) !== clean);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to dequeue offline subscriber:', err);
  }
}

/**
 * Records synced email locally to avoid spamming
 */
function markEmailSynced(email: string): void {
  try {
    const clean = sanitizeEmail(email);
    const raw = localStorage.getItem(REGISTERED_EMAILS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(clean)) {
      list.push(clean);
      if (list.length > 500) list.shift();
      localStorage.setItem(REGISTERED_EMAILS_KEY, JSON.stringify(list));
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Main Central Synchronization Function
 * Captures email -> Firebase -> Cloudflare D1 -> R2 -> Parent Portal (roohpro.com)
 */
export async function syncEmailGlobally(payload: SubscriberPayload): Promise<{
  success: boolean;
  firebaseSaved: boolean;
  d1Synced: boolean;
  parentSynced: boolean;
}> {
  const cleanEmail = sanitizeEmail(payload.email);
  if (!isValidEmail(cleanEmail)) {
    return { success: false, firebaseSaved: false, d1Synced: false, parentSynced: false };
  }

  const enrichedPayload: SubscriberPayload = {
    ...payload,
    email: cleanEmail,
    fullName: payload.fullName?.trim() || cleanEmail.split('@')[0],
    userRole: payload.userRole || 'job_seeker',
    phoneNumber: payload.phoneNumber?.trim() || '',
    portalOrigin: payload.portalOrigin || 'jop',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  let firebaseSaved = false;
  let d1Synced = false;
  let parentSynced = false;

  // 1. Instant Save to Firebase Firestore
  try {
    firebaseSaved = await saveSubscriberToFirestore(enrichedPayload);
    console.log(`[Firebase] Subscriber ${cleanEmail} saved to Firestore:`, firebaseSaved);
  } catch (fbErr) {
    console.warn('[Firebase] Firestore subscriber sync notice:', fbErr);
  }

  // Check if browser is online
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    enqueueOfflineSubscriber(enrichedPayload);
    return { success: true, firebaseSaved, d1Synced: false, parentSynced: false };
  }

  // 2. Sync to Cloudflare D1 & R2 via Cloudflare Worker backend
  try {
    const workerEndpoints = ['/jop/api/sync-user', '/api/sync-user'];
    let workerSuccess = false;

    for (const ep of workerEndpoints) {
      try {
        const resp = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enrichedPayload)
        });
        if (resp.ok) {
          const json = await resp.json().catch(() => ({}));
          d1Synced = !!json.success || !!json.d1Saved;
          workerSuccess = true;
          break;
        }
      } catch {
        // try next endpoint
      }
    }

    if (!workerSuccess) {
      console.log('[Central Sync] Worker endpoint unreachable, attempting direct fallback to Parent Platform');
    }
  } catch (d1Err) {
    console.warn('[Cloudflare D1] Worker sync attempt notice:', d1Err);
  }

  // 3. Fallback / Parallel Sync to Parent Platform: POST https://roohpro.com/api/v1/users/sync
  try {
    const parentResponse = await fetch('https://roohpro.com/api/v1/users/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: cleanEmail,
        fullName: enrichedPayload.fullName,
        role: enrichedPayload.userRole,
        phone: enrichedPayload.phoneNumber,
        portal: 'jop',
        timestamp: new Date().toISOString()
      }),
      mode: 'cors'
    }).catch(() => {
      // In case of CORS or offline, fallback no-cors dispatch
      return fetch('https://roohpro.com/api/v1/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          portal: 'jop',
          timestamp: new Date().toISOString()
        }),
        mode: 'no-cors'
      });
    });

    if (parentResponse) {
      parentSynced = true;
    }
  } catch (parentErr) {
    console.warn('[Parent Sync] Fallback sync to roohpro.com notice:', parentErr);
  }

  // If both D1 and Parent sync failed due to network, enqueue for offline retry
  if (!d1Synced && !parentSynced && !firebaseSaved) {
    enqueueOfflineSubscriber(enrichedPayload);
  } else {
    dequeueOfflineSubscriber(cleanEmail);
    markEmailSynced(cleanEmail);
  }

  return {
    success: firebaseSaved || d1Synced || parentSynced,
    firebaseSaved,
    d1Synced,
    parentSynced
  };
}

/**
 * Flush offline subscriber queue upon network reconnection
 */
export async function flushOfflineSubscribers(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`[Offline Resilience] Draining ${queue.length} offline subscribers...`);
  const remaining: SubscriberPayload[] = [];

  for (const item of queue) {
    try {
      const res = await syncEmailGlobally(item);
      if (!res.success) {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}

// Automatically bind window online listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Network] Reconnected to the internet. Flushing offline subscribers queue...');
    flushOfflineSubscribers();
  });
}

/**
 * -------------------------------------------------------------
 * 2️⃣ Instant SEO & Route Archiving (IndexNow & Sitemap Registration)
 * -------------------------------------------------------------
 */

export async function archiveRouteInstant(newUrl: string, type: string = 'job_listing'): Promise<void> {
  if (!newUrl) return;

  const absoluteUrl = newUrl.startsWith('http') ? newUrl : `https://roohpro.com${newUrl.startsWith('/') ? '' : '/'}${newUrl}`;

  console.log(`[Instant SEO] Dispatching archiving ping for: ${absoluteUrl}`);

  // 1. Dispatch to IndexNow (Bing, Yandex, Seznam, Naver instant crawler notification)
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'roohpro.com',
        key: 'roohpro-indexnow-key',
        keyLocation: 'https://roohpro.com/roohpro-indexnow-key.txt',
        urlList: [absoluteUrl]
      }),
      mode: 'no-cors' // Safe cross-origin dispatch
    });
    console.log('[Instant SEO] IndexNow ping sent successfully');
  } catch (err) {
    console.warn('[Instant SEO] IndexNow direct ping non-critical notice:', err);
  }

  // 2. Dispatch to Parent Platform Central Sitemap Registry
  try {
    await fetch('https://roohpro.com/api/sitemaps/register-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: absoluteUrl,
        portal: 'jop',
        type
      }),
      mode: 'no-cors'
    });
    console.log('[Instant SEO] Central sitemap register-url ping sent successfully');
  } catch (err) {
    console.warn('[Instant SEO] Central sitemap registration notice:', err);
  }

  // 3. Worker-side archive endpoint if available
  try {
    fetch('/jop/api/archive-instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: absoluteUrl, type })
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

/**
 * -------------------------------------------------------------
 * Schema.org Google Jobs (JSON-LD) Dynamic Injection
 * -------------------------------------------------------------
 */

export function injectGoogleJobsSchema(post: JobPost): void {
  if (typeof document === 'undefined' || !post) return;

  try {
    let scriptTag = document.getElementById('google-jobposting-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'google-jobposting-schema';
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }

    const employmentTypeMap: Record<string, string> = {
      'دوام جزئي': 'PART_TIME',
      'عن بعد': 'CONTRACTOR',
      'عمل حر': 'CONTRACTOR',
      'دوام كامل': 'FULL_TIME',
      'عاجل': 'TEMPORARY'
    };

    const jobPostingSchema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: post.title,
      description: post.description || `${post.title} - فرصة عمل عبر منصة شغل وتقنية roohpro.com/jop`,
      datePosted: new Date().toISOString(),
      validThrough: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      employmentType: post.workType ? employmentTypeMap[post.workType] || 'FULL_TIME' : 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: post.authorName || 'منصة شغل وتقنية',
        sameAs: 'https://roohpro.com/jop',
        logo: post.authorAvatar || 'https://roohpro.com/icon.svg'
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: post.location || 'الإسكندرية',
          addressCountry: post.country || 'EG'
        }
      },
      baseSalary: post.salary ? {
        '@type': 'MonetaryAmount',
        currency: 'EGP',
        value: {
          '@type': 'QuantitativeValue',
          value: post.salary,
          unitText: 'MONTH'
        }
      } : undefined
    };

    scriptTag.textContent = JSON.stringify(jobPostingSchema);
  } catch (err) {
    console.warn('[SEO] Failed to inject Google JobPosting schema:', err);
  }
}
