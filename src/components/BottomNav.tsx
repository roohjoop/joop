import React from 'react';
import { Home, MessageCircle, Plus, Bell, User } from 'lucide-react';
import { ActiveNavTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  unreadNotificationsCount: number;
  unreadMessagesCount?: number;
  commentsCount?: number;
  onOpenAddChoice: () => void;
  onOpenComments?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadNotificationsCount,
  unreadMessagesCount = 0,
  commentsCount = 0,
  onOpenAddChoice,
  onOpenComments
}) => {
  const isCommentsActive = activeTab === 'comments' || activeTab === 'messages';

  const handleCommentsClick = () => {
    if (onOpenComments) {
      onOpenComments();
    } else {
      onTabChange('comments');
    }
  };

  return (
    <nav className="relative z-40 bg-white/95 backdrop-blur-xl border-t border-x border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-2xl sm:rounded-t-3xl safe-area-bottom shrink-0 h-[62px] flex items-center transition-all">
      {/* Subtle top glossy highlight border */}
      <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

      <div className="w-full max-w-md md:max-w-xl mx-auto px-3 sm:px-6 flex items-center justify-between relative">
        
        {/* 1. Home (الرئيسية) - Active Color: Emerald / Cyan Vibrant Theme */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center min-w-[54px] py-1 transition-all duration-200 cursor-pointer group active:scale-95 ${
            activeTab === 'home' 
              ? 'text-emerald-600 scale-105' 
              : 'text-slate-500 hover:text-emerald-600'
          }`}
          title="الصفحة الرئيسية"
        >
          <div className="relative p-1 rounded-xl group-hover:bg-emerald-50/70 transition-colors">
            <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'stroke-[2.8] text-emerald-600 scale-110 drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]' : 'stroke-[1.8]'}`} />
          </div>
          <span className={`text-[11px] font-black mt-0.5 tracking-tight ${activeTab === 'home' ? 'text-emerald-700' : 'text-slate-600'}`}>
            الرئيسية
          </span>
          {activeTab === 'home' && (
            <span className="w-2 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] mt-0.5 animate-in zoom-in" />
          )}
        </button>

        {/* 2. Comments (التعليقات) - Active Color: Rose / Ruby Vibrant Theme */}
        <button
          onClick={handleCommentsClick}
          className={`relative flex flex-col items-center justify-center min-w-[54px] py-1 transition-all duration-200 cursor-pointer group active:scale-95 ${
            isCommentsActive 
              ? 'text-rose-600 scale-105' 
              : 'text-slate-500 hover:text-rose-600'
          }`}
          title="التعليقات والاستفسارات"
        >
          <div className="relative p-1 rounded-xl group-hover:bg-rose-50/70 transition-colors">
            <MessageCircle className={`w-5 h-5 transition-transform ${isCommentsActive ? 'stroke-[2.8] text-rose-600 scale-110 drop-shadow-[0_2px_4px_rgba(244,63,94,0.3)]' : 'stroke-[1.8]'}`} />
            {(commentsCount > 0 || unreadMessagesCount > 0) && (
              <span className="absolute -top-0.5 -right-1 bg-rose-600 text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-white shadow-xs">
                {commentsCount || unreadMessagesCount}
              </span>
            )}
          </div>
          <span className={`text-[11px] font-black mt-0.5 tracking-tight ${isCommentsActive ? 'text-rose-700' : 'text-slate-600'}`}>
            التعليقات
          </span>
          {isCommentsActive && (
            <span className="w-2 h-1 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] mt-0.5 animate-in zoom-in" />
          )}
        </button>

        {/* 3. Add/Plus (إضافة) - 3D Center Button Protruding Exactly 2px Outside Top Border */}
        <div className="relative -top-[2px] flex flex-col items-center justify-center shrink-0 min-w-[54px]">
          <button
            onClick={onOpenAddChoice}
            className="group relative flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 active:translate-y-0.5"
            title="إضافة وظيفة أو طلب عمل"
          >
            {/* 3D Tactile Glowing Curved Button */}
            <div className="w-11 h-11 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-rose-500 via-red-600 to-red-700 flex items-center justify-center text-white shadow-[0_4px_10px_rgba(225,29,72,0.35),0_1.5px_3px_rgba(0,0,0,0.18),inset_0_2px_1.5px_rgba(255,255,255,0.7),inset_0_-2.5px_3px_rgba(0,0,0,0.35)] ring-2 ring-white/95 border border-rose-300/50 group-hover:scale-105 group-hover:brightness-105 transition-all duration-200 relative overflow-hidden">
              {/* Glossy top dome reflection for 3D effect */}
              <div className="absolute top-0 inset-x-1 h-[48%] bg-gradient-to-b from-white/50 via-white/15 to-transparent pointer-events-none rounded-t-full" />
              {/* Bottom depth shade for 3D curvature */}
              <div className="absolute bottom-0 inset-x-1 h-[30%] bg-gradient-to-t from-black/25 to-transparent pointer-events-none rounded-b-full" />
              <Plus className="w-5 h-5 stroke-[3.2] text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] group-hover:rotate-90 transition-transform duration-300 relative z-10" />
            </div>
          </button>
          <span className="text-[10.5px] font-black text-slate-800 mt-0.5 tracking-tight drop-shadow-xs">
            إضافة
          </span>
        </div>

        {/* 4. Notifications (الإشعارات) - Active Color: Amber / Gold Vibrant Theme */}
        <button
          onClick={() => onTabChange('notifications')}
          className={`relative flex flex-col items-center justify-center min-w-[54px] py-1 transition-all duration-200 cursor-pointer group active:scale-95 ${
            activeTab === 'notifications' 
              ? 'text-amber-500 scale-105' 
              : 'text-slate-500 hover:text-amber-500'
          }`}
          title="الإشعارات والتنبيهات"
        >
          <div className="relative p-1 rounded-xl group-hover:bg-amber-50/70 transition-colors">
            <Bell className={`w-5 h-5 transition-transform ${activeTab === 'notifications' ? 'stroke-[2.8] text-amber-500 scale-110 drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]' : 'stroke-[1.8]'}`} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <span className={`text-[11px] font-black mt-0.5 tracking-tight ${activeTab === 'notifications' ? 'text-amber-600' : 'text-slate-600'}`}>
            الإشعارات
          </span>
          {activeTab === 'notifications' && (
            <span className="w-2 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] mt-0.5 animate-in zoom-in" />
          )}
        </button>

        {/* 5. Profile (حسابي) - Active Color: Royal Indigo / Violet Vibrant Theme */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center min-w-[54px] py-1 transition-all duration-200 cursor-pointer group active:scale-95 ${
            activeTab === 'profile' 
              ? 'text-indigo-600 scale-105' 
              : 'text-slate-500 hover:text-indigo-600'
          }`}
          title="حسابي الشخصي"
        >
          <div className="relative p-1 rounded-xl group-hover:bg-indigo-50/70 transition-colors">
            <User className={`w-5 h-5 transition-transform ${activeTab === 'profile' ? 'stroke-[2.8] text-indigo-600 scale-110 drop-shadow-[0_2px_4px_rgba(99,102,241,0.3)]' : 'stroke-[1.8]'}`} />
          </div>
          <span className={`text-[11px] font-black mt-0.5 tracking-tight ${activeTab === 'profile' ? 'text-indigo-700' : 'text-slate-600'}`}>
            حسابي
          </span>
          {activeTab === 'profile' && (
            <span className="w-2 h-1 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)] mt-0.5 animate-in zoom-in" />
          )}
        </button>

      </div>
    </nav>
  );
};
