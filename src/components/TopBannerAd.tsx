import React, { useState, useEffect, useRef } from 'react';
import { Download, ExternalLink, X, ShieldAlert, ChevronDown, ChevronUp, Play, Volume2, VolumeX } from 'lucide-react';
import { getDeveloperAdsState, DeveloperAdsState, DeveloperBannerAd, BannerColorTheme } from '../utils/adsManager';
import { AdReportModal } from './AdReportModal';

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
  indicatorActive: string;
}

const THEME_STYLES: Record<ConcreteColorTheme, ThemeStyles> = {
  red: {
    containerBg: 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-700',
    borderColor: 'border-rose-400/50',
    titleClass: 'text-white font-black drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] group-hover:text-amber-200 transition-colors',
    sponsorClass: 'text-amber-200 font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]',
    imageBorder: 'border-white/80 shadow-md',
    videoTag: 'bg-black/40 text-amber-300 border-amber-300/40',
    ctaButton: 'bg-white text-slate-950 hover:bg-amber-100 border-white/60 shadow-sm font-black',
    ctaIconColor: 'text-red-600',
    videoBtnActive: 'bg-amber-400 text-slate-950 border-amber-300 shadow-md',
    videoBtnInactive: 'bg-black/35 hover:bg-black/60 text-amber-300 hover:text-white border-amber-400/40',
    videoArrowIcon: 'text-amber-300',
    reportBtn: 'bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white border-white/20',
    reportIcon: 'text-amber-300',
    closeBtn: 'text-white/80 hover:text-white hover:bg-black/30',
    divider: 'border-white/20',
    indicatorActive: 'bg-red-400 ring-2 ring-white scale-110'
  },
  blue: {
    containerBg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700',
    borderColor: 'border-sky-400/50',
    titleClass: 'text-white font-black drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] group-hover:text-cyan-200 transition-colors',
    sponsorClass: 'text-sky-200 font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]',
    imageBorder: 'border-white/80 shadow-md',
    videoTag: 'bg-black/40 text-sky-300 border-sky-300/40',
    ctaButton: 'bg-white text-blue-950 hover:bg-sky-50 border-white/60 shadow-sm font-black',
    ctaIconColor: 'text-blue-600',
    videoBtnActive: 'bg-sky-400 text-blue-950 border-sky-300 shadow-md',
    videoBtnInactive: 'bg-black/35 hover:bg-black/60 text-sky-300 hover:text-white border-sky-400/40',
    videoArrowIcon: 'text-sky-300',
    reportBtn: 'bg-black/30 hover:bg-black/50 text-sky-200 hover:text-white border-white/20',
    reportIcon: 'text-sky-300',
    closeBtn: 'text-white/80 hover:text-white hover:bg-black/30',
    divider: 'border-white/20',
    indicatorActive: 'bg-sky-400 ring-2 ring-white scale-110'
  },
  yellow: {
    // Ultra-clear contrast on vibrant golden yellow: dark text, punchy black CTA, sharp borders
    containerBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
    borderColor: 'border-amber-600/50',
    titleClass: 'text-slate-950 font-black drop-shadow-[0_1px_0px_rgba(255,255,255,0.8)] group-hover:text-black transition-colors',
    sponsorClass: 'text-amber-950 font-black drop-shadow-none',
    imageBorder: 'border-slate-950/60 shadow-md',
    videoTag: 'bg-slate-950 text-yellow-300 border-slate-950 font-black',
    ctaButton: 'bg-slate-950 text-white hover:bg-slate-800 border-slate-900 shadow-md font-black',
    ctaIconColor: 'text-yellow-400',
    videoBtnActive: 'bg-slate-950 text-yellow-300 border-slate-900 shadow-md',
    videoBtnInactive: 'bg-slate-950/85 hover:bg-slate-950 text-yellow-300 hover:text-white border-slate-900',
    videoArrowIcon: 'text-yellow-300',
    reportBtn: 'bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 hover:text-black border-slate-950/30',
    reportIcon: 'text-slate-950',
    closeBtn: 'text-slate-900 hover:text-black hover:bg-slate-950/15',
    divider: 'border-slate-950/25',
    indicatorActive: 'bg-amber-950 ring-2 ring-yellow-200 scale-110'
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

export const TopBannerAd: React.FC<TopBannerAdProps> = ({ onAdClick }) => {
  const [adsState, setAdsState] = useState<DeveloperAdsState>(() => getDeveloperAdsState());
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [colorCycleIndex, setColorCycleIndex] = useState(0);
  const [userSelectedColor, setUserSelectedColor] = useState<ConcreteColorTheme | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    return () => window.removeEventListener('rooh_ads_config_changed', handleConfigChange);
  }, []);

  // Filter active banners
  const activeBanners = (adsState.customBanners || []).filter(b => b.active);

  // Rotate banner ads & rotate color themes smoothly (Red -> Blue -> Yellow) ONLY when video is not expanded
  // Strictly rotated every 15 seconds (15,000ms) as mandated by user specifications
  useEffect(() => {
    if (isVideoExpanded) return;

    const timer = setInterval(() => {
      // Rotate active ad banner if more than 1
      if (activeBanners.length > 1) {
        setCurrentAdIndex((prev) => (prev + 1) % activeBanners.length);
      }
      // Always rotate color theme smoothly every cycle (Red -> Blue -> Yellow)
      setColorCycleIndex((prev) => (prev + 1) % COLOR_CYCLE_LIST.length);
      // Reset manual override on timer cycle so dynamic change keeps going
      setUserSelectedColor(null);
    }, TOP_BANNER_ROTATION_INTERVAL_MS); // Strictly 15 seconds (15000ms)

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
        className="w-full h-[62px] min-h-[62px] max-h-[62px] shrink-0 bg-slate-900 border-b border-slate-800 text-white shadow-md relative overflow-hidden select-none flex items-center justify-between px-3 z-30"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          {/* Distinctive Yellow Framed AD Badge */}
          <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md border-2 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-mono tracking-wider">
            AD
          </span>
          <span className="text-xs text-slate-300 font-medium">
            مساحة إعلانية معتمدة من جوجل أدسنس
          </span>
        </div>

        {/* AdSense ins container */}
        <div className="flex-1 max-w-md mx-4 h-full flex items-center justify-center">
          <ins 
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '100%', height: '50px' }}
            data-ad-client={adsState.adsenseClientId || 'ca-pub-ROOHPRO777888999'}
            data-ad-slot={adsState.adsenseSlotId || '1234567890'}
          />
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="إخفاء"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 3. Custom Developer Banners Mode
  const currentBanner: DeveloperBannerAd | undefined = activeBanners[currentAdIndex] || activeBanners[0];

  if (!currentBanner) return null;

  // Determine current active theme (Red, Blue, Yellow)
  // Priority: User Manual Dot click > Developer Global setting (if not auto) > Banner individual color (if not auto) > Color Cycle rotation
  let activeThemeKey: ConcreteColorTheme = COLOR_CYCLE_LIST[colorCycleIndex % COLOR_CYCLE_LIST.length];

  if (userSelectedColor) {
    activeThemeKey = userSelectedColor;
  } else if (adsState.bannerColorTheme && adsState.bannerColorTheme !== 'auto') {
    activeThemeKey = adsState.bannerColorTheme as ConcreteColorTheme;
  } else if (currentBanner.colorTheme && currentBanner.colorTheme !== 'auto') {
    activeThemeKey = currentBanner.colorTheme as ConcreteColorTheme;
  }

  const theme = THEME_STYLES[activeThemeKey] || THEME_STYLES.red;

  // Check if banner has an associated video (YouTube or direct video file, always enabled for interactive video ad showcase)
  const hasVideo = true;
  const rawVideoUrl = currentBanner.videoUrl || (currentBanner.mediaType === 'video' ? currentBanner.imageUrl : '') || 'https://www.youtube.com/watch?v=ScMzIvxBSi4';
  const isYoutube = isYouTubeUrl(rawVideoUrl);
  const resolvedYouTubeEmbed = isYoutube ? getYouTubeEmbedUrl(rawVideoUrl, isMuted) : '';

  const handleBannerClick = () => {
    if (onAdClick) {
      onAdClick(currentBanner);
    } else if (currentBanner.targetUrl) {
      window.open(currentBanner.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div 
        onClick={handleBannerClick}
        className={`w-full min-h-[62px] shrink-0 ${theme.containerBg} ${theme.borderColor} shadow-md relative overflow-hidden select-none transition-all duration-700 ease-in-out flex flex-col z-30 cursor-pointer border-b group`}
        dir="rtl"
      >
        {/* Subtle shine animation overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3.5s_infinite] pointer-events-none" />

        {/* Main Banner Bar (Height 62px) */}
        <div className="w-full h-[62px] px-2 sm:px-3 flex items-center justify-between gap-1.5 sm:gap-2.5">
          
          {/* Right Section: Standard 55x55 Square Platform Image + Title & Sponsor with Ultra-Clear Font */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Standardized 55x55 pixel platform ad image */}
            <div className={`w-[55px] h-[55px] min-w-[55px] min-h-[55px] rounded-xl overflow-hidden border-2 ${theme.imageBorder} shrink-0 bg-slate-900 flex items-center justify-center relative`}>
              <img 
                src={currentBanner.imageUrl || '/icon.svg'} 
                alt={currentBanner.title}
                className="w-[55px] h-[55px] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {hasVideo && (
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xs">
                  <Play className="w-2 h-2 fill-current" />
                </div>
              )}
            </div>

            {/* Title & Sponsor Info - High contrast, perfectly legible in Red, Blue, and Yellow */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <h3 className={`text-xs sm:text-sm md:text-[15px] leading-snug truncate ${theme.titleClass}`}>
                {currentBanner.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[11px] truncate ${theme.sponsorClass}`}>
                  {currentBanner.sponsorName}
                </span>
                {hasVideo && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-full border hidden xs:inline-flex items-center gap-1 ${theme.videoTag}`}>
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>فيديو متاح</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Left Section: Action CTA + Color Indicator Dots + Expand Video Arrow (if video available) + Report + (AD above X) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* CTA Action Button: Install or Navigate (High-contrast styled per color theme) */}
            <button
              type="button"
              onClick={handleBannerClick}
              className={`${theme.ctaButton} px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0`}
            >
              {currentBanner.buttonType === 'install' || currentBanner.buttonType === 'download' ? (
                <Download className={`w-3.5 h-3.5 ${theme.ctaIconColor} stroke-[2.5]`} />
              ) : (
                <ExternalLink className={`w-3.5 h-3.5 ${theme.ctaIconColor} stroke-[2.5]`} />
              )}
              <span>{currentBanner.buttonLabel || (currentBanner.buttonType === 'install' ? 'تثبيت' : currentBanner.buttonType === 'download' ? 'تحميل' : 'انتقال')}</span>
            </button>

            {/* Video Expand / Collapse Arrow Button: When clicked, pauses banner rotation & expands video */}
            {hasVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoExpanded(prev => !prev);
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs border ${
                  isVideoExpanded ? theme.videoBtnActive : theme.videoBtnInactive
                }`}
                title={isVideoExpanded ? 'طي الفيديو وإخفاؤه للأعلى' : 'مشاهدة فيديو الإعلان بالأسفل'}
              >
                {isVideoExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 stroke-[2.5] animate-bounce" />
                    <span className="text-[10px] hidden md:inline font-black">رفع الفيديو</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className={`w-4 h-4 stroke-[2.5] ${theme.videoArrowIcon} animate-bounce`} />
                    <span className="text-[10px] hidden md:inline font-black">تنزيل الفيديو</span>
                  </>
                )}
              </button>
            )}

            {/* Subtle Color Switcher Dots (Red, Blue, Yellow) - Shows color alternation & allows instant manual switch */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="hidden lg:flex items-center gap-1 bg-black/20 backdrop-blur-xs px-1.5 py-1 rounded-full border border-white/20"
              title="تغيير لون خلفية البنر (أحمر، أزرق، أصفر)"
            >
              <button
                type="button"
                onClick={() => setUserSelectedColor('red')}
                className={`w-2.5 h-2.5 rounded-full transition-transform cursor-pointer ${
                  activeThemeKey === 'red' ? 'bg-red-500 ring-2 ring-white scale-125' : 'bg-red-400/60 hover:bg-red-400'
                }`}
                title="اللون الأحمر الملكي"
              />
              <button
                type="button"
                onClick={() => setUserSelectedColor('blue')}
                className={`w-2.5 h-2.5 rounded-full transition-transform cursor-pointer ${
                  activeThemeKey === 'blue' ? 'bg-blue-500 ring-2 ring-white scale-125' : 'bg-blue-400/60 hover:bg-blue-400'
                }`}
                title="اللون الأزرق التقني"
              />
              <button
                type="button"
                onClick={() => setUserSelectedColor('yellow')}
                className={`w-2.5 h-2.5 rounded-full transition-transform cursor-pointer ${
                  activeThemeKey === 'yellow' ? 'bg-yellow-400 ring-2 ring-slate-900 scale-125' : 'bg-yellow-400/60 hover:bg-yellow-400'
                }`}
                title="اللون الأصفر الذهبي عالي الوضوح"
              />
            </div>

            {/* Report Button on Ad Window (زر إبلاغ صغير) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsReportOpen(true);
              }}
              className={`px-1.5 sm:px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 border ${theme.reportBtn}`}
              title="إبلاغ الدعم عن هذا الإعلان"
            >
              <ShieldAlert className={`w-3 h-3 ${theme.reportIcon}`} />
              <span className="hidden lg:inline">إبلاغ</span>
            </button>

            {/* Dedicated Vertical Column: Always Distinctive Yellow Framed AD Badge ON TOP, Close (X) button SHIFTED DOWN */}
            <div className={`flex flex-col items-center justify-between h-[52px] py-0.5 shrink-0 pl-0.5 pr-0.5 border-r ${theme.divider} mr-0.5`}>
              {/* Distinctive Yellow Framed AD Badge */}
              <span className="px-2 py-0.5 text-[9.5px] rounded-md font-mono font-black shadow-[0_0_10px_rgba(250,204,21,0.6)] tracking-wider leading-none select-none text-center bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 border-2 border-yellow-300">
                AD
              </span>

              {/* Close (X) button shifted down slightly */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
                className={`p-1 rounded-md transition-all cursor-pointer mt-1 ${theme.closeBtn}`}
                title="إخفاء الإعلان مؤقتاً"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

          </div>

        </div>

        {/* Embedded Interactive Video Drawer (Opens when user clicks down-arrow, rotation pauses, supports YouTube & MP4) */}
        {isVideoExpanded && hasVideo && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-slate-950 border-t-2 border-amber-400/60 p-2.5 sm:p-4 relative overflow-hidden transition-all duration-300 shadow-2xl animate-in slide-in-from-top-2"
          >
            {/* Video Player in standard YouTube 16:9 widescreen ratio in the open space */}
            <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-slate-800 bg-black relative shadow-2xl group/player aspect-video flex items-center justify-center">
              
              {/* Media Player: YouTube Iframe or HTML5 Video (both standard 16:9 YouTube aspect ratio) */}
              {isYoutube ? (
                <div className="w-full h-full relative aspect-video bg-black flex items-center justify-center">
                  <iframe
                    src={resolvedYouTubeEmbed}
                    title={currentBanner.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="relative w-full h-full aspect-video flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    src={rawVideoUrl}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    loop
                    className="w-full h-full object-contain mx-auto bg-black"
                  />

                  {/* Icon-Only Mute Button (أيقونة كتم الصوت فقط بدون أي نص بجانب الزر) */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(prev => !prev);
                      }}
                      className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-xl ${
                        isMuted 
                          ? 'bg-black/80 hover:bg-black border-yellow-400/80 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]' 
                          : 'bg-emerald-600/90 hover:bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      }`}
                      title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                      aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Volume2 className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Bar: Replaces the removed sentence.
                Contains:
                1. نافذة اسم وعنوان التطبيق بجانب زر التحميل
                2. نافذة زر تحميل التطبيق
                3. سهم زر الرفع (سهم الرفع لرفع وطَي الفيديو للأعلى) بجانب زر التحميل */}
            <div className="mt-3 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/95 border-2 border-slate-800 hover:border-amber-400/40 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-md transition-all">
              
              {/* 1. نافذة اسم وعنوان التطبيق والراعي مع الشعار المعياري 55x55 وشارة AD الصفراء */}
              <div className="flex items-center gap-3 min-w-0 flex-1 w-full md:w-auto bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 sm:px-3">
                <div className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] sm:w-[55px] sm:h-[55px] sm:min-w-[55px] sm:min-h-[55px] rounded-xl overflow-hidden border-2 border-yellow-400/90 shadow-md bg-black shrink-0 flex items-center justify-center">
                  <img 
                    src={currentBanner.imageUrl || '/icon.svg'} 
                    alt={currentBanner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center gap-2 mb-0.5">
                    {/* Distinctive Yellow Framed AD Badge */}
                    <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-[9.5px] px-2 py-0.5 rounded border border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)] font-mono tracking-wider">
                      AD
                    </span>
                    <span className="text-[11px] font-black text-amber-300 truncate">
                      {currentBanner.sponsorName || 'منصة شغل وتقنية'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                    {currentBanner.title}
                  </h4>
                </div>
              </div>

              {/* 2 & 3. أزرار الإجراءات: زر تحميل التطبيق + سهم زر الرفع بجانبه مباشرة */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full md:w-auto justify-end">
                {/* 2. نافذة وزر تحميل التطبيق */}
                <button
                  type="button"
                  onClick={handleBannerClick}
                  className="flex-1 md:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer active:scale-95 transition-all border border-white/20"
                  title="تحميل التطبيق الآن"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{currentBanner.buttonLabel || (currentBanner.buttonType === 'download' ? 'تحميل التطبيق' : currentBanner.buttonType === 'install' ? 'تثبيت التطبيق' : 'تحميل التطبيق')}</span>
                </button>

                {/* 3. سهم زر الرفع (سهم الرفع لرفع الفيديو وطيه للأعلى) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVideoExpanded(false);
                  }}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 hover:text-white border-2 border-yellow-400/60 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-black/40 cursor-pointer transition-all active:scale-95 group shrink-0"
                  title="سهم رفع الفيديو للأعلى"
                >
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 stroke-[3] group-hover:-translate-y-0.5 transition-transform" />
                  <span className="font-black">رفع الفيديو</span>
                </button>
              </div>

            </div>

          </div>
        )}
      </div>

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


