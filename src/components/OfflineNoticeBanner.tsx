import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, QrCode, CheckCircle2, X } from 'lucide-react';

interface OfflineNoticeBannerProps {
  onOpenMyPasses: () => void;
}

export const OfflineNoticeBanner: React.FC<OfflineNoticeBannerProps> = ({ onOpenMyPasses }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 sm:p-4 rounded-2xl bg-[#24080c]/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl text-stone-200 font-sans"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-200 text-xs sm:text-sm">
                Offline Mode Detected
              </h4>
              <button
                onClick={() => setDismissed(true)}
                className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
                aria-label="Dismiss offline banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Your booked Eco-Passes are cached locally. You can display your digital QR code at the entrance scanner even without cellular connectivity.
            </p>
            <div className="pt-1.5 flex items-center gap-2">
              <button
                onClick={onOpenMyPasses}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Open Cached Pass</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
