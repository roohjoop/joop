import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type PWAInstallResult = 'installed' | 'dismissed' | 'already-installed' | 'prompted';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect standalone or fullscreen mode (already installed as PWA or running in home screen)
    const isStandalone =
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: fullscreen)').matches) ||
      (typeof navigator !== 'undefined' && (navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(isStandalone);

    // Detect device type
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isMobileDevice = /android|iphone|ipad|ipod|mobile/.test(userAgent);
      setIsIOS(isIOSDevice);
      setIsMobile(isMobileDevice);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered directly by the download button
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Direct installation trigger - NO modal window popup
  const install = async (): Promise<PWAInstallResult> => {
    // 1. If already installed
    if (isInstalled) {
      return 'already-installed';
    }

    // 2. If native install prompt is available (Chrome Android, Chromium Desktop, Edge)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return 'installed';
        } else {
          return 'dismissed';
        }
      } catch (err) {
        console.warn('PWA install prompt direct trigger:', err);
      }
      return 'dismissed';
    }

    // If deferred prompt hasn't fired yet or browser installs directly
    return 'prompted';
  };

  return {
    isInstallable: !!deferredPrompt || !isInstalled,
    isInstalled,
    isIOS,
    isMobile,
    install
  };
}
