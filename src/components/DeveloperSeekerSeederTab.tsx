import React, { useState } from 'react';
import { 
  UserCheck, 
  PlusCircle, 
  Sparkles, 
  MapPin, 
  Phone, 
  Check, 
  Trash2, 
  Layers,
  Search,
  Award
} from 'lucide-react';
import { JobPost } from '../types';
import { REAL_SEED_SEEKERS } from '../data/seedOpportunities';

interface DeveloperSeekerSeederTabProps {
  allPosts: JobPost[];
  onAddListing?: (post: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => void;
  onBatchAddListings?: (posts: Array<Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>>) => void;
  onDeleteJob?: (jobId: string) => void;
  onSelectPost?: (post: JobPost) => void;
}

const CATEGORIES_LIST = [
  'السباكة والأعمال الصحية',
  'النجارة والموبيليا',
  'الكهرباء والتحكم',
  'الديكور والتشطيبات',
  'صيانة الأجهزة والتكييف',
  'التقنية والبرمجة',
  'النقل والتوصيل',
  'الحرف والورش',
  'الإدارة والمبيعات',
  'أخرى'
];

const WORK_TYPES = ['عمل حر', 'دوام كامل', 'دوام جزئي', 'عن بعد', 'عاجل'] as const;

const AVATAR_PRESETS = [
  { label: 'فني شاب 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'معلم حرفي 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'فني محترف 3', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { label: 'تقني ومطور 4', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' },
  { label: 'سائق ومساعد 5', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80' },
  { label: 'مهنية وسيدات 6', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' }
];

export const DeveloperSeekerSeederTab: React.FC<DeveloperSeekerSeederTabProps> = ({
  allPosts,
  onAddListing,
  onBatchAddListings,
  onDeleteJob,
  onSelectPost
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    candidateName: '',
    roleTitle: 'فني سباكة وتأسيس صحي',
    title: '',
    category: 'السباكة والأعمال الصحية',
    salary: 'يومية 350 - 450 ج.م أو راتب 7,500 ج.م',
    workType: 'عمل حر' as typeof WORK_TYPES[number],
    location: 'القاهرة - حلوان والمعادي',
    authorPhone: '+201015523311',
    whatsappNumber: '+201015523311',
    experience: 'خبرة 7 سنوات',
    description: '',
    authorAvatar: AVATAR_PRESETS[0].url,
    backdropImage: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1080&auto=format&fit=crop&q=80',
    tags: 'حرفي, سباك, القاهرة, تشطيب'
  });

  const seekerPosts = allPosts.filter(p => p.type === 'seeker');
  const filteredSeekers = seekerPosts.filter(p => 
    p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.authorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidateName.trim()) {
      alert('يرجى كتابة اسم الحرفي أو المهني');
      return;
    }

    const titleText = formData.title.trim() || `${formData.roleTitle} (${formData.candidateName}) أبحث عن عمل`;

    const tagsArray = formData.tags
      .split(/[,،]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const postPayload: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'> = {
      type: 'seeker',
      title: titleText,
      category: formData.category,
      salary: formData.salary.trim(),
      location: formData.location.trim(),
      country: 'مصر',
      countryCode: '+20',
      experience: formData.experience.trim(),
      description: formData.description.trim() || 'كفاءة مهنية حقيقية مسجلة وموثوقة، جاهز للعمل الفوري باليومية أو بالمشروع أو بدوام كامل.',
      authorName: formData.candidateName.trim(),
      authorRole: formData.roleTitle.trim(),
      authorAvatar: formData.authorAvatar,
      authorPhone: formData.authorPhone.trim(),
      backdropImage: formData.backdropImage,
      whatsappNumber: formData.whatsappNumber.trim(),
      whatsappLink: formData.whatsappNumber ? `https://wa.me/${formData.whatsappNumber.replace(/[^0-9]/g, '')}` : undefined,
      tags: tagsArray.length > 0 ? tagsArray : ['باحث عن عمل', 'حرفي'],
      verified: true,
      workType: formData.workType
    };

    if (onAddListing) {
      onAddListing(postPayload);
    }

    setSuccessToast(`تم نشر ملف الكفاءة "${formData.candidateName}" بنجاح وحفظه في فايربيس!`);
    setTimeout(() => setSuccessToast(''), 4000);

    setFormData(prev => ({
      ...prev,
      candidateName: '',
      title: '',
      description: ''
    }));
    setShowAddForm(false);
  };

  const handleSeedBatch = () => {
    if (onBatchAddListings) {
      onBatchAddListings(REAL_SEED_SEEKERS);
      setSuccessToast(`🎉 تم شحن باقة الـ 10 كفاءات وحرفيين الحقيقيين بنجاح وحفظهم في فايربيس!`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150" dir="rtl">
      
      {/* Success Notice */}
      {successToast && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{successToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessToast('')}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Explanation */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl shadow-md border border-emerald-800 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/30 border border-emerald-400 text-emerald-200 text-[10px] font-bold">
                خاص بلوحة تحكم المطور
              </span>
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                تأسيس كفاءات وحرفيين حقيقيين
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              إضافة باحثين عن عمل وكفاءات حقيقية (Seed Real Job Seekers & Craftsmen)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تتيح لك هذه الصفحة كمطور إضافة أشخاص وكفاءات حقيقية تبحث عن عمل وصنائعية تم جمعهم من مجموعات التوظيف وسوق العمل ليظهروا فوراً لأصحاب الأعمال في ريلز "يبحثون عن عمل" دون الحاجة لربط إيميل شخصي.
            </p>
          </div>

          {/* Quick 1-Click Seeder Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSeedBatch}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 border border-emerald-300"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
              <span>⚡ شحن باقة 10 حرفيين وكفاءات حقيقية</span>
            </button>
          </div>
        </div>

        {/* Counter and Form Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>إجمالي الباحثين عن عمل المسجلين:</span>
            <span className="font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded-md">
              {seekerPosts.length} شخصاً
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>{showAddForm ? 'إغلاق النموذج' : 'إضافة باحث عن عمل يدوياً'}</span>
          </button>
        </div>
      </div>

      {/* Manual Seeker Addition Form */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 bg-white border-2 border-emerald-200 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900">
                بيانات الشخص / الحرفي الباحث عن عمل
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              * تُسجل وتُوثق مباشرة ككفاءة معتمدة للمنصة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Candidate Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                اسم الشخص أو الحرفي الحقيقي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.candidateName}
                onChange={e => setFormData({ ...formData, candidateName: e.target.value })}
                placeholder="مثال: أحمد كمال مصطفى"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Role Title */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                المهنة أو الحرفة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.roleTitle}
                onChange={e => setFormData({ ...formData, roleTitle: e.target.value })}
                placeholder="مثال: فني سباكة وتأسيس صحي معتمد"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Title / Headline */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                عنوان الإعلان الرئيسي في الريلز
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: فني سباكة معتمد أبحث عن مشاريع شقق أو دوام باليومية"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                التخصص المهني
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none bg-white"
              >
                {CATEGORIES_LIST.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Expected Wage / Salary */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                اليومية أو الراتب المطلوب
              </label>
              <input
                type="text"
                value={formData.salary}
                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                placeholder="مثال: يومية 350 - 450 ج.م أو راتب 7,500 ج.م"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Work Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                طبيعة العمل المطلوبة
              </label>
              <select
                value={formData.workType}
                onChange={e => setFormData({ ...formData, workType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none bg-white"
              >
                {WORK_TYPES.map(wt => (
                  <option key={wt} value={wt}>{wt}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                المحافظة والمنطقة المتاحة للعمل
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="مثال: القاهرة - حلوان والمعادي ومدينة نصر"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Contact Phone & WhatsApp */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                رقم التواصل والواتساب
              </label>
              <input
                type="text"
                value={formData.authorPhone}
                onChange={e => setFormData({ ...formData, authorPhone: e.target.value, whatsappNumber: e.target.value })}
                placeholder="مثال: +201015523311"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none dir-ltr text-right"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                سنوات الخبرة
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                placeholder="مثال: خبرة 7 سنوات"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Description / Bio */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                نبذة عن المهارات والأعمال السابقة
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب نبذة عن مهارات الحرفي، خبراته السابقة، والأجهزة أو العدد التي يمتلكها..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none resize-none"
              />
            </div>

            {/* Avatar Preset Picker */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                الصورة الشخصية الحقيقية (اختر وجهاً واقعياً سريعاً أو ضع رابطاً)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, authorAvatar: p.url })}
                    className={`flex items-center gap-1.5 p-1 rounded-xl border transition-all cursor-pointer ${
                      formData.authorAvatar === p.url
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <img 
                      src={p.url} 
                      alt={p.label} 
                      className="w-7 h-7 rounded-lg object-cover" 
                    />
                    <span className="text-[10px] font-bold text-slate-700 pl-1">{p.label}</span>
                  </button>
                ))}
              </div>
              <input
                type="url"
                value={formData.authorAvatar}
                onChange={e => setFormData({ ...formData, authorAvatar: e.target.value })}
                placeholder="رابط صورة مخصصة https://..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 font-mono outline-none dir-ltr text-left"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ ونشر ملف الكفاءة في المنصة وفايربيس فوراً</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Seekers List & Management */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">
              قائمة الباحثين عن عمل المتاحين بالمنصة ({filteredSeekers.length} من أصل {seekerPosts.length})
            </h3>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="بحث في الاسم أو الحرفة أو المحافظة..."
              className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-emerald-400"
            />
          </div>
        </div>

        {filteredSeekers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            لا توجد ملفات كفاءات مطابقة للبحث حالياً. يمكنك استخدام زر الشحن الفوري بالأعلى لإضافة 10 كفاءات بنقرة واحدة!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto no-scrollbar pt-1">
            {filteredSeekers.map(seeker => (
              <div
                key={seeker.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={seeker.authorAvatar || seeker.backdropImage}
                      alt={seeker.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {seeker.authorName}
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-bold truncate">
                        {seeker.authorRole || seeker.title} • {seeker.category}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    {seeker.salary}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{seeker.location}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {seeker.authorPhone && (
                      <a
                        href={`tel:${seeker.authorPhone}`}
                        className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                        title="اتصال بالحرفي"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                    )}

                    {onSelectPost && (
                      <button
                        type="button"
                        onClick={() => onSelectPost(seeker)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-emerald-700 text-[10px] font-bold cursor-pointer"
                      >
                        معاينة
                      </button>
                    )}

                    {onDeleteJob && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف ملف "${seeker.authorName}"؟`)) {
                            onDeleteJob(seeker.id);
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="حذف الملف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
