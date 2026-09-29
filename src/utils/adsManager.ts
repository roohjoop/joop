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

export type AdButtonType = 'install' | 'navigate' | 'download' | 'whatsapp';
export type BannerColorTheme = 'auto' | 'red' | 'blue' | 'yellow';

export interface DeveloperBannerAd {
  id: string;
  title: string;
  sponsorName: string;
  mediaType?: 'image' | 'video';
  imageUrl: string;
  videoUrl?: string;
  targetUrl: string;
  buttonType: AdButtonType;
  buttonLabel: string;
  colorTheme?: BannerColorTheme; // 'auto' | 'red' | 'blue' | 'yellow'
  active: boolean;
  expiresAt?: string; // ISO date string
  isUserCampaign?: boolean; // From roohpro.com/AD
  viewsCount?: number;
  clicksCount?: number;
}

export interface InterstitialAdConfig {
  enabled: boolean;
  frequencyInterval: number; // e.g., every 5 ads
  title: string;
  sponsorName: string;
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

/**
 * Checks whether at least 1 minute (60 seconds) has elapsed since the last ad of ANY type.
 * Enforces mutual exclusion: a rewarded ad cannot show right after an interstitial ad,
 * and an interstitial ad cannot show right after a rewarded ad.
 */
export function canShowAnyAd(): boolean {
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
 * 1. Must be enabled from the inside
 * 2. Must have an available valid video URL
 * 3. Must satisfy the 1-minute shared mutual cooldown
 */
export function canShowInterstitialAd(): boolean {
  if (!isInterstitialAdConfiguredAndActive()) return false;
  return canShowAnyAd();
}

/**
 * Checks whether a rewarded ad is allowed to show:
 * 1. Must be enabled from the inside
 * 2. Must have an available valid video URL
 * 3. Must satisfy the 1-minute shared mutual cooldown
 */
export function canShowRewardedAd(): boolean {
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
  if (trimmed === '' || trimmed.includes('ForBiggerBlazes')) return true;
  return false;
}

/**
 * Checks whether the interstitial ad has an available valid video AND is enabled from the inside.
 */
export function isInterstitialAdConfiguredAndActive(state?: DeveloperAdsState): boolean {
  const current = state || getDeveloperAdsState();
  if (!current.platformAdsEnabled) return false;
  if (!current.interstitialAd || !current.interstitialAd.enabled) return false;
  if (isPlaceholderOrEmptyVideo(current.interstitialAd.mediaUrl)) return false;
  return true;
}

/**
 * Checks whether the rewarded ad has an available valid video AND is enabled from the inside.
 */
export function isRewardedAdConfiguredAndActive(state?: DeveloperAdsState): boolean {
  const current = state || getDeveloperAdsState();
  if (!current.platformAdsEnabled) return false;
  if (!current.rewardedAd || !current.rewardedAd.enabled) return false;
  if (isPlaceholderOrEmptyVideo(current.rewardedAd.mediaUrl)) return false;
  return true;
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
 * Add a new custom banner to developer ads
 */
export function addDeveloperBanner(banner: Omit<DeveloperBannerAd, 'id' | 'viewsCount' | 'clicksCount'>): DeveloperBannerAd {
  const current = getDeveloperAdsState();
  const newBanner: DeveloperBannerAd = {
    ...banner,
    id: `banner-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    viewsCount: 0,
    clicksCount: 0
  };
  current.customBanners.unshift(newBanner);
  saveDeveloperAdsState(current);
  return newBanner;
}

/**
 * Delete a custom banner
 */
export function deleteDeveloperBanner(bannerId: string): void {
  const current = getDeveloperAdsState();
  current.customBanners = current.customBanners.filter(b => b.id !== bannerId);
  saveDeveloperAdsState(current);
}

/**
 * Toggle banner active status
 */
export function toggleBannerStatus(bannerId: string, active: boolean): void {
  const current = getDeveloperAdsState();
  const target = current.customBanners.find(b => b.id === bannerId);
  if (target) {
    target.active = active;
    saveDeveloperAdsState(current);
  }
}
