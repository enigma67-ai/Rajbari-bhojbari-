import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, QrCode, Banknote, PhoneCall, ArrowLeft, MessageSquare } from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';

interface PaymentFailedStateProps {
  errorMessage: string;
  onRetry: () => void;
  onSwitchToUpi: () => void;
  onSwitchToCash: () => void;
  onCancel: () => void;
}

export const PaymentFailedState: React.FC<PaymentFailedStateProps> = ({
  errorMessage,
  onRetry,
  onSwitchToUpi,
  onSwitchToCash,
  onCancel,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#2a080c] via-[#1a0507] to-[#140305] border border-rose-500/40 text-stone-200 space-y-5 text-center font-sans shadow-xl"
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <span className="font-mono text-[10px] font-bold text-rose-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30">
          Payment Processing Notice
        </span>
        <h3 className="text-lg font-bold text-white font-display">
          Transaction Verification Incomplete
        </h3>
        <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
          {errorMessage || 'We could not verify this transaction reference. No funds have been lost.'}
        </p>
      </div>

      {/* Actionable Recovery Options */}
      <div className="space-y-2 pt-1 text-left text-xs">
        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
          Recommended Next Steps:
        </span>
        
        <button
          type="button"
          onClick={onRetry}
          className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-check / Re-submit Reference</span>
        </button>

        <button
          type="button"
          onClick={onSwitchToCash}
          className="w-full p-3 rounded-xl bg-stone-900 border border-amber-500/40 hover:border-amber-400 text-stone-200 font-semibold flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Banknote className="w-4 h-4 text-amber-400" />
            <div>
              <span className="block font-bold text-xs">Switch to 'Pay Cash at Gate Counter'</span>
              <span className="text-[10px] text-stone-400">Generate your QR pass instantly & pay at the entrance cashier</span>
            </div>
          </div>
          <span className="text-amber-400 font-bold text-xs">Express →</span>
        </button>

        <button
          type="button"
          onClick={onSwitchToUpi}
          className="w-full p-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 font-medium flex items-center gap-2.5 cursor-pointer transition-all"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>Pay via Standard UPI QR Code</span>
        </button>
      </div>

      {/* Concierge Helpline Help */}
      <div className="pt-2 border-t border-amber-900/30 flex items-center justify-between text-[11px] text-stone-400">
        <a
          href={FESTIVAL_INFO.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat on WhatsApp ({FESTIVAL_INFO.whatsappNumber})</span>
        </a>

        <button
          type="button"
          onClick={onCancel}
          className="text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return</span>
        </button>
      </div>
    </motion.div>
  );
};
