/**
 * Coins Engine & Rooh AD Campaign Sync
 * 
 * - يوفر 50 كوين هدية ترحيبية فورية عند إنشاء أو إضافة حساب جديد.
 * - عداد كوينات متقدم داخل صفحة حسابي يستمر في الجمع أثناء تواجد المستخدم.
 * - يتيح جمع المزيد من الكوينات عبر التفاعل والمشاهدة.
 * - يزامن البريد الإلكتروني للمستخدم مع شبكة إعلانات Rooh AD (Roohpro.com/AD)
 *   لتمكين المستخدم من إطلاق حملات إعلانية على كافة منصات الشبكة.
 */

import { ADS_PORTAL_URL } from './seoAndRouting';

const STORAGE_KEY_COINS = 'rooh_user_coins_balance';
const STORAGE_KEY_WELCOME_GRANTED = 'rooh_welcome_coins_granted_v2';
const STORAGE_KEY_SYNCED_EMAIL = 'rooh_ad_synced_email';
const STORAGE_KEY_SYNCED_TS = 'rooh_ad_synced_timestamp';
const STORAGE_KEY_SESSION_AWARDED = 'rooh_session_coins_awarded_id';
const STORAGE_KEY_SESSION_VISITS = 'rooh_total_sessions_count';

// Get current coin balance (default initial gift 50 coins)
export function getStoredCoins(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_COINS);
    if (!val) {
      // 50 Welcome Coins for new account/user
      localStorage.setItem(STORAGE_KEY_COINS, '50');
      return 50;
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 0 ? 50 : parsed;
  } catch {
    return 50;
  }
}

// Save coin balance and notify listeners
export function saveStoredCoins(amount: number): void {
  try {
    const safeAmount = Math.max(0, Math.floor(amount));
    localStorage.setItem(STORAGE_KEY_COINS, safeAmount.toString());
    window.dispatchEvent(new CustomEvent('rooh_coins_updated', { detail: { coins: safeAmount } }));
  } catch (err) {
    console.warn('Failed to save coins:', err);
  }
}

// Track and initialize session. User earns +50 coins for their completed session in the app.
export function initSessionCoinsTracker(): void {
  try {
    // Generate or get existing session ID for this browser tab/session
    let sessionId = sessionStorage.getItem('rooh_session_token');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('rooh_session_token', sessionId);
      
      // Increment total sessions count
      const totalVisits = parseInt(localStorage.getItem(STORAGE_KEY_SESSION_VISITS) || '0', 10) + 1;
      localStorage.setItem(STORAGE_KEY_SESSION_VISITS, totalVisits.toString());
    }

    // Award +50 coins when leaving or finishing the session
    const handleSessionExit = () => {
      completeSessionAndAwardCoins();
    };

    window.addEventListener('beforeunload', handleSessionExit);
    window.addEventListener('pagehide', handleSessionExit);
  } catch (err) {
    console.warn('Session tracker error:', err);
  }
}

// Complete session and award exactly 50 coins for the session (only once per session)
export function completeSessionAndAwardCoins(): { awarded: boolean; coins: number } {
  try {
    const sessionId = sessionStorage.getItem('rooh_session_token');
    if (!sessionId) return { awarded: false, coins: getStoredCoins() };

    const lastAwardedSession = localStorage.getItem(STORAGE_KEY_SESSION_AWARDED);
    if (lastAwardedSession === sessionId) {
      // Already awarded for this session
      return { awarded: false, coins: getStoredCoins() };
    }

    // Award 50 coins for completing this app session
    localStorage.setItem(STORAGE_KEY_SESSION_AWARDED, sessionId);
    const current = getStoredCoins();
    const next = current + 50;
    saveStoredCoins(next);
    return { awarded: true, coins: next };
  } catch {
    return { awarded: false, coins: getStoredCoins() };
  }
}

// Grant 50 Welcome Coins specifically upon creating or adding an account
export function grantAccountWelcomeCoins(email?: string): { coins: number; isFirstTime: boolean } {
  try {
    const alreadyGranted = localStorage.getItem(STORAGE_KEY_WELCOME_GRANTED);
    const current = getStoredCoins();

    if (email) {
      localStorage.setItem(STORAGE_KEY_SYNCED_EMAIL, email.trim().toLowerCase());
      localStorage.setItem(STORAGE_KEY_SYNCED_TS, new Date().toISOString());
    }

    if (!alreadyGranted) {
      localStorage.setItem(STORAGE_KEY_WELCOME_GRANTED, 'true');
      // Guarantee at least 50 coins or add 50 bonus
      const newBalance = Math.max(50, current + 50);
      saveStoredCoins(newBalance);
      return { coins: newBalance, isFirstTime: true };
    }

    // Ensure balance never drops below 50 for registered users
    if (current < 50) {
      saveStoredCoins(50);
      return { coins: 50, isFirstTime: false };
    }

    return { coins: current, isFirstTime: false };
  } catch {
    return { coins: 50, isFirstTime: true };
  }
}

// Add bonus coins (e.g. rewarded ad, watching videos, active interaction)
export function addCoinsBonus(amount: number): number {
  const current = getStoredCoins();
  const next = current + Math.max(1, amount);
  saveStoredCoins(next);
  return next;
}

// Get synchronization state with Rooh AD Network
export function getRoohAdSyncInfo(currentEmail?: string) {
  try {
    const storedEmail = localStorage.getItem(STORAGE_KEY_SYNCED_EMAIL) || currentEmail || '';
    const syncTimestamp = localStorage.getItem(STORAGE_KEY_SYNCED_TS) || new Date().toISOString();
    return {
      syncedEmail: storedEmail,
      isSynced: Boolean(storedEmail),
      syncTimestamp,
      networkName: 'Rooh AD Multi-Platform Network'
    };
  } catch {
    return {
      syncedEmail: currentEmail || '',
      isSynced: Boolean(currentEmail),
      syncTimestamp: new Date().toISOString(),
      networkName: 'Rooh AD Multi-Platform Network'
    };
  }
}

// Build ad campaign creation URL synced with user email & coins
export function buildAdCampaignUrl(coins: number, userName?: string, intent?: string, email?: string): string {
  const params = new URLSearchParams();
  params.set('coins', coins.toString());
  if (email) {
    params.set('email', email.trim());
  }
  if (userName) {
    params.set('user', userName.trim());
  }
  if (intent) {
    params.set('intent', intent);
  }
  params.set('source', 'shoghl_network');
  params.set('network', 'rooh_ads_network');
  params.set('action', 'create_campaign');
  params.set('sync', 'email_verified');
  params.set('ts', Date.now().toString());

  return `${ADS_PORTAL_URL}?${params.toString()}`;
}
