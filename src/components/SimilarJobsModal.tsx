import React from 'react';
import { 
  X, 
  Heart, 
  Bookmark, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  Building2,
  Share2,
  Flame
} from 'lucide-react';
import { JobPost } from '../types';
import { TopBannerAd } from './TopBannerAd';

interface SimilarJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  referencePost: JobPost | null;
  similarPosts: JobPost[];
  onSelectPost: (post: JobPost) => void;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onOpenAdvertiserProfile: (post: JobPost) => void;
}

export const SimilarJobsModal: React.FC<SimilarJobsModalProps> = ({
  isOpen,
  onClose,
  referencePost,
  similarPosts,
  onSelectPost,
  onLike,
  onBookmark,
  onOpenAdvertiserProfile,
}) => {
  if (!isOpen || !referencePost) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full h-full sm:h-[700px] sm:max-h-[92vh] sm:max-w-2xl max-w-full bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Standard Top Banner Ad (50px) at the very top */}
        <TopBannerAd />

        {/* 2. Header with Refined White/Red/Blue Modern Aesthetics */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 via-white to-blue-50 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-blue-700 hover:text-blue-900 hover:bg-blue-100/60 transition-colors flex items-center gap-1 font-black text-xs shrink-0 cursor-pointer"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden xs:inline">رجوع</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300" />
            </div>

            <div className="min-w-0 flex-1 pr-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-base font-black text-slate-900 leading-tight">
                  الوظائف والفرص المشابهة
                </h3>
                <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                  {similarPosts.length} نتائج
                </span>
              </div>
              <p className="text-[11px] text-blue-800 font-bold truncate max-w-[240px] sm:max-w-md mt-0.5">
                مبنية على الإعلان: "{referencePost.title}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3. Reference Highlight Strip - Compact & Strictly No Overflow */}
        <div className="bg-slate-50/90 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 text-[11px] text-slate-600 shrink-0 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 overflow-hidden">
            <span className="font-bold text-slate-500 shrink-0">التصنيف:</span>
            <span className="font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md truncate max-w-[140px]">
              {referencePost.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 truncate max-w-[120px]">
              <MapPin className="w-3 h-3 text-red-600 shrink-0" />
              <span className="truncate">{referencePost.location}</span>
            </span>
          </div>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline shrink-0">
            انقر على أي بطاقة لعرض تفاصيل الإعلان
          </span>
        </div>

        {/* 4. Scrollable List of Cards - Anti-overflow on all phone viewports */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
          {similarPosts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300 p-6 shadow-xs my-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-inner">
                <Briefcase className="w-7 h-7 stroke-[1.8]" />
              </div>
              <p className="text-sm font-black text-slate-800">لا توجد إعلانات أخرى مشابهة حالياً</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                تصفح باقي الإعلانات والفرص في المنصة أو استخدم شريط البحث لاكتشاف تخصصات جديدة
              </p>
            </div>
          ) : (
            similarPosts.map((post) => {
              const isReference = post.id === referencePost.id;

              return (
                <div
                  key={post.id}
                  onClick={() => {
                    onSelectPost(post);
                    onClose();
                  }}
                  className={`w-full max-w-full overflow-hidden p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer flex flex-col gap-2.5 shadow-xs select-none active:scale-[0.99] ${
                    isReference
                      ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border-blue-400 ring-2 ring-blue-200/80 shadow-md'
                      : 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* Top Row: Thumbnail + Author & Badges */}
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 w-full overflow-hidden">
                    {/* Visual Media Thumbnail with Type Badge */}
                    <div className="relative shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 shadow-inner">
                      <img
                        src={post.backdropImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&auto=format&fit=crop&q=80'}
                        alt={post.title}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                      <span
                        className={`absolute top-0 right-0 text-[8.5px] font-black px-1.5 py-0.5 rounded-bl-lg text-white shadow-xs ${
                          post.type === 'job' ? 'bg-red-600' : 'bg-blue-600'
                        }`}
                      >
                        {post.type === 'job' ? 'فرصة' : 'طلب'}
                      </span>
                    </div>

                    {/* Content Section - Break words & strict containment */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words line-clamp-2 flex-1">
                          {post.title}
                        </h4>
                        {isReference && (
                          <span className="text-[9px] bg-blue-600 text-white font-black px-1.5 py-0.5 rounded-md shrink-0 shadow-xs">
                            الحالي
                          </span>
                        )}
                      </div>

                      {/* Author Name and Verification */}
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-900 font-bold mt-1 overflow-hidden">
                        <span className="truncate max-w-[170px] sm:max-w-[260px]">
                          {post.authorName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-semibold truncate text-[10.5px]">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Description Snippet (If exists) - strictly line clamped */}
                  {post.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 break-words bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                      {post.description}
                    </p>
                  )}

                  {/* Bottom Row: Badges & Action Buttons */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap w-full overflow-hidden">
                    {/* Metadata Badges (Location, Salary, Experience) */}
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 overflow-hidden">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                        <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                        <span className="truncate">{post.location}</span>
                      </span>

                      {post.salary && post.salary.trim() && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-[120px]">
                          <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{post.salary}</span>
                        </span>
                      )}

                      {post.experience && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[100px]">
                          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">{post.experience}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Like, Bookmark & View */}
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onLike(post.id)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          post.isLiked
                            ? 'bg-red-50 border-red-300 text-red-600'
                            : 'bg-slate-50 hover:bg-red-50 border-slate-200 text-slate-500 hover:text-red-600'
                        }`}
                        title="إعجاب"
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onBookmark(post.id)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          post.isSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-500 hover:text-amber-600'
                        }`}
                        title="حفظ"
                      >
                        <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectPost(post);
                          onClose();
                        }}
                        className="py-1 px-3 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-[11px] font-black rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>عرض</span>
                        <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* 5. Footer strip with platform branding */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>منصة Rooh Pro • توظيف معتمد وعروض موثقة</span>
          </div>
          <span className="font-mono text-blue-800 font-bold">Roohpro.com/jop</span>
        </div>

      </div>
    </div>
  );
};
