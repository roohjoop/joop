import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ExternalLink, 
  RotateCw, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  Home, 
  ChevronRight 
} from 'lucide-react';

interface AboutPlatformWebViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl?: string;
}

export const AboutPlatformWebViewModal: React.FC<AboutPlatformWebViewModalProps> = ({
  isOpen,
  onClose,
  targetUrl = 'https://rohpro.com/me'
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Top Navigation Bar */}
      <header className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
        
        {/* Right side: Back / Return button & Title */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            title="العودة إلى التطبيق"
          >
            <ArrowRight className="w-4 h-4 stroke-[3]" />
            <span className="hidden xs:inline">العودة للتطبيق</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white">منصة من نحن الرئيسية</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.2 rounded-full font-bold hidden sm:inline">
                  roohpro.com/me
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                بوابتنا الشاملة لعرض الرؤية والمنظومة المتكاملة
              </p>
            </div>
          </div>
        </div>

        {/* Left side: Refresh & Open in new tab & Close X */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="تحديث الصفحة"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            title="فتح الرابط في متصفح خارجي"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">نافذة خارجية</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق والعودة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main WebView Frame */}
      <div className="relative flex-1 w-full h-full bg-slate-900 overflow-hidden">
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900 text-white">
            <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-slate-300">جارٍ تحميل منصة من نحن (roohpro.com/me)...</p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={targetUrl}
          title="منصة من نحن الكاملة"
          className="w-full h-full border-0 bg-white"
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />

        {/* FLOATING ACTION BUTTON ON SCREEN: "زر عائم على الشاشة للعودة إلى التطبيق" */}
        <div className="absolute bottom-6 right-6 z-40 animate-bounce duration-1000">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-[0_8px_25px_rgba(37,99,235,0.6)] border-2 border-white/80 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer ring-4 ring-blue-500/30"
            title="انقر هنا للعودة فوراً إلى تطبيق شغل وتقنية"
          >
            <ArrowRight className="w-5 h-5 stroke-[3] text-amber-300" />
            <span>العودة إلى التطبيق</span>
          </button>
        </div>

        {/* Fallback info bar if external site restricts iframes */}
        <div className="absolute bottom-6 left-6 z-30 hidden sm:block">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>مسار معتمد: <strong>roohpro.com/me</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
