import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  Database, 
  CheckCircle2, 
  Ban, 
  Search, 
  ExternalLink, 
  Trash2, 
  UserX, 
  Phone, 
  MessageCircle, 
  Building2, 
  Hammer, 
  KeyRound, 
  LogOut, 
  Layers, 
  RefreshCw,
  PlusCircle,
  FileText,
  BadgeCheck,
  Check,
  Filter,
  Megaphone,
  Video,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Coins,
  Download,
  Sliders,
  Briefcase,
  UserCheck,
  Eye,
  Headphones,
  Send,
  MessageSquare
} from 'lucide-react';
import { JobPost, UserProfile, ReportItem } from '../types';
import { extractUnifiedPagePersons, PagePersonEntity } from '../data/legalPolicies';
import { 
  getDeveloperCredentials, 
  setDeveloperSession,
  getPolicyApprovalsList,
  recordPersonApproval,
  PolicyApprovalRecord
} from '../utils/developerFirebase';
import {
  getDeveloperAdsState,
  saveDeveloperAdsState,
  addDeveloperBanner,
  deleteDeveloperBanner,
  toggleBannerStatus,
  DeveloperAdsState,
  DeveloperBannerAd,
  BannerColorTheme,
  AdButtonType,
  AdReportItem,
  getAdReportsList,
  resolveAdReport,
  deleteAdReport
} from '../utils/adsManager';
import { 
  getAllSupportTickets, 
  replyToSupportTicket, 
  updateSupportTicketStatus, 
  SupportTicket 
} from '../utils/supportManager';
import { DeveloperJobSeederTab } from './DeveloperJobSeederTab';
import { DeveloperSeekerSeederTab } from './DeveloperSeekerSeederTab';

interface DeveloperDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPosts: JobPost[];
  reports: ReportItem[];
  userProfile?: UserProfile;
  activeAccountEmail?: string;
  onDeleteJob?: (jobId: string) => void;
  onResolveReport?: (reportId: string) => void;
  onSelectPost?: (post: JobPost) => void;
  onInspectApp?: (role?: 'seeker' | 'job' | 'all') => void;
  onAddListing?: (post: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => void;
  onBatchAddListings?: (posts: Array<Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>>) => void;
}

export const DeveloperDashboardModal: React.FC<DeveloperDashboardModalProps> = ({
  isOpen,
  onClose,
  allPosts,
  reports,
  userProfile,
  activeAccountEmail,
  onDeleteJob,
  onResolveReport,
  onSelectPost,
  onInspectApp,
  onAddListing,
  onBatchAddListings
}) => {
  const [activeTab, setActiveTab] = useState<'add_real_jobs' | 'add_real_seekers' | 'ads' | 'support' | 'persons' | 'reports' | 'credentials'>('add_real_jobs');

  const jobPostsCount = useMemo(() => allPosts.filter(p => p.type === 'job').length, [allPosts]);
  const seekerPostsCount = useMemo(() => allPosts.filter(p => p.type === 'seeker').length, [allPosts]);

  // Support tickets state (Direct User Support)
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => getAllSupportTickets());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(() => {
    const list = getAllSupportTickets();
    return list.length > 0 ? list[0].id : null;
  });
  const [supportReplyText, setSupportReplyText] = useState('');
  const [supportSearch, setSupportSearch] = useState('');

  // Listen for support tickets updates
  useEffect(() => {
    const handleSupportUpdated = () => {
      const all = getAllSupportTickets();
      setSupportTickets(all);
      if (!selectedTicketId && all.length > 0) {
        setSelectedTicketId(all[0].id);
      }
    };
    window.addEventListener('rooh_support_tickets_updated', handleSupportUpdated);
    return () => window.removeEventListener('rooh_support_tickets_updated', handleSupportUpdated);
  }, [selectedTicketId]);

  // Persons search & filters
  const [personSearch, setPersonSearch] = useState('');
  const [personFilter, setPersonFilter] = useState<'all' | 'approved' | 'exempt' | 'pending'>('all');

  // Reports search & filters
  const [reportSearch, setReportSearch] = useState('');
  const [resolvedReports, setResolvedReports] = useState<string[]>([]);
  const [reportsSubTab, setReportsSubTab] = useState<'job_reports' | 'ad_reports'>('ad_reports');
  const [adReportsList, setAdReportsList] = useState<AdReportItem[]>(() => getAdReportsList());

  // Listen for ad reports updates
  useEffect(() => {
    const handleAdReportsUpdated = () => {
      setAdReportsList(getAdReportsList());
    };
    window.addEventListener('rooh_ad_reports_updated', handleAdReportsUpdated);
    return () => window.removeEventListener('rooh_ad_reports_updated', handleAdReportsUpdated);
  }, []);

  // Developer credentials (Read-only, managed exclusively via Firebase Console)
  const devCreds = getDeveloperCredentials();

  // Ads Engine State (Banner, AdSense, Interstitials, Rewarded)
  const [adsState, setAdsState] = useState<DeveloperAdsState>(() => getDeveloperAdsState());
  const [showAddBannerForm, setShowAddBannerForm] = useState(false);
  const [adsSavedNotice, setAdsSavedNotice] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    sponsorName: '',
    mediaType: 'video' as 'image' | 'video',
    imageUrl: '',
    videoUrl: '',
    targetUrl: '',
    buttonType: 'download' as AdButtonType,
    buttonLabel: 'تحميل التطبيق الآن',
    colorTheme: 'auto' as BannerColorTheme,
    expiresAt: '2026-12-31'
  });

  const handleUpdateAdsState = (updater: (prev: DeveloperAdsState) => DeveloperAdsState) => {
    setAdsState(prev => {
      const next = updater(prev);
      saveDeveloperAdsState(next);
      setAdsSavedNotice(true);
      setTimeout(() => setAdsSavedNotice(false), 2500);
      return next;
    });
  };

  const handleCreateNewBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim() || (!bannerForm.imageUrl.trim() && !bannerForm.videoUrl.trim())) return;

    addDeveloperBanner({
      title: bannerForm.title.trim(),
      sponsorName: bannerForm.sponsorName.trim() || 'إعلان معتمد Rooh Pro',
      mediaType: bannerForm.mediaType,
      imageUrl: bannerForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80',
      videoUrl: bannerForm.videoUrl.trim(),
      targetUrl: bannerForm.targetUrl.trim() || 'https://roohpro.com/AD',
      buttonType: bannerForm.buttonType,
      buttonLabel: bannerForm.buttonLabel.trim() || (bannerForm.buttonType === 'download' ? 'تحميل الآن' : bannerForm.buttonType === 'install' ? 'تثبيت التطبيق' : 'انتقال للرابط'),
      colorTheme: bannerForm.colorTheme,
      active: true,
      expiresAt: bannerForm.expiresAt
    });

    setAdsState(getDeveloperAdsState());
    setShowAddBannerForm(false);
    setBannerForm({
      title: '',
      sponsorName: '',
      mediaType: 'video',
      imageUrl: '',
      videoUrl: '',
      targetUrl: '',
      buttonType: 'download',
      buttonLabel: 'تحميل التطبيق الآن',
      colorTheme: 'auto',
      expiresAt: '2026-12-31'
    });
    setAdsSavedNotice(true);
    setTimeout(() => setAdsSavedNotice(false), 2500);
  };

  const handleDeleteBannerItem = (id: string) => {
    deleteDeveloperBanner(id);
    setAdsState(getDeveloperAdsState());
  };

  const handleToggleBannerItem = (id: string, active: boolean) => {
    toggleBannerStatus(id, active);
    setAdsState(getDeveloperAdsState());
  };

  // Approvals dynamic state
  const [approvalsList, setApprovalsList] = useState<PolicyApprovalRecord[]>(() => {
    return getPolicyApprovalsList();
  });

  // Extract all page persons
  const rawPagePersons = useMemo(() => {
    return extractUnifiedPagePersons(allPosts, userProfile, activeAccountEmail);
  }, [allPosts, userProfile, activeAccountEmail]);

  // Combine raw persons with approvals list
  const unifiedPersons = useMemo(() => {
    return rawPagePersons.map((p) => {
      const approval = approvalsList.find(a => a.personName.trim() === p.name.trim());
      const hasAccepted = !!approval || localStorage.getItem('shoghl_policy_accepted') === 'true';
      return {
        ...p,
        hasApprovedPolicy: hasAccepted,
        approvalDate: approval ? new Date(approval.approvedAt).toLocaleDateString('ar-EG') : (p.agreedAt || 'معتمد آلياً')
      };
    });
  }, [rawPagePersons, approvalsList]);

  // Count approved persons
  const approvedPersonsCount = useMemo(() => {
    return unifiedPersons.filter(p => p.hasApprovedPolicy).length;
  }, [unifiedPersons]);

  const fullyCompliantCount = useMemo(() => {
    return unifiedPersons.filter(p => p.isCompliantWith15).length;
  }, [unifiedPersons]);

  const independentCount = useMemo(() => {
    return unifiedPersons.filter(p => !p.isCompliantWith15).length;
  }, [unifiedPersons]);

  // Filtered Persons List
  const filteredPersons = useMemo(() => {
    return unifiedPersons.filter((p) => {
      const matchQuery = 
        p.name.toLowerCase().includes(personSearch.toLowerCase()) ||
        p.role.toLowerCase().includes(personSearch.toLowerCase()) ||
        p.location.toLowerCase().includes(personSearch.toLowerCase()) ||
        (p.phone && p.phone.includes(personSearch));

      if (!matchQuery) return false;

      if (personFilter === 'approved') return p.hasApprovedPolicy;
      if (personFilter === 'exempt') return !p.isCompliantWith15;
      if (personFilter === 'pending') return !p.hasApprovedPolicy;
      return true;
    });
  }, [unifiedPersons, personSearch, personFilter]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchQuery = 
        r.jobTitle.toLowerCase().includes(reportSearch.toLowerCase()) ||
        (r.authorName || '').toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.reason.toLowerCase().includes(reportSearch.toLowerCase()) ||
        (r.details || '').toLowerCase().includes(reportSearch.toLowerCase());
      return matchQuery;
    });
  }, [reports, reportSearch]);

  // Filtered Ad Reports (سجل بلاغات الإعلانات)
  const filteredAdReports = useMemo(() => {
    return adReportsList.filter((ar) => {
      const q = reportSearch.toLowerCase();
      return (
        ar.adTitle.toLowerCase().includes(q) ||
        (ar.adSponsor || '').toLowerCase().includes(q) ||
        ar.reason.toLowerCase().includes(q) ||
        (ar.details || '').toLowerCase().includes(q) ||
        (ar.contactEmailOrPhone || '').toLowerCase().includes(q)
      );
    });
  }, [adReportsList, reportSearch]);

  // Handle Developer manual toggle of approval
  const handleTogglePersonApproval = (person: PagePersonEntity) => {
    const isApprovedNow = approvalsList.some(a => a.personName === person.name);
    if (isApprovedNow) {
      const updated = approvalsList.filter(a => a.personName !== person.name);
      setApprovalsList(updated);
      localStorage.setItem('shoghl_firebase_policy_approvals', JSON.stringify(updated));
    } else {
      const record = recordPersonApproval(person.name, person.role, {
        phone: person.phone,
        isCompliantWith15: person.isCompliantWith15
      });
      setApprovalsList(prev => [record, ...prev]);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setDeveloperSession(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="w-full max-w-5xl h-[94vh] max-h-[900px] bg-white border border-blue-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header with Developer Title & Firebase Live Tag (White, Red, Blue light theme) */}
        <div className="px-4 py-3 bg-gradient-to-r from-red-50 via-white to-blue-50 border-b border-blue-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  لوحة تحكم وإدارة المطور
                </h2>
                <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>Firebase مزامن</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                المسؤول: {devCreds.name} ({devCreds.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onInspectApp) {
                  onInspectApp('all');
                }
              }}
              title="الدخول لمعاينة المنصة وتجربة التطبيق من الداخل كأي مستخدم"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">معاينة التطبيق من الداخل</span>
              <span className="sm:hidden">معاينة</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="تسجيل خروج من لوحة المطور"
              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">خروج</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Top Navigation Tabs (White, Red, Blue light theme) */}
        <div className="p-2 bg-slate-50 border-b border-blue-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('add_real_jobs')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
              activeTab === 'add_real_jobs'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>إضافة وظائف وشواغر (حقيقي)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'add_real_jobs' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {jobPostsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add_real_seekers')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
              activeTab === 'add_real_seekers'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>إضافة باحثين وكفاءات (حقيقي)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'add_real_seekers' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {seekerPostsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
              activeTab === 'ads'
                ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white border-red-500 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>إدارة الإعلانات والمساحات</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'ads' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {adsState.customBanners.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
              activeTab === 'support'
                ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>رسائل الدعم الفني</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'support' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {supportTickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('persons')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
              activeTab === 'persons'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الأشخاص والموافقات</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'persons' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {unifiedPersons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
              activeTab === 'reports'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-800 hover:border-red-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>قسم البلاغات</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'
            }`}>
              {reports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
              activeTab === 'credentials'
                ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>بيانات المطور وفايربيز</span>
          </button>
        </div>

        {/* 3. Main Body Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 no-scrollbar bg-gradient-to-b from-slate-50/50 via-white to-blue-50/20 text-slate-900">

          {/* TAB: ADD REAL JOBS */}
          {activeTab === 'add_real_jobs' && (
            <DeveloperJobSeederTab
              allPosts={allPosts}
              onAddListing={onAddListing}
              onBatchAddListings={onBatchAddListings}
              onDeleteJob={onDeleteJob}
              onSelectPost={onSelectPost}
            />
          )}

          {/* TAB: ADD REAL SEEKERS */}
          {activeTab === 'add_real_seekers' && (
            <DeveloperSeekerSeederTab
              allPosts={allPosts}
              onAddListing={onAddListing}
              onBatchAddListings={onBatchAddListings}
              onDeleteJob={onDeleteJob}
              onSelectPost={onSelectPost}
            />
          )}

          {/* TAB 1: PERSONS & APPROVALS */}
          {activeTab === 'persons' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Prominent Counter Card: عدد الأشخاص التي قامت بالموافقة وتعمل داخل التطبيق */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-white to-red-50 border border-blue-200 rounded-2xl shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>سجل الأشخاص والمعلنين الخاص بلوحة تحكم المطور</span>
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      عدد الأشخاص الذين قاموا بالموافقة على السياسة ويعملون داخل التطبيق: <span className="text-blue-700 font-mono text-xl sm:text-2xl font-black">{approvedPersonsCount} شخصاً</span> من أصل {unifiedPersons.length}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      سجل موثق وحصري للمطور؛ محجوب تماماً عن صفحة سياسات المستخدمين العاديين.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
                      <div className="text-xs font-bold text-emerald-700">ملتزمون بكافة الـ 15</div>
                      <div className="text-base font-black text-emerald-800">{fullyCompliantCount} منشأة</div>
                    </div>

                    <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-right">
                      <div className="text-xs font-bold text-amber-700">مستقلون (عمل حر)</div>
                      <div className="text-base font-black text-amber-800">{independentCount} حرفي</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={personSearch}
                    onChange={(e) => setPersonSearch(e.target.value)}
                    placeholder="ابحث بالاسم، المهنة، الهاتف، المحافظة..."
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setPersonFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                      personFilter === 'all'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    الكل ({unifiedPersons.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPersonFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                      personFilter === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    المعتمدون ({approvedPersonsCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPersonFilter('exempt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                      personFilter === 'exempt'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    المستقلون ({independentCount})
                  </button>
                </div>
              </div>

              {/* Persons Grid / Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPersons.map((person) => (
                  <div
                    key={person.id}
                    className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl transition-all space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              {person.name}
                            </h4>
                            {person.verified && (
                              <BadgeCheck className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {person.role} • {person.location}
                          </p>
                        </div>
                      </div>

                      {/* Approval Status Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                        person.hasApprovedPolicy
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {person.hasApprovedPolicy ? 'تمت الموافقة ✓' : 'في الانتظار'}
                      </span>
                    </div>

                    {/* Compliance Category */}
                    <div className="p-2 bg-slate-50 rounded-xl text-[10.5px] text-slate-700 flex items-center justify-between border border-slate-100">
                      <span className="flex items-center gap-1.5 font-bold">
                        {person.isCompliantWith15 ? (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-blue-900">ملتزم بكافة الـ 15 بنداً</span>
                          </>
                        ) : (
                          <>
                            <Hammer className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-900">مستقل (خاضع لبند العمل الحر 11)</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {person.approvalDate}
                      </span>
                    </div>

                    {/* Quick Developer Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-2">
                        {person.phone && (
                          <a
                            href={`tel:${person.phone}`}
                            className="text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold"
                          >
                            <Phone className="w-3 h-3 text-red-600" />
                            <span>{person.phone}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePersonApproval(person)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                            person.hasApprovedPolicy
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                          }`}
                        >
                          {person.hasApprovedPolicy ? 'إلغاء الاعتماد' : 'اعتماد الموافقة'}
                        </button>

                        {person.samplePostId && onSelectPost && (
                          <button
                            type="button"
                            onClick={() => {
                              const found = allPosts.find(p => p.id === person.samplePostId);
                              if (found) {
                                onSelectPost(found);
                                onClose();
                              }
                            }}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                            title="عرض إعلان هذا الشخص في الواجهة"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: REPORTS & COMPLAINTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Reports summary */}
              <div className="p-4 bg-gradient-to-r from-red-50 via-white to-blue-50 border border-red-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>سجل البلاغات ومكافحة الانتهاكات والاحتيال</span>
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    إجمالي البلاغات: <span className="text-red-600 font-mono">{reports.length + adReportsList.length}</span> بلاغاً وارداً
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    يشمل بلاغات الوظائف والمنشورات ({reports.length}) وبلاغات الإعلانات ومساحات الترويج ({adReportsList.length})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
                    <div className="text-[10px] text-slate-500 font-semibold">بلاغات الوظائف</div>
                    <div className="text-base font-black text-red-600">{reports.length}</div>
                  </div>
                  <div className="px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-center shadow-xs">
                    <div className="text-[10px] text-amber-700 font-semibold">بلاغات الإعلانات</div>
                    <div className="text-base font-black text-amber-600">{adReportsList.length}</div>
                  </div>
                </div>
              </div>

              {/* Reports SubTabs selector: Job Posts vs Advertisements */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setReportsSubTab('ad_reports')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                    reportsSubTab === 'ad_reports'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>بلاغات الإعلانات (AD Reports)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-black/20 text-slate-950">
                    {adReportsList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportsSubTab('job_reports')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                    reportsSubTab === 'job_reports'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>بلاغات المنشورات والوظائف</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-white/20 text-white">
                    {reports.length}
                  </span>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder={reportsSubTab === 'ad_reports' ? "ابحث بعنوان الإعلان، المعلن، أو سبب بلاغ الإعلان..." : "ابحث برقم البلاغ، اسم المعلن، الوظيفة، أو سبب الشكوى..."}
                  className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* SUBTAB 1: AD REPORTS */}
              {reportsSubTab === 'ad_reports' && (
                <div className="space-y-3">
                  {filteredAdReports.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">لا توجد بلاغات على الإعلانات حالياً</h4>
                      <p className="text-xs text-slate-500">
                        جميع الإعلانات والمساحات الترويجية المعروضة مطابقة للمعايير ولم يسجل المستخدمون أي شكاوى بحقها.
                      </p>
                    </div>
                  ) : (
                    filteredAdReports.map((ar) => (
                      <div
                        key={ar.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          ar.status === 'resolved' 
                            ? 'bg-slate-50/70 border-slate-200 opacity-70' 
                            : 'bg-white border-amber-300 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-mono font-black">
                              AD #{ar.id}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {ar.reason}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                              {ar.adType === 'banner' ? 'بنر علوي' : ar.adType === 'square' ? 'مربع 350' : ar.adType === 'interstitial' ? 'إعلان بيني' : 'مكافأة فيديو'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{new Date(ar.createdAt).toLocaleString('ar-EG')}</span>
                            {ar.status === 'resolved' && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                                تم الحل
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ad Details */}
                        <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1">
                          <div className="text-slate-800 font-bold">
                            عنوان الإعلان: <span className="text-blue-700 font-black">{ar.adTitle}</span>
                          </div>
                          {ar.adSponsor && (
                            <div className="text-slate-600">
                              المعلن / المنصة: <span className="text-slate-900 font-bold">{ar.adSponsor}</span>
                            </div>
                          )}
                          {ar.details && (
                            <div className="pt-1.5 text-slate-700 text-[11.5px] border-t border-amber-200 leading-relaxed font-medium">
                              ملاحظات إضافية: "{ar.details}"
                            </div>
                          )}
                        </div>

                        {/* Contact & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                          <div className="text-slate-500 text-[11px]">
                            مقدم البلاغ: {ar.contactEmailOrPhone || 'مستخدم مجهول'}
                          </div>

                          <div className="flex items-center gap-2">
                            {ar.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  resolveAdReport(ar.id);
                                  setAdReportsList(getAdReportsList());
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>معالجة البلاغ كمنتهي</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف سجل البلاغ الخاص بـ "${ar.adTitle}"؟`)) {
                                  deleteAdReport(ar.id);
                                  setAdReportsList(getAdReportsList());
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف البلاغ</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SUBTAB 2: JOB POSTS REPORTS */}
              {reportsSubTab === 'job_reports' && (
                filteredReports.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">لا توجد بلاغات على الوظائف حالياً</h4>
                    <p className="text-xs text-slate-500">
                      المنصة تعمل بنزاهة ولا توجد أي مخالفات تم الإبلاغ عنها في هذا النطاق.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map((report) => {
                      const isResolved = resolvedReports.includes(report.id);
                      return (
                        <div
                          key={report.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            isResolved 
                              ? 'bg-slate-50/70 border-slate-200 opacity-70' 
                              : 'bg-white border-red-200 shadow-sm'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-red-100 border border-red-300 text-red-700 text-xs font-mono font-black">
                                بلاغ #{report.id}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {report.reason}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>{new Date(report.createdAt).toLocaleString('ar-EG')}</span>
                              {isResolved && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                                  تم الحل
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Report Target details */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="text-slate-800 font-bold">
                              الإعلان المستهدف: <span className="text-blue-700 font-black">{report.jobTitle}</span>
                            </div>
                            <div className="text-slate-600">
                              المعلن المشكو بحقه: <span className="text-slate-900 font-bold">{report.authorName}</span>
                            </div>
                            {report.details && (
                              <div className="pt-1.5 text-slate-700 text-[11.5px] border-t border-slate-200 leading-relaxed font-medium">
                                تفاصيل البلاغ: "{report.details}"
                              </div>
                            )}
                          </div>

                          {/* Reporter contact */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                            <div className="text-slate-500 text-[11px]">
                              مقدم البلاغ: {report.contactEmailOrPhone || 'مستخدم مجهول'}
                            </div>

                            {/* Developer Action Buttons */}
                            <div className="flex items-center gap-2">
                              {!isResolved && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResolvedReports(prev => [...prev, report.id]);
                                    if (onResolveReport) onResolveReport(report.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>تحديد كمحلول</span>
                                </button>
                              )}

                              {onDeleteJob && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف الإعلان المخالف "${report.jobTitle}"؟`)) {
                                      onDeleteJob(report.jobId);
                                      setResolvedReports(prev => [...prev, report.id]);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف الإعلان المخالف</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

            </div>
          )}

          {/* TAB 3: DEVELOPER CREDENTIALS & FIREBASE CONFIG (READ-ONLY & MANAGED EXCLUSIVELY VIA FIREBASE CONSOLE) */}
          {activeTab === 'credentials' && (
            <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
              
              {/* Security Shield Banner */}
              <div className="p-4 bg-gradient-to-br from-blue-50 via-white to-red-50 border border-blue-200 rounded-2xl space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-blue-800 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>بروتوكول حماية بيانات المطور (Firebase Security Protocol)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  تم قفل صلاحية تعديل بيانات المطور من داخل واجهات التطبيق؛ ويتم التحكم وتعديل البريد والرمز السري حصرياً من خلال <strong className="text-red-700">لوحة تحكم فايربيز (Firebase Console)</strong> لضمان الحماية المطلقة ومنع وصول أي طرف آخر.
                </p>
              </div>

              {/* Read-Only Developer Profile Card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">بيانات الاعتماد السحابية</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Firestore Document: {devCreds.firebaseDocId}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    نشط ومقترن بفايربيز
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Developer Name */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-600">هوية المطور:</span>
                    <span className="font-bold text-slate-900">{devCreds.name}</span>
                  </div>

                  {/* Developer Email */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-600">البريد الإلكتروني المعتمد:</span>
                    <span className="font-mono font-bold text-blue-700">{devCreds.email}</span>
                  </div>

                  {/* 7-Digit Security PIN */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-600">الرمز السري المكون من 7 أرقام:</span>
                    <span className="font-mono font-black text-red-600 tracking-widest text-sm bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                      •••••••
                    </span>
                  </div>
                </div>

                {/* Cloud Control Instructions */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-[11px] text-slate-800">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>كيفية تعديل هذه البيانات في المستقبل؟</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[10.5px]">
                    ادخل إلى مشروعك في <strong>Firebase Console</strong> &gt; انتقل إلى <strong>Firestore Database</strong> &gt; افتح المجموعة <strong>developer_credentials</strong> &gt; يمكنك تحديث حقول <code className="text-blue-700 bg-white px-1 py-0.5 rounded border border-blue-200">email</code> و <code className="text-blue-700 bg-white px-1 py-0.5 rounded border border-blue-200">securityCode</code> (7 أرقام) بأمان تام.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ADS ENGINE & SPACES MANAGEMENT */}
          {activeTab === 'ads' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Notification Banner when saved */}
              {adsSavedNotice && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>تم حفظ وتحديث إعدادات الإعلانات بنجاح في المنصة وفايربيز!</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">مُفعل فورياً</span>
                </div>
              )}

              {/* 1. Master Control: Platform Ads vs Third-Party SDKs / AdSense */}
              <div className="p-4 sm:p-5 bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                      adsState.platformAdsEnabled ? 'bg-gradient-to-tr from-blue-600 to-indigo-600' : 'bg-slate-700'
                    }`}>
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">إعلانات المنصة الداخلية (Platform Ads)</h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                          adsState.platformAdsEnabled 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {adsState.platformAdsEnabled ? 'إعلانات المنصة نشطة' : 'متوقفة بالكامل (تفسح المجال للـ SDK)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        التحكم الشامل في إعلانات المنصة (البنرات، الإعلانات البينية، إعلانات المكافأة) وتصاميمها
                      </p>
                    </div>
                  </div>

                  {/* The Master Platform Ads Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleUpdateAdsState(prev => ({
                      ...prev,
                      platformAdsEnabled: !prev.platformAdsEnabled
                    }))}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0 ${
                      adsState.platformAdsEnabled
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <span>{adsState.platformAdsEnabled ? 'إيقاف إعلانات المنصة' : 'تشغيل إعلانات المنصة'}</span>
                  </button>
                </div>

                {!adsState.platformAdsEnabled && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تم إيقاف إعلانات المنصة بنجاح. كافة المساحات مخصصة الآن لشبكة إعلانات Google AdSense وحزم الـ SDK الخارجية (تطبيق باد / AppLovin).</span>
                  </div>
                )}

                {/* Sub-Toggles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  
                  {/* Sub-toggle: Banners */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-900">إعلانات البنر (AD)</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          adsState.bannerAdsEnabled && adsState.platformAdsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {adsState.bannerAdsEnabled && adsState.platformAdsEnabled ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        بنرات أعلى الصفحة ونافذة إضافة الإعلان (علامة AD)
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!adsState.platformAdsEnabled}
                      onClick={() => handleUpdateAdsState(prev => ({
                        ...prev,
                        bannerAdsEnabled: !prev.bannerAdsEnabled
                      }))}
                      className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {adsState.bannerAdsEnabled ? 'تعطيل البنرات' : 'تفعيل البنرات'}
                    </button>
                  </div>

                  {/* Sub-toggle: Interstitial */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-900">الإعلان البيني (فيديو)</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          adsState.interstitialAd.enabled && adsState.platformAdsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {adsState.interstitialAd.enabled && adsState.platformAdsEnabled ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        يظهر كل 5 إعلانات تصفح بالفيديو مع زر كتم الصوت
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!adsState.platformAdsEnabled}
                      onClick={() => handleUpdateAdsState(prev => ({
                        ...prev,
                        interstitialAd: { ...prev.interstitialAd, enabled: !prev.interstitialAd.enabled }
                      }))}
                      className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {adsState.interstitialAd.enabled ? 'تعطيل البيني' : 'تفعيل البيني'}
                    </button>
                  </div>

                  {/* Sub-toggle: Rewarded Ad */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-900">إعلان المكافأة (فيديو)</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          adsState.rewardedAd.enabled && adsState.platformAdsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {adsState.rewardedAd.enabled && adsState.platformAdsEnabled ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        يستمر لنهاية الفيديو لمنح الكوينات عند النقر على واتساب
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!adsState.platformAdsEnabled}
                      onClick={() => handleUpdateAdsState(prev => ({
                        ...prev,
                        rewardedAd: { ...prev.rewardedAd, enabled: !prev.rewardedAd.enabled }
                      }))}
                      className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {adsState.rewardedAd.enabled ? 'تعطيل المكافأة' : 'تفعيل المكافأة'}
                    </button>
                  </div>

                  {/* Sub-toggle: Third Party SDKs & AdSense */}
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-indigo-900">شبكات SDK وأدسنس</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          adsState.thirdPartySdkEnabled || adsState.adsenseEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {adsState.thirdPartySdkEnabled ? 'تطبيق باد نشط' : adsState.adsenseEnabled ? 'أدسنس نشط' : 'وضع المنصة'}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-700 font-medium">
                        إعلانات المستخدمين الخارجية (تطبيق باد / AppLovin / AdSense)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdateAdsState(prev => ({
                        ...prev,
                        thirdPartySdkEnabled: !prev.thirdPartySdkEnabled
                      }))}
                      className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black transition-colors cursor-pointer shadow-xs"
                    >
                      {adsState.thirdPartySdkEnabled ? 'إيقاف SDK تطبيق باد' : 'تفعيل SDK تطبيق باد'}
                    </button>
                  </div>

                </div>
              </div>

              {/* 2. Third-Party SDK & AdSense Configuration Card */}
              <div className="p-4 sm:p-5 bg-white border border-indigo-200 rounded-2xl space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900">إعلانات المستخدمين الخارجية وحزم الـ SDK (تطبيق باد & Google AdSense)</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                    Third-Party Monetization SDK
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* AppBad SDK Setup */}
                  <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-900">تطبيق باد (AppBad SDK Integration)</span>
                      <span className="text-[9px] bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded font-bold">جاهز للربط</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      هذا الخيار خاص بإعلانات المستخدمين والحملات الخارجية المدفوعة التي يتم جلبها عبر SDK تطبيق باد المعتمد.
                    </p>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">SDK App Key / Client Key</label>
                      <input 
                        type="text"
                        value={adsState.thirdPartyAppKey || 'appbad_sdk_live_key_994102'}
                        onChange={e => handleUpdateAdsState(prev => ({
                          ...prev,
                          thirdPartyAppKey: e.target.value
                        }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Google AdSense Setup */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">Google AdSense الرسمي</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateAdsState(prev => ({
                          ...prev,
                          adsenseEnabled: !prev.adsenseEnabled
                        }))}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          adsState.adsenseEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {adsState.adsenseEnabled ? 'أدسنس نشط' : 'تفعيل أدسنس'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">AdSense Client ID</label>
                        <input 
                          type="text"
                          value={adsState.adsenseClientId}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            adsenseClientId: e.target.value
                          }))}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-mono text-slate-900 dir-ltr"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Slot ID</label>
                        <input 
                          type="text"
                          value={adsState.adsenseSlotId}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            adsenseSlotId: e.target.value
                          }))}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-mono text-slate-900 dir-ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Custom Banners Management */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-black text-slate-900">إعلانات البنر والمساحات النشطة</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {adsState.customBanners.length} بنرات
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddBannerForm(!showAddBannerForm)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{showAddBannerForm ? 'إلغاء النموذج' : 'إضافة إعلان بنر جديد'}</span>
                  </button>
                </div>

                {/* Global Banner Background Color Setting (Red, Blue, Yellow, Auto) */}
                <div className="p-3 bg-gradient-to-r from-amber-50 via-rose-50 to-sky-50 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>نمط ألوان خلفية إعلان البنر العلوي (Red / Blue / Yellow)</span>
                    </h4>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      يمكنك تثبيت لون موحد أو تفعيل التبديل الدوري التلقائي بين الأحمر والأزرق والأصفر مع الحفاظ على وضوح الخط التام.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleUpdateAdsState(prev => ({ ...prev, bannerColorTheme: 'auto' }))}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black cursor-pointer transition-all border ${
                        (adsState.bannerColorTheme || 'auto') === 'auto'
                          ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      🔄 دوري تلقائي
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateAdsState(prev => ({ ...prev, bannerColorTheme: 'red' }))}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black cursor-pointer transition-all border ${
                        adsState.bannerColorTheme === 'red'
                          ? 'bg-red-600 text-white border-red-700 shadow-sm'
                          : 'bg-white text-red-700 hover:bg-red-50 border-red-200'
                      }`}
                    >
                      🔴 أحمر ملكي
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateAdsState(prev => ({ ...prev, bannerColorTheme: 'blue' }))}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black cursor-pointer transition-all border ${
                        adsState.bannerColorTheme === 'blue'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-blue-700 hover:bg-blue-50 border-blue-200'
                      }`}
                    >
                      🔵 أزرق نيلي
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateAdsState(prev => ({ ...prev, bannerColorTheme: 'yellow' }))}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black cursor-pointer transition-all border ${
                        adsState.bannerColorTheme === 'yellow'
                          ? 'bg-amber-400 text-slate-950 font-black border-amber-500 shadow-sm'
                          : 'bg-white text-amber-700 hover:bg-amber-50 border-amber-300'
                      }`}
                    >
                      🟡 أصفر ذهبي ساطع
                    </button>
                  </div>
                </div>

                {/* Add New Banner Form */}
                {showAddBannerForm && (
                  <form onSubmit={handleCreateNewBanner} className="p-4 bg-slate-50 rounded-xl border border-blue-200 space-y-3.5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-blue-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>إضافة إعلان مخصص جديد للمنصة</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          اسم الإعلان / العنوان الرئيسي *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: حمّل تطبيق المنصة الرسمي للأندرويد"
                          value={bannerForm.title}
                          onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          اسم الراعي / المعلن
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: منصة Rooh Pro"
                          value={bannerForm.sponsorName}
                          onChange={e => setBannerForm({ ...bannerForm, sponsorName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          رابط صورة الإعلان (Cloudflare R2 / Firebase Storage / CDN) *
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://... صورة الإعلان بحجم جذاب"
                          value={bannerForm.imageUrl}
                          onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none dir-ltr font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          الرابط المستهدف عند النقر (Target URL) *
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://roohpro.com/app-download أو https://roohpro.com/AD"
                          value={bannerForm.targetUrl}
                          onChange={e => setBannerForm({ ...bannerForm, targetUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none dir-ltr font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          نوع الزر المطلوب *
                        </label>
                        <select
                          value={bannerForm.buttonType}
                          onChange={e => {
                            const val = e.target.value as AdButtonType;
                            setBannerForm({
                              ...bannerForm,
                              buttonType: val,
                              buttonLabel: val === 'install' ? 'تثبيت التطبيق' : (val === 'download' ? 'تحميل' : 'انتقال للرابط')
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 outline-none cursor-pointer"
                        >
                          <option value="install">زر تثبيت (Install App)</option>
                          <option value="navigate">زر انتقال (Navigate URL)</option>
                          <option value="download">زر تحميل (Download)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          نص الزر (CTA Label)
                        </label>
                        <input
                          type="text"
                          value={bannerForm.buttonLabel}
                          onChange={e => setBannerForm({ ...bannerForm, buttonLabel: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          لون خلفية الإعلان
                        </label>
                        <select
                          value={bannerForm.colorTheme || 'auto'}
                          onChange={e => setBannerForm({ ...bannerForm, colorTheme: e.target.value as BannerColorTheme })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 outline-none cursor-pointer font-bold"
                        >
                          <option value="auto">🔄 دوري تلقائي (متغير)</option>
                          <option value="red">🔴 أحمر ياقوتي ملكي</option>
                          <option value="blue">🔵 أزرق نيلي تقني</option>
                          <option value="yellow">🟡 أصفر ذهبي ساطع (خط واضح)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          تاريخ انتهاء الإعلان
                        </label>
                        <input
                          type="date"
                          value={bannerForm.expiresAt}
                          onChange={e => setBannerForm({ ...bannerForm, expiresAt: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddBannerForm(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
                      >
                        حفظ ونشر الإعلان
                      </button>
                    </div>
                  </form>
                )}

                {/* Banners List */}
                <div className="space-y-2.5">
                  {adsState.customBanners.map(banner => (
                    <div
                      key={banner.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs font-black text-slate-900 truncate">{banner.title}</h5>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                              banner.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {banner.active ? 'معروض' : 'متوقف'}
                            </span>
                            <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-full font-bold">
                              {banner.buttonType === 'install' ? 'زر تثبيت' : 'زر انتقال'}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${
                              banner.colorTheme === 'blue' 
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : banner.colorTheme === 'yellow'
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : banner.colorTheme === 'red'
                                ? 'bg-red-100 text-red-900 border-red-300'
                                : 'bg-purple-100 text-purple-900 border-purple-300'
                            }`}>
                              {banner.colorTheme === 'blue' ? '🔵 أزرق' : banner.colorTheme === 'yellow' ? '🟡 أصفر' : banner.colorTheme === 'red' ? '🔴 أحمر' : '🔄 دوري متغير'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {banner.sponsorName} • الرابط: <span className="font-mono text-slate-400">{banner.targetUrl}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBannerItem(banner.id, !banner.active)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                            banner.active ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {banner.active ? 'إيقاف' : 'تفعيل'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBannerItem(banner.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors cursor-pointer border border-red-200"
                          title="حذف الإعلان"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* 3. Smart Interstitial & Rewarded Ads Detailed Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Interstitial Ad Settings Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-black text-slate-900">تصميم الإعلان البيني الذكي (فيديو / صورة)</h4>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      كل 5 إعلانات تصفح
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-1">نوع الوسائط</label>
                        <select
                          value={adsState.interstitialAd.mediaType || 'video'}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            interstitialAd: { ...prev.interstitialAd, mediaType: e.target.value as 'image' | 'video' }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="video">إعلان فيديو (Video)</option>
                          <option value="image">صورة ثابتة (Image)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-1">زر الإجراء (CTA)</label>
                        <select
                          value={adsState.interstitialAd.buttonType}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            interstitialAd: { ...prev.interstitialAd, buttonType: e.target.value as AdButtonType }
                          }))}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none cursor-pointer"
                        >
                          <option value="download">زر تحميل (Download)</option>
                          <option value="install">زر تثبيت (Install)</option>
                          <option value="navigate">زر انتقال (Navigate)</option>
                        </select>
                      </div>
                    </div>

                    {/* Behavior Checkboxes */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <span className="text-[10.5px] font-bold text-slate-800 block">سلوك تشغيل الفيديو والصوت:</span>
                      <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsState.interstitialAd.autoMute !== false}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            interstitialAd: { ...prev.interstitialAd, autoMute: e.target.checked }
                          }))}
                          className="accent-blue-600 rounded"
                        />
                        <span>تشغيل الفيديو صامتاً مع إتاحة زر كتم / تشغيل الصوت للمستخدم</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsState.interstitialAd.waitForVideoEnd !== false}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            interstitialAd: { ...prev.interstitialAd, waitForVideoEnd: e.target.checked }
                          }))}
                          className="accent-blue-600 rounded"
                        />
                        <span>استمرار الإعلان لحين انتهاء الفيديو قبل السماح بالتخطي</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[10.5px] text-slate-600 block mb-1">عنوان الإعلان البيني</label>
                      <input
                        type="text"
                        value={adsState.interstitialAd.title}
                        onChange={e => handleUpdateAdsState(prev => ({
                          ...prev,
                          interstitialAd: { ...prev.interstitialAd, title: e.target.value }
                        }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] text-slate-600 block mb-1">رابط وسائط الإعلان (Video MP4 / Image URL)</label>
                      <input
                        type="url"
                        value={adsState.interstitialAd.mediaUrl}
                        onChange={e => handleUpdateAdsState(prev => ({
                          ...prev,
                          interstitialAd: { ...prev.interstitialAd, mediaUrl: e.target.value }
                        }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none font-mono dir-ltr focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] text-slate-600 block mb-1">نص الزر</label>
                        <input
                          type="text"
                          value={adsState.interstitialAd.buttonLabel}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            interstitialAd: { ...prev.interstitialAd, buttonLabel: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-slate-600 block mb-1">ثواني تخطي الصور (احتياطي)</label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={adsState.interstitialAd.durationSeconds}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            interstitialAd: { ...prev.interstitialAd, durationSeconds: Number(e.target.value) || 5 }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rewarded Ad Settings Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-black text-slate-900">تصميم إعلان المكافأة بالفيديو (Rewarded Ad)</h4>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      حتى انتهاء الفيديو
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-1">نوع الوسائط</label>
                        <select
                          value={adsState.rewardedAd.mediaType || 'video'}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            rewardedAd: { ...prev.rewardedAd, mediaType: e.target.value as 'image' | 'video' }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="video">إعلان فيديو صامت (Video)</option>
                          <option value="image">صورة ثابتة (Image)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-1">مكافأة الكوينات</label>
                        <input
                          type="number"
                          value={adsState.rewardedAd.rewardCoins}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            rewardedAd: { ...prev.rewardedAd, rewardCoins: Number(e.target.value) || 5 }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* Triggers and Video Rules */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[10.5px] font-bold text-slate-800 block">قواعد الفيديو والتفعيل:</span>
                      <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsState.rewardedAd.autoMute !== false}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            rewardedAd: { ...prev.rewardedAd, autoMute: e.target.checked }
                          }))}
                          className="accent-blue-600 rounded"
                        />
                        <span>تشغيل الفيديو صامتاً مع زر كتم/تشغيل الصوت</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsState.rewardedAd.waitForVideoEnd !== false}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            rewardedAd: { ...prev.rewardedAd, waitForVideoEnd: e.target.checked }
                          }))}
                          className="accent-blue-600 rounded"
                        />
                        <span>استمرار الإعلان لحين انتهاء الفيديو لمنح الكوينات وإتاحة المتابعة</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adsState.rewardedAd.triggerOnWhatsApp}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            rewardedAd: { ...prev.rewardedAd, triggerOnWhatsApp: e.target.checked }
                          }))}
                          className="accent-blue-600 rounded"
                        />
                        <span>تشغيل الإعلان قبل الانتقال إلى واتساب</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[10.5px] text-slate-600 block mb-1">رابط وسائط إعلان المكافأة (Video MP4 / Image)</label>
                      <input
                        type="url"
                        value={adsState.rewardedAd.mediaUrl}
                        onChange={e => handleUpdateAdsState(prev => ({
                          ...prev,
                          rewardedAd: { ...prev.rewardedAd, mediaUrl: e.target.value }
                        }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none font-mono dir-ltr focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] text-slate-600 block mb-1">عنوان الإعلان</label>
                        <input
                          type="text"
                          value={adsState.rewardedAd.title}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            rewardedAd: { ...prev.rewardedAd, title: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-slate-600 block mb-1">نص زر التحميل / التثبيت</label>
                        <input
                          type="text"
                          value={adsState.rewardedAd.buttonLabel}
                          onChange={e => handleUpdateAdsState(prev => ({
                            ...prev,
                            rewardedAd: { ...prev.rewardedAd, buttonLabel: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: DIRECT SUPPORT & USER TICKETS */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      صندوق رسائل وتذاكر الدعم الفني المباشر
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    استقبال استفسارات المستخدمين والرد الفوري عليها مباشرة. 
                    <span className="text-emerald-700 font-bold mr-1">
                      🔒 نظام عزل كامل: كل مستخدم يرى رسائله الخاصة فقط ولا يمكن لأي مستخدم آخر الاطلاع عليها.
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-center shadow-xs">
                    <div className="text-[10px] text-slate-500 font-semibold">إجمالي التذاكر</div>
                    <div className="text-sm font-black text-blue-700 font-mono">{supportTickets.length}</div>
                  </div>
                  <div className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-center shadow-xs">
                    <div className="text-[10px] text-amber-700 font-semibold">تذاكر بحاجة لرد</div>
                    <div className="text-sm font-black text-amber-600 font-mono">
                      {supportTickets.filter(t => t.status === 'open').length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Tickets Search & Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Tickets List on Left (4 cols) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3 flex flex-col h-[520px]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={supportSearch}
                      onChange={(e) => setSupportSearch(e.target.value)}
                      placeholder="بحث بحساب المستخدم أو البريد..."
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                    {supportTickets.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        لا توجد رسائل دعم فني حالياً
                      </div>
                    ) : (
                      supportTickets
                        .filter(t => 
                          t.userEmail.toLowerCase().includes(supportSearch.toLowerCase()) ||
                          t.userName.toLowerCase().includes(supportSearch.toLowerCase()) ||
                          t.messages.some(m => m.text.toLowerCase().includes(supportSearch.toLowerCase()))
                        )
                        .map(ticket => {
                          const isSelected = selectedTicketId === ticket.id;
                          const latestMsg = ticket.messages[ticket.messages.length - 1];
                          return (
                            <div
                              key={ticket.id}
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer text-right space-y-1 ${
                                isSelected 
                                  ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-300' 
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black text-slate-900 truncate">
                                  {ticket.userName}
                                </span>
                                <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold ${
                                  ticket.status === 'open' 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : ticket.status === 'replied' 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {ticket.status === 'open' ? 'جديد بحاجة لرد' : ticket.status === 'replied' ? 'تم الرد' : 'مغلق'}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-blue-700 font-mono truncate dir-ltr text-right">
                                {ticket.userEmail}
                              </p>
                              {latestMsg && (
                                <p className="text-[11px] text-slate-600 truncate mt-1">
                                  {latestMsg.sender === 'user' ? '👤 المستخدم: ' : '🎧 الدعم: '}
                                  {latestMsg.text}
                                </p>
                              )}
                              <div className="text-[9.5px] text-slate-400 font-mono">
                                {new Date(ticket.updatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Ticket Details & Chat Panel on Right (8 cols) */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col h-[520px]">
                  {(() => {
                    const activeTicket = supportTickets.find(t => t.id === selectedTicketId);
                    if (!activeTicket) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                          <Headphones className="w-8 h-8 text-slate-300 stroke-1" />
                          <span>اختر تذكرة من القائمة للاطلاع على المحادثة والرد عليها</span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex-1 flex flex-col h-full min-h-0">
                        {/* Conversation Header */}
                        <div className="pb-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900">{activeTicket.userName}</h4>
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono dir-ltr font-bold">
                                {activeTicket.userEmail}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              رقم التذكرة: <span className="font-mono">{activeTicket.id}</span> • تاريخ البدء: {new Date(activeTicket.createdAt).toLocaleDateString('ar-EG')}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                updateSupportTicketStatus(activeTicket.id, activeTicket.status === 'closed' ? 'open' : 'closed');
                                setSupportTickets(getAllSupportTickets());
                              }}
                              className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                                activeTicket.status === 'closed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {activeTicket.status === 'closed' ? 'إعادة فتح التذكرة' : 'إغلاق التذكرة'}
                            </button>
                          </div>
                        </div>

                        {/* Messages History */}
                        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                          {activeTicket.messages.map((m) => {
                            const isUser = m.sender === 'user';
                            return (
                              <div
                                key={m.id}
                                className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                              >
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                                  isUser
                                    ? 'bg-slate-100 text-slate-900 rounded-tr-none'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tl-none shadow-xs'
                                }`}>
                                  <div className="flex items-center justify-between gap-3 text-[10px]">
                                    <span className="font-black">
                                      {isUser ? `👤 ${activeTicket.userName}` : '🎧 دعم المنصة (المطور)'}
                                    </span>
                                    <span className={`font-mono text-[9px] ${isUser ? 'text-slate-500' : 'text-blue-100'}`}>
                                      {new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{m.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Reply Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!supportReplyText.trim()) return;
                            replyToSupportTicket(activeTicket.id, supportReplyText.trim());
                            setSupportReplyText('');
                            setSupportTickets(getAllSupportTickets());
                          }}
                          className="pt-3 border-t border-slate-200 shrink-0 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={supportReplyText}
                            onChange={(e) => setSupportReplyText(e.target.value)}
                            placeholder="اكتب رد الدعم الفني المباشر للمستخدم..."
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={!supportReplyText.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <span>إرسال الرد</span>
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* 4. Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-700">لوحة تحكم مطور المنصة النشطة (Rooh Pro)</span>
          </div>
          <span className="font-mono text-blue-700 font-bold">Firebase Auth & Firestore Realtime</span>
        </div>
      </div>
    </div>
  );
};
