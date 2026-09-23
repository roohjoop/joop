import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Ban,
  Fingerprint,
  Save
} from 'lucide-react';
import { 
  getDeveloperCredentials, 
  verifyDeveloperCredentials,
  setDeveloperSession,
  isDeviceLocked,
  recordFailedAttempt,
  resetFailedAttempts,
  getFailedAttemptsCount,
  isDeveloperLoggedIn
} from '../utils/developerFirebase';

interface DeveloperAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const DeveloperAuthModal: React.FC<DeveloperAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '', '']); // 7 digits
  const [showCode, setShowCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locked, setLocked] = useState(false);

  // References to the 7 digit inputs
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check saved session & lockout state on mount/open
  useEffect(() => {
    if (isOpen) {
      // 1. Check if device is locked
      if (isDeviceLocked()) {
        setLocked(true);
        setErrorMsg('تم حظر هذا الهاتف نهائياً لمحاولة إدخال بيانات خاطئة 3 مرات متتالية. لا يمكن تفعيل أو فتح لوحة المطور من هذا الجهاز.');
        return;
      }

      // 2. Check if developer previously logged in and session is saved on this phone
      if (isDeveloperLoggedIn()) {
        onAuthenticated();
        return;
      }

      // 3. Otherwise initialize inputs
      const current = getDeveloperCredentials();
      const savedEmail = localStorage.getItem('rooh_developer_saved_email');
      setEmail(savedEmail || current.email || (import.meta.env.VITE_ADMIN_EMAIL || ''));
      setDigits(['', '', '', '', '', '', '']);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsProcessing(false);
      setLocked(false);

      const timer = setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onAuthenticated]);

  if (!isOpen) return null;

  // Handle single digit changes
  const handleDigitChange = (index: number, val: string) => {
    if (locked) return;
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    if (clean.length > 1) {
      const newDigits = [...digits];
      const slice = clean.slice(0, 7).split('');
      slice.forEach((char, i) => {
        if (i < 7) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(slice.length, 6);
      digitInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean[clean.length - 1];
    setDigits(newDigits);

    if (index < 6 && clean.length > 0) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (locked) return;
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (locked) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 7);
    if (!pasteData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 7; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setDigits(newDigits);

    const focusIdx = Math.min(pasteData.length, 6);
    digitInputRefs.current[focusIdx]?.focus();
  };

  // Submit Verification & 3-attempt lockout rule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const code = digits.join('');

    if (!email.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني الخاص بالمطور');
      return;
    }

    if (code.length !== 7) {
      setErrorMsg('يجب إدخال الرمز السري المكون من 7 أرقام كاملاً');
      return;
    }

    setIsProcessing(true);

    try {
      const isValid = await verifyDeveloperCredentials(email, code);
      setIsProcessing(false);

      if (isValid) {
        resetFailedAttempts();
        setDeveloperSession(true, email);
        setSuccessMsg('تم التحقق بنجاح! تم حفظ الجلسة على هذا الهاتف.');
        setTimeout(() => {
          onAuthenticated();
        }, 400);
      } else {
        const attemptRes = recordFailedAttempt();
        if (attemptRes.isLocked) {
          setLocked(true);
          setErrorMsg('تم حظر هذا الهاتف نهائياً لمحاولة إدخال بيانات خاطئة 3 مرات متتالية. لا يمكن تفعيل أو فتح لوحة المطور من هذا الجهاز.');
        } else {
          setErrorMsg(
            `بيانات الدخول غير صحيحة (المحاولة ${attemptRes.attempts} من 3). تنبيه: بعد 3 محاولات خاطئة سيتم حظر هذا الهاتف نهائياً من الدخول.`
          );
        }
      }
    } catch {
      setIsProcessing(false);
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    }
  };

  const isFormComplete = email.trim().length > 0 && digits.join('').length === 7;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-[420px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-blue-500/40 rounded-3xl shadow-[0_0_60px_-15px_rgba(59,130,246,0.35)] overflow-hidden flex flex-col my-auto text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Red and Blue Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-blue-500 to-red-600 animate-gradient"></div>

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pt-6 pb-2 px-6 text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border shadow-lg mb-1 ${
            locked 
              ? 'bg-red-950/60 border-red-700/60 text-red-400'
              : 'bg-gradient-to-br from-blue-600/30 to-red-600/20 border-blue-500/40 text-blue-400'
          }`}>
            {locked ? (
              <Ban className="w-8 h-8 text-red-500 animate-pulse" />
            ) : (
              <Fingerprint className="w-8 h-8 text-blue-400" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
              {locked ? 'تم قفل الدخول نهائياً' : 'بوابة وصول المطور'}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {locked ? 'تم تجاوز الحد الأقصى للمحاولات (3 محاولات خاطئة)' : 'أدخل بريد المطور والرمز السري (7 أرقام)'}
            </p>
          </div>
        </div>

        {/* Form strictly limited to Email, 7-digit PIN, and Save/Login button */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 rounded-2xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-bold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-2xl text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-tight font-bold">{successMsg}</span>
            </div>
          )}

          {!locked && (
            <>
              {/* 1. Developer Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  البريد الإلكتروني الخاص بالمطور
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@domain.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl py-2.5 pr-10 pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* 2. 7-Digit Security PIN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    الرمز السري المكون من <span className="text-blue-400 font-extrabold">7 أرقام</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="text-[11px] text-slate-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {showCode ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>إخفاء الأرقام</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>إظهار الأرقام</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 7 Digit Boxes Grid */}
                <div className="flex items-center justify-between gap-1 sm:gap-1.5" dir="ltr">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitInputRefs.current[idx] = el;
                      }}
                      type={showCode ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className={`w-10 sm:w-11 h-12 text-center text-base sm:text-lg font-black font-mono rounded-xl border transition-all outline-none ${
                        digit
                          ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                          : 'bg-slate-900/90 border-slate-700/80 text-white focus:border-blue-400 focus:bg-slate-800/90'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5 font-mono">
                  <span>الرمز السري (7 أرقام)</span>
                  <span>{digits.filter(Boolean).length} / 7</span>
                </div>
              </div>

              {/* 3. Action Button: حفظ (Strictly Save & Login button only - no extra footer boxes) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !isFormComplete}
                  className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>جاري التحقق والمطابقة...</span>
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 stroke-[2.5]" />
                      <span>حفظ</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {locked && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
