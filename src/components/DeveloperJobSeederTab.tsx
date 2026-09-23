import React, { useState } from 'react';
import { 
  Briefcase, 
  PlusCircle, 
  Sparkles, 
  MapPin, 
  DollarSign, 
  Phone, 
  Building2, 
  Check, 
  Trash2, 
  Image as ImageIcon,
  ExternalLink,
  Layers,
  Search
} from 'lucide-react';
import { JobPost } from '../types';
import { REAL_SEED_JOBS } from '../data/seedOpportunities';

interface DeveloperJobSeederTabProps {
  allPosts: JobPost[];
  onAddListing?: (post: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => void;
  onBatchAddListings?: (posts: Array<Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>>) => void;
  onDeleteJob?: (jobId: string) => void;
  onSelectPost?: (post: JobPost) => void;
}

const CATEGORIES_LIST = [
  'النجارة والموبيليا',
  'السباكة والأعمال الصحية',
  'الكهرباء والتحكم',
  'الديكور والتشطيبات',
  'صيانة الأجهزة والتكييف',
  'التقنية والبرمجة',
  'الحرف والورش',
  'النقل والتوصيل',
  'الإدارة والمبيعات',
  'أخرى'
];

const WORK_TYPES = ['دوام كامل', 'دوام جزئي', 'عن بعد', 'عمل حر', 'عاجل'] as const;

const PHOTO_PRESETS = [
  { label: 'ورشة نجارة وأثاث', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1080&auto=format&fit=crop&q=80' },
  { label: 'تكييف وتبريد', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1080&auto=format&fit=crop&q=80' },
  { label: 'سباكة وتأسيس', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1080&auto=format&fit=crop&q=80' },
  { label: 'كهرباء وإنارة', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1080&auto=format&fit=crop&q=80' },
  { label: 'برمجة وتكنولوجيا', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1080&auto=format&fit=crop&q=80' },
  { label: 'سيارات وميكانيكا', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1080&auto=format&fit=crop&q=80' },
  { label: 'مطاعم وأغذية', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1080&auto=format&fit=crop&q=80' },
  { label: 'شحن ولوجستيات', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1080&auto=format&fit=crop&q=80' },
  { label: 'مكتب وعقارات', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&auto=format&fit=crop&q=80' }
];

export const DeveloperJobSeederTab: React.FC<DeveloperJobSeederTabProps> = ({
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
    title: '',
    authorName: '',
    authorRole: 'صاحب عمل / منشأة تجارية',
    category: 'النجارة والموبيليا',
    salary: '7,000 - 9,000 ج.م',
    workType: 'دوام كامل' as typeof WORK_TYPES[number],
    location: 'القاهرة - التجمع الخامس',
    authorPhone: '+201012345678',
    whatsappNumber: '+201012345678',
    experience: 'خبرة 3+ سنوات',
    description: '',
    backdropImage: PHOTO_PRESETS[0].url,
    authorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    tags: 'وظيفة, عمل, القاهرة'
  });

  const jobPosts = allPosts.filter(p => p.type === 'job');
  const filteredJobs = jobPosts.filter(p => 
    p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.authorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.authorName.trim()) {
      alert('يرجى كتابة عنوان الوظيفة واسم المنشأة');
      return;
    }

    const tagsArray = formData.tags
      .split(/[,،]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const postPayload: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'> = {
      type: 'job',
      title: formData.title.trim(),
      category: formData.category,
      salary: formData.salary.trim(),
      location: formData.location.trim(),
      country: 'مصر',
      countryCode: '+20',
      experience: formData.experience.trim(),
      description: formData.description.trim() || 'وظيفة حقيقية معلنة من سوق العمل، للتواصل والاستفسار المباشر عبر الهاتف أو الواتساب.',
      authorName: formData.authorName.trim(),
      authorRole: formData.authorRole.trim(),
      authorAvatar: formData.authorAvatar,
      authorPhone: formData.authorPhone.trim(),
      backdropImage: formData.backdropImage,
      whatsappNumber: formData.whatsappNumber.trim(),
      whatsappLink: formData.whatsappNumber ? `https://wa.me/${formData.whatsappNumber.replace(/[^0-9]/g, '')}` : undefined,
      tags: tagsArray.length > 0 ? tagsArray : ['وظائف', 'شغل'],
      verified: true,
      workType: formData.workType
    };

    if (onAddListing) {
      onAddListing(postPayload);
    }

    setSuccessToast(`تم نشر وظيفة "${formData.title}" بنجاح وحفظها في فايربيس!`);
    setTimeout(() => setSuccessToast(''), 4000);

    // Reset some fields
    setFormData(prev => ({
      ...prev,
      title: '',
      description: ''
    }));
    setShowAddForm(false);
  };

  const handleSeedBatch = () => {
    if (onBatchAddListings) {
      onBatchAddListings(REAL_SEED_JOBS);
      setSuccessToast(`🎉 تم شحن باقة الـ 10 وظائف الحقيقية المعتمدة بالكامل وحفظها في فايربيس!`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150" dir="rtl">
      
      {/* Success Notification Bar */}
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
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md border border-blue-800 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/30 border border-blue-400 text-blue-200 text-[10px] font-bold">
                خاص بلوحة تحكم المطور
              </span>
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                تأسيس محتوى حقيقي للمنصة
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              إضافة وظائف وشواغر حقيقية من سوق العمل (Seed Real Job Openings)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تتيح لك هذه الصفحة كمطور جمع ونشر وظائف حقيقية متاحة في السوق المصري والعربي لملء المنصة فوراً دون الحاجة لربط إيميل المستخدم؛ حيث تُحفظ وتُوثّق مباشرة في Firebase Firestore وتظهر لجميع الزوار في الريلز وقائمة الوظائف.
            </p>
          </div>

          {/* Quick 1-Click Seeder Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSeedBatch}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 border border-amber-300"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
              <span>⚡ شحن باقة 10 وظائف حقيقية معتمدة</span>
            </button>
          </div>
        </div>

        {/* Counter and Form Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span>إجمالي الوظائف المتاحة بالمنصة:</span>
            <span className="font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded-md">
              {jobPosts.length} وظيفة
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>{showAddForm ? 'إغلاق النموذج' : 'إضافة وظيفة يدوياً بالتفصيل'}</span>
          </button>
        </div>
      </div>

      {/* Manual Job Addition Form */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900">
                بيانات الوظيفة الحقيقية المطلوب إضافتها
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              * لا يُشترط وجود إيميل للمعلن (تُسجل كإعلان معتمد موثق)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                عنوان الوظيفة / الشاغر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: مطلوب نجار موبيليا وتشطيبات فندقية لمعرض أثاث"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Company / Author Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                جهة العمل / اسم المنشأة أو صاحب العمل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.authorName}
                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="مثال: شركة الأفق للأثاث والديكور"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none bg-white"
              >
                {CATEGORIES_LIST.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                الراتب / المقابل المالي
              </label>
              <input
                type="text"
                value={formData.salary}
                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                placeholder="مثال: 8,000 - 10,000 ج.م أو قابل للتفاوض"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Work Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                نوع الدوام
              </label>
              <select
                value={formData.workType}
                onChange={e => setFormData({ ...formData, workType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none bg-white"
              >
                {WORK_TYPES.map(wt => (
                  <option key={wt} value={wt}>{wt}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                المحافظة / المدينة
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="مثال: القاهرة - التجمع الخامس"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Phone & WhatsApp */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                رقم الهاتف / الواتساب للتواصل
              </label>
              <input
                type="text"
                value={formData.authorPhone}
                onChange={e => setFormData({ ...formData, authorPhone: e.target.value, whatsappNumber: e.target.value })}
                placeholder="مثال: +201012345678"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none dir-ltr text-right"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                الخبرة المطلوبة
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                placeholder="مثال: خبرة 3 - 5 سنوات"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                الكلمات المفتاحية (مفصولة بفاصلة)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="مثال: نجار, أثاث, القاهرة, تشطيبات"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                تفاصيل الشروط والمهام الوظيفية
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب وصفاً جذاباً للوظيفة والمهام المطلوبة من المتقدم..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-blue-600 outline-none resize-none"
              />
            </div>

            {/* Backdrop Image with Quick Presets */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                صورة الإعلان / الخلفية (اختر صورة سريعة أو ضع رابطاً مخصصاً)
              </label>
              
              <div className="flex flex-wrap gap-1.5">
                {PHOTO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, backdropImage: p.url })}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                      formData.backdropImage === p.url
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <input
                type="url"
                value={formData.backdropImage}
                onChange={e => setFormData({ ...formData, backdropImage: e.target.value })}
                placeholder="https://..."
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ ونشر الوظيفة في المنصة وفايربيس فوراً</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Jobs List & Management */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900">
              قائمة الوظائف المتاحة حالياً على المنصة ({filteredJobs.length} من أصل {jobPosts.length})
            </h3>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="بحث في الوظائف أو المعلن أو المنطقة..."
              className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-400"
            />
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            لا توجد وظائف مطابقة للبحث حالياً. يمكنك استخدام زر الشحن الفوري بالأعلى لإضافة 10 وظائف فوراً!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto no-scrollbar pt-1">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={job.authorAvatar || job.backdropImage}
                      alt={job.authorName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {job.title}
                      </h4>
                      <p className="text-[11px] text-blue-700 font-bold truncate">
                        {job.authorName} • {job.category}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                    {job.salary}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{job.location}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {job.authorPhone && (
                      <a
                        href={`tel:${job.authorPhone}`}
                        className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        title="اتصال بالمعلن"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                    )}

                    {onSelectPost && (
                      <button
                        type="button"
                        onClick={() => onSelectPost(job)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-blue-700 text-[10px] font-bold cursor-pointer"
                      >
                        معاينة
                      </button>
                    )}

                    {onDeleteJob && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الوظيفة "${job.title}"؟`)) {
                            onDeleteJob(job.id);
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="حذف الوظيفة"
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
