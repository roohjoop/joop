import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Briefcase, 
  UserCheck, 
  DollarSign, 
  MapPin, 
  Clock, 
  Phone, 
  Link as LinkIcon,
  CheckCircle,
  Sparkles,
  Globe,
  ArrowRight
} from 'lucide-react';
import { JobPost, ListingType, ActiveNavTab } from '../types';
import { BottomNav } from './BottomNav';
import { ARAB_COUNTRIES, detectCountryFromPhone, generateWhatsAppUrl, CountryInfo } from '../utils/whatsapp';
import { SquareBannerAd350 } from './SquareBannerAd350';
import { uploadImageToCloudflareR2 } from '../utils/cloudSync';

interface AddJobModalProps {
  initialType: ListingType;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => void;
  activeNavTab?: ActiveNavTab;
  onNavTabChange?: (tab: ActiveNavTab) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenAddChoice?: () => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({
  initialType,
  isOpen,
  onClose,
  onSubmit,
  activeNavTab = 'add',
  onNavTabChange,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenAddChoice
}) => {
  const [type, setType] = useState<ListingType>(initialType);
  const [title, setTitle] = useState('');
  // Free-form profession/category (no fixed restricted dropdown)
  const [category, setCategory] = useState('');
  // Optional salary toggle: whether advertiser wants to show salary or keep it hidden/unspecified
  const [showSalary, setShowSalary] = useState(true);
  const [salary, setSalary] = useState('');
  // Free-form location/address (e.g. مصر، إسكندرية، القاهرة، إلخ - no restricted dropdown)
  const [location, setLocation] = useState('');
  
  // Country selection and auto-detection
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(
    ARAB_COUNTRIES.find(c => c.name === 'مصر') || ARAB_COUNTRIES[0]
  );
  
  const [experience, setExperience] = useState('خبرة 3+ سنوات');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');
  
  // WhatsApp input: supports either phone number OR direct link (wa.me)
  const [whatsappInput, setWhatsappInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [workType, setWorkType] = useState<'دوام كامل' | 'دوام جزئي' | 'عن بعد' | 'عمل حر' | 'عاجل'>('دوام كامل');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [agreePolicy, setAgreePolicy] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  if (!isOpen) return null;

  // Handle local user photo upload with instant preview and Cloudflare R2 pipeline
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const uploadResult = await uploadImageToCloudflareR2(file, 'avatars');
        setAvatarPreview(uploadResult.url);
        setAuthorAvatar(uploadResult.url);
      } catch (err) {
        console.warn('R2 upload pipeline fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Result = reader.result as string;
          setAvatarPreview(base64Result);
          setAuthorAvatar(base64Result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Smart detect country if user types phone number
  const handlePhoneOrLinkChange = (value: string) => {
    setWhatsappInput(value);
    const detected = detectCountryFromPhone(value);
    if (detected) {
      setSelectedCountry(detected);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean tags array
    const tags = tagsInput
      .split(/[,،]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (tags.length === 0) {
      tags.push(type === 'job' ? 'وظيفة_مباشرة' : 'صنايعي_محترف');
      if (category.trim()) tags.push(category.trim());
      if (location.trim()) tags.push(location.trim().split(' ')[0]);
    }

    // Process WhatsApp target url and number
    let finalWhatsAppNumber: string | undefined = undefined;
    let finalWhatsAppLink: string | undefined = undefined;

    const trimmedInput = whatsappInput.trim();
    if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://') || trimmedInput.startsWith('wa.me')) {
      finalWhatsAppLink = trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`;
    } else {
      finalWhatsAppNumber = trimmedInput;
      finalWhatsAppLink = generateWhatsAppUrl(trimmedInput, selectedCountry.code);
    }

    // Default relevant backdrop based on type
    const defaultBackdrops = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
    ];
    const backdropImage = defaultBackdrops[Math.floor(Math.random() * defaultBackdrops.length)];

    onSubmit({
      type,
      title: title.trim(),
      category: category.trim() || 'وظائف ومهن عامة',
      salary: showSalary ? (salary.trim() || 'قابل للتفاوض') : '',
      location: location.trim(),
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      experience: experience.trim() || 'حسب الكفاءة',
      description: description.trim() || (type === 'job' ? 'مطلوب للعمل فوراً، يرجى التواصل عبر الواتساب المباشر.' : 'متاح للعمل فوراً، يرجى التواصل عبر الواتساب المباشر.'),
      authorName: authorName.trim() || 'مستخدم معتمد',
      authorRole: authorRole.trim() || (type === 'job' ? 'صاحب عمل' : 'مهني / فني'),
      authorAvatar: authorAvatar,
      backdropImage,
      tags,
      workType,
      verified: true,
      whatsappNumber: finalWhatsAppNumber || (finalWhatsAppLink ? '' : whatsappInput.trim()),
      whatsappLink: finalWhatsAppLink,
      isLiked: false,
      isSaved: false
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/60 backdrop-blur-sm px-2 sm:px-4 py-4 sm:py-8 flex justify-center items-start animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* نافذة إضافة الإعلان: بدون سكرول داخلي ليتم سحب الصفحة بالكامل للأعلى من أي مكان */}
        <div 
          className="order-1 lg:order-1 w-full max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-50 via-white to-blue-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              type === 'job' ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              {type === 'job' ? <Briefcase className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {type === 'job' ? 'نشر إعلان وظيفة جديدة' : 'نشر طلب عمل / سيرة ذاتية'}
              </h2>
              <p className="text-[11px] sm:text-xs text-blue-700 font-semibold">
                {type === 'job' 
                  ? 'أضف أي وظيفة في أي مكان بحرية كاملة مع زر واتساب مباشر' 
                  : 'اعرض مهنتك وخبراتك للتواصل الفوري عبر الواتساب'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-blue-700 hover:text-blue-900 hover:bg-slate-100 transition-colors flex items-center gap-1 font-bold text-xs"
              title="رجوع للصفحة السابقة"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden xs:inline">رجوع</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="إغلاق (X)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle inside modal */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setType('job')}
              className={`py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                type === 'job'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>إضافة وظيفة (صاحب عمل)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('seeker')}
              className={`py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                type === 'seeker'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>طلب عمل (باحث عن وظيفة)</span>
            </button>
          </div>
        </div>

        {/* Form Body - تم إزالة السكرول الداخلي ليكون السحب على الصفحة بالكامل */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Custom User Profile Picture Upload */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={avatarPreview || authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt="معاينة الصورة"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-md ring-2 ring-blue-100"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                title="تغيير الصورة"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-right">
              <h4 className="text-xs font-black text-slate-900 mb-0.5">
                صورة الحساب / الشعار (Custom Profile Picture)
              </h4>
              <p className="text-[11px] text-slate-500 mb-2">
                ارفع صورتك الشخصية أو شعار ورشتك/شركتك للظهور في واجهة الإعلان
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>رفع صورة من جهازك</span>
              </button>
            </div>
          </div>

          {/* Job Title / Candidate Headline */}
          <div>
            <label className="block text-xs font-black text-slate-900 mb-1.5">
              {type === 'job' 
                ? 'عنوان الوظيفة المطلوب شغلها * (اكتب أي وظيفة بحرية)' 
                : 'عنوان تخصصك أو مهنتك * (اكتب مهنتك بحرية)'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'job' ? 'مثال: مطلوب نجار موبيليا وديكور، سباك، محاسب...' : 'مثال: نجار ديكور ومطابخ، سباك صحي، مبرمج...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Free-form Category/Profession + Country Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Free-form Profession/Category (NO RESTRICTED DROPDOWN) */}
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5 flex items-center gap-1">
                <span>المجال أو التخصص المهني * (اكتب أي مهنة بحرية)</span>
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مثال: نجارة، سباكة، حدادة، برمجة، نقاشة، محاسبة، تمريض..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>

            {/* Country Selector with Flag and Dial Code */}
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>البلد (يحدد رمز الاتصال ومكان الإعلان)</span>
              </label>
              <select
                value={selectedCountry.name}
                onChange={(e) => {
                  const found = ARAB_COUNTRIES.find(c => c.name === e.target.value);
                  if (found) setSelectedCountry(found);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                {ARAB_COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Free-form Location / Address (NO RESTRICTED DROPDOWN) */}
          <div>
            <label className="block text-xs font-black text-slate-900 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>العنوان / المحافظة أو المدينة أو الحي * (اكتب أي مكان بحرية)</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: مصر - الإسكندرية (سموحة)، القاهرة (المعادي)، الجيزة، المنصورة، طنطا، أو أي مدينة..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              يمكنك كتابة أي عنوان بدقة في مصر، الإسكندرية، أو أي محافظة أو دولة بالعالم.
            </p>
          </div>

          {/* Professional WhatsApp Number OR Link Input */}
          <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-emerald-900 flex items-center gap-1.5">
                {/* Official WhatsApp SVG emblem */}
                <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.797.813 3.179 0 5.767-2.587 5.767-5.766.001-3.181-2.586-5.768-5.768-5.768zm7.969 5.768c0 4.414-3.586 8-8 8-1.378 0-2.433-.35-3.535-.937l-4.465 1.171 1.194-4.359c-.687-1.19-1.194-2.39-1.194-3.875 0-4.414 3.586-8 8-8s8 3.586 8 8zm-4.385 2.193c-.1-.167-.367-.267-.768-.467-.4-.2-2.368-1.168-2.735-1.301-.367-.133-.634-.2-.901.2-.267.4-1.034 1.301-1.268 1.568-.233.267-.467.3-.867.1-.4-.2-1.691-.623-3.221-1.987-1.19-1.061-1.993-2.372-2.227-2.772-.233-.4-.025-.616.175-.815.18-.179.4-.467.6-.7.2-.233.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.901-2.168-1.235-2.969-.324-.779-.653-.674-.9-.686-.233-.012-.5-.015-.767-.015s-.7.1-.1.067.433 1.034 1.634 1.034 3.501c0 1.867 1.368 3.668 1.568 3.934.2.267 2.692 4.11 6.523 5.762.911.393 1.622.628 2.176.804.914.291 1.746.25 2.404.152.733-.11 2.256-.922 2.576-1.811.32-.889.32-1.649.224-1.811z" />
                </svg>
                <span>رقم الواتساب أو رابط المحادثة المباشر *</span>
              </label>

              <span className="text-[10px] text-emerald-800 font-mono font-bold">
                {selectedCountry.flag} {selectedCountry.code}
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={whatsappInput}
                onChange={(e) => handlePhoneOrLinkChange(e.target.value)}
                placeholder="اكتب رقم الهاتف (مثال: 01012345678 أو +20...) أو الصق رابط wa.me"
                dir="ltr"
                className="w-full bg-white border border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 text-left focus:outline-none focus:border-emerald-600 font-mono shadow-sm"
              />
            </div>
            
            <div className="mt-1.5 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-1">
              <span>يقبل أرقام الهواتف أو روابط الواتساب المباشرة (مثل https://wa.me/...)</span>
              {whatsappInput && (
                <span className="text-emerald-700 font-mono font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 inline text-emerald-600" />
                  رابط مباشر جاهز
                </span>
              )}
            </div>
          </div>

          {/* Author Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5">
                {type === 'job' ? 'اسم المنشأة أو صاحب العمل *' : 'اسمك الكريم أو اسم الشهرة *'}
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={type === 'job' ? 'مثال: ورشة الإسكندرية للديكور' : 'مثال: أحمد عبد الرحمن'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5">
                الصفة أو التوصيف
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder={type === 'job' ? 'صاحب عمل / مقاولات' : 'صنايعي حر / فني مستقل'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Salary, Experience & Work Type */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  {type === 'job' ? 'الراتب المعروض (اختياري)' : 'الراتب أو الأجر المتوقع (اختياري)'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  يمكنك تفعيل أو إخفاء إظهار السعر والراتب في الإعلان حسب رغبتك
                </span>
              </div>

              {/* Toggle switch for optional salary */}
              <button
                type="button"
                onClick={() => setShowSalary(!showSalary)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  showSalary ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title={showSalary ? 'إخفاء الراتب من الإعلان' : 'إظهار الراتب في الإعلان'}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    showSalary ? 'translate-x-0' : '-translate-x-5'
                  }`}
                />
              </button>
            </div>

            {showSalary && (
              <div className="animate-in fade-in duration-200">
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="مثال: 6,000 - 8,000 ج.م أو قابل للتفاوض أو باليومية..."
                  className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5">
                الخبرة
              </label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="مثال: خبرة 3+ سنوات"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5">
                نوع الدوام
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="دوام كامل">دوام كامل</option>
                <option value="دوام جزئي">دوام جزئي</option>
                <option value="عن بعد">عن بعد</option>
                <option value="عمل حر">عمل حر</option>
                <option value="عاجل">عاجل وفوري</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-slate-900 mb-1.5">
              تفاصيل الوظيفة أو المهارات والخبرات
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'job' 
                ? 'اذكر مسؤوليات الوظيفة، المزايا (بدل سكن، حوافز، مواعيد العمل)...' 
                : 'تحدث عن مهاراتك الفنية، أبرز الأعمال والمشاريع السابقة، وجاهزيتك للعمل...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-black text-slate-900 mb-1.5">
              وسوم وكلمات دلالية (مفصولة بفاصلة)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: نجار، إسكندرية، تشطيبات، شغل فوري"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Policy & Terms Checkbox */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="agree-15-clauses"
              checked={agreePolicy}
              onChange={(e) => setAgreePolicy(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5 cursor-pointer"
            />
            <label htmlFor="agree-15-clauses" className="text-[11px] text-slate-700 leading-tight font-medium cursor-pointer">
              أقر بصحة البيانات وأوافق على <span className="font-black text-blue-700">وثيقة الـ 15 بنداً القانونية 100%</span> والتواصل المباشر وإخلاء مسؤولية المنصة.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!agreePolicy}
              className={`px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                !agreePolicy 
                  ? 'bg-slate-300 cursor-not-allowed opacity-60' 
                  : type === 'job' 
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' 
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{type === 'job' ? 'نشر الوظيفة الآن' : 'نشر طلب العمل الآن'}</span>
            </button>
          </div>

          </form>

        {/* Integrated Bottom Navigation Bar: Enables navigation across all sections */}
        {onNavTabChange && (
          <div className="shrink-0 border-t border-slate-200 bg-white">
            <BottomNav
              activeTab={activeNavTab}
              onTabChange={(tab) => {
                if (tab === 'add') return;
                onNavTabChange(tab);
                onClose();
              }}
              commentsCount={0}
              unreadNotificationsCount={unreadNotificationsCount}
              unreadMessagesCount={unreadMessagesCount}
              onOpenAddChoice={() => {
                if (onOpenAddChoice) onOpenAddChoice();
              }}
            />
          </div>
        )}
        </div>

        {/* إعلان بنر مربع 350x350 مدمج ومتكيف من اليمين إلى الشمال */}
        <SquareBannerAd350 className="order-2 lg:order-2 shrink-0 my-3 shadow-2xl lg:sticky lg:top-8" />
      </div>
    </div>
  );
};
