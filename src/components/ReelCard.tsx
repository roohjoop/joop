import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Pause, 
  Play, 
  ShieldAlert, 
  ArrowUp,
  ExternalLink,
  Tag,
  Building2,
  Info,
  UserPlus,
  UserCheck,
  Download,
  Sparkles
} from 'lucide-react';
import { JobPost } from '../types';
import { generateWhatsAppUrl, detectCountryFromPhone, getDefaultWhatsAppMessage } from '../utils/whatsapp';

// Authentic WhatsApp SVG Logo component
const WhatsAppLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.797.813 3.179 0 5.767-2.587 5.767-5.766.001-3.181-2.586-5.768-5.768-5.768zm7.969 5.768c0 4.414-3.586 8-8 8-1.378 0-2.433-.35-3.535-.937l-4.465 1.171 1.194-4.359c-.687-1.19-1.194-2.39-1.194-3.875 0-4.414 3.586-8 8-8s8 3.586 8 8zm-4.385 2.193c-.1-.167-.367-.267-.768-.467-.4-.2-2.368-1.168-2.735-1.301-.367-.133-.634-.2-.901.2-.267.4-1.034 1.301-1.268 1.568-.233.267-.467.3-.867.1-.4-.2-1.691-.623-3.221-1.987-1.19-1.061-1.993-2.372-2.227-2.772-.233-.4-.025-.616.175-.815.18-.179.4-.467.6-.7.2-.233.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.901-2.168-1.235-2.969-.324-.779-.653-.674-.9-.686-.233-.012-.5-.015-.767-.015s-.7.1-.1.067.433 1.034 1.634 1.034 3.501c0 1.867 1.368 3.668 1.568 3.934.2.267 2.692 4.11 6.523 5.762.911.393 1.622.628 2.176.804.914.291 1.746.25 2.404.152.733-.11 2.256-.922 2.576-1.811.32-.889.32-1.649.224-1.811z" />
  </svg>
);

interface ReelCardProps {
  post: JobPost;
  isActive: boolean;
  isDesktopGrid: boolean;
  isAutoAdvanceActive: boolean;
  onAdvanceNext: () => void;
  onAdvancePrev?: () => void;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onOpenComments: (post: JobPost) => void;
  onOpenReport?: (post: JobPost) => void;
  onOpenAdvertiserProfile: (post: JobPost) => void;
  isFollowed?: boolean;
  onToggleFollow?: (authorName: string) => void;
  onInstallApp?: () => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  post,
  isActive,
  isDesktopGrid,
  isAutoAdvanceActive,
  onAdvanceNext,
  onAdvancePrev,
  onLike,
  onBookmark,
  onOpenComments,
  onOpenReport,
  onOpenAdvertiserProfile,
  isFollowed = false,
  onToggleFollow,
  onInstallApp
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const wheelCooldownRef = useRef<boolean>(false);

  const DURATION_MS = 10000; // 10 seconds auto-advance duration
  const INTERVAL_MS = 100;

  // Detect country info if not explicitly set
  const detectedCountry = post.country 
    ? null 
    : detectCountryFromPhone(post.whatsappNumber || post.whatsappLink || '');

  const displayCountryFlag = post.countryCode === '+20' || post.country === 'مصر' ? '🇪🇬' 
    : post.countryCode === '+966' || post.country === 'السعودية' ? '🇸🇦'
    : post.countryCode === '+971' || post.country === 'الإمارات' ? '🇦🇪'
    : detectedCountry?.flag || '📍';

  // 10-second auto-advance progress timer
  useEffect(() => {
    if (!isActive || !isAutoAdvanceActive || isPaused) {
      if (!isActive) {
        setProgress(0);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setProgress(0);
    const startTime = Date.now();

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min((elapsed / DURATION_MS) * 100, 100);
      setProgress(currentPct);

      if (elapsed >= DURATION_MS) {
        if (timerRef.current) clearInterval(timerRef.current);
        onAdvanceNext();
      }
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isAutoAdvanceActive, isPaused, post.id, onAdvanceNext]);

  // Mouse Wheel Gesture Handler (smooth upward/downward scroll between cards)
  const handleWheel = (e: React.WheelEvent) => {
    if (isDesktopGrid) return;
    if (wheelCooldownRef.current) return;

    if (Math.abs(e.deltaY) > 40) {
      wheelCooldownRef.current = true;
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 500);

      if (e.deltaY > 0) {
        onAdvanceNext();
      } else if (onAdvancePrev) {
        onAdvancePrev();
      }
    }
  };

  // Direct WhatsApp messaging with dynamic greeting based on employer vs seeker intent
  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dynamicGreeting = getDefaultWhatsAppMessage(post);
    const targetUrl = generateWhatsAppUrl(
      post.whatsappNumber || post.authorPhone || '',
      post.countryCode,
      dynamicGreeting
    );
    
    if (targetUrl) {
      window.dispatchEvent(new CustomEvent('rooh_trigger_rewarded_ad', {
        detail: {
          type: 'whatsapp',
          action: () => {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          }
        }
      }));
    }
  };

  return (
    <div 
      className={`relative overflow-hidden shadow-xl border border-slate-200/90 hover:border-slate-300 bg-white flex flex-col justify-between select-none group transition-all ${
        isDesktopGrid 
          ? 'w-full max-w-[360px] min-h-[540px] h-[560px] shrink-0 rounded-3xl' 
          : 'w-full h-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl mx-auto'
      }`}
      onWheel={handleWheel}
      dir="rtl"
    >
      {/* 1. Backdrop Thematic Visual Image with Light, Airy Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={post.backdropImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80'}
          alt={post.title}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Soft, crisp white and light blue gradient background */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-blue-50/85" />
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />
      </div>

      {/* 2. Top Progress Bar for 10-Second Auto-Advance */}
      <div className="relative z-10 w-full px-3 pt-2 pb-0.5 shrink-0">
        <div className="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-red-600 transition-all duration-100 ease-linear shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 3. Internal Content Container - Rich, prominent, filling the window cleanly */}
      <div className="relative z-10 flex-1 min-h-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex flex-col justify-between overflow-hidden gap-1.5 sm:gap-2">
        
        {/* Attractive Brand Badge Window inside the Reel Card ("داخل النافذة المتحركة نافذة بها العلامة بشكل جذاب") */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-red-900/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm border border-white/20">
            <img src="/icon.svg" alt="العلامة" className="w-4 h-4 rounded-md shadow-xs object-cover" />
            <span className="text-[10px] font-black tracking-wide">منصة شغل وتقنيه</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Pause / Play Auto Advance & Quick Type Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-xl font-black shadow-xs whitespace-nowrap ${
              post.type === 'job' 
                ? 'bg-red-600 text-white shadow-red-500/20' 
                : 'bg-blue-600 text-white shadow-blue-500/20'
            }`}>
              {post.type === 'job' ? 'فرصة عمل' : 'طلب عمل'}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              className="p-1 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-xs border border-slate-200 transition-colors"
              title={isPaused ? "استئناف التمرير التلقائي (10 ثوانٍ)" : "إيقاف مؤقت للتمرير"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" /> : <Pause className="w-3.5 h-3.5 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* SECTION A: User / Company Header with Follow Button across windows */}
        <div 
          onClick={() => onOpenAdvertiserProfile(post)}
          className="bg-white/95 backdrop-blur-sm border border-slate-200 hover:border-blue-400 rounded-2xl p-2 sm:p-2.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-2 shrink-0 cursor-pointer group/hdr"
          title="انقر لرؤية تفاصيل الوظيفة ورقم الهاتف والعنوان والتواصل المباشر"
        >
          {/* User Profile Picture & Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Profile Avatar */}
            <div className="relative shrink-0">
              <img
                src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={post.authorName}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-blue-600 shadow-sm ring-1 ring-blue-100 group-hover/hdr:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              {post.verified && (
                <span className="absolute -bottom-1 -left-1 bg-blue-600 text-white rounded-full p-0.5 border border-white shadow-sm" title="حساب موثق">
                  <CheckCircle2 className="w-3 h-3 text-white fill-current" />
                </span>
              )}
            </div>

            {/* Name & Role */}
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover/hdr:text-blue-700 transition-colors truncate">
                {post.authorName}
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-700 font-bold truncate mt-0.5">
                {post.authorRole} • <span className="text-slate-500 font-medium">{post.createdAt}</span>
              </p>
            </div>
          </div>

          {/* Follow Button ("زر المتابعة على جميع النوافذ لكي يتمكن أي مستخدم من متابعة المستخدمين الآخرين") */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleFollow && onToggleFollow(post.authorName)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95 shadow-xs ${
                isFollowed
                  ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
              title={isFollowed ? 'إلغاء المتابعة' : 'متابعة هذا المستخدم'}
            >
              {isFollowed ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>أتابعه</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>متابعة</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION B: Central Job Card Details */}
        <div 
          onClick={() => onOpenAdvertiserProfile(post)}
          className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-2.5 sm:p-3.5 shadow-sm flex flex-col justify-between flex-1 min-h-0 overflow-y-auto no-scrollbar cursor-pointer hover:border-blue-300 transition-colors"
        >
          {/* Top Title & Category */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 inline-flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-600" />
                {post.category}
              </span>
              {post.workType && (
                <span className="text-[9.5px] sm:text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                  {post.workType}
                </span>
              )}
            </div>

            <h2 className="text-xs sm:text-base font-black text-slate-900 leading-snug line-clamp-2">
              {post.title}
            </h2>
          </div>

          {/* Core Info Grid: Salary, Location */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 my-1 sm:my-2 py-1 sm:py-2 border-y border-slate-100">
            {/* Salary */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-[8.5px] sm:text-[9px] text-slate-500 font-bold">الراتب / المقابل</p>
                <p className="text-[11px] sm:text-xs font-black text-emerald-800 truncate">{post.salary}</p>
              </div>
            </div>

            {/* Location & Country */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xs sm:text-sm">
                {displayCountryFlag}
              </div>
              <div className="min-w-0">
                <p className="text-[8.5px] sm:text-[9px] text-slate-500 font-bold">الموقع والدولة</p>
                <p className="text-[11px] sm:text-xs font-black text-slate-900 truncate">
                  {post.location || post.country || 'مصر'}
                </p>
              </div>
            </div>
          </div>

          {/* Description Excerpt & Tags */}
          <div className="space-y-1 sm:space-y-1.5">
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
              {post.description}
            </p>

            {/* Tags Pills */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-100">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* SECTION C: UNIFIED BOTTOM ACTION BAR INSIDE THE WINDOW */}
        <div className="pt-1.5 sm:pt-2 pb-0.5 border-t border-slate-200/90 flex flex-col gap-1 sm:gap-1.5 shrink-0 z-10">
          
          {/* Row 1: WhatsApp button + Details button with matching balanced sizes + Download Button beside them */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full shrink-0">
            {/* Direct WhatsApp Button (Balanced Size) */}
            <button
              onClick={openWhatsApp}
              className="flex-1 bg-gradient-to-r from-[#25D366] to-[#1EBE5D] hover:from-[#20ba5a] hover:to-[#19a550] text-white font-black py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98 transition-all shrink-0 cursor-pointer min-w-0"
              title="مراسلة واتساب فورية مباشرة"
            >
              <WhatsAppLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
              <span className="truncate">مراسلة واتساب</span>
            </button>

            {/* Details Button - Matching balanced size to WhatsApp button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAdvertiserProfile(post);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0 cursor-pointer border border-blue-700 min-w-0"
              title="عرض التفاصيل الكاملة ورقم الهاتف والعنوان"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">التفاصيل</span>
            </button>

            {/* Download / Install App Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onInstallApp) onInstallApp();
              }}
              className="w-9 h-8 sm:w-11 sm:h-9.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white flex items-center justify-center shadow-md shadow-red-500/25 active:scale-90 transition-all shrink-0 cursor-pointer group/dl border border-red-500 relative"
              title="تثبيت التطبيق على هاتفك أو سطح المكتب مباشرة"
              aria-label="تثبيت التطبيق"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] group-hover/dl:translate-y-0.5 transition-transform" />
              {/* Subtle sparkle indicator */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
            </button>
          </div>

          {/* Row 2: Engagement Buttons Row (Like, Comment, Save, Report) */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            
            {/* 1. Like Button with Count */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(post.id);
              }}
              className={`py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-xl flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-all border ${
                post.isLiked
                  ? 'bg-red-50 text-red-600 border-red-300 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={post.isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
            >
              <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-red-600 text-red-600 scale-110' : 'text-slate-500'}`} />
              <span className="font-black">{post.likesCount}</span>
            </button>

            {/* 2. Comments / Inquiries Button with Count */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments(post);
              }}
              className="py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-all shadow-xs"
              title="الاستفسارات والتعليقات"
            >
              <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-black">{post.commentsCount}</span>
            </button>

            {/* 3. Save / Bookmark Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(post.id);
              }}
              className={`py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-xl flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-all border ${
                post.isSaved
                  ? 'bg-blue-50 text-blue-600 border-blue-300 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={post.isSaved ? 'محفوظ في المفضلة' : 'حفظ الإعلان'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${post.isSaved ? 'fill-blue-600 text-blue-600' : 'text-slate-500'}`} />
              <span>{post.isSaved ? 'محفوظ' : 'حفظ'}</span>
            </button>

            {/* 4. Report Button (إبلاغ للدعم) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenReport) {
                  onOpenReport(post);
                }
              }}
              className="py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-xl bg-red-50/60 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-all active:scale-95"
              title="إبلاغ الدعم الفني عن مخالفة"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>إبلاغ</span>
            </button>

          </div>

        </div>

      </div>

      {/* 4. Swipe Up Hint Bar (Discreet at Bottom only in Mobile Single-Reel Mode) */}
      {!isDesktopGrid && (
        <div className="relative z-10 w-full py-0.5 sm:py-1 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-center gap-1.5 text-[9.5px] sm:text-[10px] font-bold text-slate-600 shrink-0">
          <ArrowUp className="w-3 h-3 text-blue-600 animate-bounce" />
          <span>اسحب للأعلى أو استخدم الأسهم للانتقال للإعلان التالي</span>
        </div>
      )}

    </div>
  );
};
