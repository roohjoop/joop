import React, { useState, useEffect, useRef } from 'react';
import { Download, ExternalLink, X, ShieldAlert, ChevronDown, ChevronUp, Play, Volume2, VolumeX, Phone, MessageCircle } from 'lucide-react';
import { getDeveloperAdsState, DeveloperAdsState, DeveloperBannerAd, isAdEligibleToShow, recordAdView, recordAdClick } from '../utils/adsManager';
import { subscribeToDeveloperBanners } from '../firebase/services';
import { AdReportModal } from './AdReportModal';
import { AdVideoPlayer } from './AdVideoPlayer';

interface TopBannerAdProps {
  onAdClick?: (ad: any) => void;
}

type ConcreteColorTheme = 'red' | 'blue' | 'yellow';

interface ThemeStyles {
  containerBg: string;
  borderColor: string;
  titleClass: string;
  sponsorClass: string;
  imageBorder: string;
  videoTag: string;
  ctaButton: string;
  ctaIconColor: string;
  videoBtnActive: string;
  videoBtnInactive: string;
  videoArrowIcon: string;
  reportBtn: string;
  reportIcon: string;
  closeBtn: string;
  divider: string;
}

const THEME_STYLES: Record<ConcreteColorTheme, ThemeStyles> = {
  red: {
    containerBg: 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-700',
    borderColor: 'border-rose-400/50',
    titleClass: 'text-white font-black drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] group-hover:text-amber-200 transition-colors',
    sponsorClass: 'text-amber-200 font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]',
    imageBorder: 'border-white/90 shadow-md',
    videoTag: 'bg-black/40 text-amber-300 border-amber-300/40',
    ctaButton: 'bg-white text-slate-950 hover:bg-amber-100 border-white/60 shadow-sm font-black',
    ctaIconColor: 'text-red-600',
    videoBtnActive: 'bg-amber-400 text-slate-950 border-amber-300 shadow-md',
    videoBtnInactive: 'bg-black/35 hover:bg-black/60 text-amber-300 hover:text-white border-amber-400/40',
    videoArrowIcon: 'text-amber-300',
    reportBtn: 'bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white border-white/20',
    reportIcon: 'text-amber-300',
    closeBtn: 'text-white/80 hover:text-white hover:bg-black/30',
    divider: 'border-white/25',
  },
  blue: {
    containerBg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700',
    borderColor: 'border-sky-400/50',
    titleClass: 'text-white font-black drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] group-hover:text-cyan-200 transition-colors',
    sponsorClass: 'text-sky-200 font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]',
    imageBorder: 'border-white/90 shadow-md',
    videoTag: 'bg-black/40 text-sky-300 border-sky-300/40',
    ctaButton: 'bg-white text-blue-950 hover:bg-sky-50 border-white/60 shadow-sm font-black',
    ctaIconColor: 'text-blue-600',
    videoBtnActive: 'bg-sky-400 text-blue-950 border-sky-300 shadow-md',
    videoBtnInactive: 'bg-black/35 hover:bg-black/60 text-sky-300 hover:text-white border-sky-400/40',
    videoArrowIcon: 'text-sky-300',
    reportBtn: 'bg-black/30 hover:bg-black/50 text-sky-200 hover:text-white border-white/20',
    reportIcon: 'text-sky-300',
    closeBtn: 'text-white/80 hover:text-white hover:bg-black/30',
    divider: 'border-white/25',
  },
  yellow: {
    containerBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
    borderColor: 'border-amber-600/50',
    titleClass: 'text-slate-950 font-black drop-shadow-[0_1px_0px_rgba(255,255,255,0.8)] group-hover:text-black transition-colors',
    sponsorClass: 'text-amber-950 font-black drop-shadow-none',
    imageBorder: 'border-slate-950/70 shadow-md',
    videoTag: 'bg-slate-950 text-yellow-300 border-slate-950 font-black',
    ctaButton: 'bg-slate-950 text-white hover:bg-slate-800 border-slate-900 shadow-md font-black',
    ctaIconColor: 'text-yellow-400',
    videoBtnActive: 'bg-slate-950 text-yellow-300 border-slate-900 shadow-md',
    videoBtnInactive: 'bg-slate-950/85 hover:bg-slate-950 text-yellow-300 hover:text-white border-slate-900',
    videoArrowIcon: 'text-yellow-300',
    reportBtn: 'bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 hover:text-black border-slate-950/30',
    reportIcon: 'text-slate-950',
    closeBtn: 'text-slate-900 hover:text-black hover:bg-slate-950/15',
    divider: 'border-slate-950/30',
  }
};

const COLOR_CYCLE_LIST: ConcreteColorTheme[] = ['red', 'blue', 'yellow'];

/**
 * Strictly rotate every 15 seconds (15000ms), NOT less!
 */
export const TOP_BANNER_ROTATION_INTERVAL_MS = 15000;

/**
 * Checks if a given media URL is a YouTube video URL
 */
export function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be/.test(url);
}

/**
 * Resolves any YouTube URL (watch, shorts, youtu.be, embed) into an embeddable iframe URL
 */
export function getYouTubeEmbedUrl(url: string, muted: boolean = true): string {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
  } else if (url.includes('youtube.com/watch')) {
    const match = url.match(/[?&]v=([^&#]+)/);
    videoId = match ? match[1] : '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1]?.split(/[?&#]/)[0] || '';
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('youtube.com/shorts/')[1]?.split(/[?&#]/)[0] || '';
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
  }
  return url;
}

/**
 * Normalizes button label to concise text (e.g. 'تحميل الآن', 'تثبيت الآن', 'انتقل الآن')
 * to guarantee optimal spacing and avoid encroaching upon the title.
 */
function getCompactButtonLabel(banner: DeveloperBannerAd): string {
  const raw = (banner.buttonLabel || '').trim();
  if (
    raw === 'تحميل التطبيق الآن' ||
    raw === 'تحميل التطبيق' ||
    raw === 'تحميل' ||
    banner.buttonType === 'download'
  ) {
    return 'تحميل الآن';
  }
  if (
    raw === 'تثبيت التطبيق الآن' ||
    raw === 'تثبيت التطبيق' ||
    raw === 'تثبيت العرض' ||
    raw === 'تثبيت' ||
    banner.buttonType === 'install'
  ) {
    return 'تثبيت الآن';
  }
  if (
    raw === 'استكشاف الباقات' ||
    raw === 'استكشف الباقات' ||
    raw === 'انتقال' ||
    raw === 'انتقال الآن' ||
    banner.buttonType === 'navigate'
  ) {
    return 'انتقل الآن';
  }
  return raw || 'انتقل الآن';
}

export const TopBannerAd: React.FC<TopBannerAdProps> = ({ onAdClick }) => {
  const [adsState, setAdsState] = useState<DeveloperAdsState>(() => getDeveloperAdsState());
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [colorCycleIndex, setColorCycleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending re-open timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Listen to developer ads configuration updates in realtime
  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setAdsState(e.detail);
      } else {
        setAdsState(getDeveloperAdsState());
      }
    };

    window.addEventListener('rooh_ads_config_changed', handleConfigChange);

    // Real-time synchronization from Firebase Firestore
    const unsubscribeBanners = subscribeToDeveloperBanners((remoteBanners) => {
      if (remoteBanners && remoteBanners.length > 0) {
        setAdsState(prev => {
          const updated = { ...prev, customBanners: remoteBanners };
          localStorage.setItem('rooh_developer_ads_config', JSON.stringify(updated));
          return updated;
        });
      }
    });

    return () => {
      window.removeEventListener('rooh_ads_config_changed', handleConfigChange);
      if (typeof unsubscribeBanners === 'function') unsubscribeBanners();
    };
  }, []);

  // Filter active and non-capped banners using isAdEligibleToShow
  const activeBanners = (adsState.customBanners || []).filter(isAdEligibleToShow);

  // Record ad view whenever the displayed ad changes
  const currentBanner: DeveloperBannerAd | undefined = activeBanners[currentAdIndex] || activeBanners[0];
  useEffect(() => {
    if (currentBanner?.id) {
      recordAdView(currentBanner.id);
    }
  }, [currentBanner?.id]);

  // Close banner handler: Hides current banner and shows a DIFFERENT ad after exactly 3 seconds
  const handleCloseBanner = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Hide current banner and reset expanded video immediately
    setIsVisible(false);
    setIsVideoExpanded(false);

    // Clear any previous timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    // After strictly 3 seconds (3000ms), rotate to a DIFFERENT ad and re-show
    closeTimeoutRef.current = setTimeout(() => {
      setCurrentAdIndex((prevIndex) => {
        const count = activeBanners.length;
        if (count <= 1) return prevIndex;
        return (prevIndex + 1) % count;
      });
      setColorCycleIndex((prev) => (prev + 1) % COLOR_CYCLE_LIST.length);
      setIsVisible(true);
    }, 3000);
  };

  // Rotate banner ads & rotate color themes smoothly (Red -> Blue -> Yellow) ONLY when video is not expanded
  useEffect(() => {
    if (isVideoExpanded) return;

    const timer = setInterval(() => {
      if (activeBanners.length > 1) {
        setCurrentAdIndex((prev) => (prev + 1) % activeBanners.length);
      }
      setColorCycleIndex((prev) => (prev + 1) % COLOR_CYCLE_LIST.length);
    }, TOP_BANNER_ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeBanners.length, isVideoExpanded]);

  if (!isVisible) return null;

  // 1. If all ads are disabled by developer or platform ads disabled
  if (!adsState.platformAdsEnabled && !adsState.adsenseEnabled) {
    return null;
  }

  if (!adsState.bannerAdsEnabled && !adsState.adsenseEnabled) {
    return null;
  }

  // 2. Google AdSense Official Mode
  if (adsState.adsenseEnabled) {
    return (
      <div 
        className="w-full h-[74px] sm:h-[90px] min-h-[74px] sm:min-h-[90px] shrink-0 bg-slate-900 border-b border-slate-800 text-white shadow-md relative overflow-hidden select-none flex items-center justify-between px-3 z-30"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md border border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-mono tracking-wider">
            AD
          </span>
          <span className="text-xs text-slate-300 font-medium">
            مساحة إعلانية معتمدة من جوجل أدسنس
          </span>
        </div>

        <div className="flex-1 max-w-md mx-4 h-full flex items-center justify-center">
          <ins 
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '100%', height: '50px' }}
            data-ad-client={adsState.adsenseClientId || 'ca-pub-ROOHPRO777888999'}
            data-ad-slot={adsState.adsenseSlotId || '1234567890'}
          />
        </div>

        <button
          onClick={handleCloseBanner}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="إغلاق الإعلان"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 3. Custom Developer Banners Mode
  if (!currentBanner) return null;

  // Determine current active theme (Red, Blue, Yellow)
  let activeThemeKey: ConcreteColorTheme = COLOR_CYCLE_LIST[colorCycleIndex % COLOR_CYCLE_LIST.length];

  if (adsState.bannerColorTheme && adsState.bannerColorTheme !== 'auto') {
    activeThemeKey = adsState.bannerColorTheme as ConcreteColorTheme;
  } else if (currentBanner.colorTheme && currentBanner.colorTheme !== 'auto') {
    activeThemeKey = currentBanner.colorTheme as ConcreteColorTheme;
  }

  const theme = THEME_STYLES[activeThemeKey] || THEME_STYLES.red;
  const compactLabel = getCompactButtonLabel(currentBanner);

  // Check if banner has an associated video
  const hasVideo = true;
  const rawVideoUrl = currentBanner.videoUrl || (currentBanner.mediaType === 'video' ? currentBanner.imageUrl : '') || 'https://www.youtube.com/watch?v=ScMzIvxBSi4';
  const isYoutube = isYouTubeUrl(rawVideoUrl);
  const resolvedYouTubeEmbed = isYoutube ? getYouTubeEmbedUrl(rawVideoUrl, isMuted) : '';

  const handleBannerClick = () => {
    if (currentBanner?.id) {
      recordAdClick(currentBanner.id);
    }
    if (onAdClick) {
      onAdClick(currentBanner);
    } else if (currentBanner.buttonAction === 'whatsapp' || currentBanner.buttonType === 'whatsapp' || currentBanner.whatsappNumber || currentBanner.phoneNumber) {
      const num = currentBanner.whatsappNumber || currentBanner.phoneNumber || '';
      const cleanPhone = num.replace(/[^\d+]/g, '');
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}`, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    if (currentBanner.targetUrl) {
      window.open(currentBanner.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* 
        CONDITIONAL RENDER: 
        1. When isVideoExpanded is true:
           - On Desktop: Video player (350px width, YouTube 16:9) displays horizontally BESIDE the window elements.
           - On Mobile: Video player (350px width, YouTube 16:9) is at the top, and icon & info are shifted DOWN below it.
        2. When isVideoExpanded is false:
           - Compact standard 90px banner (74px on mobile) with 80x80 image and down arrow.
      */}
      {isVideoExpanded && hasVideo ? (
        <div 
          onClick={handleBannerClick}
          className={`w-full ${theme.containerBg} ${theme.borderColor} shadow-xl relative overflow-hidden select-none border-b transition-all duration-500 z-30 cursor-pointer animate-in fade-in slide-in-from-top-2`}
          dir="rtl"
        >
          {/* Subtle shine animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3.5s_infinite] pointer-events-none" />

          {/* DESKTOP BROWSER VIEW (md: and up): 3-Column Grid with Centered Video, 2-line Title, and CTA beside Collapse Arrow */}
          <div className="hidden md:grid md:grid-cols-[1fr_350px_1fr] items-center px-4 pt-[3px] pb-[3px] gap-4 w-full h-[203px] min-h-[203px] max-h-[203px]">
            
            {/* Right: Ad Window Card (Square 197x197 Image + Title in 2 Stacked Lines) */}
            <div className="flex items-center gap-3 min-w-0 justify-start h-[197px]">
              {/* Scaled Square Image: 3px from top & 3px from bottom */}
              <div className={`w-[197px] h-[197px] min-w-[197px] min-h-[197px] aspect-square rounded-2xl overflow-hidden border-2 ${theme.imageBorder} shrink-0 bg-slate-900 shadow-xl relative`}>
                <img 
                  src={currentBanner.customIconUrl || currentBanner.imageUrl || '/icon.svg'} 
                  alt={currentBanner.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title displayed in two stacked lines (صفين فوق بعض) */}
              <div className="min-w-0 max-w-[250px] flex flex-col justify-center py-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="px-2 py-0.5 text-[9.5px] font-mono font-black rounded-md bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 border border-yellow-300 shadow-xs">
                    AD
                  </span>
                  <span className={`text-xs font-black truncate ${theme.sponsorClass}`}>
                    {currentBanner.sponsorName}
                  </span>
                </div>
                {/* العنوان في صفين فوق بعض */}
                <h3 className={`text-sm lg:text-[15px] font-black leading-snug line-clamp-2 ${theme.titleClass}`}>
                  {currentBanner.title}
                </h3>
                <span className="text-[11px] font-medium text-white/70 mt-1.5 truncate">
                  منصة شغل وتقنية • إعلان معتمد
                </span>
              </div>
            </div>

            {/* Center: Video placed in the exact top-center of the banner (أعلى المنتصف) */}
            <div className="flex items-center justify-center">
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-[350px] min-w-[350px] max-w-[350px] aspect-video h-[197px] rounded-xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl relative flex items-center justify-center shrink-0"
              >
                <AdVideoPlayer
                  videoUrl={rawVideoUrl}
                  posterImage={currentBanner.imageUrl}
                  title={currentBanner.title}
                  isMuted={isMuted}
                  autoPlay={true}
                  className="w-full h-full"
                  aspectRatio="video"
                />
              </div>
            </div>

            {/* Left: Actions (Download / Link Button, Direct Phone / WhatsApp button, Report, AD badge, Close X) */}
            <div className="flex items-center justify-end gap-2.5 h-[197px]">
              {/* Optional Direct Contact Phone / WhatsApp button */}
              {currentBanner.phoneNumber && (
                <a
                  href={`https://wa.me/${currentBanner.phoneNumber.replace(/[^\d+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0 border border-emerald-400"
                  title={`تواصل مع المعلن: ${currentBanner.phoneNumber}`}
                >
                  <MessageCircle className="w-4 h-4 text-emerald-100" />
                  <span className="whitespace-nowrap">واتساب / هاتف</span>
                </a>
              )}

              {/* زر التحميل أو الانتقال للرابط المستهدف */}
              <button
                type="button"
                onClick={handleBannerClick}
                className={`${theme.ctaButton} px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md font-black shrink-0`}
                title={compactLabel}
              >
                {currentBanner.buttonType === 'install' || currentBanner.buttonType === 'download' ? (
                  <Download className={`w-4 h-4 ${theme.ctaIconColor} stroke-[2.5]`} />
                ) : (
                  <ExternalLink className={`w-4 h-4 ${theme.ctaIconColor} stroke-[2.5]`} />
                )}
                <span className="font-black whitespace-nowrap">{compactLabel}</span>
              </button>

              {/* عمود: علامة الإبلاغ في الأعلى وأسفلها سهم رفع وطَي الفيديو */}
              <div className="flex flex-col items-center justify-between h-[120px] py-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReportOpen(true);
                  }}
                  className={`p-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer border ${theme.reportBtn} shadow-xs`}
                  title="إبلاغ الدعم الفني عن هذا الإعلان"
                >
                  <ShieldAlert className={`w-4 h-4 ${theme.reportIcon}`} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVideoExpanded(false);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border shadow-md ${theme.videoBtnActive}`}
                  title="رفع الفيديو وإخفاؤه للأعلى"
                >
                  <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* عمود: شارة AD في الأعلى وأسفلها زر إغلاق الإعلان X */}
              <div className={`flex flex-col items-center justify-between h-[120px] py-1 border-r ${theme.divider} pr-2`}>
                <span className="px-2 py-1 text-[10px] rounded-lg font-mono font-black shadow-[0_0_8px_rgba(250,204,21,0.6)] tracking-wider leading-none select-none text-center bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 border border-yellow-300">
                  AD
                </span>
                <button
                  type="button"
                  onClick={handleCloseBanner}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme.closeBtn}`}
                  title="إغلاق الإعلان"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>

          {/* MOBILE VIEW (<md): Video 350px at TOP, and Icon / Window shifted DOWN */}
          <div className="md:hidden flex flex-col items-center w-full p-2 gap-2">
            
            {/* Top: 350px Professional Video Player (YouTube / Facebook / TikTok / MP4) */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-[350px] max-w-[350px] aspect-video rounded-xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl relative flex items-center justify-center mx-auto shrink-0"
            >
              <AdVideoPlayer
                videoUrl={rawVideoUrl}
                posterImage={currentBanner.imageUrl}
                title={currentBanner.title}
                isMuted={isMuted}
                autoPlay={true}
                className="w-full h-full"
                aspectRatio="video"
              />
            </div>

            {/* Bottom Bar: Icon and Window Info shifted DOWN below the 350px video */}
            <div className="w-full max-w-[350px] flex items-center justify-between gap-1.5 px-0.5">
              
              {/* Right: Ad icon (shifted down) + Title & Sponsor */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-[48px] h-[48px] min-w-[48px] min-h-[48px] rounded-lg overflow-hidden border-2 ${theme.imageBorder} shrink-0 bg-slate-900 shadow-sm relative`}>
                  <img 
                    src={currentBanner.imageUrl || '/icon.svg'} 
                    alt={currentBanner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-black leading-tight truncate ${theme.titleClass}`}>
                    {currentBanner.title}
                  </h4>
                  <span className={`text-[10px] truncate block ${theme.sponsorClass}`}>
                    {currentBanner.sponsorName}
                  </span>
                </div>
              </div>

              {/* Left: Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {currentBanner.phoneNumber && (
                  <a
                    href={`https://wa.me/${currentBanner.phoneNumber.replace(/[^\d+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black flex items-center gap-1 shadow-sm shrink-0 border border-emerald-400"
                    title="واتساب / هاتف"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>تواصل</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleBannerClick}
                  className={`${theme.ctaButton} px-2 py-1 rounded-lg text-[10.5px] font-black flex items-center gap-1 shadow-sm shrink-0`}
                  title={compactLabel}
                >
                  <Download className="w-3 h-3 stroke-[2.5]" />
                  <span>{compactLabel}</span>
                </button>

                {/* عمود: الإبلاغ وسهم رفع الفيديو */}
                <div className="flex flex-col items-center justify-between h-[52px] py-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReportOpen(true);
                    }}
                    className={`p-1 rounded-md text-[9px] font-bold flex items-center justify-center border ${theme.reportBtn}`}
                    title="إبلاغ"
                  >
                    <ShieldAlert className={`w-3 h-3 ${theme.reportIcon}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoExpanded(false);
                    }}
                    className={`w-6 h-6 rounded-md flex items-center justify-center border shadow-xs ${theme.videoBtnActive}`}
                    title="رفع الفيديو للأعلى"
                  >
                    <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* عمود: شارة AD وزر الإغلاق */}
                <div className={`flex flex-col items-center justify-between h-[52px] py-0.5 border-r ${theme.divider} pr-1`}>
                  <span className="px-1 py-0.2 text-[8.5px] rounded font-mono font-black shadow-[0_0_6px_rgba(250,204,21,0.6)] leading-none text-center bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 border border-yellow-300">
                    AD
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseBanner}
                    className={`p-0.5 rounded transition-all cursor-pointer ${theme.closeBtn}`}
                    title="إغلاق الإعلان"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* STANDARD COLLAPSED BANNER BAR: 90px in Desktop / Browser (74px on Phone) */
        <div 
          onClick={handleBannerClick}
          className={`w-full min-h-[74px] sm:min-h-[90px] shrink-0 ${theme.containerBg} ${theme.borderColor} shadow-md relative overflow-hidden select-none transition-all duration-700 ease-in-out flex flex-col z-30 cursor-pointer border-b group animate-in fade-in slide-in-from-top-2 duration-500`}
          dir="rtl"
        >
          {/* Subtle shine animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3.5s_infinite] pointer-events-none" />

          {/* EXACT HORIZONTAL CENTER IN BROWSER/DESKTOP: "شاهد الآن" Button (في منتصف إعلان البانر بالضبط وبحجم أكبر لكي تلفت الانتباه) */}
          {hasVideo && (
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoExpanded(true);
                }}
                className="flex items-center gap-2.5 px-6 py-2.5 sm:px-7 sm:py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm lg:text-[15px] shadow-xl shadow-red-600/40 border-2 border-yellow-300 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
                title="شاهد الفيديو الآن مباشرة"
              >
                <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shrink-0 shadow-inner">
                  <Play className="w-3.5 h-3.5 fill-current text-white mr-0.5" />
                </span>
                <span className="whitespace-nowrap font-black tracking-wide">
                  شاهد الآن
                </span>
                <ChevronDown className="w-5 h-5 stroke-[3] text-amber-200" />
              </button>
            </div>
          )}

          {/* MOBILE VIEW (<sm): 
              Right: 58x58 Square Image
              Center: Title on top (extending freely over download button) + Download button & Sponsor below it
              Left: (Report on top & Video Arrow below) + (AD on top & Close below)
          */}
          <div className="sm:hidden w-full h-[76px] px-2 flex items-center justify-between gap-2 relative z-10">
            {/* Right: 58x58 Square Image */}
            <div className={`w-[56px] h-[56px] min-w-[56px] min-h-[56px] rounded-xl overflow-hidden border-2 ${theme.imageBorder} shrink-0 bg-slate-900 flex items-center justify-center relative shadow-md self-center`}>
              <img 
                src={currentBanner.customIconUrl || currentBanner.imageUrl || '/icon.svg'} 
                alt={currentBanner.title}
                className="w-full h-full object-cover"
              />
              {hasVideo && (
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-xs">
                  <Play className="w-1.5 h-1.5 fill-current" />
                </div>
              )}
            </div>

            {/* Middle: Title extending naturally ABOVE the download button, with remaining title below it without harsh truncation */}
            <div className="min-w-0 flex-1 flex flex-col justify-between py-1 h-full">
              {/* العنوان يظهر فوق كلمة تحميل لكي يكون واضحاً بشكل كامل مع امتداد طبيعي */}
              <h3 className={`text-[11.5px] font-black leading-tight line-clamp-2 ${theme.titleClass}`}>
                {currentBanner.title}
              </h3>

              {/* أسفل العنوان: زر التحميل وبجانبه اسم المعلن */}
              <div className="flex items-center gap-1.5 mt-auto pt-0.5">
                <button
                  type="button"
                  onClick={handleBannerClick}
                  className={`${theme.ctaButton} px-2.5 py-1 rounded-lg text-[10.5px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs font-black`}
                  title={compactLabel}
                >
                  {currentBanner.buttonType === 'install' || currentBanner.buttonType === 'download' ? (
                    <Download className={`w-3 h-3 ${theme.ctaIconColor} stroke-[2.5]`} />
                  ) : (
                    <ExternalLink className={`w-3 h-3 ${theme.ctaIconColor} stroke-[2.5]`} />
                  )}
                  <span className="font-black whitespace-nowrap">{compactLabel}</span>
                </button>

                <span className={`text-[9.5px] font-bold truncate ${theme.sponsorClass}`}>
                  {currentBanner.sponsorName}
                </span>
              </div>
            </div>

            {/* Left Controls: Column 1 (Report on top, Arrow below) & Column 2 (AD on top, Close below) */}
            <div className="flex items-center gap-1.5 shrink-0 h-full">
              {/* عمود: زر الإبلاغ في الأعلى وأسفله سهم تشغيل الفيديو */}
              <div className="flex flex-col items-center justify-between h-[66px] py-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReportOpen(true);
                  }}
                  className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer border ${theme.reportBtn} shadow-xs`}
                  title="إبلاغ الدعم الفني عن هذا الإعلان"
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${theme.reportIcon}`} />
                </button>

                {hasVideo ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoExpanded(true);
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border shadow-xs ${theme.videoBtnInactive}`}
                    title="شاهد الفيديو الآن"
                  >
                    <ChevronDown className={`w-4 h-4 stroke-[2.5] ${theme.videoArrowIcon}`} />
                  </button>
                ) : (
                  <div className="w-7 h-7" />
                )}
              </div>

              {/* عمود: شارة AD في الأعلى وأسفلها زر إغلاق الإعلان X */}
              <div className={`flex flex-col items-center justify-between h-[66px] py-0.5 border-r ${theme.divider} pr-1.5`}>
                <span className="px-1.5 py-0.5 text-[8.5px] rounded-md font-mono font-black shadow-[0_0_8px_rgba(250,204,21,0.6)] tracking-wider leading-none select-none text-center bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 border border-yellow-300">
                  AD
                </span>
                <button
                  type="button"
                  onClick={handleCloseBanner}
                  className={`p-1 rounded-lg transition-all cursor-pointer ${theme.closeBtn}`}
                  title="إغلاق الإعلان (سيظهر إعلان بديل بعد 3 ثوانٍ)"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (sm: and up): 
              Right: 78x78 Square Image + Title & Sponsor
              Center: "شاهد الآن" (prominent and centered)
              Left: Large Download button + Report + AD + Close
          */}
          <div className="hidden sm:flex w-full h-[90px] px-4 items-center justify-between gap-4 relative z-10">
            {/* Right Section: 78x78 Square Image + Title & Sponsor */}
            <div className="flex items-center gap-3.5 min-w-0 max-w-[42%] lg:max-w-[45%] h-full py-1">
              <div className={`w-[78px] h-[78px] min-w-[78px] min-h-[78px] rounded-xl overflow-hidden border-2 ${theme.imageBorder} shrink-0 bg-slate-900 flex items-center justify-center relative shadow-md self-center`}>
                <img 
                  src={currentBanner.customIconUrl || currentBanner.imageUrl || '/icon.svg'} 
                  alt={currentBanner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {hasVideo && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-xs">
                    <Play className="w-2 h-2 fill-current" />
                  </div>
                )}
              </div>

              {/* Title & Sponsor Info */}
              <div className="min-w-0 flex-1 flex flex-col justify-start pt-2 h-full">
                <h3 className={`text-base lg:text-[17px] font-black leading-tight line-clamp-1 ${theme.titleClass}`}>
                  {currentBanner.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[13px] font-bold truncate ${theme.sponsorClass}`}>
                    {currentBanner.sponsorName}
                  </span>
                  {hasVideo && (
                    <span className="px-2 py-0.5 text-[9.5px] font-black rounded-md bg-red-600 text-white shadow-xs inline-flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>فيديو متاح</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Left / Actions Section */}
            <div className="flex items-center gap-3 shrink-0 h-full">
              {/* زر تثبيت/تحميل التطبيق بحجم كبير مماثل لزر شاهد الآن ونازل للأسفل قليلاً */}
              <div className="flex items-end h-full pb-2">
                <button
                  type="button"
                  onClick={handleBannerClick}
                  className={`${theme.ctaButton} px-6 py-3 rounded-2xl text-sm lg:text-[14px] flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0 shadow-lg font-black`}
                  title={compactLabel}
                >
                  {currentBanner.buttonType === 'install' || currentBanner.buttonType === 'download' ? (
                    <Download className={`w-5 h-5 ${theme.ctaIconColor} stroke-[2.5]`} />
                  ) : (
                    <ExternalLink className={`w-5 h-5 ${theme.ctaIconColor} stroke-[2.5]`} />
                  )}
                  <span className="font-black whitespace-nowrap">{compactLabel}</span>
                </button>
              </div>

              {/* زر الإبلاغ */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReportOpen(true);
                  }}
                  className={`p-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer border ${theme.reportBtn} shadow-xs`}
                  title="إبلاغ الدعم الفني عن هذا الإعلان"
                >
                  <ShieldAlert className={`w-4 h-4 ${theme.reportIcon}`} />
                </button>
              </div>

              {/* عمود: شارة AD في الأعلى وأسفلها زر إغلاق الإعلان X */}
              <div className={`flex flex-col items-center justify-between h-[76px] py-1 border-r ${theme.divider} pr-2.5`}>
                <span className="px-2 py-0.5 text-[10px] rounded-md font-mono font-black shadow-[0_0_8px_rgba(250,204,21,0.6)] tracking-wider leading-none select-none text-center bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 border border-yellow-300">
                  AD
                </span>
                <button
                  type="button"
                  onClick={handleCloseBanner}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme.closeBtn}`}
                  title="إغلاق الإعلان (سيظهر إعلان بديل بعد 3 ثوانٍ)"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ad Report Reason Modal */}
      <AdReportModal
        isOpen={isReportOpen}
        adTitle={currentBanner.title}
        adSponsor={currentBanner.sponsorName}
        adType="banner"
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
};
