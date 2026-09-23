import React, { useState, useEffect } from 'react';
import { X, Bell, Briefcase, Heart, MessageCircle, Check, Sparkles, ArrowRight, Headphones, ChevronLeft, ShieldCheck, Zap } from 'lucide-react';
import { ActiveNavTab } from '../types';
import { BottomNav } from './BottomNav';
import { TopBannerAd } from './TopBannerAd';
import { NotificationItem } from '../types';
import { DirectSupportModal } from './DirectSupportModal';
import { initializeFCM } from '../firebase/messaging';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (jobId?: string) => void;
  activeNavTab?: ActiveNavTab;
  onNavTabChange?: (tab: ActiveNavTab) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenAddChoice?: () => void;
  currentUserEmail?: string;
  currentUserName?: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  activeNavTab = 'notifications',
  onNavTabChange,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenAddChoice,
  currentUserEmail = '',
  currentUserName = ''
}) => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isActivatingPush, setIsActivatingPush] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, [isOpen]);

  const handleEnablePush = async () => {
    setIsActivatingPush(true);
    try {
      const token = await initializeFCM();
      if (token) {
        setPushStatus('granted');
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        setPushStatus(Notification.permission);
      }
    } catch (err) {
      console.warn('Error enabling push:', err);
    } finally {
      setIsActivatingPush(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200" onClick={onClose}>
        <div 
          className="w-full h-full sm:h-[650px] sm:max-h-[92vh] sm:max-w-xl max-w-full bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top 50px Banner Ad in Notifications Modal */}
          <TopBannerAd />

          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-red-50/70 border-b border-red-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1.5 -mr-1 rounded-xl text-red-700 hover:text-red-900 hover:bg-red-100/80 transition-colors flex items-center gap-1 font-bold text-xs"
                title="رجوع للصفحة السابقة"
              >
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                <span className="hidden xs:inline">رجوع</span>
              </button>
              <div className="w-9 h-9 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">مركز الإشعارات</h2>
                <p className="text-xs text-red-700 font-semibold">تحديثات الوظائف والتفاعل المباشر</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold px-2 py-1 rounded-lg hover:bg-white transition-colors"
              >
                تحديد الكل كمقروء
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dedicated Direct Support Window at the top (نافذة مخصصة للدعم الفني المباشر عند النقر عليها تفتح نافذة الدعم) */}
          <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border-b border-blue-100 shrink-0">
            <div 
              onClick={() => setIsSupportModalOpen(true)}
              className="bg-white hover:bg-blue-50/60 p-3 rounded-2xl border-2 border-blue-200 hover:border-blue-400 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <Headphones className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" title="متواجد للرد" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      نافذة التواصل مع الدعم الفني المباشر
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[9.5px] px-2 py-0.5 rounded-full font-black border border-emerald-300">
                      رد فوري
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 font-medium mt-0.5">
                    انقر هنا لإرسال استفسار أو مشكلة مباشرة لإدارة المنصة بسرية تامة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span>تواصل الآن</span>
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Web Push (FCM) Integration Banner with VAPID Key */}
          <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-slate-900">إشعارات الويب المباشرة (FCM)</span>
                  {pushStatus === 'granted' ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-black border border-emerald-300 flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>نشطة ومفعلة</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.2 rounded font-black border border-amber-300">
                      بانتظار الإذن
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 truncate">
                  {pushStatus === 'granted' 
                    ? 'جهازك متصل بخدمة Firebase Cloud Messaging لاستقبال التنبيهات الفورية'
                    : 'فعّل الإشعارات لتصلك تحديثات الوظائف والرسائل مباشرة على هاتفك ومتصفحك'}
                </p>
              </div>
            </div>

            {pushStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={isActivatingPush}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-sm shrink-0 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-3 h-3 stroke-[2.5]" />
                <span>{isActivatingPush ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-bold text-slate-700">لا توجد إشعارات جديدة حالياً</p>
              <p className="text-xs text-slate-500 mt-1">ستصلك تنبيهات فور تفاعل أصحاب العمل أو إرسال استفسارات</p>
            </div>
          ) : (
            notifications.map((item) => {
              const getIcon = () => {
                switch (item.type) {
                  case 'job':
                    return <Briefcase className="w-4 h-4 text-blue-600" />;
                  case 'like':
                    return <Heart className="w-4 h-4 text-red-600 fill-current" />;
                  case 'comment':
                    return <MessageCircle className="w-4 h-4 text-emerald-600" />;
                  case 'message':
                    return <Sparkles className="w-4 h-4 text-amber-600" />;
                  default:
                    return <Briefcase className="w-4 h-4 text-blue-600" />;
                }
              };

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.jobId) onSelectNotification(item.jobId);
                  }}
                  className={`p-3 rounded-2xl transition-colors cursor-pointer flex items-start gap-3 ${
                    item.read ? 'hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 shadow-sm">
                    {getIcon()}
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Integrated Bottom Navigation Bar: Enables navigation across all sections */}
        {onNavTabChange && (
          <div className="shrink-0 border-t border-slate-200 bg-white">
            <BottomNav
              activeTab={activeNavTab}
              onTabChange={(tab) => {
                if (tab === 'notifications') return;
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

    {/* Direct Support Chat Modal */}
    <DirectSupportModal
      isOpen={isSupportModalOpen}
      onClose={() => setIsSupportModalOpen(false)}
      currentUserEmail={currentUserEmail}
      currentUserName={currentUserName}
    />
  </>
  );
};
