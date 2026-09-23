import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Scale, 
  MessageCircle, 
  Ban, 
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  Bot,
  Send,
  Building2,
  HelpCircle,
  Clock,
  Compass,
  FileCheck,
  ShieldAlert,
  Copy,
  ExternalLink,
  Share2
} from 'lucide-react';
import { JobPost, UserProfile } from '../types';
import { 
  FIFTEEN_LEGAL_CLAUSES, 
  LegalClause 
} from '../data/legalPolicies';
import { askGeminiLegalAssistant } from '../utils/geminiPolicy';
import { applyPageSeo, PRIVACY_POLICY_URL } from '../utils/seoAndRouting';

// Backwards compatibility export
export const COMPACT_LEGAL_SECTIONS = FIFTEEN_LEGAL_CLAUSES;

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  initialTab?: 'about' | 'policy' | 'gemini' | 'persons' | 'disclaimer';
  allPosts?: JobPost[];
  userProfile?: UserProfile;
  activeAccountEmail?: string;
  onSelectPersonPost?: (post: JobPost) => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'policy'
}) => {
  // Modal restricted strictly to: policy (البنود والسياسات), about (من نحن), gemini (جيميناوي)
  const [activeTab, setActiveTab] = useState<'policy' | 'about' | 'gemini'>(() => {
    if (initialTab === 'about') return 'about';
    if (initialTab === 'gemini') return 'gemini';
    return 'policy';
  });

  const [expandedSection, setExpandedSection] = useState<string | null>('clause-1-free-service');
  const [clauseFilter, setClauseFilter] = useState<string>('all');
  const [clauseSearch, setClauseSearch] = useState('');

  // Gemini AI assistant (جيميناوي) state
  const [geminiQuery, setGeminiQuery] = useState('');
  const [geminiAnswer, setGeminiAnswer] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  // Acceptance status persistence
  const [hasAcceptedInStorage, setHasAcceptedInStorage] = useState<boolean>(() => {
    return localStorage.getItem('shoghl_policy_accepted') === 'true';
  });
  const [userCheckedAgreed, setUserCheckedAgreed] = useState<boolean>(() => {
    return localStorage.getItem('shoghl_policy_accepted') === 'true';
  });

  // Filtered 15 clauses
  const filteredClauses = useMemo(() => {
    return FIFTEEN_LEGAL_CLAUSES.filter((clause) => {
      const matchSearch = 
        clause.title.toLowerCase().includes(clauseSearch.toLowerCase()) ||
        clause.summary.toLowerCase().includes(clauseSearch.toLowerCase()) ||
        clause.content.toLowerCase().includes(clauseSearch.toLowerCase());

      if (!matchSearch) return false;
      if (clauseFilter !== 'all' && clause.category !== clauseFilter) return false;
      return true;
    });
  }, [clauseSearch, clauseFilter]);

  // Handle Gemini legal assistant query
  const handleAskGemini = async (presetPrompt?: string) => {
    const q = presetPrompt || geminiQuery;
    if (!q.trim()) return;
    setIsGeminiLoading(true);
    setGeminiQuery(q);
    try {
      const ans = await askGeminiLegalAssistant(q);
      setGeminiAnswer(ans);
    } catch (e) {
      console.error(e);
      setGeminiAnswer('تعذر الاتصال بمستشار جيميناوي حالياً، يرجى مراجعة نصوص البنود الـ 15 المعروضة في تبويب البنود والسياسات.');
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Handle accepting policy
  const handleConfirmAccept = () => {
    const nowStr = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    localStorage.setItem('shoghl_policy_accepted', 'true');
    localStorage.setItem('shoghl_policy_accepted_date', nowStr);
    setHasAcceptedInStorage(true);
    setUserCheckedAgreed(true);
    onAccept();
  };

  const [copiedPolicyUrl, setCopiedPolicyUrl] = useState(false);

  // Synchronize SEO & Google Indexing metadata when Privacy Policy is open
  useEffect(() => {
    if (isOpen) {
      applyPageSeo({
        title: 'وثيقة السياسات والـ 15 بنداً القانونية | شغل وتقنية (roohpro.com/jop)',
        description: 'الوثيقة القانونية والسياسات الرسمية المعتمدة لتنظيم سوق العمل الحر وحماية حقوق المنشآت والمهنيين بنسبة 100%.',
        canonicalUrl: PRIVACY_POLICY_URL,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'وثيقة السياسات والـ 15 بنداً القانونية',
          url: PRIVACY_POLICY_URL,
          publisher: {
            '@type': 'Organization',
            name: 'شغل وتقنية - Rooh Pro Jobs'
          }
        }
      });
    }
  }, [isOpen]);

  const handleCopyPolicyUrl = () => {
    navigator.clipboard.writeText(PRIVACY_POLICY_URL);
    setCopiedPolicyUrl(true);
    setTimeout(() => setCopiedPolicyUrl(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-hidden animate-in fade-in duration-150 select-none"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full h-[100dvh] sm:h-auto sm:max-w-xl md:sm:max-w-2xl sm:max-h-[86vh] bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header with Title & Badges */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-red-600 via-blue-700 to-indigo-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight">
                  وثيقة السياسات والـ 15 بنداً القانونية
                </h3>
                <span className="text-[9px] sm:text-[10px] bg-emerald-400 text-emerald-950 font-black px-1.5 py-0.5 rounded-full">
                  15 بنداً قانونياً 100%
                </span>
              </div>
              <p className="text-[10px] text-blue-100 font-medium">
                الشروط والأحكام والضوابط القانونية المعتمدة للمنصة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy Official URL Button */}
            <button
              type="button"
              onClick={handleCopyPolicyUrl}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
              title="نسخ رابط السياسة المعتمد للأرشفة في جوجل"
            >
              {copiedPolicyUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedPolicyUrl ? 'تم النسخ!' : 'رابط السياسة'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated URL Bar for Google indexing notice */}
        <div className="bg-slate-900 px-3 py-1.5 text-white/90 flex items-center justify-between gap-2 text-[10.5px] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-blue-400 font-black shrink-0">المسار المعتمد:</span>
            <span className="font-mono text-[10px] text-slate-300 truncate dir-ltr">
              roohpro.com/jop/privacy
            </span>
          </div>
          <button
            onClick={handleCopyPolicyUrl}
            className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline shrink-0 cursor-pointer"
          >
            {copiedPolicyUrl ? '✓ تم النسخ' : 'نسخ للأرشفة'}
          </button>
        </div>

        {/* 2. Navigation Tabs (مقتصرة على: البنود والسياسات، من نحن، جيميناوي) */}
        <div className="bg-slate-100 border-b border-slate-200 p-1.5 shrink-0">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            
            {/* تبويب 1: البنود والسياسات */}
            <button
              type="button"
              onClick={() => setActiveTab('policy')}
              className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                activeTab === 'policy'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">البنود والسياسات</span>
            </button>

            {/* تبويب 2: من نحن */}
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                activeTab === 'about'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="truncate">من نحن</span>
            </button>

            {/* تبويب 3: جيميناوي */}
            <button
              type="button"
              onClick={() => setActiveTab('gemini')}
              className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                activeTab === 'gemini'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-purple-800 border-purple-200'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">جيميناوي الذكي</span>
            </button>

          </div>
        </div>

        {/* 3. Reassuring Status Banner (خالي من أعداد المستخدمين وسجل الأشخاص) */}
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-slate-700 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>15 بنداً قانونياً 100% معتمدة ونظامية</span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 text-[10px] sm:text-[10.5px]">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>حماية تامة لحقوق المنشآت والمهنيين والباحثين عن عمل</span>
          </div>
        </div>

        {/* 4. Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/60 text-xs no-scrollbar">

          {/* TAB 1: 15 LEGAL CLAUSES (البنود والسياسات) */}
          {activeTab === 'policy' && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              
              {/* Alert notice */}
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-[11px] text-red-700">
                  <Ban className="w-3.5 h-3.5 shrink-0" />
                  <span>وثيقة قانونية نظامية ملزمة بنسبة 100%</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-red-900 font-medium">
                  تتضمن هذه الوثيقة 15 بنداً قانونياً صحيحاً تم صياغتها وفق القوانين والأنظمة المعمول بها. تلتزم المنشآت وأصحاب الأعمال بكافة البنود الـ 15، بينما يخضع المهنيون الأحرار والحرفيون لبند العمل الحر (البند 11) والبنود العامة دون إلزامهم بالاشتراطات المؤسسية.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:flex-1">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={clauseSearch}
                    onChange={(e) => setClauseSearch(e.target.value)}
                    placeholder="ابحث في نصوص وعناوين البنود الـ 15..."
                    className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto shrink-0 no-scrollbar">
                  {[
                    { id: 'all', label: 'كافة البنود (15)' },
                    { id: 'مالي وتنظيمي', label: 'مالي وتنظيمي' },
                    { id: 'أمان وخصوصية', label: 'أمان وخصوصية' },
                    { id: 'نزاهة ومسؤولية', label: 'نزاهة ومسؤولية' },
                    { id: 'حقوق وتشريعات', label: 'حقوق وتشريعات' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setClauseFilter(cat.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
                        clauseFilter === cat.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clauses Accordion List */}
              <div className="space-y-2">
                {filteredClauses.map((clause: LegalClause) => {
                  const isExpanded = expandedSection === clause.id;
                  return (
                    <div
                      key={clause.id}
                      className={`bg-white rounded-xl border transition-all overflow-hidden ${
                        isExpanded ? 'border-blue-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedSection(isExpanded ? null : clause.id)}
                        className="w-full p-2.5 sm:p-3 text-right flex items-center justify-between gap-2 cursor-pointer bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-800 font-black text-[11px] flex items-center justify-center shrink-0 border border-blue-200">
                            {clause.num}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 leading-tight">
                              {clause.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium line-clamp-1">
                              {clause.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] border px-1.5 py-0.5 rounded font-bold ${clause.badgeColor}`}>
                            {clause.badge}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 text-slate-700 bg-slate-50/50 border-t border-slate-100 space-y-2">
                          <p className="text-[11px] leading-relaxed text-slate-800 whitespace-pre-line font-medium">
                            {clause.content}
                          </p>

                          <div className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] text-slate-600 flex items-start justify-between gap-2">
                            <span className="flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>نطاق السريان: <strong>{clause.applicableTo}</strong></span>
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              التصنيف: {clause.category}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: ABOUT US & PLATFORM (من نحن) */}
          {activeTab === 'about' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-4 text-white shadow-xs space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10.5px] font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>سوق العمل الذكي المباشر بدون وسيط</span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  منصة "شغل وتقنية" — بوابتك المهنية بدون وسيط
                </h4>
                <p className="text-[11px] sm:text-xs text-blue-100 leading-relaxed font-normal">
                  منصة رقمية عربية متطورة تعتمد على نظام العرض المباشر للتواصل السريع، تهدف إلى ربط أصحاب الأعمال والمنشآت بالباحثين عن عمل والفنيين والمهنيين مباشرة وفورياً وبشكل مجاني بالكامل بموجب الـ 15 بنداً القانونية.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-600 font-black text-xs">
                    <Compass className="w-4 h-4 shrink-0" />
                    <span>رؤيتنا</span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 leading-relaxed">
                    توفير بيئة عمل رقمية حرة تتيح التوظيف السريع دون تعقيدات مكاتب العمل والرسوم الإضافية أو الوسطاء.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs">
                    <FileCheck className="w-4 h-4 shrink-0" />
                    <span>الشفافية والمجانية التامة</span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 leading-relaxed">
                    المنصة مجانية 100% لكافة الأطراف، بدون عمولات، مع حماية أمنية وتشفير سحابي للبيانات.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-950 font-bold leading-normal">
                  التواصل يتم مباشرة عبر تطبيق واتساب أو الهاتف المحمول من خلال زر التواصل المتاح في كل بطاقة إعلان.
                </p>
              </div>

              {/* Disclaimer highlight */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-start gap-2 text-slate-700">
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[10.5px] leading-relaxed">
                  تلتزم المنصة بتوفير مساحة تقنية حرة ومحايدة لنشر الإعلانات وتسهيل التعارف المهني وفقاً للبند القانوني رقم (2) و(6) من وثيقة السياسات.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: GEMINI AI ASSISTANT (جيميناوي) */}
          {activeTab === 'gemini' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              <div className="p-3.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 rounded-2xl text-white shadow-xs space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-amber-300">
                  <Bot className="w-3.5 h-3.5" />
                  <span>مستشار "جيميناوي" الذكي للسياسات والقوانين</span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  فحص وتفسير الـ 15 بنداً قانونياً وحقوق كافة الأطراف
                </h4>
                <p className="text-[10.5px] text-blue-100 leading-relaxed">
                  يمكنك سؤال نموذج جيميناوي مباشرة عن أي تفاصيل تتعلق بالبنود الـ 15، وحقوقك القانونية، أو شروط العمل الحر وإخلاء المسؤولية.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-600 block">
                  أسئلة شائعة للاستيضاح الفوري:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAskGemini('ما الفرق بين الملتزمين بالـ 15 بنداً والأشخاص المستقلين الذين لا ينتمون إليها؟')}
                    className="p-2 bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 rounded-xl text-right text-[10.5px] font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    ❓ الفرق بين الملتزمين بالـ 15 والمستقلين؟
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskGemini('هل يضمن البند الأول مجانية المنصة 100% وعدم دفع أي عمولة؟')}
                    className="p-2 bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 rounded-xl text-right text-[10.5px] font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    💰 هل البند 1 يضمن مجانية الخدمة 100%؟
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskGemini('ما هي المسؤولية القانونية للمعلن وفق البنود 2 و6؟')}
                    className="p-2 bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 rounded-xl text-right text-[10.5px] font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    ⚖️ المسؤولية القانونية للمعلن والباحث؟
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskGemini('كيف تحمي البنود الـ 15 سرية البيانات والتواصل المباشر عبر واتساب؟')}
                    className="p-2 bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 rounded-xl text-right text-[10.5px] font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    🔒 حماية الخصوصية والتواصل بواتساب؟
                  </button>
                </div>
              </div>

              {/* Query Input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={geminiQuery}
                  onChange={(e) => setGeminiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAskGemini();
                    }
                  }}
                  placeholder="اكتب سؤالك لجيميناوي حول أي بند من البنود الـ 15..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAskGemini()}
                  disabled={isGeminiLoading}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isGeminiLoading ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>إرسال</span>
                </button>
              </div>

              {/* Gemini Answer Box */}
              {geminiAnswer && (
                <div className="p-3 bg-white border border-purple-200 rounded-2xl shadow-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-purple-700 font-black text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>إجابة وتوضيح مستشار جيميناوي الذكي:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {geminiAnswer}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* 5. Footer with Mandatory Acceptance & Official Approval */}
        <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          
          {/* Agreement Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-[10.5px] text-slate-700 font-bold">
            <input
              type="checkbox"
              checked={userCheckedAgreed}
              onChange={(e) => setUserCheckedAgreed(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <span>
              أقر بأنني اطلعت على وثيقة السياسات والـ 15 بنداً القانونية وأوافق عليها
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إغلاق
            </button>

            <button
              type="button"
              onClick={() => {
                if (userCheckedAgreed) {
                  handleConfirmAccept();
                  onClose();
                }
              }}
              disabled={!userCheckedAgreed}
              className={`px-4 py-1.5 rounded-xl text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                userCheckedAgreed 
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-95' 
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>
                {hasAcceptedInStorage ? 'معتمد وموافق رسمياً' : 'موافق واعتماد السياسة'}
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
