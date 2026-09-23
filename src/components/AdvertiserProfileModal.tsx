import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Briefcase, 
  Star, 
  Clock, 
  DollarSign, 
  Copy, 
  Check, 
  Share2, 
  UserCheck,
  UserPlus,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Download
} from 'lucide-react';
import { JobPost, ActiveNavTab } from '../types';
import { BottomNav } from './BottomNav';
import { TopBannerAd } from './TopBannerAd';
import { getDefaultWhatsAppMessage } from '../utils/whatsapp';

interface AdvertiserProfileModalProps {
  post: JobPost | null;
  isOpen: boolean;
  onClose: () => void;
  allPosts: JobPost[];
  onSelectPost: (post: JobPost) => void;
  onOpenReport: (post: JobPost) => void;
  onStartChat?: (advertiserPost: JobPost) => void;
  activeNavTab?: ActiveNavTab;
  onNavTabChange?: (tab: ActiveNavTab) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenAddChoice?: () => void;
  isFollowed?: boolean;
  onToggleFollow?: (authorName: string) => void;
  onInstallApp?: () => void;
}

// Authentic WhatsApp SVG Logo
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.49 0-2.95-.4-4.22-1.15l-.3-.18-3.13.82.83-3.05-.2-.31a8.164 8.164 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.188 8.188 0 0 1 2.41 5.83c.01 4.54-3.69 8.24-8.21 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32z"/>
  </svg>
);

export const AdvertiserProfileModal: React.FC<AdvertiserProfileModalProps> = ({
  post,
  isOpen,
  onClose,
  allPosts,
  onSelectPost,
  onOpenReport,
  activeNavTab = 'home',
  onNavTabChange,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenAddChoice,
  isFollowed = false,
  onToggleFollow,
  onInstallApp
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Interactive Star Rating for the advertiser
  const [userRating, setUserRating] = useState<number>(() => {
    if (!post) return 0;
    const saved = localStorage.getItem(`shoghl_rating_${post.authorName}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);

  // Sync rating when post author changes
  useEffect(() => {
    if (post) {
      const saved = localStorage.getItem(`shoghl_rating_${post.authorName}`);
      setUserRating(saved ? parseInt(saved, 10) : 0);
    }
  }, [post?.authorName]);

  const handleRate = (stars: number) => {
    setUserRating(stars);
    if (post) {
      localStorage.setItem(`shoghl_rating_${post.authorName}`, stars.toString());
    }
    setRatingMessage(`تم تسجيل تقييمك (${stars} من 5 نجوم) للمعلن بنجاح!`);
    setTimeout(() => setRatingMessage(null), 3000);
  };

  if (!isOpen || !post) return null;

  // Find all posts published by this advertiser
  const advertiserPosts = allPosts.filter(
    (p) => p.authorName.trim().toLowerCase() === post.authorName.trim().toLowerCase()
  );

  const phoneToUse = post.authorPhone || post.whatsappNumber;
  const addressToUse = post.authorAddress || `${post.location}${post.country ? `، ${post.country}` : ''}`;
  
  // Custom advertiser description or default based on role
  const bioToUse = post.authorBio || (
    post.type === 'job'
      ? `نعمل في مجال ${post.category}. نلتزم بتوفير بيئة عمل احترافية، وتقدير الكفاءات المهنية، وتقديم حوافز ومزايا مجزية. نسعى لاستقطاب أفضل الكوادر وتطوير مهاراتهم للارتقاء بجودة المشاريع والخدمات المنفذة.`
      : `متخصص في مجال ${post.category} بخبرة تتجاوز ${post.experience}. أتميز بالدقة العالية، الالتزام بمواعيد التسليم، وجودة التنفيذ وإتقان التفاصيل. جاهز للعمل والمساهمة الفعالة في بيئة عمل طموحة وناجحة.`
  );

  const handleCopyPhone = () => {
    window.dispatchEvent(new CustomEvent('rooh_trigger_rewarded_ad', {
      detail: {
        type: 'phone',
        action: () => {
          navigator.clipboard.writeText(phoneToUse);
          setCopiedPhone(true);
          setTimeout(() => setCopiedPhone(false), 2000);
        }
      }
    }));
  };

  const handleShareProfile = () => {
    const shareText = `المعلن: ${post.authorName}\nالوظيفة: ${post.title}\nالهاتف: ${phoneToUse}`;
    if (navigator.share) {
      navigator.share({
        title: post.authorName,
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const openWhatsApp = () => {
    const rawDigits = phoneToUse.replace(/[^0-9]/g, '');
    const dynamicGreeting = getDefaultWhatsAppMessage(post);
    const textMsg = encodeURIComponent(dynamicGreeting);
    const waUrl = `https://wa.me/${rawDigits}?text=${textMsg}`;

    window.dispatchEvent(new CustomEvent('rooh_trigger_rewarded_ad', {
      detail: {
        type: 'whatsapp',
        action: () => {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }
      }
    }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full h-full bg-white border-0 sm:border sm:border-slate-200 overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top 60px Banner Ad across the Details Window */}
        <TopBannerAd />

        {/* TOP SECTION: PHOTO AT THE VERY TOP (5px from top & 5px from right) WITHOUT INNER BORDER */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-red-600 px-3 py-2 shrink-0 text-white shadow-sm flex items-center justify-between gap-2.5">
          {/* Right side (RTL): User Photo (positioned 5px from top & right of the window frame) + Advertiser Name & Role */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Photo at the top right replacing previous opportunity slot */}
            <div className="relative shrink-0">
              <img
                src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={post.authorName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-white shadow-md ring-1 ring-white/60"
                referrerPolicy="no-referrer"
              />
              {post.verified && (
                <span className="absolute -bottom-1 -left-1 bg-white text-blue-600 rounded-full p-0.5 border border-blue-600 shadow-sm" title="معتمد">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />
                </span>
              )}
            </div>

            {/* Advertiser Name & Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white leading-tight truncate drop-shadow-sm">
                  {post.authorName}
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100 font-bold truncate mt-0.5">
                {post.authorRole}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-blue-100 font-semibold mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-300 fill-current" />
                  <span>{userRating > 0 ? `${userRating}.0` : '4.9'} تقييم</span>
                </span>
                <span>•</span>
                <span>{advertiserPosts.length} إعلان منشور</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {(post.type === 'job' || post.authorRole.includes('شركة') || post.authorRole.includes('مؤسسة') || post.authorRole.includes('مصنع') || post.authorRole.includes('مجموعة') || post.authorRole.includes('صاحب عمل')) ? (
                  <span className="text-[9.5px] bg-emerald-500/30 text-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-300/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span>ملتزم بالـ 15 بنداً القانونية 100%</span>
                  </span>
                ) : (
                  <span className="text-[9.5px] bg-amber-500/30 text-amber-100 font-bold px-2 py-0.5 rounded-full border border-amber-300/50 flex items-center gap-1">
                    <span>مهني حر - خاضع لبند العمل الحر رقم 11</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Left side (RTL): Close Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-red-600 text-white backdrop-blur-md flex items-center gap-1 text-xs font-black transition-all border border-white/30 shrink-0 cursor-pointer shadow-xs active:scale-95"
              title="إغلاق النافذة والرجوع"
            >
              <span>إغلاق</span>
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Dedicated Action Bar Directly Below Personality Window: Compact Stars (No extra words) + Compact Follow, Share, Report */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50/70 to-slate-50 border-b border-blue-200 px-2 sm:px-3 py-1.5 shrink-0 overflow-x-hidden">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full max-w-full">
            
            {/* Interactive Stars Rating Component: إزالة أي كلمات للحفاظ على مساحة الإطار ومنع خروج العناصر */}
            <div 
              className="flex items-center gap-0.5 bg-white border border-amber-300 py-1 px-1.5 rounded-xl shadow-xs shrink-0" 
              dir="ltr"
              title={userRating > 0 ? `تقييمك الحالي: ${userRating} من 5 نجوم` : 'انقر للتقييم من 1 إلى 5 نجوم'}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || userRating || 0) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                    title={`تقييم ${star} نجوم`}
                  >
                    <Star 
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-300 hover:text-amber-300'
                      }`} 
                    />
                  </button>
                );
              })}
            </div>

            {/* Action Buttons: Compact Follow, Share, Report */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* 1. زر متابعة مخفّض الحجم */}
              <button
                onClick={() => onToggleFollow?.(post.authorName)}
                className={`py-1.5 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer border shrink-0 ${
                  isFollowed 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-500/20' 
                    : 'bg-white hover:bg-blue-600 text-blue-700 hover:text-white border-blue-300 hover:border-blue-600'
                }`}
                title={isFollowed ? 'إلغاء المتابعة' : 'متابعة هذا المعلن'}
              >
                {isFollowed ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>مُتابَع</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>متابعة</span>
                  </>
                )}
              </button>

              {/* 2. زر المشاركة مخفّض الحجم */}
              <button
                onClick={handleShareProfile}
                className="py-1.5 px-2 sm:px-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-400 text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                title="مشاركة إعلان هذا المعلن"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة</span>
                  </>
                )}
              </button>

              {/* 3. زر الإبلاغ */}
              <button
                onClick={() => {
                  onClose();
                  onOpenReport(post);
                }}
                className="py-1.5 px-2 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                title="إبلاغ الدعم الفني عن مخالفة"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">إبلاغ</span>
              </button>
            </div>

          </div>

          {/* Toast Message upon Rating */}
          {ratingMessage && (
            <div className="mt-1 text-center animate-in fade-in duration-200">
              <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 px-3 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                ★ {ratingMessage}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Profile Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          
          {/* DISCLAIMER BANNER: المنصة غير مسؤولة عن أي وظائف */}
          <div className="bg-amber-50 border-2 border-amber-300/90 rounded-2xl p-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-right">
                <h4 className="text-xs font-black text-amber-900 mb-0.5">
                  تنبيه وإخلاء مسؤولية المنصة:
                </h4>
                <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                  المنصة وسيط إعلاني لعرض الفرص والطلبات فقط، و<strong>المنصة غير مسؤولة عن أي وظائف أو معاملات مالية أو اتفاقات</strong>. التواصل والتفاوض يتم حصراً ومباشرة مع صاحب الإعلان عبر الواتساب أو رقم الهاتف.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Contact Box: Phone & WhatsApp & Address */}
          <div className="bg-gradient-to-br from-blue-50/90 to-slate-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-blue-950 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>بيانات التواصل المباشر الموفرة من قبل المعلن</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold">اتصال أو واتساب</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Phone Number Box */}
              <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 block">رقم الهاتف للاتصال المباشر:</span>
                  <span className="text-sm font-black text-slate-900 dir-ltr inline-block tracking-wider">
                    {phoneToUse}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyPhone}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="نسخ رقم الهاتف"
                  >
                    {copiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`tel:${phoneToUse}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>

              {/* WhatsApp Quick Action */}
              <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">محادثة واتساب الرسمية:</span>
                  <span className="text-xs font-black text-emerald-700">متاح وجاهز للرد</span>
                </div>
                <button
                  onClick={openWhatsApp}
                  className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  <span>واتساب</span>
                </button>
              </div>

            </div>

            {/* Address / Location Box */}
            <div className="bg-white rounded-xl p-3 border border-red-100 shadow-sm flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-500 block">العنوان والموقع الجغرافي المعلن:</span>
                <p className="text-xs font-black text-slate-900 leading-snug">
                  {addressToUse}
                </p>
                <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">
                  المنطقة: {post.location} • الدولة: {post.country || 'مصر'}
                </span>
              </div>
            </div>

          </div>

          {/* Section 1: Advertiser's Own Bio & Description */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>نبذة وشرح المعلن عن نفسه ونشاطه</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {bioToUse}
            </p>
          </div>

          {/* Section 2: Detailed Explanation of Current Job / Opportunity */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <h3 className="text-xs sm:text-sm font-black text-blue-950 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-red-600" />
                <span>تفاصيل وشرح الوظيفة الحالية المعلنة</span>
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white">
                {post.workType || 'دوام كامل'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">
                {post.title}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {post.description}
              </p>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold block">التخصص:</span>
                <span className="font-black text-slate-900 truncate block">{post.category}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block">الراتب / المقابل:</span>
                <span className="font-black text-emerald-900 truncate block">{post.salary}</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-purple-700 font-bold block">الخبرة المطلوبة:</span>
                <span className="font-black text-purple-900 truncate block">{post.experience}</span>
              </div>
            </div>
          </div>

          {/* Direct In-Profile Report Section (زر إبلاغ داخل الصفحة) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50/80 border-2 border-red-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-red-950 block">هل لاحظت أي إعلان وهمي أو مخالفة؟</span>
                <span className="text-[10px] text-red-700 font-medium block">فريق الدعم الفني يراجع كافة البلاغات فوراً</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenReport(post);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 shrink-0"
            >
              إبلاغ
            </button>
          </div>

          {/* Section 3: All Other Posts by this Advertiser */}
          {advertiserPosts.length > 0 && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>إعلانات أخرى من هذا المعلن</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ({advertiserPosts.length})
                </span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {advertiserPosts.map((advPost) => (
                  <div
                    key={advPost.id}
                    onClick={() => {
                      onSelectPost(advPost);
                      onClose();
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      advPost.id === post.id
                        ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <h5 className="text-xs font-black text-slate-900 truncate">
                        {advPost.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {advPost.category} • {advPost.salary}
                      </p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-700 shrink-0">
                      {advPost.id === post.id ? 'الإعلان الحالي' : 'عرض الإعلان'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sticky Action Footer: زر واتساب وزر اتصال بنفس الحجم وبجانبه إمكانية نسخ الرقم لاستغلال المساحة */}
        <div className="p-2.5 sm:p-3.5 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center gap-2">
          {/* 1. زر واتساب */}
          <button
            onClick={openWhatsApp}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1EBE5D] hover:from-[#20ba5a] hover:to-[#19a550] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
            title="محادثة واتساب مباشرة"
          >
            <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-white shrink-0" />
            <span>واتساب</span>
          </button>

          {/* 2. زر اتصال (بنفس حجم زر واتساب تماماً) */}
          <a
            href={`tel:${phoneToUse}`}
            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer text-center"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>اتصال</span>
          </a>

          {/* 3. زر تحميل وتثبيت التطبيق بدلاً من زر نسخ الرقم السابق */}
          <button
            onClick={() => onInstallApp && onInstallApp()}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 transition-all active:scale-95 shrink-0 cursor-pointer"
            title="تثبيت التطبيق بالكامل على سطح المكتب أو هاتفك"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">تثبيت التطبيق</span>
          </button>
        </div>

      </div>
    </div>
  );
};
