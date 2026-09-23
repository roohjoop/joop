import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Headphones, 
  ShieldCheck, 
  Lock, 
  Clock, 
  User, 
  CheckCircle2, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { 
  SupportTicket, 
  getUserSupportTickets, 
  sendUserSupportMessage 
} from '../utils/supportManager';

interface DirectSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  currentUserName?: string;
}

export const DirectSupportModal: React.FC<DirectSupportModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail = '',
  currentUserName = ''
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback identifier if user doesn't have an email connected yet
  const activeEmail = currentUserEmail || 'guest-user@shoghlpro.local';
  const activeName = currentUserName || 'مستخدم المنصة';

  const loadTickets = () => {
    const userTickets = getUserSupportTickets(activeEmail);
    setTickets(userTickets);
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen, activeEmail]);

  useEffect(() => {
    const handleUpdate = () => loadTickets();
    window.addEventListener('rooh_support_tickets_updated', handleUpdate);
    return () => window.removeEventListener('rooh_support_tickets_updated', handleUpdate);
  }, [activeEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tickets]);

  if (!isOpen) return null;

  const currentTicket = tickets[0];
  const messages = currentTicket ? currentTicket.messages : [];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    sendUserSupportMessage(activeEmail, activeName, inputText.trim(), currentTicket?.id);
    setInputText('');
    loadTickets();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full h-full sm:h-[620px] sm:max-h-[90vh] sm:max-w-lg max-w-full bg-white border-0 sm:border sm:border-slate-200 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Support Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-red-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/30 flex items-center justify-center text-amber-300 shadow-inner">
                <Headphones className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-indigo-900 rounded-full shadow-xs" title="متصل الآن" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black">الدعم الفني المباشر</h3>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[9.5px] px-2 py-0.5 rounded-full font-bold">
                  متواجد للرد
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium mt-0.5">
                فريق خدمة مستخدمي منصة شُغل برو
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy & Account Security Banner */}
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-[10.5px] text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>رسائلك سرية تماماً وخاصة ببريدك:</span>
            <span className="text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate">
              {currentUserEmail || 'حساب الجلسة الحالي'}
            </span>
          </div>
          <span className="text-[9.5px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md font-black shrink-0 border border-emerald-300">
            محادثة خاصة ومحمية
          </span>
        </div>

        {/* Messages Chat Area */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
          {/* Welcome Message from Support */}
          <div className="flex items-start gap-2.5 max-w-[88%]">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tr-none shadow-xs text-xs text-slate-800 space-y-1.5 leading-relaxed">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-blue-700 text-[11px]">فريق الدعم الفني</span>
                <span className="text-[10px] text-slate-400">آلي / مباشر</span>
              </div>
              <p>
                مرحباً بك! يسعدنا مساعدتك في أي استفسار يخص إعلاناتك، الوظائف، أو أي مشكلة تواجهك في المنصة. اكتب رسالتك وسنرد عليك فوراً.
              </p>
            </div>
          </div>

          {/* User & Support Messages */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse self-end ml-auto max-w-[85%]' : 'max-w-[88%]'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                  isUser 
                    ? 'bg-gradient-to-tr from-red-600 to-amber-600 text-white' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                </div>

                <div className={`p-3 rounded-2xl shadow-xs text-xs leading-relaxed space-y-1 ${
                  isUser 
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-slate-900 rounded-tl-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tr-none'
                }`}>
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className={`font-black ${isUser ? 'text-red-700' : 'text-blue-700'}`}>
                      {isUser ? 'أنت' : 'فريق الدعم'}
                    </span>
                    <span className="text-slate-400 font-mono text-[9.5px]">
                      {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-3.5 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب استفسارك أو رسالتك للدعم الفني..."
              className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none transition-all placeholder:text-slate-400 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer active:scale-95 transition-all"
            >
              <span>إرسال</span>
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>رسائلك تصل حصرياً للوحة تحكم إدارة المنصة دون اطلاع أي مستخدم آخر عليها</span>
          </p>
        </form>

      </div>
    </div>
  );
};
