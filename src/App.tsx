import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Search,
  Briefcase,
  UserCheck,
  LayoutGrid,
  Smartphone
} from 'lucide-react';
import { JobPost, ListingType, ActiveNavTab, CommentItem, ChatThread, NotificationItem, ReportItem, UserProfile, EMPTY_GUEST_PROFILE, FollowerUser } from './types';
import { 
  INITIAL_JOBS, 
  INITIAL_COMMENTS, 
  INITIAL_THREADS, 
  INITIAL_NOTIFICATIONS 
} from './data/initialJobs';
import { searchAndFilterListings } from './utils/indexer';
import { dispatchPushNotification, playCustomNotificationSound } from './utils/notifications';
import { usePWAInstall } from './utils/usePWAInstall';
import { Header } from './components/Header';
import { TopBannerAd } from './components/TopBannerAd';
import { UnifiedSearchFilterBar } from './components/UnifiedSearchFilterBar';
import { ReelCard } from './components/ReelCard';
import { CommentsModal } from './components/CommentsModal';
import { ReportModal } from './components/ReportModal';
import { AddJobModal } from './components/AddJobModal';
import { AddChoiceModal } from './components/AddChoiceModal';
import { MessagesModal } from './components/MessagesModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';
import { AdvertiserProfileModal } from './components/AdvertiserProfileModal';
import { SimilarJobsModal } from './components/SimilarJobsModal';
import { BottomNav } from './components/BottomNav';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { DeveloperAuthModal } from './components/DeveloperAuthModal';
import { DeveloperDashboardModal } from './components/DeveloperDashboardModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { getDeveloperAdsState, canShowInterstitialAd, canShowRewardedAd } from './utils/adsManager';
import { applyPageSeo, pingMainPortalArchive } from './utils/seoAndRouting';
import { syncUserWithCloudflareD1, syncJobPostToFirebase, syncReportToFirebase } from './utils/cloudSync';
import { grantAccountWelcomeCoins } from './utils/coinsEngine';
import { 
  subscribeToFirestorePosts, 
  savePostToFirestore, 
  deletePostFromFirestore,
  batchSavePostsToFirestore,
  syncUserProfileToFirestore
} from './firebase/services';

export default function App() {
  // 1. Persistent State (cleaned of any dummy/mock jobs)
  const [posts, setPosts] = useState<JobPost[]>(() => {
    const saved = localStorage.getItem('shoghl_posts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean all fake/mock jobs (e.g. job-1, job-2, seeker-1, or items with fake test names)
          const cleaned = parsed.filter((p: JobPost) => 
            p && p.id && 
            !p.id.startsWith('job-') && 
            !p.id.startsWith('seeker-') && 
            !p.id.startsWith('mock-') && 
            !p.id.startsWith('dummy-') &&
            !p.title?.includes('نجار موبيليا وتشطيبات خشبية') &&
            !p.title?.includes('فني سباكة وتأسيس صحي')
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('shoghl_posts', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_JOBS;
  });

  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>(() => {
    const saved = localStorage.getItem('shoghl_comments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          delete parsed['job-1'];
          delete parsed['job-2'];
          delete parsed['seeker-1'];
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_COMMENTS;
  });

  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('shoghl_threads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((t: ChatThread) => !t.id.startsWith('thread-'));
          return cleaned;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_THREADS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('shoghl_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('shoghl_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('shoghl_comments', JSON.stringify(commentsMap));
  }, [commentsMap]);

  useEffect(() => {
    localStorage.setItem('shoghl_threads', JSON.stringify(chatThreads));
  }, [chatThreads]);

  useEffect(() => {
    localStorage.setItem('shoghl_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Real-time Firestore subscription for posts
  useEffect(() => {
    const unsubscribe = subscribeToFirestorePosts((cloudPosts) => {
      if (cloudPosts && cloudPosts.length > 0) {
        setPosts((currentPosts) => {
          const map = new Map<string, JobPost>();
          // Cloud posts are master
          cloudPosts.forEach((cp) => map.set(cp.id, cp));
          // Keep non-duplicate local posts
          currentPosts.forEach((lp) => {
            if (!map.has(lp.id)) {
              map.set(lp.id, lp);
            }
          });
          const merged = Array.from(map.values());
          localStorage.setItem('shoghl_posts', JSON.stringify(merged));
          return merged;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Navigation & View State
  const [activeTab, setActiveTab] = useState<ListingType>('job');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isAutoAdvanceActive, setIsAutoAdvanceActive] = useState(true);
  
  // Responsive layout detection: Desktop defaults to 4-card grid layout, Mobile defaults to full-screen vertical reel
  const [isDesktopGrid, setIsDesktopGrid] = useState(true);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Modals & Panels
  const [selectedAdvertiserPost, setSelectedAdvertiserPost] = useState<JobPost | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<JobPost | null>(null);
  const [activeReportPost, setActiveReportPost] = useState<JobPost | null>(null);
  
  // Similar Jobs feature: tracks the last job that user liked or bookmarked
  const [lastInteractedPost, setLastInteractedPost] = useState<JobPost | null>(null);
  const [isSimilarJobsModalOpen, setIsSimilarJobsModalOpen] = useState(false);
  
  // Multi-Account Isolated Storage
  // Structure: { [email: string]: { profile: UserProfile; savedPostIds: string[] } }
  const [activeAccountEmail, setActiveAccountEmail] = useState<string>(() => {
    return localStorage.getItem('shoghl_active_email') || '';
  });

  const [accountsData, setAccountsData] = useState<Record<string, { profile: UserProfile; savedPostIds: string[] }>>(() => {
    const saved = localStorage.getItem('shoghl_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('shoghl_accounts', JSON.stringify(accountsData));
  }, [accountsData]);

  useEffect(() => {
    localStorage.setItem('shoghl_active_email', activeAccountEmail);
  }, [activeAccountEmail]);

  // Derived current user profile based on active account (empty if guest)
  const userProfile: UserProfile = useMemo(() => {
    if (activeAccountEmail && accountsData[activeAccountEmail]?.profile) {
      return accountsData[activeAccountEmail].profile;
    }
    return EMPTY_GUEST_PROFILE;
  }, [activeAccountEmail, accountsData]);

  // Derived saved post IDs for active account (strict isolation)
  const currentAccountSavedIds = useMemo(() => {
    if (!activeAccountEmail) return [];
    return accountsData[activeAccountEmail]?.savedPostIds || [];
  }, [activeAccountEmail, accountsData]);

  // Handle account login/connection
  const handleConnectAccount = (email: string, intent: 'employer' | 'seeker' = 'employer') => {
    const cleanEmail = email.toLowerCase().trim();
    setActiveAccountEmail(cleanEmail);

    setAccountsData((prev) => {
      const existing = prev[cleanEmail];
      if (existing) {
        return prev;
      }
      const newProfile: UserProfile = {
        name: cleanEmail.split('@')[0],
        role: intent === 'employer' ? 'صاحب عمل / معلن وظائف' : 'باحث عن عمل / مهني وفني',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone: '',
        whatsapp: '',
        address: '',
        city: 'الإسكندرية',
        country: 'مصر',
        bio: '',
        verified: true,
        email: cleanEmail,
        userIntent: intent,
        connectedAccount: {
          email: cleanEmail,
          provider: 'google',
          connectedAt: new Date().toISOString(),
          googleAccountId: 'goog_' + Math.random().toString(36).substring(2, 10),
          isVerified: true
        }
      };

      // Sync with Cloudflare D1 unified users & cross-platform ecosystem
      try {
        const { user: d1User, isNewUser } = syncUserWithCloudflareD1(newProfile, intent);
        newProfile.coinsBalance = d1User.coinsBalance;
        newProfile.d1SyncId = d1User.id;
        newProfile.crossPlatformLinked = true;
      } catch (err) {
        console.warn('D1 sync warning:', err);
      }

      return {
        ...prev,
        [cleanEmail]: {
          profile: newProfile,
          savedPostIds: []
        }
      };
    });

    // Grant 50 Welcome Coins & sync with Rooh AD Network
    try {
      grantAccountWelcomeCoins(cleanEmail);
    } catch (e) {
      console.warn('Welcome coins grant notice:', e);
    }

    triggerToast(`🎉 مبروك! تم إنشاء حسابك ومنحك 50 كوين هدية ترحيبية ومزامنة بريدك (${cleanEmail}) مع منصة إعلانات Rooh AD!`);
  };

  const handleDisconnectAccount = () => {
    setActiveAccountEmail('');
    triggerToast('تم تسجيل الخروج بنجاح');
  };

  const handleUpdateUserProfile = (updated: UserProfile) => {
    const email = updated.connectedAccount?.email || activeAccountEmail;
    if (!email) return;

    setAccountsData((prev) => {
      const existing = prev[email] || { profile: updated, savedPostIds: [] };
      return {
        ...prev,
        [email]: {
          ...existing,
          profile: updated
        }
      };
    });
    triggerToast('تم حفظ وتحديث بيانات ملفك الشخصي');
  };

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const saved = localStorage.getItem('shoghl_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [addChoiceOpen, setAddChoiceOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<ListingType>('job');
  const [activeNavTab, setActiveNavTab] = useState<ActiveNavTab>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGlobalPrivacyOpen, setIsGlobalPrivacyOpen] = useState(false);
  const [globalPrivacyTab, setGlobalPrivacyTab] = useState<'about' | 'policy' | 'gemini'>('policy');

  // Developer Control Panel & Secret Auth States
  const [isDeveloperAuthOpen, setIsDeveloperAuthOpen] = useState(false);
  const [isDeveloperDashboardOpen, setIsDeveloperDashboardOpen] = useState(false);
  const [isDeveloperInspectMode, setIsDeveloperInspectMode] = useState(false);

  const handleDeveloperInspectApp = (role?: 'seeker' | 'job' | 'all') => {
    setIsDeveloperDashboardOpen(false);
    setIsDeveloperInspectMode(true);
    if (role === 'job') {
      setActiveTab('job');
    } else if (role === 'seeker') {
      setActiveTab('seeker');
    }
    setActiveReelIndex(0);
    triggerToast('تم تفعيل وضع معاينة وفحص المنصة للمطور - يمكنك اختبار كافة الميزات والريلز بحرية');
  };

  const handleAddDeveloperListing = (newPostData: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => {
    const created: JobPost = {
      ...newPostData,
      id: 'post_dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      likesCount: Math.floor(25 + Math.random() * 80),
      commentsCount: Math.floor(2 + Math.random() * 12),
      createdAt: 'الآن',
      isLiked: false,
      isSaved: false,
      verified: true
    };
    setPosts(prev => [created, ...prev]);
    savePostToFirestore(created).catch((e) => console.warn('Firestore write warning:', e));
    syncJobPostToFirebase(created);
    triggerToast(newPostData.type === 'job' ? 'تم نشر الوظيفة بنجاح وتوثيقها في فايربيس' : 'تم نشر طلب العمل بنجاح وتوثيقه في فايربيس');
  };

  const handleBatchAddDeveloperListings = (newPostsList: Array<Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>>) => {
    const createdList: JobPost[] = newPostsList.map((p, idx) => ({
      ...p,
      id: 'post_seed_' + (Date.now() + idx) + '_' + Math.random().toString(36).substring(2, 6),
      likesCount: Math.floor(20 + Math.random() * 95),
      commentsCount: Math.floor(3 + Math.random() * 15),
      createdAt: 'اليوم',
      isLiked: false,
      isSaved: false,
      verified: true
    }));
    setPosts(prev => [...createdList, ...prev]);
    batchSavePostsToFirestore(createdList).catch((e) => console.warn('Firestore batch warning:', e));
    createdList.forEach(item => syncJobPostToFirebase(item));
    triggerToast(`تمت إضافة ${createdList.length} إعلاناً حقيقياً بنجاح ومزامنتها مع فايربيس`);
  };

  // Ad Modals State (Rewarded 10s & Interstitial every 5 ads)
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);
  const [rewardedAdCallback, setRewardedAdCallback] = useState<(() => void) | null>(null);
  const [rewardedAdNotice, setRewardedAdNotice] = useState<string>('');
  const [isInterstitialAdOpen, setIsInterstitialAdOpen] = useState(false);
  const adsAdvanceCounterRef = useRef(0);

  // Listen for custom trigger for rewarded ad (on WhatsApp click or Phone copy)
  useEffect(() => {
    const handleRewardedTrigger = (e: any) => {
      const { action, type } = e.detail || {};
      const currentAds = getDeveloperAdsState();
      
      // Master switch or ad disabled check
      if (!currentAds.platformAdsEnabled || !currentAds.rewardedAd.enabled) {
        if (action) action();
        return;
      }

      // Check 1-minute cooldown rule: if 1 minute hasn't passed, do not show ad, directly proceed
      if (!canShowRewardedAd()) {
        if (action) action();
        return;
      }

      if (type === 'whatsapp' && currentAds.rewardedAd.triggerOnWhatsApp) {
        setRewardedAdNotice('شاهد إعلان المكافأة (10 ثوانٍ) للانتقال إلى محادثة واتساب');
        setRewardedAdCallback(() => action);
        setIsRewardedAdOpen(true);
      } else if (type === 'phone' && currentAds.rewardedAd.triggerOnCopyPhone) {
        setRewardedAdNotice('شاهد إعلان المكافأة (10 ثوانٍ) لنسخ رقم الهاتف المباشر');
        setRewardedAdCallback(() => action);
        setIsRewardedAdOpen(true);
      } else {
        if (action) action();
      }
    };

    window.addEventListener('rooh_trigger_rewarded_ad', handleRewardedTrigger);
    return () => window.removeEventListener('rooh_trigger_rewarded_ad', handleRewardedTrigger);
  }, []);

  // Check URL routing for SEO and dedicated paths (/privacy or roohpro.com/jop/privacy)
  useEffect(() => {
    applyPageSeo({
      title: 'Rooh Pro | منصة التوظيف والفرص المهنية',
      description: 'منصة Rooh Pro لربط الباحثين عن عمل بأصحاب الأعمال والشركات'
    });

    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('/privacy') || window.location.hash.includes('privacy')) {
      setIsGlobalPrivacyOpen(true);
      setGlobalPrivacyTab('policy');
    }
  }, []);

  const handleDeletePost = (jobId: string) => {
    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== jobId);
      localStorage.setItem('shoghl_posts', JSON.stringify(updated));
      return updated;
    });
    deletePostFromFirestore(jobId).catch((e) => console.warn('Firestore delete error:', e));
    triggerToast('تم حذف الإعلان بنجاح من قاعدة البيانات والواجهة');
  };

  const handleOpenGlobalPrivacy = (tab: 'about' | 'policy' | 'gemini' = 'policy') => {
    setGlobalPrivacyTab(tab);
    setIsGlobalPrivacyOpen(true);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive screen size listener
  useEffect(() => {
    const checkScreen = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileScreen(isMobile);
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Show quick toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Followed Advertisers State & Storage (empty initially, no fake data)
  const [followedAuthors, setFollowedAuthors] = useState<string[]>(() => {
    const saved = localStorage.getItem('shoghl_followed_authors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('shoghl_followed_authors', JSON.stringify(followedAuthors));
  }, [followedAuthors]);

  // Followers List for Account and Comments Windows
  const [followersList, setFollowersList] = useState<FollowerUser[]>(() => {
    const saved = localStorage.getItem('shoghl_followers_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'fol-1',
        name: 'م. خالد المنصوري',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'مدير مشروعات هندسية',
        city: 'القاهرة',
        followedAt: 'منذ يومين'
      },
      {
        id: 'fol-2',
        name: 'سارة عبدالرحمن',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        role: 'أخصائية موارد بشرية وتوظيف',
        city: 'الرياض',
        followedAt: 'منذ 3 أيام'
      },
      {
        id: 'fol-3',
        name: 'شركة الأفق للمقاولات',
        avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
        role: 'شركة مقاولات وتوريدات',
        city: 'دبي',
        followedAt: 'منذ أسبوع'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('shoghl_followers_list', JSON.stringify(followersList));
  }, [followersList]);

  // PWA Direct Install Hook
  const { isInstalled, install } = usePWAInstall();

  const handleOpenInstallApp = async () => {
    const result = await install();
    playCustomNotificationSound();
    if (result === 'already-installed' || isInstalled) {
      triggerToast('تطبيق شغل وتقنية مثبت بالفعل على جهازك ويعمل بملء الشاشة');
    } else if (result === 'installed') {
      triggerToast('تم تثبيت تطبيق شغل وتقنية على جهازك بنجاح');
    } else if (result === 'dismissed') {
      triggerToast('تم إلغاء التثبيت');
    } else {
      triggerToast('جاري بدء تثبيت تطبيق شغل وتقنية مباشرة بملء الشاشة...');
    }
  };

  const handleToggleFollow = (authorName: string) => {
    setFollowedAuthors(prev => {
      const exists = prev.includes(authorName);
      if (exists) {
        triggerToast(`تم إلغاء متابعة ${authorName}`);
        return prev.filter(name => name !== authorName);
      } else {
        triggerToast(`تمت متابعة ${authorName} بنجاح`);
        playCustomNotificationSound();
        dispatchPushNotification({
          title: 'متابعة جديدة',
          body: `أصبحت تتابع ${authorName} الآن وستصلك أحدث وظائفه`,
          tag: `follow-${authorName}`
        });
        return [...prev, authorName];
      }
    });
  };

  // Listings mapped to the current account's saved items (Strict account isolation)
  const displayPosts = useMemo(() => {
    return posts.map(p => ({
      ...p,
      isSaved: currentAccountSavedIds.includes(p.id)
    }));
  }, [posts, currentAccountSavedIds]);

  // 3. Intelligent Internal Indexing and Filtering
  const filteredPosts = useMemo(() => {
    return searchAndFilterListings(
      displayPosts,
      searchQuery,
      activeTab
    );
  }, [displayPosts, searchQuery, activeTab]);

  // Compute similar posts to the last liked or saved job
  const similarPosts = useMemo(() => {
    if (!lastInteractedPost) return [];
    
    // Extract keywords from category and title
    const refCat = lastInteractedPost.category.toLowerCase().trim();
    const refTitle = lastInteractedPost.title.toLowerCase().trim();
    const refKeywords = refTitle.split(/[\s,،-]+/).filter(w => w.length > 2);

    return displayPosts.filter(p => {
      // Must match same type (job or seeker)
      if (p.type !== lastInteractedPost.type) return false;

      // Exact or partial category match
      const pCat = p.category.toLowerCase().trim();
      const pTitle = p.title.toLowerCase().trim();
      
      const categoryMatch = pCat === refCat || pCat.includes(refCat) || refCat.includes(pCat);
      const titleMatch = refKeywords.some(kw => pTitle.includes(kw));
      const tagsMatch = p.tags.some(t => lastInteractedPost.tags.includes(t));

      return categoryMatch || titleMatch || tagsMatch;
    });
  }, [displayPosts, lastInteractedPost]);

  // Reset reel index when search or tab changes
  useEffect(() => {
    setActiveReelIndex(0);
  }, [activeTab, searchQuery]);

  // Shorts Slide Animation Direction: 1 = next (slide up), -1 = prev (slide down)
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Shorts-style vertical sliding animation variants (authentic YouTube Shorts / TikTok physics)
  const shortsVariants = {
    enter: (direction: number) => ({
      y: direction > 0 ? '100%' : '-100%',
      scale: 0.94,
      opacity: 0.8,
    }),
    center: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        y: { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.8 },
        scale: { duration: 0.25 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      y: direction > 0 ? '-100%' : '100%',
      scale: 0.94,
      opacity: 0.8,
      transition: {
        y: { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.8 },
        scale: { duration: 0.25 },
        opacity: { duration: 0.2 }
      }
    })
  };

  // Advance to next card (shorts-style 10-second auto-advance or manual next)
  const handleAdvanceNext = () => {
    if (filteredPosts.length === 0) return;

    // Smart Interstitial Ad trigger every 5 job ads if enabled AND 1 minute has elapsed
    adsAdvanceCounterRef.current += 1;
    const currentAds = getDeveloperAdsState();
    if (
      currentAds.platformAdsEnabled && 
      currentAds.interstitialAd.enabled && 
      adsAdvanceCounterRef.current % 5 === 0 &&
      canShowInterstitialAd()
    ) {
      setIsInterstitialAdOpen(true);
    }

    setSlideDirection(1);
    setActiveReelIndex((prev) => {
      const nextIdx = prev + 1;
      return nextIdx < filteredPosts.length ? nextIdx : 0; // Loop back or stop
    });
  };

  const handleAdvancePrev = () => {
    if (filteredPosts.length === 0) return;
    setSlideDirection(-1);
    setActiveReelIndex((prev) => (prev > 0 ? prev - 1 : filteredPosts.length - 1));
  };

  // Keyboard navigation for reel mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        handleAdvanceNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        handleAdvancePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPosts.length]);

  // Likes handler
  const handleToggleLike = (id: string) => {
    const targetPost = posts.find(p => p.id === id);
    if (targetPost && !targetPost.isLiked) {
      setLastInteractedPost(targetPost);
      playCustomNotificationSound();
      dispatchPushNotification({
        title: 'إعجاب بالوظيفة',
        body: `أبديت إعجابك بـ: ${targetPost.title}`,
        tag: `like-${id}`
      });
    }

    setPosts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isLiked = !item.isLiked;
          const likesCount = isLiked ? item.likesCount + 1 : Math.max(0, item.likesCount - 1);
          return { ...item, isLiked, likesCount };
        }
        return item;
      })
    );
  };

  // Bookmark handler - strictly isolated per account!
  const handleToggleBookmark = (id: string) => {
    if (!activeAccountEmail) {
      triggerToast('يرجى تسجيل الدخول أو ربط الحساب أولاً لحفظ الإعلانات في مفضلتك');
      setActiveNavTab('profile');
      return;
    }

    const targetPost = posts.find(p => p.id === id);
    if (targetPost && !currentAccountSavedIds.includes(id)) {
      setLastInteractedPost(targetPost);
    }

    setAccountsData((prev) => {
      const existing = prev[activeAccountEmail] || { profile: userProfile, savedPostIds: [] };
      const isSaved = existing.savedPostIds.includes(id);
      const updatedIds = isSaved
        ? existing.savedPostIds.filter((item) => item !== id)
        : [...existing.savedPostIds, id];

      triggerToast(isSaved ? 'تمت إزالة الإعلان من المحفوظات' : 'تم حفظ الإعلان في مفضلتك بنجاح');

      return {
        ...prev,
        [activeAccountEmail]: {
          ...existing,
          savedPostIds: updatedIds
        }
      };
    });
  };

  // Comments handler - dynamic author based on profile or guest
  const handleAddComment = (jobId: string, text: string) => {
    const authorName = userProfile.name || (activeAccountEmail ? activeAccountEmail.split('@')[0] : 'زائر المنصة');
    const authorAvatar = userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    const newComment: CommentItem = {
      id: 'c_' + Date.now(),
      jobId,
      userName: authorName,
      userAvatar: authorAvatar,
      text,
      createdAt: 'الآن',
      likes: 0
    };

    setCommentsMap((prev) => ({
      ...prev,
      [jobId]: [newComment, ...(prev[jobId] || [])]
    }));

    // Update comment counter in post
    setPosts((prev) =>
      prev.map((p) => (p.id === jobId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );

    playCustomNotificationSound();
    dispatchPushNotification({
      title: 'استفسار جديد على الوظيفة',
      body: `تم إرسال استفسارك بنجاح`,
      tag: `comment-${jobId}`
    });

    triggerToast('تم نشر استفسارك وسيتلقى صاحب الإعلان إشعاراً');
  };

  const handleLikeComment = (commentId: string) => {
    if (!activeCommentPost) return;
    const jobId = activeCommentPost.id;
    setCommentsMap((prev) => {
      const list = prev[jobId] || [];
      const updated = list.map((c) =>
        c.id === commentId ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked } : c
      );
      return { ...prev, [jobId]: updated };
    });
  };

  // Adding new Job or Seeker Request (associated with active user if logged in)
  const handleCreateNewListing = (newPostData: Omit<JobPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => {
    const defaultAuthor = userProfile.name || (activeAccountEmail ? activeAccountEmail.split('@')[0] : 'معلن المنصة');
    const defaultAvatar = userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
    const defaultPhone = userProfile.phone || '';
    const whatsappNum = newPostData.whatsappNumber || userProfile.whatsapp || defaultPhone;

    const created: JobPost = {
      ...newPostData,
      id: 'post_' + Date.now(),
      creatorEmail: activeAccountEmail || undefined,
      authorName: newPostData.authorName || defaultAuthor,
      authorAvatar: newPostData.authorAvatar || defaultAvatar,
      authorPhone: newPostData.authorPhone || defaultPhone,
      whatsappNumber: whatsappNum,
      whatsappLink: whatsappNum ? `https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}` : undefined,
      likesCount: 1,
      commentsCount: 0,
      createdAt: 'الآن',
      isLiked: true,
      isSaved: false
    };

    setPosts((prev) => [created, ...prev]);
    savePostToFirestore(created).catch((e) => console.warn('Firestore write warning:', e));
    // Sync to Firebase realtime cloud infrastructure
    syncJobPostToFirebase(created);

    setActiveTab(newPostData.type);
    setActiveReelIndex(0);
    triggerToast(
      newPostData.type === 'job' 
        ? 'تم نشر إعلان الوظيفة بنجاح وتحديث الفهرس الذكي' 
        : 'تم نشر طلب العمل بنجاح وسيظهر لأصحاب الأعمال'
    );
  };

  // Sending Chat message
  const handleSendMessage = (threadId: string, text: string) => {
    const newMsg = {
      id: 'm_' + Date.now(),
      sender: 'me' as const,
      text,
      time: 'الآن'
    };

    setChatThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            lastMessage: text,
            timestamp: 'الآن',
            messages: [...thread.messages, newMsg]
          };
        }
        return thread;
      })
    );
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    triggerToast('تم تحديد جميع الإشعارات كمقروءة');
  };

  // Open Add modal with specific type
  const handleOpenAddModal = (type: ListingType) => {
    setAddModalType(type);
    setAddModalOpen(true);
  };

  // Handle report submission to support
  const handleSubmitReport = (report: ReportItem) => {
    setReports((prev) => [report, ...prev]);
    // Sync to Firebase abuse reports collection
    syncReportToFirebase(report);

    try {
      const existing = JSON.parse(localStorage.getItem('shoghl_reports') || '[]');
      localStorage.setItem('shoghl_reports', JSON.stringify([report, ...existing]));
    } catch (e) {
      console.error(e);
    }
    triggerToast(`تم استلام البلاغ برقم (#${report.id}) وجارٍ المراجعة من الدعم الفني`);
  };

  // Start chat with an advertiser directly from profile
  const handleStartChatWithAdvertiser = (advertiserPost: JobPost) => {
    setSelectedAdvertiserPost(null);
    const existingThread = chatThreads.find((t) => t.recipientName === advertiserPost.authorName);
    if (!existingThread) {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        jobId: advertiserPost.id,
        jobTitle: advertiserPost.title,
        recipientName: advertiserPost.authorName,
        recipientAvatar: advertiserPost.authorAvatar,
        recipientRole: advertiserPost.authorRole,
        lastMessage: 'مرحباً، أود الاستفسار عن إعلانك.',
        timestamp: 'الآن',
        unreadCount: 0,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'me',
            text: `مرحباً، بخصوص إعلانك: "${advertiserPost.title}". أود معرفة المزيد من التفاصيل.`,
            time: 'الآن'
          }
        ]
      };
      setChatThreads((prev) => [newThread, ...prev]);
    }
    setActiveNavTab('messages');
    triggerToast(`تم فتح المحادثة المباشرة مع ${advertiserPost.authorName}`);
  };

  // Computed counters
  const unreadMessagesCount = chatThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const savedPosts = useMemo(() => {
    return displayPosts.filter((p) => currentAccountSavedIds.includes(p.id));
  }, [displayPosts, currentAccountSavedIds]);

  const myPosts = useMemo(() => {
    if (!activeAccountEmail) return [];
    return displayPosts.filter((p) => p.creatorEmail === activeAccountEmail);
  }, [displayPosts, activeAccountEmail]);

  const jobPostsCount = useMemo(() => posts.filter((p) => p.type === 'job').length, [posts]);
  const seekerPostsCount = useMemo(() => posts.filter((p) => p.type === 'seeker').length, [posts]);

  // Active post in reel focus mode
  const currentReelPost = filteredPosts[activeReelIndex] || filteredPosts[0];

  return (
    <div className="app-viewport-container w-full h-full bg-slate-100 text-slate-900 flex flex-col font-sans overflow-hidden select-none">
      
      {/* 1. Top 50px Banner Ad (حجم الإعلان 50 بيكسل في حجم الصفحة من اليمين إلى الشمال) */}
      <TopBannerAd />

      {/* Developer Live Inspection Mode Active Strip */}
      {isDeveloperInspectMode && (
        <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-700 text-white px-3 py-1.5 text-xs font-black flex items-center justify-between shadow-md shrink-0 z-40 border-b border-emerald-400/40" dir="rtl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
            </span>
            <span className="text-[11px] sm:text-xs">وضع معاينة المنصة للمطور (Live Simulator) - أنت تتصفح التطبيق من الداخل كأي مستخدم</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDeveloperDashboardOpen(true)}
              className="px-2.5 py-0.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            >
              العودة للوحة التحكم
            </button>
            <button
              type="button"
              onClick={() => setIsDeveloperInspectMode(false)}
              className="text-white/80 hover:text-white text-xs px-1"
              title="إنهاء وضع المعاينة"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 border border-red-400 animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EXACT 2px Distance between Top Menu Bar and Window Frame */}
      <div className="h-[2px] w-full shrink-0 bg-transparent" />

      {/* 2. Main Content View Area - Maximizes 100% of available vertical space without overlap */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-1 sm:px-4 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        
        {/* Empty State when internal indexing finds zero matches OR when platform is clean */}
        {filteredPosts.length === 0 ? (
          <div className="w-full max-w-lg mx-auto text-center py-10 sm:py-14 bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 my-6 animate-in zoom-in-95 duration-200">
            {posts.length === 0 ? (
              <div className="py-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
                  <Briefcase className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">
                  أهلاً بك في منصة شُغل برو
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  يتم تحديث ونشر أحدث فرص العمل المعتمدة بشكل دوري ومستمر.
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200 mb-4">
                  <Search className="w-8 h-8 stroke-1.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">لم نعثر على نتائج مطابقة للبحث</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  جرّب تغيير كلمات البحث، أو اختر تصنيفاً آخر، أو كن أول من يضيف إعلاناً في هذا المجال.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-all"
                  >
                    إعادة ضبط البحث
                  </button>
                  <button
                    onClick={() => setAddChoiceOpen(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all"
                  >
                    إضافة إعلان جديد (وظيفة / طلب عمل)
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* VIEW MODE 1: DESKTOP MULTI-COLUMN GRID (4 Cards side-by-side)
                Responsive condition: Enabled on desktop when isDesktopGrid is true AND screen width is large */}
            {!isMobileScreen && isDesktopGrid ? (
              <div className="w-full h-full overflow-y-auto py-3 px-2 flex justify-center">
                {/* 4 Cards Side-by-Side with Generous Height to Display Full Text and Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8 justify-items-center w-full max-w-7xl">
                  {filteredPosts.map((post, idx) => (
                    <ReelCard
                      key={post.id}
                      post={post}
                      isActive={idx === activeReelIndex}
                      isAutoAdvanceActive={false} // in 4-card grid, keep stationary or focus
                      onAdvanceNext={handleAdvanceNext}
                      onAdvancePrev={handleAdvancePrev}
                      onLike={handleToggleLike}
                      onBookmark={handleToggleBookmark}
                      onOpenComments={setActiveCommentPost}
                      onOpenReport={setActiveReportPost}
                      onOpenAdvertiserProfile={(p) => setSelectedAdvertiserPost(p)}
                      isDesktopGrid={true}
                      isFollowed={followedAuthors.includes(post.authorName)}
                      onToggleFollow={() => handleToggleFollow(post.authorName)}
                      onInstallApp={handleOpenInstallApp}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* VIEW MODE 2: MOBILE VIEW & SINGLE-CARD REEL FOCUS VIEW (TikTok / Reels Style)
                 Vertical full-screen scrolling window utilizing 100% of space between the 2px top/bottom gaps */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                
                {/* Manual Navigation Arrows for Desktop Reel Mode */}
                <div className="hidden md:flex flex-col items-center gap-3 absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-30">
                  <button
                    onClick={handleAdvancePrev}
                    className="w-12 h-12 rounded-full bg-white hover:bg-blue-600 text-blue-900 hover:text-white border-2 border-blue-200 hover:border-blue-600 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                    title="البطاقة السابقة (سهم لأعلى)"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  <div className="text-center">
                    <span className="text-xs font-black text-slate-900 block">
                      {activeReelIndex + 1}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      من {filteredPosts.length}
                    </span>
                  </div>
                  <button
                    onClick={handleAdvanceNext}
                    className="w-12 h-12 rounded-full bg-white hover:bg-blue-600 text-blue-900 hover:text-white border-2 border-blue-200 hover:border-blue-600 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                    title="البطاقة التالية (سهم لأسفل)"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>

                {/* Vertical Reels Feed Card with Natural Shorts Slide Transition */}
                <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                  {currentReelPost && (
                    <motion.div
                      key={currentReelPost.id}
                      custom={slideDirection}
                      variants={shortsVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      drag="y"
                      dragDirectionLock
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={{ top: 0.7, bottom: 0.7 }}
                      onDragEnd={(_e, info) => {
                        const { offset, velocity } = info;
                        if (offset.y < -45 || velocity.y < -300) {
                          handleAdvanceNext();
                        } else if (offset.y > 45 || velocity.y > 300) {
                          handleAdvancePrev();
                        }
                      }}
                      className="w-full flex justify-center h-full touch-pan-y cursor-grab active:cursor-grabbing"
                    >
                      <ReelCard
                        post={currentReelPost}
                        isActive={true}
                        isAutoAdvanceActive={isAutoAdvanceActive}
                        onAdvanceNext={handleAdvanceNext}
                        onAdvancePrev={handleAdvancePrev}
                        onLike={handleToggleLike}
                        onBookmark={handleToggleBookmark}
                        onOpenComments={setActiveCommentPost}
                        onOpenReport={setActiveReportPost}
                        onOpenAdvertiserProfile={(p) => setSelectedAdvertiserPost(p)}
                        isDesktopGrid={false}
                        isFollowed={followedAuthors.includes(currentReelPost.authorName)}
                        onToggleFollow={() => handleToggleFollow(currentReelPost.authorName)}
                        onInstallApp={handleOpenInstallApp}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

      </main>

      {/* EXACT 2px Distance between Window Frame and Controls */}
      <div className="h-[2px] w-full shrink-0 bg-transparent" />

      {/* 2.5 Unified Search & Filter Bar (مربع البحث | الوظائف: بحث عن عامل وبحث عن عمل | السياسة | من نحن) */}
      <UnifiedSearchFilterBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalFilteredCount={filteredPosts.length}
        jobCount={jobPostsCount}
        seekerCount={seekerPostsCount}
        lastInteractedPost={lastInteractedPost}
        similarJobsCount={similarPosts.length}
        onOpenSimilarJobs={() => setIsSimilarJobsModalOpen(true)}
        isDesktopGrid={isDesktopGrid}
        setIsDesktopGrid={setIsDesktopGrid}
        isAutoAdvanceActive={isAutoAdvanceActive}
        setIsAutoAdvanceActive={setIsAutoAdvanceActive}
        onOpenAboutUs={() => handleOpenGlobalPrivacy('about')}
        onOpenPolicy={() => handleOpenGlobalPrivacy('policy')}
      />

      {/* 3. Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeCommentPost ? 'comments' : activeNavTab}
        onTabChange={(tab) => {
          if (tab === 'add') {
            setAddChoiceOpen(true);
          } else if (tab === 'comments') {
            setActiveCommentPost(currentReelPost);
          } else {
            setActiveNavTab(tab);
          }
        }}
        onOpenComments={() => {
          setActiveCommentPost(currentReelPost);
        }}
        commentsCount={currentReelPost ? (commentsMap[currentReelPost.id]?.length ?? currentReelPost.commentsCount) : 0}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenAddChoice={() => setAddChoiceOpen(true)}
      />

      {/* Small Choice Popup: "إضافة وظيفة" or "طلب وظيفة" with hidden 5-click dev portal */}
      <AddChoiceModal
        isOpen={addChoiceOpen}
        onClose={() => setAddChoiceOpen(false)}
        onSelectType={(type) => {
          setAddModalType(type);
          setAddModalOpen(true);
        }}
        onOpenDeveloperAuth={() => {
          setIsDeveloperAuthOpen(true);
        }}
      />

      {/* Secret Developer Authentication & Firebase Credentials Modal */}
      <DeveloperAuthModal
        isOpen={isDeveloperAuthOpen}
        onClose={() => setIsDeveloperAuthOpen(false)}
        onAuthenticated={() => {
          setIsDeveloperAuthOpen(false);
          setIsDeveloperDashboardOpen(true);
          triggerToast('تمت مطابقة بيانات المطور بنجاح وفتح لوحة التحكم');
        }}
      />

      {/* Developer Dashboard / Control Panel */}
      <DeveloperDashboardModal
        isOpen={isDeveloperDashboardOpen}
        onClose={() => setIsDeveloperDashboardOpen(false)}
        allPosts={posts}
        reports={reports}
        userProfile={userProfile}
        activeAccountEmail={activeAccountEmail}
        onDeleteJob={handleDeletePost}
        onResolveReport={(reportId) => {
          triggerToast(`تم تحديد البلاغ #${reportId} كمحلول`);
        }}
        onSelectPost={(post) => {
          setSelectedAdvertiserPost(post);
        }}
        onInspectApp={handleDeveloperInspectApp}
        onAddListing={handleAddDeveloperListing}
        onBatchAddListings={handleBatchAddDeveloperListings}
      />

      {/* 4. Interactive Comments / Q&A Modal with Top Bar for Liked and Saved listings */}
      <CommentsModal
        isOpen={Boolean(activeCommentPost)}
        post={activeCommentPost}
        comments={activeCommentPost ? commentsMap[activeCommentPost.id] || [] : []}
        allPosts={posts}
        followedAuthors={followedAuthors}
        onToggleFollow={handleToggleFollow}
        followersList={followersList}
        currentUserName={userProfile.name}
        activeNavTab="comments"
        onNavTabChange={(tab) => {
          setActiveCommentPost(null);
          setActiveNavTab(tab);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenAddChoice={() => {
          setActiveCommentPost(null);
          setAddChoiceOpen(true);
        }}
        onClose={() => {
          setActiveCommentPost(null);
          if (activeNavTab === 'comments') {
            setActiveNavTab('home');
          }
        }}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        onSelectPost={(selectedPost) => {
          const idx = filteredPosts.findIndex(p => p.id === selectedPost.id);
          if (idx !== -1) {
            setActiveReelIndex(idx);
          } else {
            // If filtered out, switch tab
            setActiveTab(selectedPost.type);
            const foundIdx = posts.findIndex(p => p.id === selectedPost.id);
            if (foundIdx !== -1) {
              setActiveReelIndex(foundIdx);
            }
          }
          setActiveCommentPost(null);
          if (activeNavTab === 'comments') {
            setActiveNavTab('home');
          }
        }}
        onToggleLike={handleToggleLike}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* 4.5 Report to Support Modal */}
      <ReportModal
        post={activeReportPost}
        isOpen={!!activeReportPost}
        onClose={() => setActiveReportPost(null)}
        onSubmitReport={handleSubmitReport}
      />

      {/* 5. Add Job / Add Job Request Modal */}
      <AddJobModal
        initialType={addModalType}
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateNewListing}
        activeNavTab="add"
        onNavTabChange={(tab) => {
          setAddModalOpen(false);
          setActiveNavTab(tab);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenAddChoice={() => {
          setAddModalOpen(false);
          setAddChoiceOpen(true);
        }}
      />

      {/* 6. Messages Modal */}
      <MessagesModal
        isOpen={activeNavTab === 'messages'}
        onClose={() => setActiveNavTab('home')}
        threads={chatThreads}
        onSendMessage={handleSendMessage}
        activeNavTab={activeNavTab}
        onNavTabChange={(tab) => {
          setActiveNavTab(tab);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenAddChoice={() => {
          setAddChoiceOpen(true);
        }}
      />

      {/* 7. Notifications Modal */}
      <NotificationsModal
        isOpen={activeNavTab === 'notifications'}
        onClose={() => setActiveNavTab('home')}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onSelectNotification={(jobId) => {
          if (jobId) {
            const idx = filteredPosts.findIndex(p => p.id === jobId);
            if (idx !== -1) {
              setActiveReelIndex(idx);
            }
          }
          setActiveNavTab('home');
        }}
        activeNavTab={activeNavTab}
        onNavTabChange={(tab) => {
          setActiveNavTab(tab);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenAddChoice={() => {
          setAddChoiceOpen(true);
        }}
        currentUserEmail={userProfile.connectedAccount?.email || ''}
        currentUserName={userProfile.name || ''}
      />

      {/* 8. Profile & Saved Items Modal */}
      <ProfileModal
        isOpen={activeNavTab === 'profile'}
        onClose={() => setActiveNavTab('home')}
        savedPosts={savedPosts}
        myPosts={myPosts}
        onSelectPost={(post) => {
          setActiveTab(post.type);
          const idx = posts.findIndex(p => p.id === post.id);
          if (idx !== -1) {
            setActiveReelIndex(idx);
          }
          setActiveNavTab('home');
        }}
        isAutoAdvanceActive={isAutoAdvanceActive}
        setIsAutoAdvanceActive={setIsAutoAdvanceActive}
        userProfile={userProfile}
        onUpdateUserProfile={handleUpdateUserProfile}
        onConnectAccount={handleConnectAccount}
        onDisconnectAccount={handleDisconnectAccount}
        activeNavTab={activeNavTab}
        onNavTabChange={(tab) => {
          setActiveNavTab(tab);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenAddChoice={() => {
          setAddChoiceOpen(true);
        }}
        followersList={followersList}
        followedAuthors={followedAuthors}
        onToggleFollow={handleToggleFollow}
        allPosts={posts}
        onDeletePost={handleDeletePost}
      />

      {/* 9. Advertiser Profile Modal (عرض تفاصيل المعلن، وصف الوظيفة، الهاتف، العنوان، وإعلاناته الأخرى) */}
      <AdvertiserProfileModal
        post={selectedAdvertiserPost}
        isOpen={!!selectedAdvertiserPost}
        onClose={() => setSelectedAdvertiserPost(null)}
        allPosts={posts}
        isFollowed={selectedAdvertiserPost ? followedAuthors.includes(selectedAdvertiserPost.authorName) : false}
        onToggleFollow={handleToggleFollow}
        onSelectPost={(post) => {
          setSelectedAdvertiserPost(null);
          setActiveTab(post.type);
          const idx = filteredPosts.findIndex(p => p.id === post.id);
          if (idx !== -1) {
            setActiveReelIndex(idx);
          }
        }}
        onOpenReport={(post) => setActiveReportPost(post)}
        onStartChat={handleStartChatWithAdvertiser}
        onInstallApp={handleOpenInstallApp}
      />

      {/* 10. Similar Jobs Modal (عرض الوظائف المشابهة للتي نالت إعجاب المستخدم أو قام بحفظها) */}
      <SimilarJobsModal
        isOpen={isSimilarJobsModalOpen}
        onClose={() => setIsSimilarJobsModalOpen(false)}
        referencePost={lastInteractedPost}
        similarPosts={similarPosts}
        onSelectPost={(post) => {
          setActiveTab(post.type);
          const idx = filteredPosts.findIndex(p => p.id === post.id);
          if (idx !== -1) {
            setActiveReelIndex(idx);
          }
        }}
        onLike={handleToggleLike}
        onBookmark={handleToggleBookmark}
        onOpenAdvertiserProfile={(p) => setSelectedAdvertiserPost(p)}
      />

      {/* 11. Global Privacy Policy & About Us Modal */}
      <PrivacyPolicyModal
        isOpen={isGlobalPrivacyOpen}
        onClose={() => setIsGlobalPrivacyOpen(false)}
        onAccept={() => {
          setIsGlobalPrivacyOpen(false);
          triggerToast('تم تسجيل موافقتك واعتمادك في وثيقة السياسات والـ 15 بنداً القانونية بنجاح');
        }}
        initialTab={globalPrivacyTab}
        allPosts={posts}
        userProfile={userProfile}
        activeAccountEmail={activeAccountEmail}
        onSelectPersonPost={(post) => {
          setSelectedAdvertiserPost(post);
          setIsGlobalPrivacyOpen(false);
        }}
      />

      {/* 12. Smart Interstitial Ad Modal (يظهر تلقائياً كل 5 إعلانات وظائف) */}
      <InterstitialAdModal
        isOpen={isInterstitialAdOpen}
        onClose={() => setIsInterstitialAdOpen(false)}
      />

      {/* 13. Rewarded Ad Modal 10 Seconds (يظهر عند النقر على واتساب أو نسخ رقم الهاتف) */}
      <RewardedAdModal
        isOpen={isRewardedAdOpen}
        triggerNotice={rewardedAdNotice}
        onClose={() => {
          setIsRewardedAdOpen(false);
          setRewardedAdCallback(null);
        }}
        onRewardCompleted={() => {
          setIsRewardedAdOpen(false);
          triggerToast('🎉 تم منحك 5 كوينات في رصيدك بنجاح!');
          if (rewardedAdCallback) {
            rewardedAdCallback();
            setRewardedAdCallback(null);
          }
        }}
      />

    </div>
  );
}
