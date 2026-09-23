import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  Heart, 
  MessageCircle, 
  HelpCircle, 
  Bookmark, 
  ExternalLink, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  ArrowRight,
  UserCheck,
  UserPlus,
  Users,
  Check,
  Phone,
  Sparkles,
  Search,
  Filter,
  User,
  ShieldCheck
} from 'lucide-react';
import { JobPost, CommentItem, ActiveNavTab, FollowerUser } from '../types';
import { BottomNav } from './BottomNav';
import { TopBannerAd } from './TopBannerAd';

// Authentic WhatsApp SVG Logo
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.49 0-2.95-.4-4.22-1.15l-.3-.18-3.13.82.83-3.05-.2-.31a8.164 8.164 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.188 8.188 0 0 1 2.41 5.83c.01 4.54-3.69 8.24-8.21 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32z"/>
  </svg>
);

interface CommentsModalProps {
  isOpen: boolean;
  post: JobPost | null;
  comments: CommentItem[];
  allPosts?: JobPost[];
  followedAuthors?: string[];
  followersList?: FollowerUser[];
  currentUserName?: string;
  onToggleFollow?: (authorName: string) => void;
  onClose: () => void;
  onAddComment: (jobId: string, text: string) => void;
  onLikeComment: (commentId: string) => void;
  onSelectPost?: (post: JobPost) => void;
  onToggleLike?: (jobId: string) => void;
  onToggleBookmark?: (jobId: string) => void;
  activeNavTab?: ActiveNavTab;
  onNavTabChange?: (tab: ActiveNavTab) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenAddChoice?: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  post,
  comments,
  allPosts = [],
  followedAuthors = [],
  followersList = [],
  currentUserName = '',
  onToggleFollow,
  onClose,
  onAddComment,
  onLikeComment,
  onSelectPost,
  onToggleLike,
  onToggleBookmark,
  activeNavTab = 'comments',
  onNavTabChange,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenAddChoice
}) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'followers' | 'following' | 'liked' | 'saved'>('comments');
  const [likedFilter, setLikedFilter] = useState<'all' | 'job' | 'seeker'>('all');
  const [likedSearch, setLikedSearch] = useState('');
  const [newComment, setNewComment] = useState('');

  // Current live post synced with allPosts
  const currentPost = useMemo(() => {
    if (!post) return null;
    return allPosts.find(p => p.id === post.id) || post;
  }, [post, allPosts]);

  // Filter all raw liked posts
  const rawLikedPosts = useMemo(() => allPosts.filter(p => p.isLiked), [allPosts]);
  
  // Filtered liked posts by tab and search
  const likedPosts = useMemo(() => {
    return rawLikedPosts.filter(p => {
      if (likedFilter !== 'all' && p.type !== likedFilter) return false;
      if (likedSearch.trim()) {
        const q = likedSearch.trim().toLowerCase();
        return p.title.toLowerCase().includes(q) || 
               p.category.toLowerCase().includes(q) || 
               p.authorName.toLowerCase().includes(q) ||
               p.location.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rawLikedPosts, likedFilter, likedSearch]);

  // Filter all saved posts
  const savedPosts = useMemo(() => allPosts.filter(p => p.isSaved), [allPosts]);

  // Posts from followed authors
  const followedPosts = useMemo(() => {
    return allPosts.filter(p => followedAuthors.includes(p.authorName));
  }, [allPosts, followedAuthors]);

  // Unique profiles of followed authors
  const followedProfiles = useMemo(() => {
    const map = new Map<string, { authorName: string; authorRole: string; authorAvatar: string; phone: string; count: number; verified?: boolean }>();
    allPosts.forEach(p => {
      if (followedAuthors.includes(p.authorName)) {
        if (!map.has(p.authorName)) {
          map.set(p.authorName, {
            authorName: p.authorName,
            authorRole: p.authorRole,
            authorAvatar: p.authorAvatar,
            phone: p.authorPhone || p.whatsappNumber || '',
            count: 1,
            verified: p.verified
          });
        } else {
          const entry = map.get(p.authorName)!;
          entry.count += 1;
        }
      }
    });
    return Array.from(map.values());
  }, [allPosts, followedAuthors]);

  // Suggested profiles (not followed yet)
  const suggestedProfiles = useMemo(() => {
    const map = new Map<string, { authorName: string; authorRole: string; authorAvatar: string; phone: string; count: number; verified?: boolean }>();
    allPosts.forEach(p => {
      if (!followedAuthors.includes(p.authorName)) {
        if (!map.has(p.authorName)) {
          map.set(p.authorName, {
            authorName: p.authorName,
            authorRole: p.authorRole,
            authorAvatar: p.authorAvatar,
            phone: p.authorPhone || p.whatsappNumber || '',
            count: 1,
            verified: p.verified
          });
        } else {
          const entry = map.get(p.authorName)!;
          entry.count += 1;
        }
      }
    });
    return Array.from(map.values()).slice(0, 5);
  }, [allPosts, followedAuthors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentPost) return;
    onAddComment(currentPost.id, newComment.trim());
    setNewComment('');
  };

  const handlePostClick = (targetPost: JobPost) => {
    if (onSelectPost) {
      onSelectPost(targetPost);
    }
  };

  const openWhatsApp = (phone: string, title?: string) => {
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const textMsg = encodeURIComponent(
      title ? `السلام عليكم، أتواصل معكم بخصوص: "${title}".` : 'السلام عليكم ورحمة الله.'
    );
    window.open(`https://wa.me/${rawDigits}?text=${textMsg}`, '_blank', 'noopener,noreferrer');
  };

  // Safe early exit AFTER all hooks have executed unconditionally
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full h-full sm:h-[640px] sm:max-h-[92vh] sm:max-w-xl max-w-full bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top 50px Banner Ad in Comments Modal */}
        <TopBannerAd />

        {/* Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-xl text-blue-700 hover:text-blue-900 hover:bg-blue-100/80 transition-colors flex items-center gap-1 font-bold text-xs"
              title="رجوع للصفحة السابقة"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden xs:inline">رجوع</span>
            </button>

            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">قسم التعليقات والتفاعل الشخصي</h3>
              <p className="text-[11px] text-blue-700 font-bold truncate max-w-xs">{post.title}</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors shrink-0"
            title="إغلاق (X)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Private User Status & Followers/Following Bar:
            "يرجى العلم ان صفحه التعليقات هي صفحه مخصصه للمستخدمين ولذلك يجب عدم عرض هذه الصفحه للعامه
             يكون لكل مستخدم صفحته الخاصه فيجب عدم ظهور صوره المستخدم نفسه وايضا يجب عدم ظهور زر المتابعه
             في هذه الصفحه فقط يتمكن من رؤيه عدد المتابعين الخاصين به فبدلا من ظهور زر المتابعه يظهر متابع او اتابع
             لكي يعرف كم شخص يتابعه وهو يتابع كم شخص ايضا"
        */}
        <div className="px-3 py-2.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-blue-50/40 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Private User Badge without picture */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">
                  مساحتي التفاعلية الخاصة
                </span>
                <span className="text-[10px] text-slate-500 font-bold block truncate">
                  إحصائيات المتابعين وشبكتي المهنية
                </span>
              </div>
            </div>

            {/* Interactive Followers & Following Counters:
                "فبدلا من ظهور زر المتابعه يظهر متابع او اتابع لكي يعرف كم شخص يتابعه وهو يتابع كم شخص ايضا"
            */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1. زر / شارة: المتابعون (Followers) */}
              <button
                onClick={() => setActiveTab('followers')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs border ${
                  activeTab === 'followers'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-300'
                    : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200'
                }`}
                title="عرض جميع الأشخاص الذين يتابعون حسابك"
              >
                <Users className="w-3.5 h-3.5" />
                <span>المتابعون:</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[11px] font-black ${
                  activeTab === 'followers' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {followersList.length}
                </span>
              </button>

              {/* 2. زر / شارة: أتابع (Following) */}
              <button
                onClick={() => setActiveTab('following')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs border ${
                  activeTab === 'following'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25 ring-2 ring-indigo-300'
                    : 'bg-white hover:bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}
                title="عرض جميع المعلنين والأشخاص الذين تتابعهم"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>أتابع:</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[11px] font-black ${
                  activeTab === 'following' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {followedAuthors.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs inside Comments Section: [التعليقات] | [المتابعون] | [من أتابعهم] | [أعجبني] | [المحفوظات] */}
        <div className="px-2.5 sm:px-3 pt-2 pb-1.5 border-b border-slate-200 bg-white shadow-xs shrink-0">
          <div className="grid grid-cols-5 gap-1 bg-slate-100/90 p-1 rounded-xl">
            {/* Tab 1: Comments */}
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
                activeTab === 'comments'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MessageCircle className="w-3 h-3 shrink-0" />
              <span>التعليقات</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${
                activeTab === 'comments' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {comments.length}
              </span>
            </button>

            {/* Tab 2: Followers (المتابعون) */}
            <button
              onClick={() => setActiveTab('followers')}
              className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
                activeTab === 'followers'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3 h-3 shrink-0" />
              <span>متابعون</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${
                activeTab === 'followers' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {followersList.length}
              </span>
            </button>

            {/* Tab 3: Following (أتابع) */}
            <button
              onClick={() => setActiveTab('following')}
              className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
                activeTab === 'following'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-3 h-3 shrink-0" />
              <span>أتابع</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${
                activeTab === 'following' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {followedAuthors.length}
              </span>
            </button>

            {/* Tab 4: Liked (أعجبني) */}
            <button
              onClick={() => setActiveTab('liked')}
              className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
                activeTab === 'liked'
                  ? 'bg-white text-red-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-red-600 hover:bg-slate-200/60'
              }`}
            >
              <Heart className={`w-3 h-3 shrink-0 ${activeTab === 'liked' ? 'fill-red-600' : ''}`} />
              <span>أعجبني</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${
                activeTab === 'liked' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {rawLikedPosts.length}
              </span>
            </button>

            {/* Tab 5: Saved (حفظ) */}
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
                activeTab === 'saved'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60'
              }`}
            >
              <Bookmark className={`w-3 h-3 shrink-0 ${activeTab === 'saved' ? 'fill-emerald-600' : ''}`} />
              <span>حفظ</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-black ${
                activeTab === 'saved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {savedPosts.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1 Body: Comments List with Follow Button next to other commenters */}
        {activeTab === 'comments' && (
          <>
            {/* Info banner */}
            <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 text-xs text-blue-900 shrink-0">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span>يمكنك طرح أي استفسار يتعلق بالوظيفة الحالية وسيجيبك صاحب الإعلان مباشرة.</span>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageCircle className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
                  <p className="text-sm font-bold text-slate-800">لا توجد أسئلة أو استفسارات حتى الآن</p>
                  <p className="text-xs text-slate-500 mt-1">كن أول من يطرح سؤالاً لصاحب الإعلان!</p>
                </div>
              ) : (
                comments.map((item) => {
                  const isCommentAuthorFollowed = followedAuthors.includes(item.userName);
                  const isMyself = currentUserName && item.userName.toLowerCase() === currentUserName.toLowerCase();

                  return (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200"
                    >
                      <img
                        src={item.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={item.userName}
                        className="w-8 h-8 rounded-full object-cover border border-blue-200 shrink-0 shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {item.userName}
                            </span>
                            {isMyself && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">أنت</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.createdAt}
                            </span>

                            {/* Follow Button for Other Commenters across windows ("اما زر المتابعه قم باضافته على جميع النوافذ لكي يتمكن اي مستخدم من متابعه المستخدمين الاخرين") */}
                            {!isMyself && onToggleFollow && (
                              <button
                                onClick={() => onToggleFollow(item.userName)}
                                className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 transition-all shadow-xs ${
                                  isCommentAuthorFollowed
                                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                                title={isCommentAuthorFollowed ? 'إلغاء المتابعة' : 'متابعة هذا المستخدم'}
                              >
                                {isCommentAuthorFollowed ? (
                                  <>
                                    <UserCheck className="w-2.5 h-2.5" />
                                    <span>أتابعه</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-2.5 h-2.5" />
                                    <span>متابعة</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 mt-1 leading-relaxed">
                          {item.text}
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => onLikeComment(item.id)}
                            className={`text-[11px] flex items-center gap-1 font-bold ${
                              item.isLiked ? 'text-red-600' : 'text-slate-500 hover:text-red-600'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${item.isLiked ? 'fill-current' : ''}`} />
                            <span>{item.likes} إعجاب</span>
                          </button>
                          <span className="text-[10px] text-blue-700 font-bold cursor-pointer hover:underline">
                            رد
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب استفسارك هنا بكل وضوح..."
                  className="flex-1 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white p-2.5 rounded-xl font-black transition-all shadow-md shrink-0 cursor-pointer"
                  title="إرسال"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}

        {/* Tab 2 Body: Dedicated Followers Window ("نافذة خاصة بالمتابعين لكي يتمكن من رؤية جميع المتابعين") */}
        {activeTab === 'followers' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <Users className="w-4 h-4 text-blue-600" />
                <span>قائمة المتابعين لحسابك ({followersList.length} متابع)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">الأشخاص الذين قاموا بمتابعتك</span>
            </div>

            {followersList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <Users className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
                <h4 className="text-xs sm:text-sm font-black text-slate-800">لا يوجد متابعون حتى الآن</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  شارك إعلاناتك ووظائفك لجذب المهنيين وأصحاب الأعمال لمتابعة حسابك
                </p>
              </div>
            ) : (
              <div className="space-y-2">
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
                          <h4 className="text-xs font-black text-slate-900 truncate">
                            {follower.name}
                          </h4>
                          <p className="text-[10px] text-blue-700 font-bold truncate">
                            {follower.role}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                            {follower.city ? `${follower.city} • ` : ''}تابعك: {follower.followedAt}
                          </p>
                        </div>
                      </div>

                      {/* Follow Back Action */}
                      <button
                        onClick={() => onToggleFollow && onToggleFollow(follower.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95 shadow-xs shrink-0 ${
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

        {/* Tab 3 Body: Following Window ("وجميع الناس اللي تابعهم") */}
        {activeTab === 'following' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {/* Header info */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>المعلنون والشركات التي تتابعهم ({followedAuthors.length})</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-700">
                {followedPosts.length} وظيفة متاحة
              </span>
            </div>

            {followedAuthors.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-10 px-4 bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">لم تقم بمتابعة أي معلن حتى الآن</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    تابع المعلنين والشركات المفضلة لتصلك أحدث وظائفهم وفرصهم المهنية فور نشرها.
                  </p>
                </div>

                {/* Suggested Advertisers to follow */}
                {suggestedProfiles.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>معلنون مقترحون للمتابعة:</span>
                    </div>

                    <div className="space-y-2">
                      {suggestedProfiles.map((adv) => (
                        <div
                          key={adv.authorName}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={adv.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={adv.authorName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-black text-slate-900 truncate">{adv.authorName}</h5>
                              <p className="text-[10px] text-slate-500 font-bold truncate">{adv.authorRole}</p>
                              <span className="text-[10px] text-indigo-700 font-semibold">{adv.count} إعلان متاح</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onToggleFollow?.(adv.authorName)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>متابعة</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Followed Advertisers Profiles */}
                <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-xs space-y-2">
                  <span className="text-[11px] font-black text-slate-700 block">المعلنون المتابعون:</span>
                  <div className="space-y-2">
                    {followedProfiles.map((adv) => (
                      <div
                        key={adv.authorName}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-indigo-50/40 border border-indigo-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={adv.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={adv.authorName}
                            className="w-9 h-9 rounded-xl object-cover border border-indigo-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-900 truncate block">{adv.authorName}</span>
                            <span className="text-[10px] text-slate-500 font-medium truncate block">{adv.authorRole}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {adv.phone && (
                            <button
                              onClick={() => openWhatsApp(adv.phone)}
                              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-xs"
                              title="تواصل واتساب"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                            </button>
                          )}
                          <button
                            onClick={() => onToggleFollow?.(adv.authorName)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-red-400 text-slate-700 hover:text-red-600 text-[11px] font-bold transition-all"
                            title="إلغاء المتابعة"
                          >
                            إلغاء المتابعة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Jobs from Followed Advertisers */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      وظائف وإعلانات من تتابعهم ({followedPosts.length}):
                    </span>
                    <span className="text-[11px] text-slate-500">انقر لعرض أي إعلان</span>
                  </div>

                  {followedPosts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handlePostClick(item)}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={item.authorName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-900 group-hover:text-indigo-700 transition-colors truncate block">
                              {item.authorName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium truncate block">{item.authorRole}</span>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black shrink-0 ${
                          item.type === 'job' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {item.type === 'job' ? 'فرصة عمل' : 'طلب عمل'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-indigo-700">
                          <Briefcase className="w-3 h-3 text-indigo-600" />
                          {item.category}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-emerald-700">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          {item.salary}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4 Body: Liked (أعجبني) */}
        {activeTab === 'liked' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-black text-slate-900">
                الإعلانات التي أبدت إعجابك بها ({rawLikedPosts.length})
              </span>
            </div>

            {likedPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Heart className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
                <p className="text-sm font-bold text-slate-800">لا توجد إعلانات معجب بها حالياً</p>
              </div>
            ) : (
              likedPosts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePostClick(item)}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-red-300 shadow-xs cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-900 truncate">{item.title}</h4>
                    <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5">
                      <Heart className="w-3 h-3 fill-current" />
                      {item.likesCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 font-bold mt-0.5">{item.category} • {item.salary}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5 Body: Saved (المحفوظات) */}
        {activeTab === 'saved' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-black text-slate-900">
                الإعلانات المحفوظة في مفضلتك ({savedPosts.length})
              </span>
            </div>

            {savedPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Bookmark className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
                <p className="text-sm font-bold text-slate-800">لا توجد إعلانات محفوظة حتى الآن</p>
              </div>
            ) : (
              savedPosts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePostClick(item)}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs cursor-pointer transition-all"
                >
                  <h4 className="text-xs font-black text-slate-900 truncate">{item.title}</h4>
                  <p className="text-[11px] text-blue-700 font-bold mt-0.5">{item.category} • {item.salary}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{item.location}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Integrated Bottom Navigation Bar */}
        {onNavTabChange && (
          <div className="shrink-0 border-t border-slate-200 bg-white">
            <BottomNav
              activeTab={activeNavTab}
              onTabChange={(tab) => {
                if (tab === 'comments') return;
                onNavTabChange(tab);
                onClose();
              }}
              commentsCount={comments.length}
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
  );
};
