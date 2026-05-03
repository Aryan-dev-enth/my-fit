'use client';

import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user has dismissed it recently
    const dismissedAt = localStorage.getItem('pwa-dismissed-at');
    if (dismissedAt) {
      const now = new Date().getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (now - parseInt(dismissedAt) < thirtyDays) {
        return;
      }
    }

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }

    // Listen for beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    if (isIOSDevice) {
      // Show prompt after a short delay for iOS
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed-at', new Date().getTime().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-2">
          Install MyFit App
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-center text-sm mb-6 leading-relaxed">
          Get the best experience by adding MyFit to your home screen. It's fast, free, and takes no space.
        </p>

        {isIOS ? (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-col gap-2">
              <span className="flex items-center gap-2">
                1. Tap the <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> share button below.
              </span>
              <span className="flex items-center gap-2">
                2. Select <strong>'Add to Home Screen'</strong>.
              </span>
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-500/20 active:scale-95 mb-3"
          >
            Install Now
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="w-full py-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
