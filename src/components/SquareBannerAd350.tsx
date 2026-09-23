import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ShieldCheck, 
  Star, 
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldAlert,
  Play
} from 'lucide-react';
import { getDeveloperAdsState, DeveloperAdsState, DeveloperBannerAd } from '../utils/adsManager';
import { AdReportModal } from './AdReportModal';
import { isYouTubeUrl, getYouTubeEmbedUrl } from './TopBannerAd';

interface SquareBannerAd350Props {
  className?: string;
}

export const SquareBannerAd350: React.FC<SquareBannerAd350Props> = ({ className = '' }) => {
  const [adsState, setAdsState] = useState<DeveloperAdsState>(() => getDeveloperAdsState());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const activeBanners = (adsState.customBanners || []).filter(b => b.active);

  // Smooth rotation every 15 seconds
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  // When changing banner, ensure video is muted and playing
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIdx, isMuted]);

  // 1. If platform ads are disabled by developer, or no ads enabled at all
  if (!adsState.platformAdsEnabled && !adsState.adsenseEnabled && !adsState.thirdPartySdkEnabled) {
    return null;
  }

  if (!adsState.bannerAdsEnabled && !adsState.adsenseEnabled && !adsState.thirdPartySdkEnabled) {
    return null;
  }

  // 2. Third-Party SDK Mode (e.g. AppBad SDK / AppLovin)
  if (adsState.thirdPartySdkEnabled) {
    return (
      <div 
        className={`w-full max-w-[350px] md:max-w-[420px] rounded-2xl md:rounded-3xl bg-slate-900 border-2 border-indigo-500 shadow-2xl overflow-hidden flex flex-col p-4 shrink-0 select-none ${className}`}
        dir="rtl"
      >
        <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md border-2 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-mono tracking-wider">
              AD
            </span>
            <span className="text-[11px] font-bold text-indigo-400">شبكة تطبيق باد / SDK معتمدة</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">AppBad Live SDK</span>
        </div>

        <div className="w-full min-h-[180px] flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-white mb-1">مساحة إعلانات التطبيق المعتمدة (AppBad SDK)</span>
          <p className="text-[10px] text-slate-400 max-w-xs">
            يتم تحميل وعرض إعلانات المعلنين عبر مكتبة SDK الرسمية المرتبطة بالحساب
          </p>
        </div>
      </div>
    );
  }

  // 3. Google AdSense Official Mode
  if (adsState.adsenseEnabled) {
    return (
      <div 
        className={`w-full max-w-[350px] md:max-w-[420px] rounded-2xl md:rounded-3xl bg-slate-900 border-2 border-blue-500 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-4 shrink-0 select-none ${className}`}
        dir="rtl"
      >
        <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md border-2 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-mono tracking-wider">
              AD
            </span>
            <span className="text-xs font-black text-white">Google AdSense</span>
          </div>
          <span className="text-[10px] text-slate-400">إعلان معتمد</span>
        </div>

        {/* AdSense Container */}
        <div className="w-full flex-1 flex items-center justify-center py-3">
          <ins 
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '300px', height: '250px' }}
            data-ad-client={adsState.adsenseClientId || 'ca-pub-ROOHPRO777888999'}
            data-ad-slot={adsState.adsenseSlotId || '1234567890'}
          />
        </div>

        <div className="text-[10px] text-slate-400 text-center">
          شبكة إعلانات Google AdSense الرسمية لمنصة شغل وتقنية
        </div>
      </div>
    );
  }

  // 4. Custom Platform Banners
  const currentBanner: DeveloperBannerAd | undefined = activeBanners[currentIdx] || activeBanners[0];
  if (!currentBanner) return null;

  const rawMedia = currentBanner.videoUrl || currentBanner.imageUrl || '';
  const isYoutube = isYouTubeUrl(rawMedia);
  const isVideo = isYoutube || currentBanner.mediaType === 'video' || Boolean(
    currentBanner.videoUrl || 
    (currentBanner.imageUrl && (currentBanner.imageUrl.endsWith('.mp4') || currentBanner.imageUrl.includes('sample/ForBigger') || currentBanner.imageUrl.includes('video')))
  );
  const mediaSource = rawMedia;

  const handleOpenAd = () => {
    if (currentBanner.targetUrl) {
      window.open(currentBanner.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const next = !isMuted;
      videoRef.current.muted = next;
      setIsMuted(next);
    } else {
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      <div 
        className={`w-full max-w-[350px] md:max-w-[480px] rounded-2xl sm:rounded-3xl bg-white border-2 border-amber-400 shadow-2xl overflow-hidden flex flex-col shrink-0 select-none relative transition-all duration-300 ${className}`}
        dir="rtl"
      >
        {/* 1. Standardized Header with Unified "AD" Badge and Small Report Button */}
        <div className="p-2 sm:p-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Unified Distinctive Yellow Framed AD Emblem Badge */}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md border-2 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-mono tracking-wider">
              AD
            </span>
            <span className="text-[11px] font-black text-white truncate max-w-[130px] sm:max-w-[180px]">
              {currentBanner.sponsorName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Small Report Button on Ad Window (زر إبلاغ صغير) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsReportOpen(true);
              }}
              className="px-2 py-0.5 rounded-lg bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white border border-white/20 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="إبلاغ الدعم عن هذا الإعلان"
            >
              <ShieldAlert className="w-3 h-3 text-amber-300" />
              <span>إبلاغ</span>
            </button>

            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-300 bg-black/20 px-1.5 py-0.5 rounded-md">
              <Star className="w-3 h-3 fill-current" />
              <span>5.0</span>
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
          </div>
        </div>

        {/* 2. Visual Media Section & Details */}
        <div className="flex flex-col md:flex-row flex-1">
          
          {/* Media Frame (Video Player or Image Artwork) */}
          <div className="relative w-full md:w-[220px] h-[160px] md:h-auto min-h-[160px] shrink-0 overflow-hidden bg-slate-950 flex items-center justify-center">
            {isYoutube ? (
              <div className="w-full h-full relative bg-black flex items-center justify-center">
                <iframe
                  src={getYouTubeEmbedUrl(mediaSource, isMuted)}
                  title={currentBanner.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video 
                  ref={videoRef}
                  src={mediaSource}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Mute/Unmute Audio Button: Icon ONLY without words */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`absolute top-2 left-2 z-20 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-md ${
                    isMuted 
                      ? 'bg-black/80 hover:bg-black border-yellow-400/80 text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]' 
                      : 'bg-emerald-600/90 hover:bg-emerald-600 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  }`}
                  title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                  aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img 
                  src={currentBanner.imageUrl} 
                  alt={currentBanner.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              </div>
            )}

            {/* Badge over media */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 border border-yellow-300 font-mono text-[9.5px] font-black px-2 py-0.5 rounded shadow-sm">
                AD
              </span>
              {isVideo && (
                <span className="px-1.5 py-0.5 bg-red-600/90 text-white text-[9px] font-bold rounded flex items-center gap-0.5">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  فيديو
                </span>
              )}
            </div>

            {/* Sponsor Award Icon */}
            <div className="absolute bottom-2 left-2 w-6 h-6 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center border border-white shadow-sm z-10">
              <Award className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>

          {/* 3. Content Details & Action Controls */}
          <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/40">
            <div>
              {/* Standard Platform Image Thumbnail (55x55 px square) + Title */}
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-[55px] h-[55px] min-w-[55px] min-h-[55px] rounded-xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0 bg-slate-900 flex items-center justify-center">
                  <img 
                    src={currentBanner.imageUrl || '/icon.svg'} 
                    alt={currentBanner.sponsorName}
                    className="w-[55px] h-[55px] object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 font-mono text-[9px] font-black rounded">
                      AD
                    </span>
                    <span className="text-[10px] font-black text-slate-600 truncate">
                      {currentBanner.sponsorName}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
                    {currentBanner.title}
                  </h3>
                </div>
              </div>

              <p className="text-[10.5px] text-slate-500 leading-relaxed line-clamp-2">
                منصة شغل وتقنية • استكشف العرض الحصري وقم بالتحميل والتثبيت المباشر
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-amber-100">
              {/* Indicators if multiple banners */}
              {activeBanners.length > 1 && (
                <div className="flex items-center justify-between mb-1.5 text-[9px] text-slate-400">
                  <span>إعلان {currentIdx + 1} من {activeBanners.length}</span>
                  <div className="flex items-center gap-1">
                    {activeBanners.map((_, i) => (
                      <span
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={`cursor-pointer rounded-full transition-all ${
                          i === currentIdx ? 'w-3 h-1 bg-amber-500' : 'w-1 h-1 bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Action CTA Download / Install Button */}
              <button
                onClick={handleOpenAd}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {currentBanner.buttonType === 'download' ? (
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : currentBanner.buttonType === 'install' ? (
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>
                  {currentBanner.buttonLabel || (currentBanner.buttonType === 'download' ? 'تحميل الآن' : currentBanner.buttonType === 'install' ? 'تثبيت التطبيق' : 'انتقال')}
                </span>
                <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Ad Report Reason Modal */}
      <AdReportModal
        isOpen={isReportOpen}
        adTitle={currentBanner.title}
        adSponsor={currentBanner.sponsorName}
        adType="square"
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
};
