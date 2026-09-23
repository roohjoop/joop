import React from 'react';
import { X, Smartphone, Monitor, Download, Share, PlusSquare, CheckCircle, Sparkles } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isMobile: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isMobile
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">تثبيت تطبيق (شغل وتقنيه)</h3>
              <p className="text-[11px] text-blue-100 font-medium">على هاتفك أو سطح المكتب مباشرة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content based on device */}
        <div className="p-5 space-y-4 text-right">
          {/* App icon & intro */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img 
              src="/icon.svg" 
              alt="شغل وتقنيه" 
              className="w-12 h-12 rounded-xl shadow-md border border-slate-200 object-cover shrink-0" 
            />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">منصة شغل وتقنيه للوظائف</h4>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                تطبيق خفيف وسريع يعمل دون الحاجة لمتجر التطبيقات ويوفر وصولاً فورياً
              </p>
            </div>
          </div>

          {isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 text-xs font-black text-blue-900">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>طريقة التثبيت على الآيفون والآيباد (iOS):</span>
              </div>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                  <span>اضغط على زر <strong>المشاركة</strong> (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />) في شريط متصفح Safari السفلي.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                  <span>مرر لأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                  <span>اضغط على <strong>"إضافة" (Add)</strong> في أعلى الزاوية ليظهر التطبيق في شاشتك الرئيسية كأي تطبيق رسمي.</span>
                </li>
              </ol>
            </div>
          ) : isMobile ? (
            /* Android Instructions */
            <div className="space-y-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>طريقة التثبيت على أجهزة أندرويد:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                اضغط على زر الخيارات (الثلاث نقاط ⋮) في أعلى المتصفح، ثم اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong> للتمتع بتجربة شاشة كاملة وسريعة.
              </p>
            </div>
          ) : (
            /* Desktop Instructions (Chrome/Edge/Mac/Windows) */
            <div className="space-y-3 bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
                <Monitor className="w-4 h-4 text-indigo-600" />
                <span>طريقة التثبيت على سطح المكتب (كمبيوتر / لابتوب):</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                انقر على أيقونة <strong>تثبيت التطبيق (<Download className="w-3.5 h-3.5 inline mx-0.5 text-indigo-600" />)</strong> الظاهرة في شريط عنوان المتصفح (URL Bar) في الأعلى، أو من قائمة المتصفح اختر <strong>"تثبيت شغل وتقنيه"</strong>.
              </p>
            </div>
          )}

          {/* Features list */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700 pt-1">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>إشعارات فورية صوتية</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>يعمل بدون متجر</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all active:scale-95"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
