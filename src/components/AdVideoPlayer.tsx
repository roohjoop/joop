import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, AlertCircle, Play } from 'lucide-react';
import { resolveVideoInfo } from '../utils/videoResolver';

interface AdVideoPlayerProps {
  videoUrl?: string;
  posterImage?: string;
  title?: string;
  isMuted?: boolean;
  autoPlay?: boolean;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
}

export const AdVideoPlayer: React.FC<AdVideoPlayerProps> = ({
  videoUrl,
  posterImage,
  title = 'إعلان فيديو',
  isMuted = true,
  autoPlay = true,
  className = 'w-full h-full',
  aspectRatio = 'video'
}) => {
  const [localMuted, setLocalMuted] = useState(isMuted);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!videoUrl && !posterImage) {
    return (
      <div className={`bg-slate-900 flex items-center justify-center text-slate-500 text-xs ${className}`}>
        <span>لا يوجد فيديو متوفر</span>
      </div>
    );
  }

  const videoInfo = resolveVideoInfo(videoUrl, localMuted, autoPlay);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const next = !localMuted;
      videoRef.current.muted = next;
      setLocalMuted(next);
    } else {
      setLocalMuted(!localMuted);
    }
  };

  // 1. YouTube Video Embed
  if (videoInfo.platform === 'youtube') {
    return (
      <div className={`relative bg-black overflow-hidden ${aspectRatio === 'video' ? 'aspect-video' : ''} ${className}`}>
        <iframe
          src={videoInfo.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      </div>
    );
  }

  // 2. Facebook Video Embed
  if (videoInfo.platform === 'facebook') {
    return (
      <div className={`relative bg-black overflow-hidden flex items-center justify-center ${aspectRatio === 'video' ? 'aspect-video' : ''} ${className}`}>
        <iframe
          src={videoInfo.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
          scrolling="no"
        />
      </div>
    );
  }

  // 3. TikTok Video Embed
  if (videoInfo.platform === 'tiktok') {
    return (
      <div className={`relative bg-black overflow-hidden flex items-center justify-center ${aspectRatio === 'video' ? 'aspect-video' : ''} ${className}`}>
        <iframe
          src={videoInfo.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
          scrolling="no"
        />
      </div>
    );
  }

  // 4. HTML5 Direct Video
  if (videoInfo.platform === 'html5') {
    return (
      <div className={`relative bg-black flex items-center justify-center overflow-hidden ${aspectRatio === 'video' ? 'aspect-video' : ''} ${className}`}>
        <video
          ref={videoRef}
          src={videoInfo.rawUrl}
          poster={posterImage}
          autoPlay={autoPlay}
          muted={localMuted}
          playsInline
          loop
          className="w-full h-full object-contain mx-auto bg-black"
        />

        {/* Sound toggle button */}
        <button
          type="button"
          onClick={toggleSound}
          className={`absolute top-2 left-2 z-20 p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-md ${
            localMuted
              ? 'bg-black/80 hover:bg-black border-yellow-400/80 text-yellow-400'
              : 'bg-emerald-600/90 hover:bg-emerald-600 border-emerald-400 text-white'
          }`}
          title={localMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
        >
          {localMuted ? <VolumeX className="w-3.5 h-3.5 stroke-[2.5]" /> : <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>
      </div>
    );
  }

  // Fallback: Image poster
  if (posterImage) {
    return (
      <div className={`relative bg-black flex items-center justify-center overflow-hidden ${aspectRatio === 'video' ? 'aspect-video' : ''} ${className}`}>
        <img
          src={posterImage}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 flex items-center justify-center text-slate-400 text-xs p-3 text-center ${className}`}>
      <AlertCircle className="w-4 h-4 text-amber-500 mb-1" />
      <span>تعذر تشغيل رابط الفيديو، يرجى التأكد من صحة الرابط</span>
    </div>
  );
};
