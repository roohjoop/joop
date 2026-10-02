/**
 * Ads Manager for Rooh Pro Jobs Platform
 * 
 * Supports:
 * 1. Banner Ads & AdSense Mode switch
 * 2. Developer Custom Banners (Image, Title, Install/Visit Button, Target URL, Expiry)
 * 3. Smart Interstitial Ads (Triggers every 5 job ads)
 * 4. Rewarded Ads (10s Fullscreen, Triggers on WhatsApp click & Phone Copy, rewards coins)
 * 5. Media storage integration (Cloudflare R2 & Firebase Firestore sync)
 */

import { saveDeveloperBannerToFirestore, deleteDeveloperBannerFromFirestore } from '../firebase/services';

export type AdButtonType = 'install' | 'navigate' | 'download' | 'whatsapp' | 'call';
export type BannerColorTheme = 'auto' | 'red' | 'blue' | 'yellow';

export interface DeveloperBannerAd {
  id: string;
  title: string;
  sponsorName: string;
  mediaType?: 'image' | 'video';
  imageUrl: string;
  videoUrl?: string;
  customIconUrl?: string; // صورة مخصصة للأيقونة التي تظهر
  targetUrl: string; // الرابط الخاص بالمنصة
  phoneNumber?: string; // Contact phone / WhatsApp number for the ad
  whatsappNumber?: string; // رقم الواتساب المباشر
  showWhatsAppIcon?: boolean; // إمكانية إظهار أيقونة واتساب
  buttonType: AdButtonType;
  buttonLabel: string;
  buttonAction?: 'whatsapp' | 'target_url' | 'call' | 'download' | 'install';
  colorTheme?: BannerColorTheme; // 'auto' | 'red' | 'blue' | 'yellow'
  active: boolean;
  isPaused?: boolean; // توقف الحملة يدوياً أو عند بلوغ الحد الأقصى للمشاهدات أو النقرات
  expiresAt?: string; // ISO date string
  isUserCampaign?: boolean; // From roohpro.com/AD
  viewsCount?: number; // عداد المشاهدات
  clicksCount?: number; // عداد النقرات
  maxViewsLimit?: number; // حد أقصى للمشاهدات (مثلاً 1000 أو 2000 ثم يتوقف تلقائياً)
  maxClicksLimit?: number; // حد أقصى للنقرات
  cookieTargeting?: string; // استهداف الكوكيز المجمعة من التطبيق والمنصة الرئيسية
  createdAt?: string;
  videoPlatform?: 'youtube' | 'facebook' | 'tiktok' | 'html5';
}

export interface InterstitialAdConfig {
  enabled: boolean;
  frequencyInterval: number; // e.g., every 5 ads
  title: string;
  sponsorName: string;
  iconUrl?: string; // صورة أيقونة الإعلان المعروضة
  mediaUrl: string;
  mediaType: 'image' | 'video';
  waitForVideoEnd: boolean; // if true, wait until video finishes before allowing close
  autoMute: boolean; // start muted with unmute button
  targetUrl: string;
  buttonType: AdButtonType;
  buttonLabel: string;
  durationSeconds: number; // fallback seconds for image mode
}

export interface RewardedAdConfig {
  enabled: boolean;
  triggerOnWhatsApp: boolean;
  triggerOnCopyPhone: boolean;
  title: string;
  subtitle: string;
  iconUrl?: string; // صورة أيقونة الإعلان المعروضة
  mediaUrl: string;
  mediaType: 'image' | 'video';
  waitForVideoEnd: boolean; // if true, ad must finish video before granting reward
  autoMute: boolean; // start muted with unmute button
  targetUrl: string;
  buttonType: AdButtonType;
  buttonLabel: string;
  countdownSeconds: number; // for static image mode fallback (e.g. 10s)
  rewardCoins: number;
}

export interface AdReportItem {
  id: string;
  adTitle: string;
  adSponsor?: string;
  adType: 'banner' | 'interstitial' | 'rewarded' | 'square';
  reason: string;
  details?: string;
  contactEmailOrPhone?: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface DeveloperAdsState {
  platformAdsEnabled: boolean; // Master switch: if false, platform ads stop completely for external SDKs/AdSense
  bannerAdsEnabled: boolean;
  bannerColorTheme?: BannerColorTheme; // 'auto' (cycles red/blue/yellow) or fixed 'red' | 'blue' | 'yellow'
  adsenseEnabled: boolean;
  adsenseClientId: string;
  adsenseSlotId: string;
  thirdPartySdkEnabled: boolean; // AppBad / AppLovin / AdMob SDK
  thirdPartySdkType: 'appbad' | 'applovin' | 'google_admob';
  thirdPartyAppKey: string;
  customBanners: DeveloperBannerAd[];
  interstitialAd: InterstitialAdConfig;
  rewardedAd: RewardedAdConfig;
  lastUpdated: string;
}

const STORAGE_KEY_ADS_STATE = 'rooh_developer_ads_config';
const STORAGE_KEY_LAST_GLOBAL_AD_TIME = 'rooh_last_global_ad_time';
const STORAGE_KEY_LAST_INTERSTITIAL_TIME = 'rooh_last_interstitial_ad_time';
const STORAGE_KEY_LAST_REWARDED_TIME = 'rooh_last_rewarded_ad_time';
const STORAGE_KEY_AD_REPORTS = 'rooh_ad_reports_list';
export const AD_COOLDOWN_MS = 60 * 1000; // Minimum 1 minute (60 seconds) cooldown between any ad

/**
 * Returns the timestamp of the most recently shown ad across all ad types
 * (interstitial or rewarded).
 */
export function getLastAnyAdTimestamp(): number {
  try {
    const tGlobal = Number(localStorage.getItem(STORAGE_KEY_LAST_GLOBAL_AD_TIME) || 0);
    const tInter = Number(localStorage.getItem(STORAGE_KEY_LAST_INTERSTITIAL_TIME) || 0);
    const tRew = Number(localStorage.getItem(STORAGE_KEY_LAST_REWARDED_TIME) || 0);
    return Math.max(tGlobal, tInter, tRew);
  } catch {
    return 0;
  }
}

let isDeveloperDashboardActiveFlag = false;

/**
 * Sets whether the developer dashboard is currently open/active.
 * While active, all ad runs, timers, popups, and triggers are strictly blocked.
 */
export function setDeveloperDashboardActive(active: boolean): void {
  isDeveloperDashboardActiveFlag = active;
}

/**
 * Returns whether the developer dashboard is currently open/active.
 */
export function isDeveloperDashboardActive(): boolean {
  return isDeveloperDashboardActiveFlag;
}

/**
 * Checks whether at least 1 minute (60 seconds) has elapsed since the last ad of ANY type.
 * Enforces mutual exclusion: a rewarded ad cannot show right after an interstitial ad,
 * and an interstitial ad cannot show right after a rewarded ad.
 */
export function canShowAnyAd(): boolean {
  if (isDeveloperDashboardActiveFlag) return false;
  try {
    const lastShown = getLastAnyAdTimestamp();
    if (!lastShown) return true;
    const elapsed = Date.now() - lastShown;
    return elapsed >= AD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

/**
 * Checks whether an interstitial ad is allowed to show:
 * 1. Must NOT be inside the developer dashboard
 * 2. Must be enabled from the inside
 * 3. Must have an available valid video URL
 * 4. Must satisfy the 1-minute shared mutual cooldown
 */
export function canShowInterstitialAd(): boolean {
  if (isDeveloperDashboardActiveFlag) return false;
  if (!isInterstitialAdConfiguredAndActive()) return false;
  return canShowAnyAd();
}

/**
 * Checks whether a rewarded ad is allowed to show:
 * 1. Must NOT be inside the developer dashboard
 * 2. Must be enabled from the inside
 * 3. Must have an available valid video URL
 * 4. Must satisfy the 1-minute shared mutual cooldown
 */
export function canShowRewardedAd(): boolean {
  if (isDeveloperDashboardActiveFlag) return false;
  if (!isRewardedAdConfiguredAndActive()) return false;
  return canShowAnyAd();
}

/**
 * Marks that an ad has been shown across both global and type-specific timestamps.
 */
export function markAnyAdShown(type: 'interstitial' | 'rewarded' = 'interstitial'): void {
  try {
    const now = Date.now().toString();
    localStorage.setItem(STORAGE_KEY_LAST_GLOBAL_AD_TIME, now);
    if (type === 'interstitial') {
      localStorage.setItem(STORAGE_KEY_LAST_INTERSTITIAL_TIME, now);
    } else {
      localStorage.setItem(STORAGE_KEY_LAST_REWARDED_TIME, now);
    }
  } catch (err) {
    console.error('Failed to mark ad shown timestamp:', err);
  }
}

/**
 * Marks an interstitial ad as just shown, resetting the 1-minute cooldown for all ads.
 */
export function markInterstitialAdShown(): void {
  markAnyAdShown('interstitial');
}

/**
 * Marks a rewarded ad as just shown, resetting the 1-minute cooldown for all ads.
 */
export function markRewardedAdShown(): void {
  markAnyAdShown('rewarded');
}

/**
 * Get remaining cooldown seconds before any new interstitial or rewarded ad is allowed to show.
 */
export function getRemainingAdCooldownSeconds(_type?: 'interstitial' | 'rewarded'): number {
  try {
    const lastShown = getLastAnyAdTimestamp();
    if (!lastShown) return 0;
    const elapsed = Date.now() - lastShown;
    if (elapsed >= AD_COOLDOWN_MS) return 0;
    return Math.ceil((AD_COOLDOWN_MS - elapsed) / 1000);
  } catch {
    return 0;
  }
}

/**
 * Initialize ad cooldown baseline on session start to avoid sudden ads immediately upon opening.
 */
export function initAdCooldownSessionBaseline(): void {
  try {
    const lastShown = getLastAnyAdTimestamp();
    if (!lastShown) {
      // Set session start time so user has at least 1 minute of uninterrupted browsing
      localStorage.setItem(STORAGE_KEY_LAST_GLOBAL_AD_TIME, Date.now().toString());
    }
  } catch (e) {
    console.warn('Ad session init notice:', e);
  }
}

/**
 * Retrieve all ad reports submitted by users
 */
export function getAdReportsList(): AdReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AD_REPORTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save a new ad report
 */
export function recordAdReport(report: Omit<AdReportItem, 'id' | 'createdAt' | 'status'>): AdReportItem {
  const reports = getAdReportsList();
  const newReport: AdReportItem = {
    ...report,
    id: `ADREP-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  reports.unshift(newReport);
  localStorage.setItem(STORAGE_KEY_AD_REPORTS, JSON.stringify(reports));
  window.dispatchEvent(new CustomEvent('rooh_ad_reports_updated', { detail: reports }));
  return newReport;
}

/**
 * Resolve or delete an ad report
 */
export function resolveAdReport(reportId: string): void {
  const reports = getAdReportsList();
  const target = reports.find(r => r.id === reportId);
  if (target) {
    target.status = 'resolved';
    localStorage.setItem(STORAGE_KEY_AD_REPORTS, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('rooh_ad_reports_updated', { detail: reports }));
  }
}

export function deleteAdReport(reportId: string): void {
  const reports = getAdReportsList().filter(r => r.id !== reportId);
  localStorage.setItem(STORAGE_KEY_AD_REPORTS, JSON.stringify(reports));
  window.dispatchEvent(new CustomEvent('rooh_ad_reports_updated', { detail: reports }));
}

export const DEFAULT_ADS_STATE: DeveloperAdsState = {
  platformAdsEnabled: true,
  bannerAdsEnabled: true,
  bannerColorTheme: 'auto',
  adsenseEnabled: false,
  adsenseClientId: 'ca-pub-ROOHPRO777888999',
  adsenseSlotId: '1234567890',
  thirdPartySdkEnabled: false,
  thirdPartySdkType: 'appbad',
  thirdPartyAppKey: 'appbad_sdk_live_key_994102',
  customBanners: [
    {
      id: 'banner-official-blue-1',
      title: 'حمّل تطبيق "شغل وتقنية" الرسمي للهاتف واستمتع بسرعة فائقة',
      sponsorName: 'منصة Rooh Pro للتوظيف الذكي',
      mediaType: 'video',
      imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80',
      videoUrl: '',
      targetUrl: 'https://roohpro.com/app-download',
      buttonType: 'download',
      buttonLabel: 'تحميل الآن',
      colorTheme: 'blue',
      active: true,
      expiresAt: '2026-12-31',
      viewsCount: 2450,
      clicksCount: 180
    },
    {
      id: 'banner-official-red-2',
      title: 'أنشئ حملتك الإعلانية المعتمدة بأسعار رمزية عبر شبكة Rooh AD',
      sponsorName: 'شبكة إعلانات Rooh AD الرسمية',
      mediaType: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      targetUrl: 'https://roohpro.com/AD',
      buttonType: 'install',
      buttonLabel: 'تثبيت الآن',
      colorTheme: 'red',
      active: true,
      expiresAt: '2026-12-31',
      viewsCount: 1240,
      clicksCount: 88
    },
    {
      id: 'banner-official-yellow-3',
      title: 'باقات أصحاب الأعمال: وظّف أمهر الكفاءات والصنايعية المعتمدين فوراً',
      sponsorName: 'خدمات التوظيف المباشر Rooh Gold',
      mediaType: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
      targetUrl: 'https://roohpro.com/AD',
      buttonType: 'navigate',
      buttonLabel: 'انتقل الآن',
      colorTheme: 'yellow',
      active: true,
      expiresAt: '2026-12-31',
      viewsCount: 980,
      clicksCount: 74
    }
  ],
  interstitialAd: {
    enabled: false, // Must be explicitly enabled from the inside and require a valid video
    frequencyInterval: 5, // Triggers after 1 min cooldown
    title: 'فرصة حصرية: انضم لأكبر شبكة مهنية معتمدة وحقق دخل إضافي',
    sponsorName: 'منصة شغل وتقنية Rooh Pro',
    iconUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
    mediaUrl: '', // No ad video by default: ads will NOT run currently until valid video is provided
    mediaType: 'video',
    waitForVideoEnd: true,
    autoMute: true,
    targetUrl: 'https://roohpro.com/AD',
    buttonType: 'install',
    buttonLabel: 'تثبيت التطبيق الآن',
    durationSeconds: 5
  },
  rewardedAd: {
    enabled: false, // Must be explicitly enabled from the inside and require a valid video
    triggerOnWhatsApp: true,
    triggerOnCopyPhone: true,
    title: 'إعلان مكافأة فيديو: شاهد حتى نهاية الفيديو واحصل على كوينات فورية',
    subtitle: 'شاهد العرض الترويجي صامتاً مع إمكانية تشغيل الصوت لتوثيق التواصل وفتح الرقم المباشر',
    iconUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&auto=format&fit=crop&q=80',
    mediaUrl: '', // No ad video by default: ads will NOT run currently until valid video is provided
    mediaType: 'video',
    waitForVideoEnd: true,
    autoMute: true,
    targetUrl: 'https://roohpro.com/AD',
    buttonType: 'install',
    buttonLabel: 'تثبيت العرض الترويجي',
    countdownSeconds: 10,
    rewardCoins: 5
  },
  lastUpdated: '2026-09-29T12:00:00.000Z'
};

/**
 * Helper to check if a media URL is just an empty or placeholder video
 */
export function isPlaceholderOrEmptyVideo(url?: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.length < 5 || trimmed.includes('ForBiggerBlazes')) return true;
  return false;
}

/**
 * Helper to validate if a string is a valid non-empty media/icon URL or path
 */
export function isValidMediaUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 5) return false;
  if (trimmed.includes('ForBiggerBlazes')) return false; // Known placeholder
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:')
  );
}

/**
 * Validates the three mandatory requirements for Rewarded & Interstitial Ads:
 * 1. وجود فيديو يعمل بالفعل أو صورة تعمل (Valid, working mediaUrl)
 * 2. وجود صورة أيقونة الإعلان (Valid, working iconUrl)
 * 3. العنوان يكون صحيح (Valid title with real content)
 */
export function validateAdRequirements(ad?: {
  title?: string;
  mediaUrl?: string;
  iconUrl?: string;
  mediaType?: 'image' | 'video';
  enabled?: boolean;
}): { isValid: boolean; reason?: string } {
  if (!ad) return { isValid: false, reason: 'الإعلان غير موجود' };
  if (!ad.enabled) return { isValid: false, reason: 'الإعلان معطل من الداخل' };

  // Condition 1: العنوان يكون صحيح (Title must be valid and at least 3 characters)
  if (!ad.title || ad.title.trim().length < 3) {
    return { isValid: false, reason: 'عنوان الإعلان غير صحيح أو فارغ' };
  }

  // Condition 2: وجود فيديو يعمل بالفعل أو صورة تعمل (Media URL must be valid and non-empty)
  if (!isValidMediaUrl(ad.mediaUrl)) {
    return { isValid: false, reason: 'رابط فيديو أو وسائط الإعلان غير صالح أو غير موجود' };
  }

  // Condition 3: وجود صورة أيقونة الإعلان (Ad icon image must be valid and non-empty)
  const icon = ad.iconUrl || '';
  if (!isValidMediaUrl(icon)) {
    return { isValid: false, reason: 'صورة أيقونة الإعلان غير متوفرة أو غير صالحة' };
  }

  return { isValid: true };
}

/**
 * Checks whether the interstitial ad has an available valid video AND icon AND title, AND is enabled.
 */
export function isInterstitialAdConfiguredAndActive(state?: DeveloperAdsState): boolean {
  if (isDeveloperDashboardActiveFlag) return false;
  const current = state || getDeveloperAdsState();
  if (!current.platformAdsEnabled) return false;
  if (!current.interstitialAd || !current.interstitialAd.enabled) return false;
  const validation = validateAdRequirements(current.interstitialAd);
  return validation.isValid;
}

/**
 * Checks whether the rewarded ad has an available valid video AND icon AND title, AND is enabled.
 */
export function isRewardedAdConfiguredAndActive(state?: DeveloperAdsState): boolean {
  if (isDeveloperDashboardActiveFlag) return false;
  const current = state || getDeveloperAdsState();
  if (!current.platformAdsEnabled) return false;
  if (!current.rewardedAd || !current.rewardedAd.enabled) return false;
  const validation = validateAdRequirements(current.rewardedAd);
  return validation.isValid;
}

/**
 * Retrieve current ads state from storage
 */
export function getDeveloperAdsState(): DeveloperAdsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADS_STATE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADS_STATE, JSON.stringify(DEFAULT_ADS_STATE));
      return DEFAULT_ADS_STATE;
    }
    const parsed = JSON.parse(raw);
    const merged: DeveloperAdsState = {
      ...DEFAULT_ADS_STATE,
      ...parsed,
      interstitialAd: { ...DEFAULT_ADS_STATE.interstitialAd, ...(parsed.interstitialAd || {}) },
      rewardedAd: { ...DEFAULT_ADS_STATE.rewardedAd, ...(parsed.rewardedAd || {}) }
    };

    // Ensure valid iconUrl is present
    if (!merged.interstitialAd.iconUrl || !isValidMediaUrl(merged.interstitialAd.iconUrl)) {
      merged.interstitialAd.iconUrl = DEFAULT_ADS_STATE.interstitialAd.iconUrl;
    }
    if (!merged.rewardedAd.iconUrl || !isValidMediaUrl(merged.rewardedAd.iconUrl)) {
      merged.rewardedAd.iconUrl = DEFAULT_ADS_STATE.rewardedAd.iconUrl;
    }

    // Clean up any legacy placeholder videos from prior sessions so ads do NOT run currently
    let modified = false;
    if (isPlaceholderOrEmptyVideo(merged.interstitialAd.mediaUrl)) {
      merged.interstitialAd.mediaUrl = '';
      merged.interstitialAd.enabled = false;
      modified = true;
    }
    if (isPlaceholderOrEmptyVideo(merged.rewardedAd.mediaUrl)) {
      merged.rewardedAd.mediaUrl = '';
      merged.rewardedAd.enabled = false;
      modified = true;
    }

    if (modified) {
      localStorage.setItem(STORAGE_KEY_ADS_STATE, JSON.stringify(merged));
    }

    return merged;
  } catch {
    return DEFAULT_ADS_STATE;
  }
}

/**
 * Save updated ads state and broadcast change
 */
export function saveDeveloperAdsState(newState: DeveloperAdsState): void {
  try {
    const updated = {
      ...newState,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_ADS_STATE, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rooh_ads_config_changed', { detail: updated }));
  } catch (err) {
    console.error('Failed to save ads state:', err);
  }
}

/**
 * Add a new custom banner to developer ads and sync with Firebase Firestore
 */
export function addDeveloperBanner(banner: Omit<DeveloperBannerAd, 'id' | 'viewsCount' | 'clicksCount'>): DeveloperBannerAd {
  const current = getDeveloperAdsState();
  const newBanner: DeveloperBannerAd = {
    ...banner,
    id: `banner-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  };
  current.customBanners.unshift(newBanner);
  saveDeveloperAdsState(current);

  // Synchronize to Firebase Firestore
  saveDeveloperBannerToFirestore(newBanner).catch(err => {
    console.warn('[Firebase Firestore] Banner save notice:', err);
  });

  return newBanner;
}

/**
 * Delete a custom banner and remove from Firebase Firestore
 */
export function deleteDeveloperBanner(bannerId: string): void {
  const current = getDeveloperAdsState();
  current.customBanners = current.customBanners.filter(b => b.id !== bannerId);
  saveDeveloperAdsState(current);

  // Delete from Firebase Firestore
  deleteDeveloperBannerFromFirestore(bannerId).catch(err => {
    console.warn('[Firebase Firestore] Banner delete notice:', err);
  });
}

/**
 * Toggle banner active status and sync with Firebase Firestore
 */
export function toggleBannerStatus(bannerId: string, active: boolean): void {
  const current = getDeveloperAdsState();
  const target = current.customBanners.find(b => b.id === bannerId);
  if (target) {
    target.active = active;
    saveDeveloperAdsState(current);

    saveDeveloperBannerToFirestore(target).catch(err => {
      console.warn('[Firebase Firestore] Banner status update notice:', err);
    });
  }
}

/**
 * Merge remote banners retrieved from Firebase Firestore with local state
 */
export function mergeFirestoreBanners(remoteBanners: DeveloperBannerAd[]): void {
  if (!remoteBanners || remoteBanners.length === 0) return;
  const current = getDeveloperAdsState();
  const map = new Map<string, DeveloperBannerAd>();
  // Prioritize remote Firestore banners
  remoteBanners.forEach(b => map.set(b.id, b));
  // Keep local custom banners if any exist
  current.customBanners.forEach(b => {
    if (!map.has(b.id)) {
      map.set(b.id, b);
    }
  });
  current.customBanners = Array.from(map.values());
  saveDeveloperAdsState(current);
}

/**
 * Checks whether an ad is eligible to show:
 * 1. Must be active
 * 2. Must not be paused
 * 3. Must not have exceeded maxViewsLimit
 * 4. Must not have exceeded maxClicksLimit
 */
export function isAdEligibleToShow(ad: DeveloperBannerAd): boolean {
  if (!ad || !ad.active) return false;
  if (ad.isPaused) return false;
  if (ad.maxViewsLimit !== undefined && ad.maxViewsLimit > 0 && (ad.viewsCount || 0) >= ad.maxViewsLimit) {
    return false;
  }
  if (ad.maxClicksLimit !== undefined && ad.maxClicksLimit > 0 && (ad.clicksCount || 0) >= ad.maxClicksLimit) {
    return false;
  }
  return true;
}

/**
 * Increments the views count for an ad. If it reaches maxViewsLimit, it auto-pauses
 * and synchronizes with Firebase Firestore.
 */
export function recordAdView(adId: string): void {
  try {
    const current = getDeveloperAdsState();
    const target = current.customBanners.find(b => b.id === adId);
    if (!target) return;

    target.viewsCount = (target.viewsCount || 0) + 1;

    // Check if views limit cap reached
    if (target.maxViewsLimit !== undefined && target.maxViewsLimit > 0 && target.viewsCount >= target.maxViewsLimit) {
      target.isPaused = true;
      target.active = false;
      console.log(`[Ad Capping] Ad "${target.title}" reached max views limit (${target.maxViewsLimit}). Auto-paused.`);
    }

    saveDeveloperAdsState(current);
    saveDeveloperBannerToFirestore(target).catch(e => console.warn('Firestore ad view sync notice:', e));
  } catch (err) {
    console.warn('recordAdView notice:', err);
  }
}

/**
 * Increments the clicks count for an ad. If it reaches maxClicksLimit, it auto-pauses
 * and synchronizes with Firebase Firestore.
 */
export function recordAdClick(adId: string): void {
  try {
    const current = getDeveloperAdsState();
    const target = current.customBanners.find(b => b.id === adId);
    if (!target) return;

    target.clicksCount = (target.clicksCount || 0) + 1;

    // Check if clicks limit cap reached
    if (target.maxClicksLimit !== undefined && target.maxClicksLimit > 0 && target.clicksCount >= target.maxClicksLimit) {
      target.isPaused = true;
      target.active = false;
      console.log(`[Ad Capping] Ad "${target.title}" reached max clicks limit (${target.maxClicksLimit}). Auto-paused.`);
    }

    saveDeveloperAdsState(current);
    saveDeveloperBannerToFirestore(target).catch(e => console.warn('Firestore ad click sync notice:', e));
  } catch (err) {
    console.warn('recordAdClick notice:', err);
  }
}

/**
 * Updates campaign limits or resume/pause state for a specific ad
 */
export function updateAdLimits(
  adId: string, 
  updates: { 
    maxViewsLimit?: number; 
    maxClicksLimit?: number; 
    isPaused?: boolean;
    active?: boolean;
    title?: string;
    videoUrl?: string;
    targetUrl?: string;
    whatsappNumber?: string;
  }
): void {
  const current = getDeveloperAdsState();
  const target = current.customBanners.find(b => b.id === adId);
  if (!target) return;

  if (updates.maxViewsLimit !== undefined) target.maxViewsLimit = updates.maxViewsLimit;
  if (updates.maxClicksLimit !== undefined) target.maxClicksLimit = updates.maxClicksLimit;
  if (updates.isPaused !== undefined) target.isPaused = updates.isPaused;
  if (updates.active !== undefined) target.active = updates.active;
  if (updates.title !== undefined) target.title = updates.title;
  if (updates.videoUrl !== undefined) target.videoUrl = updates.videoUrl;
  if (updates.targetUrl !== undefined) target.targetUrl = updates.targetUrl;
  if (updates.whatsappNumber !== undefined) target.whatsappNumber = updates.whatsappNumber;

  // If user increased max limits beyond current counts and unpaused, reactivate
  if (
    !target.isPaused && 
    (!target.maxViewsLimit || (target.viewsCount || 0) < target.maxViewsLimit) &&
    (!target.maxClicksLimit || (target.clicksCount || 0) < target.maxClicksLimit)
  ) {
    target.active = true;
  }

  saveDeveloperAdsState(current);
  saveDeveloperBannerToFirestore(target).catch(e => console.warn('Firestore ad limits update notice:', e));
}

/**
 * Resets views and clicks stats for an ad to restart its campaign
 */
export function resetAdStats(adId: string): void {
  const current = getDeveloperAdsState();
  const target = current.customBanners.find(b => b.id === adId);
  if (!target) return;

  target.viewsCount = 0;
  target.clicksCount = 0;
  target.isPaused = false;
  target.active = true;

  saveDeveloperAdsState(current);
  saveDeveloperBannerToFirestore(target).catch(e => console.warn('Firestore ad reset notice:', e));
}

/**
 * Reads targeting cookies and user preferences collected from the application and main platform
 */
export function getPlatformTargetingCookies(): {
  platformCookie: string;
  interests: string[];
  city?: string;
  role?: string;
} {
  try {
    let cookieVal = '';
    const cookieMatch = document.cookie.match(/rooh_ad_target=([^;]+)/);
    if (cookieMatch) {
      cookieVal = decodeURIComponent(cookieMatch[1]);
    } else {
      cookieVal = localStorage.getItem('rooh_ad_target') || 'roohpro_main_ecosystem';
    }

    const savedRole = localStorage.getItem('shoghl_active_email') ? 'registered' : 'guest';
    const lastCategory = localStorage.getItem('shoghl_last_category') || 'عام';

    return {
      platformCookie: cookieVal,
      interests: [lastCategory, 'وظائف', 'خدمات', 'roohpro.com/ad'],
      role: savedRole
    };
  } catch {
    return {
      platformCookie: 'roohpro_main_ecosystem',
      interests: ['roohpro.com/ad']
    };
  }
}

/**
 * Saves targeting cookies for the main ecosystem
 */
export function setPlatformCookie(tag: string): void {
  try {
    localStorage.setItem('rooh_ad_target', tag);
    document.cookie = `rooh_ad_target=${encodeURIComponent(tag)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    console.warn('Cookie write notice:', e);
  }
}

