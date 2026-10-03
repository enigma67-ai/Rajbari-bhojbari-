import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, PhoneCall, RefreshCw, Mail, Calendar } from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';
import { IAMChefLogo } from './IAMChefLogo';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
  message?: string;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-[95%] sm:w-full max-w-md bg-gradient-to-b from-[#24080c] via-[#1c0507] to-[#120305] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 text-stone-200 font-sans"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            <Wrench className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest px-3 py-1 rounded-full bg-red-950/80 border border-amber-500/30">
              System Upgrades in Progress
            </span>
            <h3 id="maintenance-title" className="text-xl font-bold font-display text-white pt-1">
              Courtyard Maintenance
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              {message || 'Our festival ticketing engine is undergoing brief scheduled maintenance to ensure lightning-fast gate turnstile verification. Previously booked passes remain 100% valid.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#2a080c]/60 border border-amber-500/20 text-xs text-left space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px] uppercase">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Event Date: Friday, 9th October 2026</span>
            </div>
            <p className="text-[11px] text-stone-300">
              For urgent pass inquiries or bookings, contact our hospitality desk at{' '}
              <a href={`tel:${FESTIVAL_INFO.phone}`} className="text-amber-300 font-mono underline font-bold">
                {FESTIVAL_INFO.phone}
              </a>
            </p>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Status / Reload</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 text-xs font-semibold hover:bg-stone-800 cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
