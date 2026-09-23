import React from 'react';
import { X, Briefcase, UserCheck, Plus, ArrowLeft } from 'lucide-react';
import { ListingType } from '../types';
import { SquareBannerAd350 } from './SquareBannerAd350';

interface AddChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ListingType) => void;
  onOpenDeveloperAuth?: () => void;
}

export const AddChoiceModal: React.FC<AddChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  onOpenDeveloperAuth
}) => {
  const clickCountRef = React.useRef(0);
  const lastClickTimeRef = React.useRef(0);

  if (!isOpen) return null;

  const handleSecretDeveloperTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    // Allow up to 3.5 seconds between clicks
    if (now - lastClickTimeRef.current > 3500) {
      clickCountRef.current = 1;
    } else {
      clickCountRef.current += 1;
    }
    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      if (onOpenDeveloperAuth) {
        onClose();
        onOpenDeveloperAuth();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="flex flex-col md:flex-row items-stretch justify-center gap-3 sm:gap-5 w-full max-w-4xl my-auto py-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* إعلان بنر مربع ثابت 350x350: في وضع الهاتف يظهر في الأعلى، وفي وضع المتصفح يظهر بجانب نافذة اختيار نوع الإعلان بحجم متساوٍ تماماً */}
        <SquareBannerAd350 className="order-1 md:order-2 shrink-0 shadow-2xl" />

        {/* نافذة اختيار نوع الإعلان (بحجم متساوٍ تماماً مع نافذة الإعلان المدمج 350 بكسل) */}
        <div 
          className="order-2 md:order-1 w-full max-w-[350px] md:w-[350px] bg-white border-2 border-blue-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between shrink-0 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        >
          {/* Top Header of the modal */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div 
                  onClick={handleSecretDeveloperTrigger}
                  className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 cursor-pointer select-none active:scale-95 transition-transform shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-[15px] font-black text-slate-900">اختر نوع الإعلان</h3>
                  <span className="text-[10.5px] text-slate-500 font-medium">خطوة سريعة لنشر إعلانك</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 my-3 leading-relaxed font-medium">
              هل ترغب في نشر فرصة عمل جديدة لتوظيف كفاءات، أم تبحث عن وظيفة وتريد تقديم سيرتك الذاتية؟
            </p>

            {/* The Two Choice Cards */}
            <div className="space-y-2.5">
              {/* Option 1: إضافة وظيفة (Add Job) */}
              <button
                id="choice-add-job"
                onClick={() => {
                  onSelectType('job');
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-red-50 hover:bg-red-100/90 border-2 border-red-200 hover:border-red-400 flex items-center justify-between gap-3 transition-all text-right group shadow-xs active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">
                      إضافة شاغر وظيفي
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                      لأصحاب العمل والشركات لنشر وظيفة جديدة
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:-translate-x-1 transition-all" />
              </button>

              {/* Option 2: طلب وظيفة / طلب عمل (Job Request) */}
              <button
                id="choice-job-request"
                onClick={() => {
                  onSelectType('seeker');
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/90 border-2 border-blue-200 hover:border-blue-400 flex items-center justify-between gap-3 transition-all text-right group shadow-xs active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      طلب عمل / سيرة ذاتية
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                      للباحثين عن عمل لعرض خبراتهم وتخصصاتهم
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* Bottom Footnote to balance height perfectly with SquareBannerAd350 */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              منصة شغل وتقنية • توظيف مباشر وتواصل فوري
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
