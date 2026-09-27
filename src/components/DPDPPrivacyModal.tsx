import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Lock, Mail, FileText, CheckCircle2 } from 'lucide-react';

interface DPDPPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DPDPPrivacyModal: React.FC<DPDPPrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="dpdp-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c0507] via-[#120305] to-[#0a0203] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-stone-200 my-8 font-sans"
        >
          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-700/60 transition-colors cursor-pointer"
            aria-label="Close DPDP Privacy Notice"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 pb-5 border-b border-amber-500/20">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-900/40 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 id="dpdp-modal-title" className="text-lg sm:text-xl font-display font-bold text-amber-200 tracking-wide">
                Privacy Policy & Data Protection Notice
              </h2>
              <p className="text-xs text-amber-400/80 font-medium">
                Digital Personal Data Protection Act, 2023 (DPDP Act)
              </p>
            </div>
          </div>

          {/* Modal Body with exact requested clauses */}
          <div className="space-y-4 py-5 text-xs sm:text-sm text-stone-300 leading-relaxed">
            
            {/* Section 1: Data Fiduciary */}
            <div className="p-3.5 rounded-2xl bg-[#2a080c]/60 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Data Fiduciary</span>
              </div>
              <p className="text-stone-200 font-medium">
                Rajbari Bhojbari Food Fest (IAM Kolkata Campus).
              </p>
            </div>

            {/* Section 2: Purpose of Data Collection */}
            <div className="p-3.5 rounded-2xl bg-[#2a080c]/60 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Purpose of Data Collection</span>
              </div>
              <p className="text-stone-200">
                We collect your Name, Phone Number, and Email exclusively to generate your secure QR digital pass, communicate booking updates via email/WhatsApp, and verify your identity at the entry gate.
              </p>
            </div>

            {/* Section 3: Data Retention & Sharing */}
            <div className="p-3.5 rounded-2xl bg-[#2a080c]/60 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Data Retention & Sharing</span>
              </div>
              <p className="text-stone-200">
                Your data is stored securely using Supabase. We do not sell or share your personal data with third-party marketers.
              </p>
            </div>

            {/* Section 4: Your Rights */}
            <div className="p-3.5 rounded-2xl bg-[#2a080c]/60 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Rights</span>
              </div>
              <p className="text-stone-200">
                Under the DPDP Act, 2023, you have the right to access, correct, or erase your personal data. To withdraw consent or request data deletion after the event, please contact our Grievance Officer at{' '}
                <a href="mailto:ks7901424@gmail.com" className="text-amber-300 underline hover:text-amber-200 font-mono font-semibold">
                  ks7901424@gmail.com
                </a>.
              </p>
            </div>

          </div>

          {/* Footer with Close button */}
          <div className="pt-3 border-t border-amber-500/20 flex justify-end">
            <button
              type="button"
              id="close-dpdp-modal-btn"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
