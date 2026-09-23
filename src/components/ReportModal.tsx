import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Send, Info, ArrowRight } from 'lucide-react';
import { JobPost, ReportItem } from '../types';

interface ReportModalProps {
  post: JobPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (report: ReportItem) => void;
}

const REPORT_REASONS = [
  { id: 'scam', label: 'محتوى احتيالي أو طلب أموال مسبقة', desc: 'يطلب رسوم تقديم أو دفع مالي غير مشروع' },
  { id: 'fake', label: 'وظيفة وهمية أو إعلان غير حقيقي', desc: 'الإعلان وهمي أو تم التوظيف بالفعل ولا توجد وظيفة' },
  { id: 'wrong_info', label: 'بيانات غير صحيحة أو رقم واتساب لا يعمل', desc: 'رقم الهاتف، المحافظة، أو الراتب غير دقيق' },
  { id: 'impersonation', label: 'انتحال صفة شركة أو شخص آخر', desc: 'استخدام اسم أو علامة تجارية دون إذن رسمي' },
  { id: 'inappropriate', label: 'محتوى غير لائق أو مخالف للشروط', desc: 'ألفاظ غير مقبولة أو إعلان مسيء' },
  { id: 'other', label: 'سبب آخر غير مذكور أعلاه', desc: 'تحديد سبب مختلف بالتفصيل' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  post,
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('scam');
  const [details, setDetails] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string>('');

  if (!isOpen || !post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedTicket = `REP-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(generatedTicket);

    const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
    const newReport: ReportItem = {
      id: generatedTicket,
      jobId: post.id,
      jobTitle: post.title,
      authorName: post.authorName,
      reason: reasonObj?.label || selectedReason,
      details: details.trim() || undefined,
      contactEmailOrPhone: contactInfo.trim() || undefined,
      createdAt: 'الآن',
      status: 'pending',
    };

    onSubmitReport(newReport);
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setSelectedReason('scam');
    setDetails('');
    setContactInfo('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200"
      onClick={handleResetAndClose}
    >
      <div 
        className="w-full h-full sm:h-[650px] sm:max-h-[92vh] sm:max-w-lg max-w-full bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Styled with Red, Blue, and White Light Palette */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-50 via-white to-blue-50 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>تقديم إبلاغ للدعم الفني</span>
                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">سري وعاجل</span>
              </h3>
              <p className="text-xs text-blue-700 font-semibold line-clamp-1 max-w-xs sm:max-w-sm mt-0.5">
                بخصوص: {post.title}
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          /* Success Screen */
          <div className="p-6 text-center flex flex-col items-center justify-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-slate-900">تم استلام الإبلاغ بنجاح!</h4>
              <p className="text-xs font-black text-blue-700">رقم البلاغ: #{ticketId}</p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed pt-2">
                شكراً لمساعدتنا في الحفاظ على أمان وسلامة المنصة. تم إرسال البلاغ مباشرة إلى فريق الدعم والمشرفين لمراجعة الإعلان واتخاذ الإجراء اللازم فوراً.
              </p>
            </div>

            <div className="w-full bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-right text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">الإعلان المستهدف:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{post.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">المعلن:</span>
                <span className="font-bold text-blue-700">{post.authorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">الحالة:</span>
                <span className="text-red-600 font-black">قيد المراجعة الفورية من الدعم</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all text-sm mt-3"
            >
              تم، العودة للإعلانات
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Caution banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                يصل هذا الإبلاغ مباشرة إلى فريق دعم المنصة ويتم التعامل معه بسرية تامة دون إظهار هويتك للمعلن.
              </p>
            </div>

            {/* Select Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>اختر سبب الإبلاغ:</span>
              </label>

              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => {
                  const isChecked = selectedReason === reason.id;
                  return (
                    <label
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-red-50/70 border-red-500 text-slate-900 ring-1 ring-red-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason.id}
                        checked={isChecked}
                        onChange={() => setSelectedReason(reason.id)}
                        className="mt-1 w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">{reason.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{reason.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Extra details textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                تفاصيل إضافية (اختياري):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="اكتب هنا أي تفاصيل توضح المشكلة أو المحادثة مع المعلن..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 resize-none outline-none transition-colors"
              />
            </div>

            {/* Optional contact input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم هاتفك أو بريدك للتواصل إن لزم الأمر (اختياري):
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="مثال: 01012345678 أو email@example.com"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-98 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الإبلاغ للدعم الفني</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors border border-slate-200"
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
