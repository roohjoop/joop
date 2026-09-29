import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  Clock, 
  ChevronLeft,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { InterstitialAdConfig, getDeveloperAdsState, markInterstitialAdShown } from '../utils/adsManager';
import { AdReportModal } from './AdReportModal';

interface InterstitialAdModalProps {
  isOpen: boolean;
  adConfig?: InterstitialAdConfig;
  onClose: () => void;
  onAdClick?: (ad: any) => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  adConfig: propAdConfig,
  onClose,
  onAdClick
}) => {
  const currentAdsState = getDeveloperAdsState();
  const adConfig = propAdConfig || currentAdsState.interstitialAd;

  // Master switch: if platform ads are disabled, or not enabled, or video is missing, do not show
  useEffect(() => {
    const hasVideo = Boolean(adConfig.mediaUrl && adConfig.mediaUrl.trim().length > 0 && !adConfig.mediaUrl.includes('ForBiggerBlazes'));
    if (isOpen && (!currentAdsState.platformAdsEnabled || !adConfig.enabled || !hasVideo)) {
      onClose();
    }
  }, [isOpen, currentAdsState.platformAdsEnabled, adConfig.enabled, adConfig.mediaUrl]);

  const isVideo = adConfig.mediaType === 'video' || Boolean(
    adConfig.mediaUrl && (
      adConfig.mediaUrl.endsWith('.mp4') || 
      adConfig.mediaUrl.endsWith('.webm') || 
      adConfig.mediaUrl.includes('sample/ForBigger') ||
      adConfig.mediaUrl.includes('video')
    )
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Static countdown for image mode
  const [skipRemaining, setSkipRemaining] = useState<number>(adConfig.durationSeconds || 5);
  const [canSkip, setCanSkip] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Mark interstitial ad shown timestamp to enforce 1-minute cooldown
      markInterstitialAdShown();
      setCanSkip(false);
      setIsMuted(true); // Always start video muted by default
      setVideoCurrentTime(0);
      setVideoProgress(0);
      setSkipRemaining(adConfig.durationSeconds || 5);

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        videoRef.current.play().catch(e => {
          console.log('Video autoplay error:', e);
        });
      }
    }
  }, [isOpen, adConfig.durationSeconds, adConfig.mediaUrl]);

  // Image mode countdown
  useEffect(() => {
    if (!isOpen || isVideo) return;

    if (skipRemaining <= 0) {
      setCanSkip(true);
      return;
    }

    const timer = setInterval(() => {
      setSkipRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isVideo, skipRemaining]);

  // Video metadata & time update
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && dur > 0) {
        setVideoDuration(dur);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      const dur = videoRef.current.duration || videoDuration;
      setVideoCurrentTime(curr);
      if (dur > 0) {
        const pct = Math.min((curr / dur) * 100, 100);
        setVideoProgress(pct);

        // In video mode: allow skip once video reaches its end
        if (curr >= dur - 0.3) {
          setCanSkip(true);
        }
      }
    }
  };

  const handleVideoEnded = () => {
    setCanSkip(true);
    setVideoProgress(100);
  };

  const toggleSound = () => {
    if (videoRef.current) {
      const next = !isMuted;
      videoRef.current.muted = next;
      setIsMuted(next);
    } else {
      setIsMuted(!isMuted);
    }
  };

  if (!isOpen) return null;

  const handleAction = () => {
    if (onAdClick) {
      onAdClick(adConfig);
    } else if (adConfig.targetUrl) {
      window.open(adConfig.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const videoRemainingSeconds = Math.max(0, Math.ceil(videoDuration - videoCurrentTime));

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200 select-none"
        dir="rtl"
      >
        <div 
          className="w-full h-[100dvh] sm:h-auto sm:max-w-lg sm:max-h-[90vh] bg-slate-900 border-0 sm:border sm:border-slate-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        >
          {/* Top bar with Unified AD Tag, Small Report Button, and Skip/Countdown timer */}
          <div className="px-4 py-3 bg-gradient-to-b from-black/90 via-black/70 to-transparent flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-2">
              {/* Distinctive Yellow Framed AD Emblem Badge */}
              <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md border-2 border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.6)] font-mono tracking-wider">
                AD
              </span>

              {/* Small Report Button on Ad Window (زر إبلاغ صغير) */}
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 bg-black/60 hover:bg-black/90 border border-slate-700/60 text-amber-300 hover:text-white px-2.5 py-1 rounded-full text-[10.5px] font-bold backdrop-blur-md transition-all cursor-pointer shadow-xs"
                title="إبلاغ الدعم عن هذا الإعلان"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>إبلاغ</span>
              </button>
            </div>

            <div>
              {canSkip ? (
                <button
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md animate-pulse"
                >
                  <span>تخطي الإعلان</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-black/70 border border-white/20 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-slate-200 backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  {isVideo ? (
                    <span>
                      متبقي لنهاية الفيديو: {videoRemainingSeconds > 0 ? `${videoRemainingSeconds} ث` : 'لحظات...'}
                    </span>
                  ) : (
                    <span>تخطي خلال: {skipRemaining} ث</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 z-30 shrink-0">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-blue-500 transition-all duration-200"
              style={{ 
                width: isVideo 
                  ? `${videoProgress}%` 
                  : `${((adConfig.durationSeconds - skipRemaining) / adConfig.durationSeconds) * 100}%` 
              }}
            />
          </div>

          {/* Media Container with Video/Image & Sound Toggle */}
          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            {isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  src={adConfig.mediaUrl}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain"
                />

                {/* Mute/Unmute audio button: Icon ONLY without words */}
                <button
                  onClick={toggleSound}
                  type="button"
                  className={`absolute top-3 left-3 z-30 p-2.5 rounded-full backdrop-blur-md border transition-all shadow-xl cursor-pointer ${
                    isMuted 
                      ? 'bg-black/80 hover:bg-black border-yellow-400/80 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]' 
                      : 'bg-emerald-600/90 hover:bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  }`}
                  title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                  aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Volume2 className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>
            ) : (
              <img
                src={adConfig.mediaUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80'}
                alt={adConfig.title}
                className="w-full h-full object-contain"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Bottom Action Footer with Standardized 55x55 pixel platform image */}
          <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0 z-30">
            <div className="flex items-center gap-3">
              {/* Standardized 55x55 pixel platform ad image */}
              <div className="w-[55px] h-[55px] min-w-[55px] min-h-[55px] rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-md shrink-0 bg-slate-900 flex items-center justify-center">
                <img 
                  src={adConfig.mediaUrl || '/icon.svg'} 
                  alt={adConfig.sponsorName}
                  className="w-[55px] h-[55px] object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 border border-yellow-300 font-mono text-[9px] font-black px-1.5 py-0.2 rounded shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                    AD
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 truncate">
                    {adConfig.sponsorName}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight line-clamp-2">
                  {adConfig.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAction}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                {adConfig.buttonType === 'download' ? (
                  <Download className="w-4 h-4 stroke-[2.5]" />
                ) : adConfig.buttonType === 'install' ? (
                  <Download className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>
                  {adConfig.buttonLabel || (adConfig.buttonType === 'download' ? 'تحميل التطبيق الآن' : adConfig.buttonType === 'install' ? 'تثبيت التطبيق' : 'زيارة الرابط')}
                </span>
              </button>

              {canSkip && (
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                >
                  إغلاق
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Ad Report Reason Modal */}
      <AdReportModal
        isOpen={isReportOpen}
        adTitle={adConfig.title}
        adSponsor={adConfig.sponsorName}
        adType="interstitial"
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
};
