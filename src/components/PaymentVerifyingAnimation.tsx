import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  Database, 
  Server, 
  FileCheck2, 
  AlertCircle, 
  RotateCw,
  Clock
} from 'lucide-react';

interface PaymentVerifyingAnimationProps {
  amount: number;
  utr: string;
  merchantTid?: string;
  onVerificationComplete?: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export const PaymentVerifyingAnimation: React.FC<PaymentVerifyingAnimationProps> = ({
  amount,
  utr,
  merchantTid = '62903194',
  error,
  onRetry,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(18);

  const verificationStages = [
    {
      id: 1,
      title: 'Connecting to UPI Banking Network',
      description: 'Handshaking with NPCI switch & HDFC SmartHub Vyapar gateway',
      icon: Server,
    },
    {
      id: 2,
      title: 'Validating 12-Digit UTR Reference',
      description: `Reconciling transaction with Merchant TID: ${merchantTid}`,
      icon: ShieldCheck,
    },
    {
      id: 3,
      title: 'Recording Reservation in Database',
      description: 'Writing persistent tokens to Firestore & Supabase cloud records',
      icon: Database,
    },
    {
      id: 4,
      title: 'Issuing Digital Feast Pass & Receipt',
      description: 'Generating cryptographically sealed festival entry token',
      icon: FileCheck2,
    },
  ];

  // Progressive animation timeline to keep the user actively engaged
  useEffect(() => {
    if (error) return;

    const timer1 = setTimeout(() => {
      setActiveStep(1);
      setProgress(46);
    }, 600);

    const timer2 = setTimeout(() => {
      setActiveStep(2);
      setProgress(74);
    }, 1300);

    const timer3 = setTimeout(() => {
      setActiveStep(3);
      setProgress(95);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [error]);

  return (
    <div className="w-full py-4 px-2 sm:px-4 space-y-6 text-stone-200">
      {/* Top Status Pill */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-mono font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>BANK GATEWAY & DATABASE RECONCILIATION</span>
        </div>
      </div>

      {/* Central Animated Visual Feedback */}
      <div className="relative flex flex-col items-center justify-center py-2">
        {/* Ambient Pulsing Glow Rings */}
        <div className="absolute w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl animate-pulse pointer-events-none" />
        <div className="absolute w-32 h-32 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

        {/* Concentric Rotating Scanner Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/40"
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
            className="absolute inset-2 rounded-full border-2 border-dotted border-amber-400/40"
          />

          {/* Central Shield Icon Container */}
          <motion.div 
            initial={{ scale: 0.85 }}
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-950 via-[#07251a] to-stone-900 border-2 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.45)] flex items-center justify-center"
          >
            {error ? (
              <AlertCircle className="w-10 h-10 text-rose-400" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-emerald-300 drop-shadow" />
            )}
            
            {/* Corner Decorative Dots */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="absolute -bottom-1 -left-1 w-2 rounded-full bg-amber-400" />
          </motion.div>
        </div>

        {/* Dynamic Titles */}
        <div className="mt-4 text-center space-y-1">
          <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-300 font-serif tracking-wide">
            Verifying Payment...
          </h3>
          <p className="text-xs text-stone-300 max-w-md mx-auto">
            Please hold on while we verify your transaction with the UPI network and persist your booking to the database.
          </p>
        </div>
      </div>

      {/* Submitted Details Highlight Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto">
        <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-center">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Amount</span>
          <span className="text-base font-black font-mono text-emerald-300">₹{amount}/-</span>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/90 border border-emerald-500/30 text-center">
          <span className="text-[10px] text-emerald-400/90 uppercase tracking-wider block font-bold">12-Digit UTR</span>
          <span className="text-base font-black font-mono text-amber-300 tracking-wider">
            {utr || '629031940128'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-center">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Merchant TID</span>
          <span className="text-base font-bold font-mono text-stone-200">{merchantTid}</span>
        </div>
      </div>

      {/* Animated Multi-Step Verification Checklist */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-emerald-500/20 max-w-lg mx-auto space-y-3.5 shadow-inner">
        <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
          <span className="font-semibold text-stone-300">Live Verification Pipeline</span>
          <span className="font-mono text-emerald-400 font-bold">{Math.round(progress)}% Completed</span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden relative">
          <motion.div
            initial={{ width: '15%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeInOut', duration: 0.5 }}
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 relative"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>

        {/* Step Items */}
        <div className="space-y-2.5 pt-1">
          {verificationStages.map((stage, idx) => {
            const isCompleted = activeStep > idx;
            const isCurrent = activeStep === idx;
            const Icon = stage.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0.6 }}
                animate={{ 
                  opacity: isCompleted || isCurrent ? 1 : 0.45,
                  scale: isCurrent ? 1.01 : 1 
                }}
                className={`p-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-emerald-950/50 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                    : isCompleted
                    ? 'bg-stone-900/60 border-emerald-500/20'
                    : 'bg-stone-900/30 border-stone-800/60'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-[10px] font-mono text-stone-500">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold leading-tight ${isCurrent ? 'text-amber-200' : isCompleted ? 'text-emerald-200' : 'text-stone-400'}`}>
                      {stage.title}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400">Verified</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-mono font-bold text-amber-300 animate-pulse">In Progress...</span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 truncate mt-0.5">
                    {stage.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Error View if verification failed */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 max-w-lg mx-auto text-left space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-rose-200">Verification Interrupted</h5>
              <p className="text-xs text-rose-300/90 leading-relaxed">{error}</p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Review UTR & Try Again</span>
            </button>
          )}
        </div>
      )}

      {/* Trust & Engagement Footer */}
      {!error && (
        <div className="text-center space-y-2 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>256-bit Encrypted</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Zero-Waste Allocation</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Official IAM Merchant</span>
            </span>
          </div>

          <p className="text-[10px] text-stone-500 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-stone-500 animate-spin" />
            <span>Please do not close or refresh this window while database sync finishes.</span>
          </p>
        </div>
      )}
    </div>
  );
};
