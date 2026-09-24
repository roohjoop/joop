import React, { useState } from 'react';
import { X, Check, Mail, Lock, ShieldCheck, ArrowLeft, Coins, Sparkles, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle, loginWithEmailAccount, saveUserProfileToFirestore } from '../firebase/services';
import { grantAccountWelcomeCoins } from '../utils/coinsEngine';

interface GoogleAccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, userData?: any) => void;
  currentEmail?: string;
}

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  currentEmail
}) => {
  const [emailInput, setEmailInput] = useState(currentEmail || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleFirebaseSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const user = await loginWithGoogle();
      if (user && user.email) {
        const cleanEmail = user.email.toLowerCase().trim();
        const welcome = grantAccountWelcomeCoins(cleanEmail);
        
        // Direct save to Firebase Firestore
        await saveUserProfileToFirestore({
          id: user.uid,
          name: user.displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar: user.photoURL || undefined,
          role: 'صاحب عمل / معلن وظائف',
          coinsBalance: welcome.coins || 50,
          verified: true,
          connectedAccount: {
            email: cleanEmail,
            provider: 'google',
            connectedAt: new Date().toISOString(),
            googleAccountId: user.uid,
            isVerified: true
          }
        } as any, user.uid);

        setSuccessMsg('تم تسجيل الدخول وحفظ البيانات بنجاح في Firebase!');
        setTimeout(() => {
          onSelectAccount(cleanEmail, user);
          onClose();
        }, 600);
      } else {
        setErrorMsg('تعذر استكمال تسجيل الدخول بحساب Google. يمكنك إدخال البريد الإلكتروني يدوياً بالأسفل.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء الاتصال بخدمة Firebase Auth. يرجى استخدام الإدخال اليدوي.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('يرجى إدخال عنوان البريد الإلكتروني');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Authenticate with Firebase and ensure active Firebase Auth user
      const fbUser = await loginWithEmailAccount(cleanEmail, cleanEmail.split('@')[0]);
      const uid = fbUser?.uid || `usr_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const welcome = grantAccountWelcomeCoins(cleanEmail);

      // Save user profile immediately to Firebase Firestore
      await saveUserProfileToFirestore({
        id: uid,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'صاحب عمل / معلن وظائف',
        coinsBalance: welcome.coins || 50,
        verified: true,
        connectedAccount: {
          email: cleanEmail,
          provider: 'email',
          connectedAt: new Date().toISOString(),
          googleAccountId: uid,
          isVerified: true
        }
      } as any, uid);

      setSuccessMsg('تم تأكيد الحساب وحفظ البيانات داخل Firebase بنجاح!');
      setTimeout(() => {
        onSelectAccount(cleanEmail, fbUser);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error during email sign-in / Firebase sync:', err);
      // Still proceed locally with account selection
      onSelectAccount(cleanEmail);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">تسجيل الدخول ومزامنة Firebase</h3>
              <p className="text-[10px] text-slate-500 font-medium">الربط الآمن والمشفر لحسابك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 50 Welcome Coins Gift Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-3 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Coins className="w-4 h-4 text-amber-100 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black">هدية ترحيبية فورية: 50 كوين!</span>
                <span className="text-[9px] bg-white text-orange-700 px-1.5 py-0.2 rounded-full font-black">مجاناً</span>
              </div>
              <p className="text-[10px] text-amber-100 font-medium mt-0.5 leading-tight">
                تُضاف إلى حسابك فوراً وتُزامن بريدك مع شبكة Rooh AD ومحفظتك
              </p>
            </div>
          </div>
        </div>

        {/* One-Click Google Firebase Authentication Button */}
        <div className="p-3.5 sm:p-4 pb-0">
          <button
            type="button"
            onClick={handleGoogleFirebaseSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span className="text-xs font-bold text-slate-800">
              {isLoading ? 'جارٍ الحفظ والمزامنة مع Firebase...' : 'تسجيل الدخول الفوري بـ Google (Firebase)'}
            </span>
          </button>

          {successMsg && (
            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center my-3 gap-2">
            <div className="flex-1 h-[1px] bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold">أو الإدخال اليدوي</span>
            <div className="flex-1 h-[1px] bg-slate-200" />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 space-y-3">
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1.5">
              البريد الإلكتروني لحساب Google أو العمل *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="name@gmail.com"
                dir="ltr"
                className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-left"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            {errorMsg && (
              <p className="text-[10px] text-red-600 font-bold mt-1">{errorMsg}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 stroke-[3] animate-spin" />
                  <span>جارٍ الحفظ في Firebase...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>تأكيد الحساب واستلام 50 كوين</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
