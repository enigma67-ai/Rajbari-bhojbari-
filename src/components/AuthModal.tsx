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
  Loader2,
  Mail,
  User,
  LogIn,
  ArrowLeft
} from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithGoogle } from '../lib/firebase';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
  onNavigateToAdmin?: () => void;
  initialMode?: 'guest' | 'admin';
}

const ADMIN_GATE_PASSWORD = 'K246790';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  onNavigateToAdmin,
  initialMode = 'guest'
}) => {
  const [mode, setMode] = useState<'guest' | 'admin'>(initialMode);

  // Guest Email Login State
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Admin PIN State
  const [password, setPassword] = useState('');
  const [adminErrorMsg, setAdminErrorMsg] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'guest');
      setGuestEmail('');
      setGuestName('');
      setGuestError('');
      setIsSubmitting(false);
      setIsGoogleLoading(false);
      setPassword('');
      setAdminErrorMsg('');
      setIsAdminLoading(false);
      setIsAdminUnlocked(false);
    }
  }, [isOpen, initialMode]);

  // Handle Guest Email Login
  const handleGuestEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = guestEmail.trim().toLowerCase();
    const cleanName = guestName.trim();

    if (!cleanEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      setGuestError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setGuestError('');

    try {
      const userProfile: UserProfile = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName || cleanEmail.split('@')[0] || 'Eco Guest',
        emailOrPhone: cleanEmail,
        role: 'guest',
        institution: 'IAM Kolkata Guest Patron',
        sustainabilityKarma: 100,
        tokens: ['welcome_patron', 'zero_waste_2026'],
      };

      // Optional background sync with Supabase OTP if configured
      try {
        supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: true }
        }).catch((err) => console.warn('Supabase OTP notice:', err));
      } catch (_) {}

      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess(userProfile);
        }
        onClose();
      }, 250);
    } catch (err: any) {
      setIsSubmitting(false);
      setGuestError(err?.message || 'Login failed. Please try again.');
    }
  };

  // Handle Google Sign-In for Guests
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGuestError('');
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const userProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Eco Patron',
          emailOrPhone: firebaseUser.email || firebaseUser.phoneNumber || 'google_user',
          role: 'guest',
          institution: 'Sustainable Culinary Patron',
          sustainabilityKarma: 100,
          tokens: ['welcome_patron', 'zero_waste_2026'],
        };
        if (onSuccess) {
          onSuccess(userProfile);
        }
        onClose();
      }
    } catch (err: any) {
      console.warn('Google sign-in fallback to Supabase OAuth:', err);
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        }
      } catch (oauthErr: any) {
        setGuestError('Google Sign-In was cancelled or unavailable. Please use your email.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Admin Staff PIN Auth
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = password.trim();
    if (!cleanInput) {
      setAdminErrorMsg('Please enter the Gate Staff Security PIN or Password.');
      return;
    }

    setIsAdminLoading(true);
    setAdminErrorMsg('');

    const envAdminPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim();

    const isMatch =
      cleanInput === ADMIN_GATE_PASSWORD ||
      cleanInput.toLowerCase() === ADMIN_GATE_PASSWORD.toLowerCase() ||
      (envAdminPassword && cleanInput.toLowerCase() === envAdminPassword.toLowerCase());

    setTimeout(() => {
      setIsAdminLoading(false);
      if (isMatch) {
        setIsAdminUnlocked(true);
        try {
          sessionStorage.setItem('rb_gate_admin_auth', 'true');
        } catch (_) {}

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
        setAdminErrorMsg('Invalid Security Password. Please enter the authorized staff key.');
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
            id={mode === 'guest' ? 'guest-auth-modal-container' : 'admin-auth-modal-container'}
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[95%] sm:w-full max-w-md max-h-[85vh] overflow-y-auto mx-auto bg-gradient-to-b from-[#24080c] to-[#150305] border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-200 z-10 ring-1 ring-amber-500/20 backdrop-blur-2xl space-y-6"
          >
            {/* Top Close Button */}
            <button
              id="close-auth-modal-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-red-950/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ================================================================= */}
            {/* 1. GUEST EMAIL LOGIN MODAL (Default for Regular Buyers)           */}
            {/* ================================================================= */}
            {mode === 'guest' ? (
              <div className="space-y-5">
                {/* Modal Header */}
                <div className="text-center space-y-2 pb-1">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Festival Guest Login</span>
                  </div>
                  <h2 className="font-display text-2xl font-black text-white tracking-tight">
                    Guest Email Login
                  </h2>
                  <p className="text-xs text-stone-300 max-w-xs mx-auto">
                    Sign in with your email to add royal zero-waste dishes to your plate and proceed to instant checkout.
                  </p>
                </div>

                {/* 1-Click Google Sign-In */}
                <button
                  id="google-signin-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400/60 text-stone-200 text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-stone-800 w-full" />
                  <span className="bg-[#1e0609] px-2.5 text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                    or with email
                  </span>
                  <div className="border-t border-stone-800 w-full" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleGuestEmailLogin} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                      Guest Email Address <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="guest-email-input"
                        type="email"
                        required
                        autoFocus
                        value={guestEmail}
                        onChange={(e) => {
                          setGuestEmail(e.target.value);
                          if (guestError) setGuestError('');
                        }}
                        placeholder="e.g. guest@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-400 block">
                      Full Name <span className="text-stone-500 text-[10px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        id="guest-name-input"
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Aritra Roy"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-stone-800 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400/70"
                      />
                    </div>
                  </div>

                  {guestError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{guestError}</span>
                    </div>
                  )}

                  <button
                    id="guest-login-submit-btn"
                    type="submit"
                    disabled={isSubmitting || !guestEmail.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950/50 border border-amber-300/60 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                        <span>Signing In as Guest...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-stone-950" />
                        <span>Sign In & Continue</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Notes & Discreet Staff Access */}
                <div className="pt-2 border-t border-amber-900/30 flex items-center justify-between text-[11px] text-stone-400">
                  <span>IAM Kolkata 2026</span>
                  <button
                    type="button"
                    onClick={() => setMode('admin')}
                    className="text-stone-500 hover:text-amber-400 text-[10px] underline cursor-pointer transition-colors"
                  >
                    Staff Admin Access
                  </button>
                </div>
              </div>
            ) : (
              /* ================================================================= */
              /* 2. ADMIN GATE STAFF PIN MODAL (For Staff Terminal Only)           */
              /* ================================================================= */
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setMode('guest')}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Guest Email Login</span>
                </button>

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

                {isAdminUnlocked ? (
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
                            if (adminErrorMsg) setAdminErrorMsg('');
                          }}
                          placeholder="Enter Gate Staff Password"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-amber-500/40 text-sm text-white font-mono placeholder-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    {adminErrorMsg && (
                      <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{adminErrorMsg}</span>
                      </div>
                    )}

                    <button
                      id="submit-admin-login-btn"
                      type="submit"
                      disabled={isAdminLoading || !password.trim()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-sm shadow-lg shadow-amber-950/50 border border-amber-300/60 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-98"
                    >
                      {isAdminLoading ? (
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
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

