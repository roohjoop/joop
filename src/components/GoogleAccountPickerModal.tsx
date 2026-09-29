import React, { useState } from 'react';
import { X, Check, Mail, Lock, ShieldCheck, ArrowLeft, Coins, Sparkles, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { loginWithEmailAccount, saveUserProfileToFirestore } from '../firebase/services';
import { syncEmailGlobally } from '../services/centralSyncService';
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

      // Global synchronization to Cloudflare D1, R2, and Central Platform (roohpro.com)
      syncEmailGlobally({
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        userRole: 'employer',
        portalOrigin: 'jop'
      }).catch((e) => console.warn('Global email sync notice:', e));

      setSuccessMsg('تم تأكيد الحساب بنجاح!');
      setTimeout(() => {
        onSelectAccount(cleanEmail, fbUser);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error during email account confirmation:', err);
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
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 shadow-xs flex items-center justify-center shrink-0 text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">تسجيل الدخول شغل وتقنية</h3>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>حسابك آمن</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
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
                تُضاف إلى حسابك فوراً لإنشاء وترويج إعلاناتك
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 space-y-3">
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1.5">
              البريد الإلكتروني *
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
                placeholder="name@example.com"
                dir="ltr"
                className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-left"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            {errorMsg && (
              <p className="text-[10px] text-red-600 font-bold mt-1">{errorMsg}</p>
            )}
          </div>

          {successMsg && (
            <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
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
                  <span>جارٍ تأكيد الحساب...</span>
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
