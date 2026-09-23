import React, { useState } from 'react';
import { X, Send, ArrowRight, MessageSquare, CheckCheck, Clock } from 'lucide-react';
import { ChatThread, ActiveNavTab } from '../types';
import { BottomNav } from './BottomNav';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  onSendMessage: (threadId: string, text: string) => void;
  activeNavTab?: ActiveNavTab;
  onNavTabChange?: (tab: ActiveNavTab) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenAddChoice?: () => void;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({
  isOpen,
  onClose,
  threads,
  onSendMessage,
  activeNavTab = 'messages',
  onNavTabChange,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenAddChoice
}) => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threads[0]?.id || null);
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

  const currentThread = threads.find(t => t.id === activeThreadId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThreadId) return;
    onSendMessage(activeThreadId, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full h-full sm:h-[680px] sm:max-h-[92vh] sm:max-w-3xl bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-xl text-blue-700 hover:text-blue-900 hover:bg-blue-100/80 transition-colors flex items-center gap-1 font-bold text-xs"
              title="رجوع للصفحة السابقة"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden xs:inline">رجوع</span>
            </button>
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">الرسائل والمحادثات المباشرة</h2>
              <p className="text-xs text-blue-700 font-semibold">تواصل فوري مع أصحاب العمل والمتقدمين</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split Left Threads / Right Chat */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Threads Column */}
          <div className={`w-full sm:w-80 border-l border-slate-200 flex flex-col bg-slate-50 ${
            activeThreadId && 'hidden sm:flex'
          }`}>
            <div className="p-3 border-b border-slate-200 text-xs font-black text-slate-700">
              المحادثات النشطة ({threads.length})
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
              {threads.map((t) => {
                const isSelected = t.id === activeThreadId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`w-full p-3 text-right flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-white border-r-4 border-blue-600 shadow-sm' : 'hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={t.recipientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={t.recipientName}
                        className="w-10 h-10 rounded-full object-cover border border-blue-200"
                      />
                      {t.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {t.recipientName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{t.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-blue-700 font-bold truncate mt-0.5">{t.jobTitle}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Messages Column */}
          <div className={`flex-1 flex flex-col bg-white ${
            !activeThreadId && 'hidden sm:flex'
          }`}>
            {currentThread ? (
              <>
                {/* Active Thread Bar */}
                <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setActiveThreadId(null)}
                      className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <img
                      src={currentThread.recipientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={currentThread.recipientName}
                      className="w-8 h-8 rounded-full object-cover border border-blue-200"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        {currentThread.recipientName}
                      </h4>
                      <p className="text-[10px] text-blue-700 font-semibold truncate max-w-[200px]">
                        بخصوص: {currentThread.jobTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {currentThread.messages.map((m) => {
                    const isMe = m.sender === 'me';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1 flex items-center gap-1 font-medium">
                          {m.time}
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-600" />}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="اكتب ردك المباشر هنا..."
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl font-black shadow-md transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
                <p className="text-sm font-bold text-slate-700">اختر محادثة من القائمة للبدء</p>
              </div>
            )}
          </div>

        </div>

        {/* Integrated Bottom Navigation Bar: Enables navigation across all sections */}
        {onNavTabChange && (
          <div className="shrink-0 border-t border-slate-200 bg-white">
            <BottomNav
              activeTab={activeNavTab}
              onTabChange={(tab) => {
                if (tab === 'messages') return;
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
  );
};
