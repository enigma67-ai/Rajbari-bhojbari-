import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, ShieldCheck, Check, X, Settings2 } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenLegal: (tab: 'cookies') => void;
  forceOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenLegal,
  forceOpenModal = false,
  onCloseModal,
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('rb_cookie_consent');
      if (!consent) {
        // Show banner after brief delay
        const timer = setTimeout(() => setShowBanner(true), 1200);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(consent);
        setAnalyticsEnabled(parsed.analytics !== false);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    if (forceOpenModal) {
      setShowPreferencesModal(true);
    }
  }, [forceOpenModal]);

  const saveConsent = (allowAnalytics: boolean) => {
    try {
      const payload = {
        essential: true,
        analytics: allowAnalytics,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('rb_cookie_consent', JSON.stringify(payload));
      setAnalyticsEnabled(allowAnalytics);
    } catch (e) {
      console.warn('Failed to save cookie consent:', e);
    }
    setShowBanner(false);
    setShowPreferencesModal(false);
    if (onCloseModal) onCloseModal();
  };

  const handleAcceptAll = () => saveConsent(true);
  const handleEssentialOnly = () => saveConsent(false);

  return (
    <>
      {/* 1. Floating Bottom Banner */}
      <AnimatePresence>
        {showBanner && !showPreferencesModal && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-[#1a0507]/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl text-stone-200 font-sans"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-amber-100 text-xs sm:text-sm">
                    Cookie & Storage Notice
                  </h4>
                  <button 
                    onClick={handleEssentialOnly}
                    className="text-stone-400 hover:text-stone-200 cursor-pointer p-0.5"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  We use essential local storage to remember your passes and cart. Privacy-friendly analytics help us optimize festival turnstile performance.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleAcceptAll}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleEssentialOnly}
                    className="px-3.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 hover:border-amber-400/60 text-stone-300 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={() => {
                      setShowBanner(false);
                      setShowPreferencesModal(true);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer ml-auto"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Detailed Preferences Modal */}
      <AnimatePresence>
        {showPreferencesModal && (
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[95%] sm:w-full max-w-lg bg-gradient-to-b from-[#1c0507] via-[#120305] to-[#0a0203] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-stone-200 space-y-5 font-sans"
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="cookie-preferences-title" className="font-bold text-base text-amber-100 font-display">
                      Cookie & Privacy Preferences
                    </h3>
                    <p className="text-[11px] text-stone-400">Manage device storage and analytics consent</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPreferencesModal(false);
                    if (onCloseModal) onCloseModal();
                  }}
                  className="p-1.5 rounded-full text-stone-400 hover:text-white cursor-pointer"
                  aria-label="Close preferences"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-stone-300">
                {/* Essential Storage */}
                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-700/60 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Essential Local Storage</span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">Required</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      Necessary for holding your offline QR tickets (`rb_tickets`), session login, and selected dishes in your banquet cart. Cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Analytics Storage */}
                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-700/60 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 font-bold text-amber-200">
                      <Cookie className="w-4 h-4 text-amber-400" />
                      <span>Performance & Latency Analytics</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      Measures turnstile loading times and visitor counts via Vercel Analytics and Supabase. No invasive third-party cross-site profiling.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreferencesModal(false);
                    onOpenLegal('cookies');
                  }}
                  className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                >
                  View Full Cookie Policy
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveConsent(analyticsEnabled)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold hover:from-amber-400 hover:to-amber-500 shadow-md cursor-pointer transition-all"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
