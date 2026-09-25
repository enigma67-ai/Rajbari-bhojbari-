import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  KeyRound, 
  Smartphone, 
  User, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  RotateCw,
  ArrowRight,
  Lock,
  AlertCircle,
  Leaf
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { supabase, recordUserLoginToSupabase } from '../lib/supabase';
import { saveUserProfile } from '../lib/firebase';
import { IAMChefLogo } from './IAMChefLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

/**
 * Formats user phone input to standard international E.164 (+91...) format for Supabase Auth
 */
export function formatToE164(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (rawPhone.trim().startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'otp' | 'google'>('otp');
  const [step, setStep] = useState<'contact' | 'verify' | 'success'>('contact');
  
  // Registration & Phone state - completely blank upon loading
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'guest' | 'student_ambassador' | 'faculty_judge' | 'royal_patron'>('guest');
  const [institution, setInstitution] = useState('IAM Kolkata');

  // Real OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [maskedContact, setMaskedContact] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendNotification, setResendNotification] = useState('');

  // Real WhatsApp countdown timer (60 seconds)
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Input refs for 6-digit PIN boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset all fields whenever modal opens to ensure clean, blank form
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setName('');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setResendNotification('');
      setStep('contact');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Timer effect when in 'verify' step
  useEffect(() => {
    let timer: any = null;
    if (step === 'verify' && countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Focus first digit when entering verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Trigger celebration confetti on successful verification
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d97706', '#991b1b', '#10b981'],
      });
    } catch {
      // safe fallback
    }
  };

  // ============================================================================
  // METHOD 1: REAL GOOGLE LOGIN VIA SUPABASE AUTH
  // ============================================================================
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Supabase Google OAuth error:', err);
      setErrorMsg(err?.message || 'Google sign-in encountered an error. Please verify your Supabase Google OAuth provider settings.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // METHOD 2: SEND REAL WHATSAPP OTP VIA SUPABASE AUTH (TWILIO WHATSAPP)
  // ============================================================================
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResendNotification('');

    const formattedPhone = formatToE164(phoneNumber);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { channel: 'whatsapp' },
      });

      if (error) {
        throw error;
      }

      // Real code successfully sent to user's WhatsApp by Supabase
      const masked = formattedPhone.replace(/(\+\d{2})(\d{2})\d+(\d{4})/, '$1 $2******$3');
      setMaskedContact(masked || formattedPhone);
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('verify');
    } catch (err: any) {
      console.error('Supabase signInWithOtp error:', err);
      setErrorMsg(err?.message || 'Failed to send WhatsApp OTP. Please check your phone number and Supabase Twilio WhatsApp configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Real OTP handler via Supabase (WhatsApp)
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    setResendNotification('');

    const formattedPhone = formatToE164(phoneNumber);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { channel: 'whatsapp' },
      });

      if (error) throw error;

      setCountdown(60);
      setCanResend(false);
      setResendNotification('A new 6-digit WhatsApp OTP has been dispatched to your phone!');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setResendNotification(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend WhatsApp OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // METHOD 3: VERIFY REAL OTP VIA SUPABASE AUTH
  // ============================================================================
  const verifyOtpCode = async (enteredPin: string) => {
    if (enteredPin.length !== 6 || isLoading) return;

    setIsLoading(true);
    setErrorMsg('');

    const formattedPhone = formatToE164(phoneNumber);

    try {
      // Connect to real Supabase verifyOtp method
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: enteredPin,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      // Supabase verified successfully! Create eco user profile
      const authUser = data?.user;
      const userProfile: UserProfile = {
        id: authUser?.id || `user_${Date.now()}`,
        name: name.trim() || authUser?.user_metadata?.full_name || `Eco Guest (${formattedPhone.slice(-4)})`,
        emailOrPhone: formattedPhone,
        role: role || 'guest',
        institution: institution || 'IAM Kolkata',
        sustainabilityKarma: 120,
        tokens: ['welcome_patron', 'zero_waste_2026', 'supabase_whatsapp_verified'],
      };

      // Record authenticated user login in Supabase database
      await recordUserLoginToSupabase({
        id: userProfile.id,
        name: userProfile.name,
        emailOrPhone: userProfile.emailOrPhone,
        role: userProfile.role,
        institution: userProfile.institution,
        sustainabilityKarma: userProfile.sustainabilityKarma,
      }, 'otp');

      // Update Supabase user profile metadata if possible
      try {
        if (name.trim()) {
          await supabase.auth.updateUser({
            data: { full_name: name.trim(), role, institution }
          });
        }
      } catch (_) {}

      // Backup sync to Firestore profile store
      try {
        await saveUserProfile({
          id: userProfile.id,
          name: userProfile.name,
          email: '',
          emailOrPhone: userProfile.emailOrPhone,
          role: userProfile.role,
        });
      } catch (_) {}

      setStep('success');
      triggerConfetti();

      // Grant entry to festival with brief celebration delay
      setTimeout(() => {
        onSuccess(userProfile);
        onClose();
        setTimeout(() => {
          setStep('contact');
          setPhoneNumber('');
          setName('');
          setOtpDigits(['', '', '', '', '', '']);
        }, 300);
      }, 1200);
    } catch (err: any) {
      console.error('Supabase verifyOtp error:', err);
      setErrorMsg(err?.message || 'Invalid or expired OTP code. Please enter the real 6-digit code received on your WhatsApp.');
      // Clear inputs for re-try
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle individual digit typing in 6-digit PIN boxes
  const handleDigitChange = (index: number, val: string) => {
    const cleanChar = val.replace(/\D/g, '').slice(-1);
    
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);
    setErrorMsg('');

    // If character entered, auto focus next box
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto-verify with Supabase
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      verifyOtpCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting full 6-digit real OTP from clipboard/SMS
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      verifyOtpCode(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div 
            id="auth-modal-container"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#061811] border border-emerald-500/30 rounded-3xl shadow-2xl p-6 sm:p-7 text-stone-200 z-10 overflow-hidden ring-1 ring-emerald-500/20 backdrop-blur-2xl"
          >
            {/* Top Close Button */}
            <motion.button
              id="close-auth-modal-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-emerald-950/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Modal Header: Renamed to Eco-Pass Login with IAM Chef Mascot Logo */}
            <div className="text-center space-y-2 pb-4 border-b border-emerald-500/20">
              <IAMChefLogo className="w-14 h-14 mx-auto" glow={true} />
              <div>
                <h2 className="font-display text-2xl font-black text-white tracking-tight">
                  Eco-Pass Login
                </h2>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  IAM ZERO-WASTE FOOD FEST 2026 • Eco-Pass Authentication
                </p>
              </div>
            </div>

            {/* Login Mode Selector Tabs */}
            {step !== 'success' && (
              <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-stone-900/90 border border-stone-800">
                <button
                  id="tab-otp-login-btn"
                  type="button"
                  onClick={() => setAuthMethod('otp')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'otp'
                      ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>WhatsApp OTP</span>
                </button>

                <button
                  id="tab-google-login-btn"
                  type="button"
                  onClick={() => setAuthMethod('google')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'google'
                      ? 'bg-stone-200 text-stone-950 shadow-md font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Account</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT: GOOGLE SIGN IN (SUPABASE OAUTH) */}
            {authMethod === 'google' && step !== 'success' && (
              <div className="py-6 space-y-5 text-center">
                <p className="text-xs text-stone-300 leading-relaxed">
                  Sign in securely with your Google Account via Supabase OAuth for one-click access to festival reservations and verified passes.
                </p>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  id="google-signin-direct-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-700" />
                      <span>Connecting with Supabase Google OAuth...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 inline mr-1" />
                  Authenticated directly via Supabase Auth client (`supabase.auth.signInWithOAuth`).
                </div>
              </div>
            )}

            {/* TAB CONTENT: REAL PHONE NUMBER & OTP FLOW */}
            {authMethod === 'otp' && (
              <div>
                {/* STEP 1: Enter Mobile Phone Number */}
                {step === 'contact' && (
                  <form onSubmit={handleSendOtp} className="space-y-4 pt-3" autoComplete="off">
                    {/* Phone Number Field (Form remains completely blank on load) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-stone-300 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Mobile WhatsApp Number *</span>
                        </label>
                        <span className="text-[10px] text-emerald-400/80 font-mono">10-Digit Mobile</span>
                      </div>

                      <div className="relative flex">
                        <div className="flex items-center gap-1 px-3 py-2.5 rounded-l-xl bg-stone-800 border border-r-0 border-stone-700 text-stone-300 text-xs font-semibold">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          id="auth-phone-input"
                          type="tel"
                          required
                          autoComplete="off"
                          value={phoneNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d\s]/g, '');
                            setPhoneNumber(val);
                            setErrorMsg('');
                          }}
                          placeholder="Enter your mobile number (WhatsApp)"
                          className="flex-1 px-3.5 py-2.5 rounded-r-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-emerald-400 font-mono tracking-wider placeholder:text-stone-600"
                        />
                      </div>
                    </div>

                    {/* Guest Name Field (Form remains completely blank on load) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Full Name / Attendee</span>
                      </label>
                      <div className="relative">
                        <input
                          id="auth-name-input"
                          type="text"
                          autoComplete="off"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Priyadarshini Mukherjee"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-emerald-400 placeholder:text-stone-600"
                        />
                      </div>
                    </div>

                    {/* Festival Role */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300">Eco-Pass Role</label>
                      <select
                        id="auth-role-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-emerald-400"
                      >
                        <option value="guest">Eco-Connoisseur / Fest Attendee</option>
                        <option value="student_ambassador">IAM Student Chef / Sustainability Ambassador</option>
                        <option value="faculty_judge">Faculty & Green Culinary Evaluator</option>
                        <option value="royal_patron">Sustainability Partner / Green Media VIP</option>
                      </select>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Send Real WhatsApp OTP Button */}
                    <button
                      id="send-auth-otp-btn"
                      type="submit"
                      disabled={isLoading || !phoneNumber.trim()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                          <span>Sending WhatsApp Code via Supabase...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-stone-950" />
                          <span>Send WhatsApp Code</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1 text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Production Supabase WhatsApp Authentication (`signInWithOtp`)</span>
                    </div>
                  </form>
                )}

                {/* STEP 2: Real OTP Verification Process */}
                {step === 'verify' && (
                  <div className="space-y-4 pt-3">
                    {/* Visual Progress Steps Bar */}
                    <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 pb-2 border-b border-emerald-900/40">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>WhatsApp Dispatched</span>
                      </span>
                      <span className="text-stone-600">→</span>
                      <span className="flex items-center gap-1 text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Verify Real PIN</span>
                      </span>
                    </div>

                    {/* Masked destination notice */}
                    <div className="text-center space-y-1">
                      <p className="text-xs text-stone-400">
                        Enter the 6-digit code sent to your WhatsApp on:
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-sm font-bold text-emerald-300">
                          {maskedContact || phoneNumber}
                        </span>
                        <button
                          type="button"
                          id="change-contact-btn"
                          onClick={() => {
                            setStep('contact');
                            setErrorMsg('');
                          }}
                          className="text-[11px] text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                        >
                          (Change Number)
                        </button>
                      </div>
                    </div>

                    {/* 6-Digit PIN Box Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-300 text-center block uppercase tracking-wider">
                        Enter 6-Digit WhatsApp Verification PIN
                      </label>
                      <div className="flex justify-center gap-2 sm:gap-2.5">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              inputRefs.current[idx] = el;
                            }}
                            id={`otp-box-${idx}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onPaste={idx === 0 ? handlePaste : undefined}
                            className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-xl border transition-all focus:outline-none ${
                              digit
                                ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 shadow-sm ring-1 ring-emerald-400/40'
                                : 'bg-stone-900 border-stone-700 text-stone-100 focus:border-cyan-400 focus:bg-stone-900'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Resend notification feedback */}
                    {resendNotification && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{resendNotification}</span>
                      </div>
                    )}

                    {/* Error message */}
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Countdown and Resend Controls */}
                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <div className="text-stone-400">
                        {canResend ? (
                          <span className="text-cyan-400">Didn't receive WhatsApp code?</span>
                        ) : (
                          <span className="flex items-center gap-1 text-stone-400">
                            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span>Resend code in: <strong className="font-mono text-emerald-300">00:{countdown < 10 ? `0${countdown}` : countdown}</strong></span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        id="resend-otp-btn"
                        onClick={handleResendOtp}
                        disabled={!canResend || isLoading}
                        className={`font-semibold flex items-center gap-1 transition-colors ${
                          canResend && !isLoading
                            ? 'text-cyan-400 hover:text-cyan-300 underline cursor-pointer'
                            : 'text-stone-600 cursor-not-allowed'
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Resend OTP</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        id="auth-back-to-contact-btn"
                        onClick={() => {
                          setStep('contact');
                          setErrorMsg('');
                        }}
                        className="px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Back
                      </button>

                      <button
                        id="verify-auth-otp-btn"
                        type="button"
                        onClick={() => verifyOtpCode(otpDigits.join(''))}
                        disabled={isLoading || otpDigits.join('').length < 6}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                            <span>Verifying with Supabase Server...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify PIN & Activate Eco-Pass</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Verification Success Celebration */}
                {step === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-xl">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-2xl font-black text-white">
                        Eco-Pass Activated!
                      </h3>
                      <p className="text-xs text-stone-300">
                        Welcome to IAM AI Zero-Waste Food Fest, <strong className="text-emerald-300">{name || 'Eco Guest'}</strong>.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+120 Sustainability Karma Points Awarded</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
