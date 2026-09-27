import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import { IAMChefLogo } from './IAMChefLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
  onNavigateToAdmin?: () => void;
}

const DEFAULT_PASSWORDS = ['IAM2026', 'BHOJ2026', 'GATE2026', 'admin123', 'rajbari2026'];

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  onNavigateToAdmin 
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setIsLoading(false);
      setIsUnlocked(false);
    }
  }, [isOpen]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = password.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter the Gate Staff Security PIN or Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const envAdminPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim();

    const isMatch =
      (envAdminPassword && cleanInput.toLowerCase() === envAdminPassword.toLowerCase()) ||
      DEFAULT_PASSWORDS.some((p) => p.toLowerCase() === cleanInput.toLowerCase());

    setTimeout(() => {
      setIsLoading(false);
      if (isMatch) {
        setIsUnlocked(true);
        try {
          sessionStorage.setItem('rb_gate_admin_auth', 'true');
        } catch (_) {}

        const adminProfile: UserProfile = {
          id: 'admin_gate_staff',
          name: 'Gate Staff Admin',
          emailOrPhone: 'gate.admin@iam.ac.in',
          role: 'faculty_judge',
          institution: 'IAM Kolkata Gate Terminal',
          sustainabilityKarma: 500,
          tokens: ['admin_pass', 'gate_terminal_unlocked'],
        };

        if (onSuccess) {
          onSuccess(adminProfile);
        }

        setTimeout(() => {
          onClose();
          if (onNavigateToAdmin) {
            onNavigateToAdmin();
          } else if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/admin');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, 800);
      } else {
        setErrorMsg('Invalid Security Password. Please enter the authorized staff key.');
      }
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div 
            id="admin-auth-modal-container"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-b from-[#24080c] to-[#150305] border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-200 z-10 overflow-hidden ring-1 ring-amber-500/20 backdrop-blur-2xl space-y-6"
          >
            {/* Top Close Button */}
            <button
              id="close-admin-auth-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-red-950/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 pb-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <Lock className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-950 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                <span>Authorized Gate Staff Terminal</span>
              </div>
              <h2 className="font-display text-2xl font-black text-white tracking-tight">
                Admin Gate Login
              </h2>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Authenticate with the gate staff password to unlock the <strong className="text-amber-300 font-mono">/admin</strong> dashboard and verify Supabase attendee bookings.
              </p>
            </div>

            {/* Unlocked Feedback State */}
            {isUnlocked ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-emerald-950/90 border border-emerald-400/60 text-center space-y-2 text-emerald-100"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="font-bold text-base text-white">Staff Access Granted!</h3>
                <p className="text-xs text-emerald-200">
                  Launching /admin Supabase bookings terminal...
                </p>
              </motion.div>
            ) : (
              /* Password Form */
              <form onSubmit={handleAdminAuth} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                    Gate Staff Password / PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      id="admin-password-input"
                      type="password"
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Enter staff password (e.g. IAM2026)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-amber-500/40 text-sm text-white font-mono placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  id="submit-admin-login-btn"
                  type="submit"
                  disabled={isLoading || !password.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950/50 border border-amber-300/60 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                      <span>Authenticating Staff Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-stone-950" />
                      <span>Unlock /admin Dashboard</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-stone-400">
              <span>Institute of Advanced Management</span>
              <span className="font-mono text-amber-300">IAM Kolkata 2026</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
