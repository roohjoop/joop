import React, { useState } from 'react';
import { 
  Search, 
  Briefcase, 
  UserCheck, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause, 
  LayoutGrid, 
  Smartphone,
  Check,
  ExternalLink
} from 'lucide-react';
import { ListingType, JobPost } from '../types';

interface UnifiedSearchFilterBarProps {
  activeTab: ListingType;
  setActiveTab: (tab: ListingType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalFilteredCount: number;
  jobCount?: number;
  seekerCount?: number;
  lastInteractedPost?: JobPost | null;
  similarJobsCount?: number;
  onOpenSimilarJobs?: () => void;
  isDesktopGrid?: boolean;
  setIsDesktopGrid?: (val: boolean) => void;
  isAutoAdvanceActive?: boolean;
  setIsAutoAdvanceActive?: (val: boolean) => void;
  onOpenAboutUs?: () => void;
  onOpenPolicy?: () => void;
  onOpenPersons?: () => void;
  isMobile?: boolean;
  onToggleCollapse?: () => void;
}

export const UnifiedSearchFilterBar: React.FC<UnifiedSearchFilterBarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  totalFilteredCount,
  jobCount = 0,
  seekerCount = 0,
  lastInteractedPost,
  similarJobsCount = 0,
  onOpenSimilarJobs,
  isDesktopGrid,
  setIsDesktopGrid,
  isAutoAdvanceActive,
  setIsAutoAdvanceActive,
  onOpenAboutUs,
  onOpenPolicy,
  onOpenPersons,
  isMobile,
  onToggleCollapse
}) => {
  // Toggle for the sub-windows: "بحث عن عامل" & "بحث عن عمل"
  const [isJobsOpen, setIsJobsOpen] = useState(false);

  return (
    <div 
      className="w-full bg-white/95 backdrop-blur-md border-t border-b border-blue-200 shadow-md shrink-0 z-30 transition-all select-none"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto px-1.5 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        
        {/* 1. اليمين: مربع البحث بدلاً من نافذة وظائف متاحة مقتسماً للمساحة بمرونة واحترافية */}
        <div className="relative flex-1 min-w-[120px] sm:min-w-[180px] h-9 sm:h-10">
          <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'job'
                ? 'ابحث: مهندس، مندوب، سائق، الإسكندرية...'
                : 'ابحث في الكفاءات: مهارة، تخصص، فني...'
            }
            className={`w-full h-full bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-[11px] sm:text-xs font-bold rounded-xl pr-7 sm:pr-8 pl-7 sm:pl-8 border border-blue-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-inner ${
              lastInteractedPost && similarJobsCount > 0 && onOpenSimilarJobs ? 'pl-20 sm:pl-24' : 'pl-7 sm:pl-8'
            }`}
          />

          {/* داخل مربع البحث: زر المسح (X) أو زر الوظائف المشابهة */}
          <div className="absolute left-1 sm:left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                title="مسح نص البحث"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}

            {lastInteractedPost && similarJobsCount > 0 && onOpenSimilarJobs && (
              <button
                type="button"
                onClick={onOpenSimilarJobs}
                className="animate-in fade-in zoom-in-95 duration-200 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black shadow-xs flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="عرض وظائف مشابهة للتي أعجبتك"
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 fill-amber-300 animate-pulse" />
                <span className="hidden md:inline">مشابه:</span>
                <span className="bg-white text-slate-900 font-extrabold px-1 rounded-xs">
                  {similarJobsCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 2. بجانب مربع البحث: نافذة الوظائف التفاعلية */}
        <div className="flex items-center gap-1 shrink-0">
          {!isJobsOpen ? (
            <button
              type="button"
              onClick={() => setIsJobsOpen(true)}
              className={`h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-[11px] sm:text-xs font-black shrink-0 border cursor-pointer active:scale-95 shadow-xs ${
                activeTab === 'job'
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-red-50 hover:bg-red-100 text-red-900 border-red-300'
              }`}
              title="انقر لفتح خيارات: وظائف متوفرة أو بحث عن عمل"
            >
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="whitespace-nowrap font-extrabold">الوظائف</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>
          ) : (
            /* عند النقر: تختفي نافذة الوظائف ويظهر مكانها الخيارات بطريقة مختصرة واحترافية لا تأخذ حجماً أكبر */
            <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 border border-slate-200 rounded-xl shrink-0 animate-in fade-in zoom-in-95 duration-150">
              {/* خيار 1: وظائف متوفرة */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('job');
                }}
                className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'job'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-blue-700 hover:bg-white/80'
                }`}
                title="عرض الوظائف المتوفرة (بحث عن شخص للعمل)"
              >
                <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="whitespace-nowrap">وظائف متوفرة</span>
                {jobCount > 0 && (
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold min-w-3.5 text-center ${
                    activeTab === 'job' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {jobCount}
                  </span>
                )}
                {activeTab === 'job' && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              {/* خيار 2: بحث عن عمل */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('seeker');
                }}
                className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'seeker'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-red-700 hover:bg-white/80'
                }`}
                title="عرض طلبات الباحثين عن عمل (بحث عن عمل)"
              >
                <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="whitespace-nowrap">بحث عن عمل</span>
                {seekerCount > 0 && (
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold min-w-3.5 text-center ${
                    activeTab === 'seeker' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'
                  }`}>
                    {seekerCount}
                  </span>
                )}
                {activeTab === 'seeker' && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              {/* زر مصغر للإغلاق والعودة لنافذة الوظائف */}
              <button
                type="button"
                onClick={() => setIsJobsOpen(false)}
                className="h-8 w-6 sm:h-9 sm:w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="إغلاق والعودة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 3. زر موحد يجمع "السياسة ومن نحن" برسمة السياسة في نافذة واحدة */}
        {(onOpenPolicy || onOpenAboutUs) && (
          <button
            type="button"
            onClick={onOpenPolicy || onOpenAboutUs}
            title="السياسة ومن نحن — شروط الاستخدام والـ 15 بنداً القانونية وإخلاء المسؤولية والتعريف بالمنصة"
            className="h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-blue-100 text-slate-800 hover:text-blue-900 border border-slate-300 hover:border-blue-300 text-[10.5px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">السياسة ومن نحن</span>
          </button>
        )}

        {/* 4. زر العودة السريع للمنصة الرئيسية roohpro.com */}
        <a
          href="https://roohpro.com"
          target="_blank"
          rel="noopener noreferrer"
          title="العودة للمنصة الرئيسية (roohpro.com)"
          className="h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:from-blue-600 hover:to-indigo-600 text-white border border-blue-600/70 text-[10.5px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
          <span className="whitespace-nowrap hidden sm:inline">المنصة الرئيسية</span>
          <span className="whitespace-nowrap sm:hidden">الرئيسية</span>
        </a>

        {/* زر إخفاء الشريط السفلي في وضع الهاتف للاستشعار والتعرف على حالة العرض وتمكين التطبيق من ملء الشاشة */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-9 px-2 sm:hidden rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-200 text-[10px] font-black active:scale-95"
            title="إخفاء هذا الشريط لعرض كامل التطبيق"
          >
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[9.5px]">إخفاء</span>
          </button>
        )}

        {/* 5. أدوات سطح المكتب (عداد 10 ثوانٍ وشبكة 4 بطاقات) */}
        {(setIsDesktopGrid || setIsAutoAdvanceActive) && (
          <div className="hidden lg:flex items-center gap-1 shrink-0 border-r border-slate-200 pr-2 mr-1">
            {setIsAutoAdvanceActive && (
              <button
                type="button"
                onClick={() => setIsAutoAdvanceActive(!isAutoAdvanceActive)}
                title={isAutoAdvanceActive ? 'إيقاف التمرير التلقائي (10 ثوانٍ)' : 'تفعيل التمرير التلقائي (10 ثوانٍ)'}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                  isAutoAdvanceActive 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                {isAutoAdvanceActive ? <Play className="w-3.5 h-3.5 fill-current text-blue-600" /> : <Pause className="w-3.5 h-3.5" />}
                <span className="text-[10px]">10ث</span>
              </button>
            )}

            {setIsDesktopGrid && (
              <button
                type="button"
                onClick={() => setIsDesktopGrid(!isDesktopGrid)}
                title={isDesktopGrid ? 'التحويل إلى وضع الفيديو الفردي (Reels Mode)' : 'التحويل إلى شبكة 5 بطاقات (صفين)'}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
              >
                {isDesktopGrid ? <Smartphone className="w-3.5 h-3.5 text-red-500" /> : <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />}
                <span className="text-[10px]">{isDesktopGrid ? 'مفرد' : '5 شبكة'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
