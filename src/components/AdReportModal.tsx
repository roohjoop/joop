import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Send, Info, Megaphone } from 'lucide-react';
import { AdReportItem, recordAdReport } from '../utils/adsManager';

export interface AdReportModalProps {
  isOpen: boolean;
  adTitle: string;
  adSponsor?: string;
  adType: 'banner' | 'interstitial' | 'rewarded' | 'square';
  onClose: () => void;
  onSubmitSuccess?: (report: AdReportItem) => void;
}

const AD_REPORT_REASONS = [
  { id: 'inappropriate', label: 'محتوى غير لائق أو خادش للحياء', desc: 'صور أو نصوص أو وسائط لا تليق بأخلاقيات المنصة' },
  { id: 'scam', label: 'إعلان احتيالي أو روابط مضللة وخبيثة', desc: 'يطلب بيانات بنكية أو يوجّه إلى صفحات وهمية أو فيروسات' },
  { id: 'sound_issue', label: 'مشكلة في الصوت أو وسائط مزعجة', desc: 'صوت مرتفع فجأة أو تعطل زر كتم الصوت' },
  { id: 'repetitive', label: 'إعلان متكرر ومزعج يمنع التصفح', desc: 'يظهر بكثرة متتالية أو يعيق حركة التمرير' },
  { id: 'misleading', label: 'عروض وهمية غير حقيقية أو تضليلية', desc: 'يدّعي جوائز غير حقيقية أو منتجات مزيفة' },
  { id: 'broken', label: 'رابط الزر لا يعمل أو تعطل الفيديو', desc: 'فشل تحميل الفيديو أو زر التثبيت لا يستجيب' },
  { id: 'other', label: 'سبب آخر غير مذكور أعلاه', desc: 'تحديد سبب مختلف بالتفصيل' }
];

export const AdReportModal: React.FC<AdReportModalProps> = ({
  isOpen,
  adTitle,
  adSponsor = 'معلن المنصة',
  adType,
  onClose,
  onSubmitSuccess
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('inappropriate');
  const [details, setDetails] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string>('');

  if (!isOpen) return null;

  const getAdTypeLabel = (type: string) => {
    switch (type) {
      case 'interstitial':
        return 'إعلان بيني يغطي الصفحة';
      case 'rewarded':
        return 'إعلان مكافأة فيديو';
      case 'square':
        return 'إعلان مربع مدمج 350x350';
      case 'banner':
      default:
        return 'بنر إعلاني علوي';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reasonObj = AD_REPORT_REASONS.find(r => r.id === selectedReason);

    const report = recordAdReport({
      adTitle,
      adSponsor,
      adType,
      reason: reasonObj?.label || selectedReason,
      details: details.trim() || undefined,
      contactEmailOrPhone: contactInfo.trim() || undefined
    });

    setTicketId(report.id);
    setIsSubmitted(true);
    if (onSubmitSuccess) {
      onSubmitSuccess(report);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setSelectedReason('inappropriate');
    setDetails('');
    setContactInfo('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={handleResetAndClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-lg bg-white border border-red-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-50 via-white to-amber-50 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded font-mono">
                  AD
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                  إبلاغ عن هذا الإعلان للدعم الفني
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                {getAdTypeLabel(adType)}: <span className="text-red-700 font-bold">{adTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isSubmitted ? (
          <div className="p-6 text-center flex flex-col items-center justify-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">تم استلام بلاغ الإعلان بنجاح!</h4>
              <p className="text-xs font-mono font-black text-red-600">رقم البلاغ: #{ticketId}</p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed pt-1.5">
                شكراً لمساعدتنا في تحسين تجربة المنصة. تم تسجيل البلاغ في قسم بلاغات الإعلانات للمراجعة الفورية من قبل المشرفين والمطور.
              </p>
            </div>

            <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">الإعلان:</span>
                <span className="font-black text-slate-900 truncate max-w-[220px]">{adTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">النوع:</span>
                <span className="font-bold text-blue-700">{getAdTypeLabel(adType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">الحالة:</span>
                <span className="text-amber-600 font-black">قيد المراجعة في لوحة التحكم</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-xl shadow-md transition-all text-xs"
            >
              تم، المتابعة
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 max-h-[75vh]">
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-2.5 flex items-start gap-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium text-[11.5px]">
                نحرص على ألا تكون الإعلانات مضللة أو مزعجة. إبلاغك يساعدنا في حظر الإعلانات المخالفة أو تعديل وتيرة ظهورها.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>اختر سبب إبلاغك عن هذا الإعلان:</span>
              </label>

              <div className="space-y-1.5">
                {AD_REPORT_REASONS.map(reason => {
                  const isChecked = selectedReason === reason.id;
                  return (
                    <label
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-red-50/80 border-red-500 text-slate-900 ring-1 ring-red-500'
                          : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="adReportReason"
                        value={reason.id}
                        checked={isChecked}
                        onChange={() => setSelectedReason(reason.id)}
                        className="mt-0.5 w-3.5 h-3.5 text-red-600 border-slate-300 focus:ring-red-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900">{reason.label}</div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">{reason.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                ملاحظات إضافية (اختياري):
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="اكتب ملاحظاتك لمساعدتنا في فحص الإعلان..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-white rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 resize-none outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                وسيلة تواصل للتحديث إن رغبت (اختياري):
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                placeholder="هاتف أو بريد إلكتروني..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال البلاغ فوراً</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors border border-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
