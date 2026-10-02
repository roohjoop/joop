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
  Play,
  MessageCircle,
  Phone
} from 'lucide-react';
import { getDeveloperAdsState, DeveloperAdsState, DeveloperBannerAd } from '../utils/adsManager';
import { subscribeToDeveloperBanners } from '../firebase/services';
import { AdReportModal } from './AdReportModal';
import { AdVideoPlayer } from './AdVideoPlayer';

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
        className={`w-full max-w-[350px] h-[350px] min-h-[350px] max-h-[350px] rounded-2xl md:rounded-3xl bg-slate-900 border-2 border-indigo-500 shadow-2xl overflow-hidden flex flex-col justify-between p-4 shrink-0 select-none mx-auto ${className}`}
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

        <div className="w-full min-h-[180px] flex-1 flex flex-col items-center justify-center py-4 text-center">
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
        className={`w-full max-w-[350px] h-[350px] min-h-[350px] max-h-[350px] rounded-2xl md:rounded-3xl bg-slate-900 border-2 border-blue-500 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-3 shrink-0 select-none mx-auto ${className}`}
        dir="rtl"
      >
        <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md border-2 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-mono tracking-wider">
              AD
            </span>
            <span className="text-xs font-black text-white">Google AdSense</span>
          </div>
          <span className="text-[10px] text-slate-400">إعلان معتمد</span>
        </div>

        {/* AdSense Container */}
        <div className="w-full flex-1 flex items-center justify-center py-1">
          <ins 
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '300px', height: '250px' }}
            data-ad-client={adsState.adsenseClientId || 'ca-pub-ROOHPRO777888999'}
            data-ad-slot={adsState.adsenseSlotId || '1234567890'}
          />
        </div>

        <div className="text-[9.5px] text-slate-400 text-center shrink-0">
          شبكة إعلانات Google AdSense الرسمية لمنصة شغل وتقنية
        </div>
      </div>
    );
  }

  // 4. Custom Platform Banners
  const currentBanner: DeveloperBannerAd | undefined = activeBanners[currentIdx] || activeBanners[0];
  if (!currentBanner) return null;

  const rawMedia = currentBanner.videoUrl || currentBanner.imageUrl || '';
  const isYoutube = rawMedia.includes('youtube.com') || rawMedia.includes('youtu.be');
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
        className={`w-full max-w-[350px] h-[350px] min-h-[350px] max-h-[350px] rounded-2xl sm:rounded-3xl bg-white border-2 border-amber-400 shadow-2xl overflow-hidden flex flex-col justify-between shrink-0 select-none relative transition-all duration-300 mx-auto ${className}`}
        dir="rtl"
      >
        {/* 1. Standardized Header with Unified "AD" Badge and Small Report Button */}
        <div className="h-[36px] min-h-[36px] px-3 py-1 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Unified Distinctive Yellow Framed AD Emblem Badge */}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] px-2 py-0.2 rounded border border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)] font-mono tracking-wider shrink-0">
              AD
            </span>
            <span className="text-xs font-black text-white truncate max-w-[150px]">
              {currentBanner.sponsorName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Small Report Button on Ad Window (زر إبلاغ صغير) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsReportOpen(true);
              }}
              className="px-1.5 py-0.5 rounded bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white border border-white/20 text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="إبلاغ الدعم عن هذا الإعلان"
            >
              <ShieldAlert className="w-2.5 h-2.5 text-amber-300" />
              <span>إبلاغ</span>
            </button>

            <span className="flex items-center gap-0.5 text-[9.5px] font-bold text-amber-300 bg-black/20 px-1 py-0.5 rounded">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>5.0</span>
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          </div>
        </div>

        {/* 2. Visual Media Section: Professional Video / Image Player */}
        <div className="relative w-full h-[162px] min-h-[162px] max-h-[162px] bg-black flex items-center justify-center overflow-hidden shrink-0">
          {isVideo || currentBanner.videoUrl ? (
            <AdVideoPlayer
              videoUrl={rawMedia}
              posterImage={currentBanner.imageUrl}
              title={currentBanner.title}
              isMuted={isMuted}
              autoPlay={true}
              className="w-full h-full object-cover"
              aspectRatio="video"
            />
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
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 border border-yellow-300 font-mono text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
              AD
            </span>
            {isVideo && (
              <span className="px-1.5 py-0.5 bg-red-600/90 text-white text-[8.5px] font-bold rounded flex items-center gap-0.5">
                <Play className="w-2 h-2 fill-current" />
                فيديو
              </span>
            )}
          </div>

          {/* Sponsor Award Icon */}
          <div className="absolute bottom-2 left-2 w-5 h-5 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center border border-white shadow-xs z-10">
            <Award className="w-3 h-3 text-amber-600" />
          </div>
        </div>

        {/* 3. Content Details & Action Controls: Sized to fit 350px exactly */}
        <div className="h-[152px] min-h-[152px] max-h-[152px] p-2.5 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/40 shrink-0">
          <div>
            {/* Standard Platform Image Thumbnail + Title */}
            <div className="flex items-start gap-2 mb-1">
              <div className="w-10 h-10 min-w-10 min-h-10 rounded-lg overflow-hidden border border-amber-400 shadow-xs shrink-0 bg-slate-900 flex items-center justify-center">
                <img 
                  src={currentBanner.imageUrl || '/icon.svg'} 
                  alt={currentBanner.sponsorName}
                  className="w-10 h-10 object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="px-1 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 font-mono text-[8.5px] font-black rounded">
                    AD
                  </span>
                  <span className="text-[10px] font-black text-slate-600 truncate">
                    {currentBanner.sponsorName}
                  </span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                  {currentBanner.title}
                </h3>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 leading-tight line-clamp-1 font-medium">
              منصة شغل وتقنية • استكشف العرض الحصري والخدمات المعتمدة
            </p>
          </div>

          <div className="pt-1.5 border-t border-amber-100">
            {/* Indicators if multiple banners */}
            {activeBanners.length > 1 && (
              <div className="flex items-center justify-between mb-1 text-[8.5px] text-slate-400">
                <span>إعلان {currentIdx + 1} من {activeBanners.length}</span>
                <div className="flex items-center gap-1">
                  {activeBanners.map((_, i) => (
                    <span
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`cursor-pointer rounded-full transition-all ${
                        i === currentIdx ? 'w-2.5 h-1 bg-amber-500' : 'w-1 h-1 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Action CTA Download / Install / Contact Button */}
            <div className="flex items-center gap-1.5">
              {currentBanner.phoneNumber && (
                <a
                  href={`https://wa.me/${currentBanner.phoneNumber.replace(/[^\d+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0 border border-emerald-400"
                  title={`تواصل مع المعلن: ${currentBanner.phoneNumber}`}
                >
                  <MessageCircle className="w-3 h-3" />
                  <span className="hidden xs:inline">واتساب</span>
                </a>
              )}

              <button
                onClick={handleOpenAd}
                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-[11px] shadow-sm shadow-red-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {currentBanner.buttonType === 'download' ? (
                  <Download className="w-3 h-3 stroke-[2.5]" />
                ) : currentBanner.buttonType === 'install' ? (
                  <Download className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                )}
                <span className="truncate">
                  {currentBanner.buttonLabel || (currentBanner.buttonType === 'download' ? 'تحميل الآن' : currentBanner.buttonType === 'install' ? 'تثبيت التطبيق' : 'انتقال')}
                </span>
                <ChevronLeft className="w-3 h-3 stroke-[3] shrink-0" />
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
