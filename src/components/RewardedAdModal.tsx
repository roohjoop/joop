import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Coins, 
  ExternalLink, 
  Download, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  Play,
  RotateCcw,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { RewardedAdConfig, getDeveloperAdsState, markRewardedAdShown } from '../utils/adsManager';
import { addCoinsBonus } from '../utils/coinsEngine';
import { playCustomNotificationSound } from '../utils/notifications';
import { AdReportModal } from './AdReportModal';

interface RewardedAdModalProps {
  isOpen: boolean;
  adConfig?: RewardedAdConfig;
  onComplete?: () => void;
  onRewardCompleted?: () => void;
  onClose: () => void;
  rewardContextNotice?: string;
  triggerNotice?: string;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  adConfig: propAdConfig,
  onComplete,
  onRewardCompleted,
  onClose,
  rewardContextNotice,
  triggerNotice
}) => {
  const currentAdsState = getDeveloperAdsState();
  const adConfig = propAdConfig || currentAdsState.rewardedAd;
  const displayNotice = triggerNotice || rewardContextNotice || 'شاهد الفيديو حتى نهايته لتوثيق التواصل وفتح الرقم المباشر والحصول على كوينات مجانية';

  // Video and audio state
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

  // Fallback countdown for image ads
  const [secondsRemaining, setSecondsRemaining] = useState<number>(adConfig.countdownSeconds || 10);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const rewardGrantedRef = useRef<boolean>(false);

  // Master switch check: if platform ads are disabled by developer, or not enabled, or video is missing, automatically grant and bypass
  useEffect(() => {
    const hasVideo = Boolean(adConfig.mediaUrl && adConfig.mediaUrl.trim().length > 0 && !adConfig.mediaUrl.includes('ForBiggerBlazes'));
    if (isOpen && (!currentAdsState.platformAdsEnabled || !adConfig.enabled || !hasVideo)) {
      addCoinsBonus(adConfig.rewardCoins || 5);
      if (onRewardCompleted) onRewardCompleted();
      if (onComplete) onComplete();
      onClose();
    }
  }, [isOpen, currentAdsState.platformAdsEnabled, adConfig.enabled, adConfig.mediaUrl]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Mark rewarded ad shown to record timestamp for 1-minute cooldown
      markRewardedAdShown();
      setIsCompleted(false);
      rewardGrantedRef.current = false;
      setIsMuted(true); // Always start video muted by default as requested!
      setVideoCurrentTime(0);
      setVideoProgress(0);
      setSecondsRemaining(adConfig.countdownSeconds || 10);

      // Try autoplaying video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        videoRef.current.play().catch(err => {
          console.log('Video autoplay waiting for gesture:', err);
        });
      }
    }
  }, [isOpen, adConfig.countdownSeconds, adConfig.mediaUrl]);

  // Image fallback countdown timer (only runs when NOT a video)
  useEffect(() => {
    if (!isOpen || isVideo) return;

    if (secondsRemaining <= 0) {
      if (!rewardGrantedRef.current) {
        rewardGrantedRef.current = true;
        setIsCompleted(true);
        addCoinsBonus(adConfig.rewardCoins || 5);
        playCustomNotificationSound();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!rewardGrantedRef.current) {
            rewardGrantedRef.current = true;
            setIsCompleted(true);
            addCoinsBonus(adConfig.rewardCoins || 5);
            playCustomNotificationSound();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isVideo, secondsRemaining, adConfig.rewardCoins]);

  // Handle video playback events
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

        // Check if finished (within 0.3s of end)
        if (curr >= dur - 0.3 && !rewardGrantedRef.current) {
          triggerRewardCompletion();
        }
      }
    }
  };

  const handleVideoEnded = () => {
    triggerRewardCompletion();
  };

  const triggerRewardCompletion = () => {
    if (rewardGrantedRef.current) return;
    rewardGrantedRef.current = true;
    setIsCompleted(true);
    setVideoProgress(100);
    addCoinsBonus(adConfig.rewardCoins || 5);
    playCustomNotificationSound();
  };

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  if (!isOpen) return null;

  const handleActionClick = () => {
    if (adConfig.targetUrl) {
      window.open(adConfig.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFinishAndProceed = () => {
    if (onRewardCompleted) onRewardCompleted();
    if (onComplete) onComplete();
    onClose();
  };

  // Remaining video time display
  const videoRemainingSeconds = Math.max(0, Math.ceil(videoDuration - videoCurrentTime));

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden animate-in fade-in duration-200 select-none"
        dir="rtl"
      >
      {/* 1. Top Header Bar with Standard AD Emblem, Countdown & Reward Badge */}
      <div className="px-3 sm:px-4 py-3 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between z-30 shrink-0 border-b border-white/10">
        
        {/* Unified AD Badge + Small Report Button + Coins Reward Tag */}
        <div className="flex items-center gap-2">
          {/* Distinctive Yellow Framed AD Badge */}
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

          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-md">
            <Coins className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-[11px] sm:text-xs font-black text-amber-300">
              +{adConfig.rewardCoins || 5} كوينات مجانية
            </span>
          </div>
        </div>

        {/* Video / Countdown Timer or Completion Button */}
        <div className="flex items-center gap-2">
          {!isCompleted ? (
            <div className="flex items-center gap-1.5 bg-black/80 border border-white/20 px-3 py-1 rounded-full text-xs font-mono font-black text-white backdrop-blur-md shadow-lg">
              <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              {isVideo ? (
                <span>
                  متبقي لنهاية الفيديو: {videoRemainingSeconds > 0 ? `${videoRemainingSeconds} ثانية` : 'لحظات...'}
                </span>
              ) : (
                <span>متبقي: {secondsRemaining} ثانية</span>
              )}
            </div>
          ) : (
            <button
              onClick={handleFinishAndProceed}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/40 transition-all cursor-pointer animate-bounce"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>متابعة الطلب الآن</span>
            </button>
          )}

          {/* Close button - ONLY enabled once video ends or countdown finishes */}
          {isCompleted && (
            <button
              onClick={handleFinishAndProceed}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق الإعلان"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar for video playback or countdown */}
      <div className="w-full h-1 bg-white/10 z-30 shrink-0">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 transition-all duration-200"
          style={{ 
            width: isVideo 
              ? `${videoProgress}%` 
              : `${((adConfig.countdownSeconds - secondsRemaining) / adConfig.countdownSeconds) * 100}%` 
          }}
        />
      </div>

      {/* 2. Full-Screen Visual Media Area (Video or Static Media) */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={adConfig.mediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
              autoPlay
              muted={isMuted}
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              className="w-full h-full object-contain md:max-w-4xl"
            />

            {/* Professional Floating Audio Toggle Button: Icon ONLY without words */}
            <button
              onClick={toggleSound}
              type="button"
              className={`absolute top-4 left-4 z-40 p-2.5 rounded-full backdrop-blur-md border transition-all shadow-xl cursor-pointer ${
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
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={adConfig.mediaUrl || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1000&auto=format&fit=crop&q=80'}
              alt={adConfig.title}
              className="w-full h-full object-contain md:max-w-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />
          </div>
        )}

        {/* Floating Reward Status Overlay Banner */}
        <div className="absolute top-16 left-4 right-4 z-20 flex justify-center pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-1.5 rounded-full text-xs text-slate-200 text-center font-bold shadow-xl max-w-lg">
            {isCompleted ? (
              <span className="text-emerald-400 flex items-center justify-center gap-1.5 font-black">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>اكتمل الفيديو وتمت إضافة المكافأة! يمكنك المتابعة الآن</span>
              </span>
            ) : (
              <span>{displayNotice}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Takeover Card with Standardized 55x55 pixel platform image & CTA Action */}
      <div className="p-3.5 sm:p-5 bg-gradient-to-t from-black via-slate-950/95 to-slate-950/80 flex flex-col gap-3 shrink-0 z-30 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Standardized 55x55 pixel platform ad image */}
            <div className="w-[55px] h-[55px] min-w-[55px] min-h-[55px] rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-md shrink-0 bg-slate-900 flex items-center justify-center">
              <img 
                src={adConfig.mediaUrl || '/icon.svg'} 
                alt={adConfig.title}
                className="w-[55px] h-[55px] object-cover"
              />
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 border border-yellow-300 font-mono font-black text-[9.5px] px-2 py-0.5 rounded shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                  AD
                </span>
                <h2 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                  {adConfig.title}
                </h2>
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-1">
                {adConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>إعلان رسمي معتمد</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Main CTA Button: Install or Navigate */}
          <button
            onClick={handleActionClick}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            {adConfig.buttonType === 'download' ? (
              <Download className="w-4 h-4 stroke-[3]" />
            ) : adConfig.buttonType === 'install' ? (
              <Download className="w-4 h-4 stroke-[3]" />
            ) : (
              <ExternalLink className="w-4 h-4 stroke-[3]" />
            )}
            <span>
              {adConfig.buttonLabel || (adConfig.buttonType === 'download' ? 'تحميل التطبيق الآن' : adConfig.buttonType === 'install' ? 'تثبيت التطبيق الآن' : 'زيارة الرابط')}
            </span>
          </button>

          {/* Skip / Proceed Button */}
          {isCompleted && (
            <button
              onClick={handleFinishAndProceed}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-emerald-600/30"
            >
              <span>متابعة</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>

    {/* Ad Report Reason Modal */}
    <AdReportModal
      isOpen={isReportOpen}
      adTitle={adConfig.title}
      adSponsor="إعلان مكافأة فيديو"
      adType="rewarded"
      onClose={() => setIsReportOpen(false)}
    />
    </>
  );
};
