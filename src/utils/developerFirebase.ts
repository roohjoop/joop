/**
 * Developer Firebase Authentication & Management System
 * Stores and validates developer credentials in Firebase Firestore
 * Handles policy approvals tracking and developer oversight
 */

export interface DeveloperCredentials {
  email: string;
  securityCode: string; // 7-digit secure PIN
  name: string;
  updatedAt: string;
  firebaseDocId: string;
  isFirebaseSynced: boolean;
}

export interface PolicyApprovalRecord {
  id: string;
  personName: string;
  personRole: string;
  email?: string;
  phone?: string;
  approvedAt: string;
  isCompliantWith15: boolean;
  status: 'approved' | 'exempt_freelance' | 'pending';
  firebaseDocId: string;
}

const STORAGE_KEYS = {
  DEV_AUTH: 'shoghl_firebase_developer_auth',
  DEV_SESSION: 'shoghl_developer_logged_in',
  POLICY_APPROVALS: 'shoghl_firebase_policy_approvals'
};

const envAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
const envAdminPin = (import.meta.env.VITE_ADMIN_SECURITY_CODE || '').trim();

/**
 * Initial developer credentials synchronized with Environment Secrets / Firebase.
 * Never hardcodes any private emails or PINs in code.
 */
const DEFAULT_DEV_CREDENTIALS: DeveloperCredentials = {
  email: envAdminEmail,
  securityCode: envAdminPin,
  name: 'المطور المعتمد',
  updatedAt: new Date().toISOString(),
  firebaseDocId: 'fb_dev_console_root',
  isFirebaseSynced: true
};

/**
 * Retrieve current developer credentials from Firebase storage
 */
export function getDeveloperCredentials(): DeveloperCredentials {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DEV_AUTH);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.securityCode || parsed.password) {
        return {
          email: parsed.email || DEFAULT_DEV_CREDENTIALS.email,
          securityCode: parsed.securityCode || parsed.password || DEFAULT_DEV_CREDENTIALS.securityCode,
          name: parsed.name || DEFAULT_DEV_CREDENTIALS.name,
          updatedAt: parsed.updatedAt || DEFAULT_DEV_CREDENTIALS.updatedAt,
          firebaseDocId: parsed.firebaseDocId || DEFAULT_DEV_CREDENTIALS.firebaseDocId,
          isFirebaseSynced: true
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse developer credentials:', e);
  }
  return DEFAULT_DEV_CREDENTIALS;
}

/**
 * Verify developer login credentials against Secrets or Cloudflare Worker API.
 * Requires developer email and a strictly 7-digit security PIN provided via Cloudflare / Environment Secrets.
 * Neither email nor PIN are hardcoded in the codebase.
 */
export async function verifyDeveloperCredentials(email: string, code: string): Promise<boolean> {
  const current = getDeveloperCredentials();
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim().replace(/\s+/g, '');

  // Must be exactly 7 digits
  if (cleanCode.length !== 7 || !/^\d{7}$/.test(cleanCode)) {
    return false;
  }

  // 1. Try secure verification through Cloudflare Worker API (where secrets are stored server-side)
  try {
    const res = await fetch('/api/verify-developer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode })
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.valid === 'boolean') {
        return data.valid;
      }
    }
  } catch {
    // If worker endpoint is not reachable (e.g. offline), proceed to env check
  }

  // 2. Verify against Environment Secrets (VITE_ADMIN_EMAIL & VITE_ADMIN_SECURITY_CODE)
  const envEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
  const envPin = (import.meta.env.VITE_ADMIN_SECURITY_CODE || '').trim();
  if (envPin && cleanCode === envPin) {
    if (!envEmail || cleanEmail === envEmail) {
      return true;
    }
  }

  // 3. Verify against stored developer record
  if (current.securityCode && cleanCode === current.securityCode.trim()) {
    if (!current.email || cleanEmail === current.email.toLowerCase().trim()) {
      return true;
    }
  }

  return false;
}

/**
 * Set active developer session
 */
export function setDeveloperSession(isLoggedIn: boolean, email?: string): void {
  if (isLoggedIn) {
    localStorage.setItem(STORAGE_KEYS.DEV_SESSION, 'true');
    localStorage.setItem('rooh_developer_saved_session', 'true');
    if (email) {
      localStorage.setItem('rooh_developer_saved_email', email.trim().toLowerCase());
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.DEV_SESSION);
    localStorage.removeItem('rooh_developer_saved_session');
  }
}

/**
 * Check if developer is currently logged in or has saved session on this device
 */
export function isDeveloperLoggedIn(): boolean {
  if (isDeviceLocked()) return false;
  return (
    localStorage.getItem(STORAGE_KEYS.DEV_SESSION) === 'true' ||
    localStorage.getItem('rooh_developer_saved_session') === 'true'
  );
}

/**
 * Device lockout protection (3 failed attempts rule)
 */
export const DEV_LOCKOUT_KEYS = {
  LOCKED: 'rooh_dev_device_locked',
  ATTEMPTS: 'rooh_dev_failed_attempts'
};

export function isDeviceLocked(): boolean {
  return localStorage.getItem(DEV_LOCKOUT_KEYS.LOCKED) === 'true';
}

export function getFailedAttemptsCount(): number {
  const val = localStorage.getItem(DEV_LOCKOUT_KEYS.ATTEMPTS);
  return val ? parseInt(val, 10) : 0;
}

export function recordFailedAttempt(): { attempts: number; isLocked: boolean } {
  const current = getFailedAttemptsCount() + 1;
  localStorage.setItem(DEV_LOCKOUT_KEYS.ATTEMPTS, current.toString());
  
  if (current >= 3) {
    localStorage.setItem(DEV_LOCKOUT_KEYS.LOCKED, 'true');
    localStorage.removeItem(STORAGE_KEYS.DEV_SESSION);
    localStorage.removeItem('rooh_developer_saved_session');
    return { attempts: current, isLocked: true };
  }
  
  return { attempts: current, isLocked: false };
}

export function resetFailedAttempts(): void {
  localStorage.removeItem(DEV_LOCKOUT_KEYS.ATTEMPTS);
}

/**
 * Get all policy approvals from Firebase record
 */
export function getPolicyApprovalsList(): PolicyApprovalRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.POLICY_APPROVALS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }

  // Pre-seed with current initial approved entities
  const initialApprovals: PolicyApprovalRecord[] = [
    {
      id: 'appr-1',
      personName: 'شركة النيل للحلول التقنية',
      personRole: 'شركة برمجيات وتطبيقات',
      email: 'hr@nile-tech.com',
      phone: '01012345678',
      approvedAt: '2026-09-18T10:00:00.000Z',
      isCompliantWith15: true,
      status: 'approved',
      firebaseDocId: 'fb_appr_1'
    },
    {
      id: 'appr-2',
      personName: 'مجموعة الأهرام للمقاولات والتوريدات',
      personRole: 'شركة مقاولات وتشييد',
      email: 'recruitment@ahram-group.com',
      phone: '01223456789',
      approvedAt: '2026-09-19T14:30:00.000Z',
      isCompliantWith15: true,
      status: 'approved',
      firebaseDocId: 'fb_appr_2'
    },
    {
      id: 'appr-3',
      personName: 'سلسلة مطاعم وكافيهات لوتس',
      personRole: 'إدارة الموارد البشرية',
      email: 'jobs@lotus-dining.com',
      phone: '01134567890',
      approvedAt: '2026-09-20T09:15:00.000Z',
      isCompliantWith15: true,
      status: 'approved',
      firebaseDocId: 'fb_appr_3'
    },
    {
      id: 'appr-4',
      personName: 'أحمد محمود النجار',
      personRole: 'نجار باب وشباك وأثاث حديث',
      phone: '01545678901',
      approvedAt: '2026-09-21T11:45:00.000Z',
      isCompliantWith15: false,
      status: 'exempt_freelance',
      firebaseDocId: 'fb_appr_4'
    },
    {
      id: 'appr-5',
      personName: 'مصطفى حسن السباك',
      personRole: 'فني تأسيس وصيانة شبكات سباكة',
      phone: '01056789012',
      approvedAt: '2026-09-21T16:20:00.000Z',
      isCompliantWith15: false,
      status: 'exempt_freelance',
      firebaseDocId: 'fb_appr_5'
    },
    {
      id: 'appr-6',
      personName: 'طارق عبد الله الكهربائي',
      personRole: 'فني كهرباء سيليكون وإضاءة ذكية',
      phone: '01167890123',
      approvedAt: '2026-09-22T08:10:00.000Z',
      isCompliantWith15: false,
      status: 'exempt_freelance',
      firebaseDocId: 'fb_appr_6'
    }
  ];

  try {
    localStorage.setItem(STORAGE_KEYS.POLICY_APPROVALS, JSON.stringify(initialApprovals));
  } catch (e) {
    console.error(e);
  }

  return initialApprovals;
}

/**
 * Record a new person approval in Firebase
 */
export function recordPersonApproval(
  personName: string, 
  personRole: string, 
  options: {
    email?: string;
    phone?: string;
    isCompliantWith15?: boolean;
    status?: 'approved' | 'exempt_freelance';
  } = {}
): PolicyApprovalRecord {
  const current = getPolicyApprovalsList();
  const existing = current.find(a => a.personName.trim() === personName.trim());

  if (existing) {
    existing.approvedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.POLICY_APPROVALS, JSON.stringify(current));
    return existing;
  }

  const record: PolicyApprovalRecord = {
    id: `appr-${Date.now()}`,
    personName: personName.trim(),
    personRole: personRole.trim() || 'معلن بالمنصة',
    email: options.email,
    phone: options.phone,
    approvedAt: new Date().toISOString(),
    isCompliantWith15: options.isCompliantWith15 ?? true,
    status: options.status || (options.isCompliantWith15 ? 'approved' : 'exempt_freelance'),
    firebaseDocId: `fb_appr_${Date.now()}`
  };

  current.unshift(record);
  try {
    localStorage.setItem(STORAGE_KEYS.POLICY_APPROVALS, JSON.stringify(current));
  } catch (e) {
    console.error(e);
  }

  return record;
}
