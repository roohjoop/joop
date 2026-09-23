export type ListingType = 'job' | 'seeker';

export interface JobPost {
  id: string;
  type: ListingType;
  title: string;
  category: string;
  salary: string;
  location: string;
  country?: string;
  countryCode?: string;
  experience: string;
  description: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  authorBio?: string;
  authorPhone?: string;
  authorAddress?: string;
  authorEmail?: string;
  authorWebsite?: string;
  backdropImage: string;
  likesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  commentsCount: number;
  whatsappNumber: string;
  whatsappLink?: string;
  tags: string[];
  createdAt: string;
  verified?: boolean;
  workType?: 'دوام كامل' | 'دوام جزئي' | 'عن بعد' | 'عمل حر' | 'عاجل';
  creatorEmail?: string;
}

export interface FollowerUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  city?: string;
  followedAt: string;
  phone?: string;
  whatsappNumber?: string;
  postsCount?: number;
}

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  bio: string;
  verified: boolean;
  email?: string;
  website?: string;
  company?: string;
  whatsappNumber?: string;
  followersCount?: number;
  followingCount?: number;
  // User Account Connection & Role Selection
  userIntent?: 'employer' | 'seeker'; // معلن عن عمل أو يبحث عن عمل
  connectedAccount?: {
    email: string;
    provider: 'google';
    connectedAt: string;
    // Private Google metadata stored only for data link / verification without being shown publicly
    googleAccountId?: string;
    isVerified: boolean;
  };
  coinsBalance?: number;
  d1SyncId?: string;
  crossPlatformLinked?: boolean;
}

export const EMPTY_GUEST_PROFILE: UserProfile = {
  name: '',
  role: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  phone: '',
  whatsapp: '',
  address: '',
  city: '',
  country: 'مصر',
  bio: '',
  verified: false
};

export interface CommentItem {
  id: string;
  jobId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

export interface ChatThread {
  id: string;
  jobId: string;
  jobTitle: string;
  recipientName: string;
  recipientAvatar: string;
  recipientRole: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'job' | 'like' | 'comment' | 'message';
  jobId?: string;
}

export interface ReportItem {
  id: string;
  jobId: string;
  jobTitle: string;
  authorName: string;
  reason: string;
  details?: string;
  contactEmailOrPhone?: string;
  createdAt: string;
  status: 'pending' | 'reviewed';
}

export type ActiveNavTab = 'home' | 'comments' | 'messages' | 'add' | 'notifications' | 'profile';
