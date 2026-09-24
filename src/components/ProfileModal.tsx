import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Bookmark, 
  Briefcase, 
  Settings, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Check, 
  Edit3, 
  Save, 
  FileText, 
  ShieldCheck, 
  Mail, 
  Building,
  ArrowRight,
  Lock,
  EyeOff,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  LogOut,
  Sparkles,
  Cloud,
  Coins,
  Database,
  AlertTriangle,
  Ban,
  Trash2,
  Copy,
  Share2,
  Zap,
  Gift
} from 'lucide-react';
import { JobPost, UserProfile, ActiveNavTab, FollowerUser } from '../types';
import { BottomNav } from './BottomNav';
import { TopBannerAd } from './TopBannerAd';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { GoogleAccountPickerModal } from './GoogleAccountPickerModal';
import { syncUserWithCloudflareD1 } from '../utils/cloudSync';
import { 
  getStoredCoins, 
  saveStoredCoins, 
  buildAdCampaignUrl, 
  grantAccountWelcomeCoins,
  addCoinsBonus,
  getRoohAdSyncInfo 
} from '../utils/coinsEngine';
import { buildShortAdUrl, buildUserProfileUrl, applyPageSeo } from '../utils/seoAndRouting';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPosts: JobPost[];
  myPosts: JobPost[];
  onSelectPost: (post: JobPost) => void;
  onDeletePost?: (postId: string) => void;
  isAutoAdvanceActive: boolean;
  setIsAutoAdvanceActive: (val: boolean) => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (updated: UserProfile) => void;
  onConnectAccount?: (email: string, intent: 'employer' | 'seeker', userData?: any) => void;
  onDisconnectAccount?: () => void;
  activeNavTab?: ActiveNavTab;
  onNavTabChange?: (tab: ActiveNavTab) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenAddChoice?: () => void;
  followersList?: FollowerUser[];
  followedAuthors?: string[];
  onToggleFollow?: (authorName: string) => void;
  allPosts?: JobPost[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  savedPosts,
  myPosts,
  onSelectPost,
  onDeletePost,
  isAutoAdvanceActive,
  setIsAutoAdvanceActive,
  userProfile,
  onUpdateUserProfile,
  onConnectAccount,
  onDisconnectAccount,
  activeNavTab = 'profile',
  onNavTabChange,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenAddChoice,
  followersList = [],
  followedAuthors = [],
  onToggleFollow,
  allPosts = []
}) => {
  // If user hasn't connected account yet, guide them directly to the onboarding step
  const isAccountConnected = Boolean(userProfile.connectedAccount?.email);

  const [activeTab, setActiveTab] = useState<'editProfile' | 'myPosts' | 'followers' | 'following' | 'saved' | 'settings'>('editProfile');
  
  // Local edit state initialized with current profile
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Coins Counter Engine (counts up continuously while user is in the platform)
  const [coins, setCoins] = useState<number>(() => getStoredCoins());
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Continuously accumulate coins while active in session
    const timer = setInterval(() => {
      setCoins((prev) => {
        const next = prev + 1;
        saveStoredCoins(next);
        return next;
      });
    }, 7000); // 1 coin every 7 seconds

    return () => clearInterval(timer);
  }, []);

  const handleLaunchAdCampaign = () => {
    const targetUrl = buildAdCampaignUrl(
      coins, 
      userProfile.name, 
      userProfile.userIntent,
      userProfile.connectedAccount?.email
    );
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClaimBonusCoins = () => {
    const next = addCoinsBonus(10);
    setCoins(next);
  };

  // Onboarding / Connection Flow States
  const [selectedIntent, setSelectedIntent] = useState<'employer' | 'seeker'>(
    userProfile.userIntent || 'employer'
  );
  
  const [privacyAgreed, setPrivacyAgreed] = useState(isAccountConnected);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'about' | 'policy' | 'persons' | 'gemini' | 'disclaimer'>('policy');
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);

  const handleOpenPrivacyModal = (tab: 'about' | 'policy' | 'persons' | 'gemini' | 'disclaimer' = 'policy') => {
    setPrivacyModalTab(tab);
    setIsPrivacyModalOpen(true);
  };

  const [currentStep, setCurrentStep] = useState<'connect' | 'details'>(
    isAccountConnected ? 'details' : 'connect'
  );

  // Sync if prop changes
  React.useEffect(() => {
    setFormData(userProfile);
    if (userProfile.connectedAccount?.email) {
      setPrivacyAgreed(true);
      setCurrentStep('details');
    } else {
      setCurrentStep('connect');
    }
  }, [userProfile]);

  if (!isOpen) return null;

  // Handle local form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({
      ...formData,
      userIntent: selectedIntent
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Called when user clicks "Google Sign-In"
  const handleConfirmRoleAndPrivacy = () => {
    if (!privacyAgreed) return;
    setIsGooglePickerOpen(true);
  };

  // Called once an account is chosen in GoogleAccountPickerModal
  const handleGoogleAccountSelected = (chosenEmail: string, userData?: any) => {
    setIsGooglePickerOpen(false);
    const welcome = grantAccountWelcomeCoins(chosenEmail);
    setCoins(welcome.coins);
    if (onConnectAccount) {
      onConnectAccount(chosenEmail, selectedIntent, userData);
    }
    setCurrentStep('details');
  };

  // Filter posts from followed authors
  const followedPosts = allPosts.filter(p => followedAuthors.includes(p.authorName));

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200" 
        onClick={onClose}
      >
        <div 
          className="w-full h-full sm:h-[680px] sm:max-h-[92vh] sm:max-w-2xl max-w-full bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top 50px Banner Ad in Profile Modal */}
          <TopBannerAd />

          {/* Profile Card Header */}
          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-red-50 via-white to-blue-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            {!isAccountConnected ? (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-red-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      حسابي الشخصي
                    </h3>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-black border border-amber-300">
                      غير متصل
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                    سجّل الدخول أو اربط حسابك لحفظ إعلاناتك
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <img
                    src={userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={userProfile.name || 'المستخدم'}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-blue-600 shadow-sm"
                  />
                  {userProfile.verified && (
                    <span className="absolute -bottom-1 -left-1 bg-blue-600 text-white rounded-full p-0.5 border border-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                      {userProfile.name}
                    </h3>
                    <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-black ${
                      userProfile.userIntent === 'employer' 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {userProfile.userIntent === 'employer' ? 'معلن عن عمل' : 'يبحث عن عمل'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 font-bold truncate mt-0.5">
                    {userProfile.role} {userProfile.company ? `• ${userProfile.company}` : ''}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    {userProfile.city && (
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-red-600" />
                        {userProfile.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200 dir-ltr">
                      <Lock className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{userProfile.connectedAccount?.email}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-blue-700 hover:text-blue-900 hover:bg-white/80 transition-colors flex items-center gap-1 font-bold text-xs"
                title="رجوع للصفحة السابقة"
              >
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                <span className="hidden xs:inline">رجوع</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
                title="إغلاق (X)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN CONDITIONAL CONTENT */}
          {currentStep === 'connect' && (
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900">
                    ربط الحساب وتسجيل الدخول الآمن
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    حدد صفتك، وافق على سياسة الخصوصية، ثم اربط حساب Google لحفظ إعلاناتك ومفضلاتك ومتابعيك بأمان.
                  </p>
                </div>
              </div>

              {/* 50 Welcome Coins & Rooh AD Campaign Sync Feature Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md flex items-center justify-between gap-3 border border-amber-400">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                    <Coins className="w-6 h-6 text-amber-100 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black">هدية ترحيبية فورية: 50 كوين بحسابك الجديد!</h4>
                      <span className="text-[9px] bg-white text-orange-700 px-1.5 py-0.2 rounded-full font-black">
                        مجاناً 100%
                      </span>
                    </div>
                    <p className="text-[10.5px] text-amber-100 font-medium leading-relaxed mt-0.5">
                      بمجرد إنشاء أو إضافة حسابك، يظهر في صفحتك <strong>50 كوين فوري</strong> مع عداد كوينات خاص بك يستمر في جمع الكوينات، وتتم <strong>مزامنة بريدك الإلكتروني تلقائياً مع منصة إعلانات Rooh AD (Roohpro.com/AD)</strong> لتمكينك من إطلاق حملاتك الإعلانية على أي منصة تابعة لنا!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Selection between 'معلن عن عمل' or 'يبحث عن عمل' */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>الخطوة 1: حدد صفتك في المنصة:</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setSelectedIntent('employer')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      selectedIntent === 'employer'
                        ? 'border-red-600 bg-red-50/70 shadow-sm ring-1 ring-red-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-red-950">معلن عن عمل</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedIntent === 'employer' ? 'border-red-600 bg-red-600' : 'border-slate-300'
                      }`}>
                        {selectedIntent === 'employer' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      شركة أو صاحب منشأة تبحث عن موظفين أو فنيين.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedIntent('seeker')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      selectedIntent === 'seeker'
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-950">يبحث عن عمل</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedIntent === 'seeker' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}>
                        {selectedIntent === 'seeker' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      فني، مهني أو متخصص يبحث عن فرصة عمل مناسبة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Privacy Policy Agreement Checkbox */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPrivacyAgreed(!privacyAgreed)}
                    className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      privacyAgreed
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-400 bg-white hover:border-blue-500'
                    }`}
                  >
                    {privacyAgreed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                    <span>أوافق وألتزم بـ </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPrivacyModal('policy')}
                      className="text-blue-600 hover:text-blue-800 font-black underline underline-offset-2 cursor-pointer"
                    >
                      سياسة الخصوصية والشروط
                    </button>
                    <span> و </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPrivacyModal('disclaimer')}
                      className="text-red-600 hover:text-red-800 font-black underline underline-offset-2 cursor-pointer"
                    >
                      إخلاء المسؤولية (100% مجاني)
                    </button>
                    <span> و </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPrivacyModal('about')}
                      className="text-indigo-600 hover:text-indigo-800 font-black underline underline-offset-2 cursor-pointer"
                    >
                      من نحن
                    </button>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      (المنصة لا تتقاضى أي أموال نهائياً، والتواصل حصراً ومباشرة عبر الواتساب مع حجب اسم وصورة Google).
                    </span>
                  </div>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={!privacyAgreed}
                  onClick={handleConfirmRoleAndPrivacy}
                  className={`w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 ${
                    privacyAgreed
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/25 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
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
                  <span>تسجيل الدخول وربط الحساب عبر Google</span>
                </button>

                {!privacyAgreed && (
                  <p className="text-[10px] text-amber-600 font-bold text-center mt-1.5 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>يرجى تفعيل مربع الموافقة على سياسة الخصوصية للمتابعة</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE DETAILS & WINDOWS (Rendered once account is linked) */}
          {currentStep === 'details' && (
            <>
              {/* Linked Google Account Notification Banner */}
              {userProfile.connectedAccount?.email && (
                <div className="bg-blue-50/90 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-700">الحساب المرتبط (للتوثيق والحفظ فقط):</span>
                    <span className="font-black text-blue-700 dir-ltr">
                      {userProfile.connectedAccount.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGooglePickerOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    تغيير الحساب
                  </button>
                </div>
              )}

              {/* Dedicated User Profile Path for Google Indexing & Sharing:
                  "ويجب جعل كل مستخدم يقوم بانشاء حساب يكون له مسار مخصص"
              */}
              <div className="px-4 sm:px-5 py-2.5 bg-slate-900 text-white flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-blue-400 font-black shrink-0">رابط حسابك المخصص:</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate dir-ltr">
                    {buildUserProfileUrl(userProfile.name || 'user')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(buildUserProfileUrl(userProfile.name || 'user'));
                    setCopiedLink('user-profile-url');
                    setTimeout(() => setCopiedLink(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10.5px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedLink === 'user-profile-url' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'user-profile-url' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              {/* Live Coins Counter Card with 50 Welcome Coins bonus, continuous counting, and Rooh AD Campaign Sync:
                  "ويكون في هذه الصفحه ايضا عداد كوينات يستمر في العد اثناء توافر المستخدم داخل المنصه
                   ويجب اضافه ميزه ايضا داخل صفحه انشاء الحساب الخاصه بصفحه حسابي عندما يقوم اي مستخدم بانشاء او اضافه حساب يجب ان يتم ظهور في الصفحه الخاصه به 50 كوين يتمكن من خلالهم من جمع الكوينات ايضا ويكون له عداد كوينات خاضت به داخل الصفحه الخاصه به لكي يتم تمكينه من انشاء حمله اعلانيه داخل منصه اد لانها تمكنه عندما يقوم بانشاء حساب داخل المنصه الخاصه بنا هنا يتم مزامنه الايميل الخاص به داخل منصه اد ليتمكن من انشاء حمله اعلانيه في اي منصه من المنصات الخاصه بنا"
              */}
              <div className="mx-4 sm:mx-5 my-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border-2 border-amber-300 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 animate-pulse">
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-amber-950">عداد الكوينات النشط الخاص بك:</span>
                        <span className="text-sm font-black bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-lg border border-amber-400/60 font-mono shadow-xs">
                          {coins} كوين
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>50 كوين هدية إنشاء الحساب مُودعة</span>
                        </span>
                      </div>
                      <p className="text-[10.5px] text-amber-900 font-medium leading-relaxed mt-1">
                        ✨ يستمر هذا العداد في جمع الكوينات تلقائياً أثناء تواجدك وتفاعلك بالمنصة.
                      </p>
                    </div>
                  </div>

                  {/* Quick Collect Bonus Button */}
                  <button
                    type="button"
                    onClick={handleClaimBonusCoins}
                    className="px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-black text-[11px] border border-amber-400/60 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    title="جمع كوينات إضافية فورية للتفاعل"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-700 fill-amber-500" />
                    <span>جمع كوينات إضافية (+10)</span>
                  </button>
                </div>

                {/* Rooh AD Sync & Campaign Launch Strip */}
                <div className="pt-2.5 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/70 p-3 rounded-xl border">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>مزامنة البريد الإلكتروني مع منصة إعلانات Rooh AD:</span>
                      <span className="font-bold text-blue-700 dir-ltr bg-blue-50 px-1.5 py-0.2 rounded text-[11px] border border-blue-200">
                        {userProfile.connectedAccount?.email || 'تمت المزامنة'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      تمت مزامنة بريدك آلياً في شبكة <strong>Rooh AD</strong>. يمكنك إطلاق حملات إعلانية ممولة باستخدام رصيدك ({coins} كوين) على جميع منصاتنا الرقمية التابعة لشبكة Rooh Pro!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchAdCampaign}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-md shadow-orange-600/25 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>إنشاء حملة إعلانية بالكوينات (Roohpro.com/AD)</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Clear Incentive Coins Policy & Legal Disclaimer Note */}
                <div className="bg-amber-100/70 border border-amber-300/80 rounded-xl p-2.5 flex items-start gap-2 text-[10.5px] text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>إفصاح وضوابط الكوينات التشجيعية:</strong> هذه الكوينات نقاط تشجيعية مجانية رقمية مخصصة حصرياً لإنشاء وترويج الإعلانات داخل منصتنا. ليس لها أي قيمة مالية أو نقدية ولا يمكن استبدالها بأموال حقيقية أو بيعها، ولا يتمكن المستخدم من إنشاء حملات إعلانية مدفوعة بأموال حقيقية؛ فجميع الحملات والكوينات المجمعة تستخدم فقط داخل المنصة وتعتبر تشجيعية مجانية بالكامل.
                  </p>
                </div>
              </div>

              {/* Followers and Following Dedicated Windows Bar */}
              <div className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {/* نافذة المتابعين */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('followers')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                      activeTab === 'followers'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-300'
                        : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                    title="فتح نافذة المتابعين لحسابك"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>نافذة المتابعين ({followersList.length})</span>
                  </button>

                  {/* نافذة من أتابعهم */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('following')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                      activeTab === 'following'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25 ring-2 ring-indigo-300'
                        : 'bg-white hover:bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}
                    title="فتح نافذة من تتابعهم من المعلنين والشركات"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>نافذة من أتابعهم ({followedAuthors.length})</span>
                  </button>
                </div>

                <span className="text-[11px] font-bold text-slate-500">
                  شبكة علاقاتك المهنية
                </span>
              </div>

              {/* Tab Switcher */}
              <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveTab('editProfile')}
                    className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === 'editProfile'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>تعديل ملفي وتفاصيلي</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('followers')}
                    className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === 'followers'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>المتابعون ({followersList.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('following')}
                    className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === 'following'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>من أتابعهم ({followedAuthors.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('myPosts')}
                    className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === 'myPosts'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>إعلاناتي ({myPosts.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === 'saved'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>المحفوظات ({savedPosts.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 text-xs sm:text-sm font-black flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === 'settings'
                        ? 'border-slate-800 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>الإعدادات والخصوصية</span>
                  </button>
                </div>
              </div>

              {/* Tab Body Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                
                {/* TAB: EDIT PROFILE & DETAILS */}
                {activeTab === 'editProfile' && (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-center justify-between">
                      <span>
                        تم ربط الحساب بنجاح. بياناتك هنا هي التي تظهر للمستخدمين، واسم وصورة حسابك في Google غير معروضة تماماً.
                      </span>
                    </div>

                    {savedSuccess && (
                      <div className="bg-emerald-600 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>تم حفظ وتحديث بيانات ملفك الشخصي بنجاح!</span>
                      </div>
                    )}

                    {/* Role toggle (معلن عن عمل / باحث عن عمل) */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">الصفة المهنية المحددة:</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSelectedIntent('employer')}
                          className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                            selectedIntent === 'employer'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          معلن عن عمل (صاحب عمل)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedIntent('seeker')}
                          className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                            selectedIntent === 'seeker'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          يبحث عن عمل (مهني / فني)
                        </button>
                      </div>
                    </div>

                    {/* Name & Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">الاسم التجاري أو المهني المعروض:</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-600"
                          placeholder="مثال: م. أحمد حسام أو شركة النور"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">المسمى الوظيفي أو التخصص:</label>
                        <input
                          type="text"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-600"
                          placeholder="مثال: مدير مشروعات، فني تبريد، مسوق"
                          required
                        />
                      </div>
                    </div>

                    {/* Company & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">اسم المنشأة أو الشركة (اختياري):</label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company || ''}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-600"
                          placeholder="مثال: شركة التطوير الهندسي"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف والتواصل:</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-600"
                          placeholder="مثال: 01012345678"
                          required
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">رقم الواتساب للتواصل الفوري:</label>
                      <input
                        type="tel"
                        name="whatsappNumber"
                        value={formData.whatsappNumber || ''}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-600"
                        placeholder="مثال: +201012345678"
                      />
                    </div>

                    {/* Country & City */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">الدولة:</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-600"
                        >
                          <option value="مصر">مصر 🇪🇬</option>
                          <option value="السعودية">المملكة العربية السعودية 🇸🇦</option>
                          <option value="الإمارات">الإمارات العربية المتحدة 🇦🇪</option>
                          <option value="الكويت">الكويت 🇰🇼</option>
                          <option value="قطر">قطر 🇶🇦</option>
                          <option value="عمان">سلطنة عمان 🇴🇲</option>
                          <option value="البحرين">البحرين 🇧🇭</option>
                          <option value="الأردن">الأردن 🇯🇴</option>
                          <option value="العراق">العراق 🇮🇶</option>
                          <option value="ليبيا">ليبيا 🇱🇾</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">المدينة أو المحافظة:</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-600"
                          placeholder="مثال: الإسكندرية، الرياض، القاهرة"
                          required
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">نبذة تعريفية ومجال الخبرة:</label>
                      <textarea
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-600 resize-none"
                        placeholder="اكتب نبذة مختصرة عن نشاطك أو مهاراتك وخبرتك المهنية..."
                      />
                    </div>

                    {/* Save Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>حفظ بيانات وتفاصيل ملفي الشخصي</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB: DEDICATED FOLLOWERS WINDOW ("نافذة خاصة بالمتابعين") */}
                {activeTab === 'followers' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          قائمة المتابعين لحسابك ({followersList.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        أشخاص يتابعون نشاطك وإعلاناتك
                      </span>
                    </div>

                    {followersList.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                        <Users className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
                        <p className="text-sm font-bold text-slate-800">لا يوجد متابعون حتى الآن</p>
                        <p className="text-xs text-slate-500 mt-1">
                          انشر فرص عمل أو طلبات عمل لجذب المتابعين والتواصل المهني المباشر
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {followersList.map((follower) => {
                          const isFollowedBack = followedAuthors.includes(follower.name);

                          return (
                            <div
                              key={follower.id}
                              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs flex items-center justify-between gap-3 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={follower.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                  alt={follower.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                                />
                                <div className="min-w-0">
                                  <h5 className="text-xs font-black text-slate-900 truncate">
                                    {follower.name}
                                  </h5>
                                  <p className="text-[10px] text-blue-700 font-bold truncate">
                                    {follower.role}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    {follower.city ? `${follower.city} • ` : ''}تابعك: {follower.followedAt}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => onToggleFollow && onToggleFollow(follower.name)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer ${
                                  isFollowedBack
                                    ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                }`}
                              >
                                {isFollowedBack ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                    <span>أتابعه</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>رد المتابعة</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: DEDICATED FOLLOWING WINDOW ("نافذة خاصة بمن يتابعهم") */}
                {activeTab === 'following' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          المعلنون والشركات التي تتابعها ({followedAuthors.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-indigo-700 font-bold">
                        {followedPosts.length} وظيفة متاحة
                      </span>
                    </div>

                    {followedAuthors.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                        <UserPlus className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
                        <p className="text-sm font-bold text-slate-800">لم تقم بمتابعة أي معلن حتى الآن</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                          استخدم زر المتابعة في بطاقات الإعلانات لمتابعة الشركات وأصحاب الأعمال المفضلين
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {followedAuthors.map((authorName) => {
                            const authorPost = allPosts.find(p => p.authorName === authorName);
                            return (
                              <div
                                key={authorName}
                                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs flex items-center justify-between gap-3 transition-all"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={authorPost?.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                    alt={authorName}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-black text-slate-900 truncate">
                                      {authorName}
                                    </h5>
                                    <p className="text-[10px] text-slate-500 font-bold truncate">
                                      {authorPost?.authorRole || 'معلن معتمد'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {authorPost && (
                                    <button
                                      onClick={() => {
                                        onSelectPost(authorPost);
                                        onClose();
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition-colors cursor-pointer"
                                    >
                                      عرض الإعلانات
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onToggleFollow && onToggleFollow(authorName)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    إلغاء المتابعة
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: MY POSTS */}
                {activeTab === 'myPosts' && (
                  <div className="space-y-3">
                    {myPosts.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                        <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                        <p className="text-sm font-bold text-slate-700">لم تقم بنشر أي إعلانات بعد</p>
                        <p className="text-xs text-slate-500 mt-1">انقر على علامة (+) في الأسفل لإضافة وظيفة أو طلب عمل</p>
                      </div>
                    ) : (
                      myPosts.map((post, index) => {
                        const shortUrl = buildShortAdUrl(userProfile.name || post.authorName, index + 1);
                        const isDeletingThis = postToDelete === post.id;

                        return (
                          <div
                            key={post.id}
                            className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex flex-col gap-2.5 transition-all shadow-xs"
                          >
                            {/* Top row: Image + Info + Badges */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <img
                                  src={post.backdropImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&auto=format&fit=crop&q=80'}
                                  alt={post.title}
                                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{post.title}</h4>
                                    <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-black">نشط</span>
                                    <span className="text-[9px] bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                                      إعلان رقم #{index + 1}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-blue-700 font-bold mt-0.5">{post.category} • {post.salary}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">{post.createdAt} • {post.likesCount} إعجاب</p>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  onSelectPost(post);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs shrink-0 cursor-pointer transition-colors"
                              >
                                معاينة
                              </button>
                            </div>

                            {/* Ad Description snippet */}
                            {post.description && (
                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {post.description}
                              </p>
                            )}

                            {/* Short URL Strip */}
                            <div className="bg-slate-100 rounded-xl p-2 flex items-center justify-between gap-2 text-[10.5px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-slate-500 shrink-0">رابط الإعلان المختصر:</span>
                                <span className="font-mono text-[10px] text-blue-800 font-bold truncate dir-ltr">
                                  {shortUrl}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(shortUrl);
                                  setCopiedLink(post.id);
                                  setTimeout(() => setCopiedLink(null), 2000);
                                }}
                                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                {copiedLink === post.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedLink === post.id ? 'تم النسخ!' : 'نسخ'}</span>
                              </button>
                            </div>

                            {/* Bottom Actions: Delete Post Confirmation */}
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                رابط معتمد عبر Roohpro.com
                              </span>

                              {isDeletingThis ? (
                                <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200 animate-in fade-in">
                                  <span className="text-[10.5px] font-bold text-red-700 px-1">تأكيد حذف الإعلان؟</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onDeletePost) {
                                        onDeletePost(post.id);
                                      }
                                      setPostToDelete(null);
                                    }}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs"
                                  >
                                    نعم، احذف
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPostToDelete(null)}
                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPostToDelete(post.id)}
                                  className="px-2.5 py-1 text-red-600 hover:text-white hover:bg-red-600 rounded-lg text-xs font-bold border border-red-200 hover:border-red-600 flex items-center gap-1 transition-all cursor-pointer"
                                  title="حذف هذا الإعلان نهائياً من حسابك والمنصة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف الإعلان</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB: SAVED POSTS */}
                {activeTab === 'saved' && (
                  <div className="space-y-3">
                    {savedPosts.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                        <Bookmark className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                        <p className="text-sm font-bold text-slate-700">لم تقم بحفظ أي إعلانات حتى الآن</p>
                        <p className="text-xs text-slate-500 mt-1">انقر على أيقونة الحفظ بالبطاقات للرجوع إليها لاحقاً</p>
                      </div>
                    ) : (
                      savedPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => {
                            onSelectPost(post);
                            onClose();
                          }}
                          className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={post.backdropImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&auto=format&fit=crop&q=80'}
                              alt={post.title}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{post.title}</h4>
                              <p className="text-[11px] text-blue-700 font-bold mt-0.5">{post.category} • {post.salary}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{post.location} ({post.country})</p>
                            </div>
                          </div>
                          <span className="text-xs text-blue-600 font-bold">عرض</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: SETTINGS & PRIVACY */}
                {activeTab === 'settings' && (
                  <div className="space-y-3.5">
                    {/* 1. About Us Card */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">من نحن — منصة شغل وتقنية</h4>
                          <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                            تعرف على رؤيتنا وأهدافنا في ربط أصحاب الأعمال والكوادر مباشرة
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenPrivacyModal('about')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
                      >
                        تعرف علينا
                      </button>
                    </div>

                    {/* 2. Privacy & Strict Disclaimer Card */}
                    <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Ban className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-red-950">إخلاء المسؤولية وسياسة الخصوصية</h4>
                          <p className="text-[11px] text-red-700 font-semibold mt-0.5">
                            المنصة مجانية 100% ولا تتقاضى أي أموال، والتواصل مباشرة عبر الواتساب
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenPrivacyModal('disclaimer')}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          إخلاء المسؤولية
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPrivacyModal('policy')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          الشروط
                        </button>
                      </div>
                    </div>

                    {/* 3. High Encryption & Secure Cloud Servers Info */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-slate-900">حماية وتشفير البيانات</h4>
                            <span className="text-[9px] bg-emerald-200 text-emerald-950 font-black px-1.5 py-0.2 rounded-md">
                              خوادم سحابية مؤمنة ومشفرة
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                            تتعامل المنصة بأعلى درجات التشفير لحماية سرية وأمان البيانات والإعلانات المنشورة
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-emerald-200 px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
                        <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-slate-800">
                          {userProfile.coinsBalance || (userProfile.connectedAccount?.email ? 100 : 50)} كوين
                        </span>
                      </div>
                    </div>

                    {/* 4. Auto Advance Toggle */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">التمرير التلقائي (10 ثوانٍ)</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          الانتقال تلقائياً للبطاقة التالية مثل ريلز وتيك توك بعد انتهاء الوقت
                        </p>
                      </div>
                      <button
                        onClick={() => setIsAutoAdvanceActive(!isAutoAdvanceActive)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                          isAutoAdvanceActive ? 'bg-red-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            isAutoAdvanceActive ? 'translate-x-0' : '-translate-x-6'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 5. Logout / Switch Account */}
                    {isAccountConnected && (
                      <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-red-950">تسجيل الخروج أو تبديل الحساب</h4>
                          <p className="text-[11px] text-red-700 mt-0.5">
                            الحساب الحالي: <span className="font-bold dir-ltr">{userProfile.connectedAccount?.email}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onDisconnectAccount) {
                              onDisconnectAccount();
                            }
                            setCurrentStep('connect');
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>تسجيل الخروج</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Subtle Bottom Footer Branding (Moved from top to keep top header clean & attractive) */}
          <div className="py-2 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-600 font-medium shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>المنصة المهنية الموحدة لربط أصحاب الأعمال والمهنيين</span>
          </div>

          {/* Integrated Bottom Navigation Bar */}
          {onNavTabChange && (
            <div className="shrink-0 border-t border-slate-200 bg-white">
              <BottomNav
                activeTab={activeNavTab}
                onTabChange={(tab) => {
                  if (tab === 'profile') return;
                  onNavTabChange(tab);
                  onClose();
                }}
                commentsCount={0}
                unreadNotificationsCount={unreadNotificationsCount}
                unreadMessagesCount={unreadMessagesCount}
                onOpenAddChoice={() => {
                  if (onOpenAddChoice) onOpenAddChoice();
                  onClose();
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Full Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onAccept={() => setPrivacyAgreed(true)}
        initialTab={privacyModalTab}
        allPosts={allPosts}
        userProfile={userProfile}
        activeAccountEmail={userProfile.connectedAccount?.email}
      />

      {/* Google Account Picker Modal */}
      <GoogleAccountPickerModal
        isOpen={isGooglePickerOpen}
        onClose={() => setIsGooglePickerOpen(false)}
        onSelectAccount={handleGoogleAccountSelected}
        currentEmail={userProfile.connectedAccount?.email}
      />
    </>
  );
};
