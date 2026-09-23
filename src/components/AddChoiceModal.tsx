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
        className="flex flex-col md:flex-row items-center justify-center gap-2.5 sm:gap-4 w-full max-w-4xl my-auto py-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* إعلان بنر مربع ثابت 350x350: في وضع الهاتف يظهر في الأعلى، وفي وضع المتصفح يظهر بجانب نافذة اختيار نوع الإعلان */}
        <SquareBannerAd350 className="order-1 md:order-2 shrink-0 shadow-2xl" />

        {/* نافذة اختيار نوع الإعلان (تم تقليل حجمها وارتفاعها لتتناسق تماماً ولا تخرج من إطار الصفحة) */}
        <div 
          className="order-2 md:order-1 w-full max-w-[340px] bg-white border-2 border-blue-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-3.5 sm:p-4 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 shrink-0"
        >
          {/* Top Header of the small popup */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div 
                onClick={handleSecretDeveloperTrigger}
                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center border border-red-200 cursor-pointer select-none active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">اختر نوع الإعلان</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 my-2 leading-tight font-medium">
            هل ترغب في نشر فرصة عمل جديدة أم تبحث عن وظيفة؟
          </p>

          {/* The Two Choice Cards */}
          <div className="space-y-2">
            {/* Option 1: إضافة وظيفة (Add Job) */}
            <button
              id="choice-add-job"
              onClick={() => {
                onSelectType('job');
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-red-50 hover:bg-red-100/80 border-2 border-red-200 hover:border-red-400 flex items-center justify-between gap-2.5 transition-all text-right group shadow-xs active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm shadow-red-500/30 shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">
                    إضافة وظيفة
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    لأصحاب العمل لنشر شاغر وظيفي
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 group-hover:-translate-x-1 transition-all" />
            </button>

            {/* Option 2: طلب وظيفة / طلب عمل (Job Request) */}
            <button
              id="choice-job-request"
              onClick={() => {
                onSelectType('seeker');
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border-2 border-blue-200 hover:border-blue-400 flex items-center justify-between gap-2.5 transition-all text-right group shadow-xs active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    طلب عمل / سيرة ذاتية
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    للباحثين عن عمل لعرض خبراتهم
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
