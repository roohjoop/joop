import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Mail, 
  ShieldCheck, 
  Coins, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Smartphone, 
  ChevronLeft,
  User,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { loginWithGoogle, loginWithEmailAccount, saveUserProfileToFirestore } from '../firebase/services';
import { syncEmailGlobally } from '../services/centralSyncService';
import { grantAccountWelcomeCoins } from '../utils/coinsEngine';

interface KnownDeviceAccount {
  email: string;
  name?: string;
  avatar?: string;
  lastLinkedAt?: string;
}

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
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(true); // Default open for ease of access
  const [knownAccounts, setKnownAccounts] = useState<KnownDeviceAccount[]>([]);

  // Load known accounts detected on this device/phone
  useEffect(() => {
    if (!isOpen) return;
    try {
      const accountsList: KnownDeviceAccount[] = [];
      
      // 1. From shoghl_known_accounts
      const rawKnown = localStorage.getItem('shoghl_known_accounts');
      if (rawKnown) {
        const parsed = JSON.parse(rawKnown);
        if (Array.isArray(parsed)) {
          parsed.forEach(acc => {
            if (acc?.email && !accountsList.some(a => a.email.toLowerCase() === acc.email.toLowerCase())) {
              accountsList.push(acc);
            }
          });
        }
      }

      // 2. From shoghl_accounts_data
      const rawAccountsData = localStorage.getItem('shoghl_accounts_data');
      if (rawAccountsData) {
        const parsedData = JSON.parse(rawAccountsData);
        Object.keys(parsedData).forEach(em => {
          const clean = em.toLowerCase().trim();
          if (clean && !accountsList.some(a => a.email.toLowerCase() === clean)) {
            const prof = parsedData[em]?.profile;
            accountsList.push({
              email: clean,
              name: prof?.name || clean.split('@')[0],
              avatar: prof?.avatar
            });
          }
        });
      }

      // 3. Fallback: check current email
      if (currentEmail && !accountsList.some(a => a.email.toLowerCase() === currentEmail.toLowerCase())) {
        accountsList.push({
          email: currentEmail.toLowerCase(),
          name: currentEmail.split('@')[0]
        });
      }

      setKnownAccounts(accountsList);
    } catch (e) {
      console.warn('Failed to load known accounts:', e);
    }
  }, [isOpen, currentEmail]);

  if (!isOpen) return null;

  // 1. Automatic Account Picker & Link using Google Auth popup (shows all device Google accounts)
  const handleAutoLinkGoogle = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (!user || !user.email) {
        throw new Error('لم يتم استرجاع البريد الإلكتروني من الحساب');
      }

      const cleanEmail = user.email.trim().toLowerCase();
      const displayName = user.displayName || cleanEmail.split('@')[0];
      const photoURL = user.photoURL || '';
      const customUsername = usernameInput.trim() || displayName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

      // Record this account into known device accounts
      saveToKnownAccounts(cleanEmail, displayName, photoURL);

      // Welcome coins
      const welcome = grantAccountWelcomeCoins(cleanEmail);

      // Persist profile with username
      await saveUserProfileToFirestore({
        id: user.uid,
        name: displayName,
        username: customUsername,
        email: cleanEmail,
        avatar: photoURL || undefined,
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

      syncEmailGlobally({
        email: cleanEmail,
        fullName: displayName,
        userRole: 'employer',
        portalOrigin: 'jop'
      }).catch(e => console.warn('Global sync notice:', e));

      setSuccessMsg(`تم استدعاء وربط الحساب بنجاح: ${cleanEmail}`);
      setTimeout(() => {
        onSelectAccount(cleanEmail, { ...user, username: customUsername });
        onClose();
      }, 600);
    } catch (err: any) {
      console.warn('Google auto link error:', err);
      // If popup blocked or cancelled, give helpful prompt
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('تم حظر النافذة المنبثقة من المتصفح. يمكنك اختيار بريد تم حفظه أو الإدخال يدوياً.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('تم إلغاء اختيار الحساب. يمكنك المحاولة مرة أخرى.');
      } else {
        setErrorMsg('تعذر استدعاء حسابات Google تلقائياً. يمكنك اختيار حسابك من القائمة أو إدخاله يدوياً.');
      }
      setShowManualInput(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 2. Select from known device accounts
  const handleSelectKnown = async (account: KnownDeviceAccount) => {
    const cleanEmail = account.email.trim().toLowerCase();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const fbUser = await loginWithEmailAccount(cleanEmail, account.name || cleanEmail.split('@')[0]);
      saveToKnownAccounts(cleanEmail, account.name, account.avatar);
      grantAccountWelcomeCoins(cleanEmail);
      const customUsername = usernameInput.trim() || (account.name || cleanEmail.split('@')[0]).toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

      setSuccessMsg(`تم تسجيل الدخول واسترجاع بيانات: ${cleanEmail}`);
      setTimeout(() => {
        onSelectAccount(cleanEmail, { ...fbUser, username: customUsername });
        onClose();
      }, 500);
    } catch (err) {
      onSelectAccount(cleanEmail, { username: usernameInput.trim() });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Manual email submission
  const handleSubmitManual = async (e?: React.FormEvent) => {
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
      const fbUser = await loginWithEmailAccount(cleanEmail, cleanEmail.split('@')[0]);
      const uid = fbUser?.uid || `usr_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const welcome = grantAccountWelcomeCoins(cleanEmail);
      const customUsername = usernameInput.trim() || cleanEmail.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

      saveToKnownAccounts(cleanEmail, cleanEmail.split('@')[0]);

      await saveUserProfileToFirestore({
        id: uid,
        name: cleanEmail.split('@')[0],
        username: customUsername,
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

      syncEmailGlobally({
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        userRole: 'employer',
        portalOrigin: 'jop'
      }).catch((e) => console.warn('Global email sync notice:', e));

      setSuccessMsg('تم تأكيد وربط الحساب بنجاح!');
      setTimeout(() => {
        onSelectAccount(cleanEmail, { ...fbUser, username: customUsername });
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error during email account confirmation:', err);
      onSelectAccount(cleanEmail, { username: usernameInput.trim() });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const saveToKnownAccounts = (email: string, name?: string, avatar?: string) => {
    try {
      const raw = localStorage.getItem('shoghl_known_accounts');
      const list: KnownDeviceAccount[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter(item => item.email.toLowerCase() !== email.toLowerCase());
      filtered.unshift({
        email,
        name: name || email.split('@')[0],
        avatar,
        lastLinkedAt: new Date().toISOString()
      });
      localStorage.setItem('shoghl_known_accounts', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to save known account:', e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50/50 via-white to-blue-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0 text-white">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">ربط البريد وتفعيل الحساب</h3>
              <p className="text-[10.5px] text-blue-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>لإطلاق الحملات الإعلانية وحجز اسم المستخدم المعتمد</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 50 Welcome Coins Gift Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-3 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Coins className="w-4 h-4 text-amber-100 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black">هدية ترحيبية فورية: 50 كوين!</span>
                <span className="text-[9px] bg-white text-orange-700 px-1.5 py-0.2 rounded-full font-black">مجاناً</span>
              </div>
              <p className="text-[10px] text-amber-100 font-medium mt-0.5 leading-tight">
                تُضاف لرصيدك مباشرة لدعم إطلاق حملتك الإعلانية ونشر إعلاناتك
              </p>
            </div>
          </div>
        </div>

        {/* Value Proposition Highlights */}
        <div className="px-4 pt-3 pb-1 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-2 text-[10.5px] font-bold text-slate-700">
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-red-600 font-black">📢</span>
              <span className="truncate">إنشاء وإدارة الحملات</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-blue-600 font-black">🔗</span>
              <span className="truncate">مسار مخصص بالاسم</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-emerald-600 font-black">☁️</span>
              <span className="truncate">مزامنة فايربيز و R2</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-indigo-600 font-black">🛡️</span>
              <span className="truncate">حفظ الصور والأدوات</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[72vh] overflow-y-auto no-scrollbar">

          {/* Primary Action: One-Tap Auto Account Chooser via Google & Phone Accounts */}
          <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white rounded-2xl border-2 border-blue-200/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  موصى به • فوري
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1.5">
                  ربط وتأكيد الحساب عبر Google
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  ربط مباشر بحساب هاتفك بنقرة واحدة، واسترجاع إعلاناتك وحملاتك السابقة فورياً من فايربيز.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-blue-100 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <button
              type="button"
              disabled={isGoogleLoading || isLoading}
              onClick={handleAutoLinkGoogle}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>جارٍ استدعاء حسابات الهاتف...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#ffffff"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#ffffff"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>استدعاء واختيار إيميل الهاتف مباشرة</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Detected & Saved Accounts on this Device */}
          {knownAccounts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-bold">
                <span>الحسابات المحفوظة على هذا الجهاز:</span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                  {knownAccounts.length} حساب
                </span>
              </div>

              <div className="space-y-1.5">
                {knownAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={isLoading || isGoogleLoading}
                    onClick={() => handleSelectKnown(acc)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 flex items-center justify-between gap-2.5 transition-all text-right cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {acc.avatar ? (
                          <img src={acc.avatar} alt={acc.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 group-hover:text-blue-700 truncate">
                          {acc.name || acc.email.split('@')[0]}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate dir-ltr text-right">
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-blue-600 font-bold shrink-0">
                      <span>دخول</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 3. Manual Email & Username Input Form */}
          <div className="pt-2 border-t border-slate-100">
            <form onSubmit={handleSubmitManual} className="space-y-3 animate-in fade-in">
              <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>أو ربط الحساب بإدخال البريد الإلكتروني:</span>
                <span className="text-[10px] text-slate-400 font-normal">تسجيل مباشر</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  البريد الإلكتروني المعتمد *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                      // auto-suggest username if blank
                      if (!usernameInput && e.target.value.includes('@')) {
                        setUsernameInput(e.target.value.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_'));
                      }
                    }}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-left"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  اسم المستخدم المطلوب (Username) لربط مسارك الخاص:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="مثال: ahmed_pro"
                    dir="ltr"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-left pl-8"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">@</span>
                </div>
                {usernameInput && (
                  <p className="text-[10px] text-blue-700 font-mono mt-1 text-left dir-ltr truncate">
                    https://roohpro.com/jop/u/{usernameInput}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  استكشاف التطبيق أولاً
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ التأكيد والربط...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ربط الحساب وتفعيل الحملات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
