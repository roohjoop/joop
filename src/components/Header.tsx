import React from 'react';
import { 
  Briefcase, 
  UserCheck, 
  Search, 
  X, 
  LayoutGrid, 
  Smartphone,
  Play,
  Pause,
  Heart,
  Bookmark,
  Sparkles,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { ListingType, JobPost } from '../types';

interface HeaderProps {
  activeTab: ListingType;
  setActiveTab: (tab: ListingType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDesktopGrid: boolean;
  setIsDesktopGrid: (val: boolean) => void;
  isAutoAdvanceActive: boolean;
  setIsAutoAdvanceActive: (val: boolean) => void;
  totalFilteredCount: number;
  // Similar jobs badge/window button
  lastInteractedPost?: JobPost | null;
  similarJobsCount?: number;
  onOpenSimilarJobs?: () => void;
  onOpenAboutUs?: () => void;
  onOpenPolicy?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  isDesktopGrid,
  setIsDesktopGrid,
  isAutoAdvanceActive,
  setIsAutoAdvanceActive,
  totalFilteredCount,
  lastInteractedPost,
  similarJobsCount = 0,
  onOpenSimilarJobs,
  onOpenAboutUs,
  onOpenPolicy
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2">
        
        {/* 1. Top Tabs Row: "الوظائف المتاحة" (Available Jobs) & "باحثون عن عمل" (Job Seekers) */}
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto mb-2">
          
          {/* Main 2 Tabs */}
          <div className="flex-1 grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner h-11 sm:h-12">
            <button
              id="tab-available-jobs"
              onClick={() => setActiveTab('job')}
              className={`w-full h-full flex items-center justify-center gap-1.5 px-2 rounded-lg text-xs sm:text-sm font-black transition-all border whitespace-nowrap ${
                activeTab === 'job'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border-blue-600'
                  : 'bg-transparent text-slate-600 hover:text-blue-600 hover:bg-white border-transparent'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>وظيفة متاحة</span>
              <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold min-w-[36px] text-center ${
                activeTab === 'job' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                فرص
              </span>
            </button>

            <button
              id="tab-job-seekers"
              onClick={() => setActiveTab('seeker')}
              className={`w-full h-full flex items-center justify-center gap-1.5 px-2 rounded-lg text-xs sm:text-sm font-black transition-all border whitespace-nowrap ${
                activeTab === 'seeker'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/25 border-red-600'
                  : 'bg-transparent text-slate-600 hover:text-red-600 hover:bg-white border-transparent'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>بحث عن عمل</span>
              <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold min-w-[36px] text-center ${
                activeTab === 'seeker' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                كفاءات
              </span>
            </button>
          </div>

          {/* About Us / Legal Disclaimers pill button */}
          {onOpenAboutUs && (
            <button
              type="button"
              onClick={onOpenAboutUs}
              title="من نحن — منصة شغل وتقنية، الشروط وإخلاء المسؤولية التام"
              className="h-11 sm:h-12 px-2.5 sm:px-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="hidden xs:inline">من نحن</span>
            </button>
          )}

          {/* Desktop/Tablet Utility controls */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {/* Auto-Advance toggle button */}
            <button
              onClick={() => setIsAutoAdvanceActive(!isAutoAdvanceActive)}
              title={isAutoAdvanceActive ? 'إيقاف التمرير التلقائي (10 ثوانٍ)' : 'تفعيل التمرير التلقائي (10 ثوانٍ)'}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                isAutoAdvanceActive 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              {isAutoAdvanceActive ? <Play className="w-3.5 h-3.5 fill-current text-blue-600" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline text-[11px]">10 ثوانٍ</span>
            </button>

            {/* Desktop 4-card grid switcher */}
            <button
              onClick={() => setIsDesktopGrid(!isDesktopGrid)}
              title={isDesktopGrid ? 'التحويل إلى وضع الفيديو الفردي (Reels Mode)' : 'التحويل إلى شبكة 4 بطاقات'}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
            >
              {isDesktopGrid ? <Smartphone className="w-3.5 h-3.5 text-red-500" /> : <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />}
              <span className="hidden lg:inline text-[11px]">{isDesktopGrid ? 'شاشة مفردة' : '4 بطاقات'}</span>
            </button>
          </div>

        </div>

        {/* 2. Prominent Search Bar Integration with Similar Jobs Badge / Button */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <div className="absolute right-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
            
            <input
              id="search-input-internal-index"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'job'
                  ? 'ابحث بحرية: أي وظيفة، أي مكان (مصر، إسكندرية، القاهرة، نجار، محاسب)...'
                  : 'ابحث في الكفاءات: أي تخصص، مهارة، مدينة أو كفاءة...'
              }
              className={`w-full bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-semibold rounded-xl pr-9 py-2 sm:py-2.5 border-2 border-blue-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-sm ${
                lastInteractedPost && similarJobsCount > 0 ? 'pl-48 sm:pl-56' : 'pl-20'
              }`}
            />

            {/* Left Interactive controls inside search bar */}
            <div className="absolute left-2 flex items-center gap-1.5">
              {/* Clear Search Button */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Requirement: Small interactive window/badge inside the search box showing similar jobs count */}
              {lastInteractedPost && similarJobsCount > 0 && onOpenSimilarJobs && (
                <button
                  type="button"
                  onClick={onOpenSimilarJobs}
                  className="animate-in fade-in zoom-in-95 duration-200 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                  title="انقر لعرض جميع الوظائف المشابهة للتي أعجبتك أو حفظتها"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" />
                  <span className="hidden xs:inline">مشابه لـ "{lastInteractedPost.category}":</span>
                  <span className="bg-white text-slate-900 font-extrabold px-1.5 py-0.2 rounded-md shadow-xs">
                    {similarJobsCount}
                  </span>
                  <span>وظيفة</span>
                </button>
              )}

              {/* Standard Filtered Results Counter */}
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold min-w-[55px] text-center shrink-0">
                {totalFilteredCount} {activeTab === 'job' ? 'وظيفة' : 'باحث'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
