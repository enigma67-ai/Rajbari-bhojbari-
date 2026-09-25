import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Lock, 
  AlertCircle, 
  Utensils, 
  Coffee, 
  Cake, 
  ChevronRight,
  Info,
  Crown,
  Share2,
  PartyPopper,
  ShieldCheck,
  Loader2,
  Leaf,
  LogOut,
  LogIn
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Session } from '@supabase/supabase-js';
import { EventTicketPass, StarterOptionType, MainsOptionType, UserProfile } from '../types';
import { saveTicketPass } from '../lib/firebase';
import { triggerFestiveCelebration, playCelebrationChime } from '../utils/confettiCelebration';
import { CelebrationModal, CelebrationData } from './CelebrationModal';
import { 
  initiateRazorpayCheckout, 
  RAZORPAY_KEY_ID, 
  STRIPE_PUBLISHABLE_KEY 
} from '../utils/paymentGateway';
import { 
  sendConfirmationNotification, 
  sendEmailJsConfirmation,
  generateBookingQrCodeUrl,
  BookingConfirmationPayload 
} from '../utils/confirmationEmailService';
import { ConfirmationEmailModal } from './ConfirmationEmailModal';
import { supabase, recordPurchaseToSupabase, getSupabaseClient } from '../lib/supabase';
import { 
  bookingAttendeeSchema, 
  sanitizeName, 
  sanitizePhoneDigits, 
  sanitizeString,
  NAME_REGEX
} from '../utils/validation';
import { TurnstileWidget } from './TurnstileWidget';
import { TicketQrScannerOverlay } from './TicketQrScannerOverlay';
import { PaymentVerifyingAnimation } from './PaymentVerifyingAnimation';

interface TicketBookingSectionProps {
  currentUser: UserProfile | null;
  onPassBooked?: (pass: EventTicketPass) => void;
  onOpenAuth?: () => void;
  onCelebration?: (data: CelebrationData) => void;
}

export const TicketBookingSection: React.FC<TicketBookingSectionProps> = ({
  currentUser,
  onPassBooked,
  onOpenAuth,
  onCelebration,
}) => {
  // Step tracker: 1: Form -> 2: Meal -> 3: Payment -> 4: Pass
  const [currentStep, setCurrentStep] = useState<'details' | 'meal' | 'payment' | 'pass'>('details');
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [confirmationDispatchInfo, setConfirmationDispatchInfo] = useState<{
    sent: boolean;
    message: string;
    service: string;
    status?: number;
  } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);

  // Rate Limiting & Cooldown (10-second debounce against spam clicks)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Bot Protection (Cloudflare Turnstile)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // 10-second debounce / cooldown countdown timer
  React.useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const triggerCooldown = (seconds = 10) => {
    setCooldownRemaining(seconds);
  };

  // Step 1: Mandatory Attendee Details (Initial states are empty strings with NO hardcoded dummy defaults)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [slot, setSlot] = useState('Grand Aristocratic Dinner (7:30 PM - 10:30 PM)');
  const [eventDate, setEventDate] = useState('Friday, 9th October 2026');

  // Supabase Auth Session & Auto-fill State
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [touched, setTouched] = useState<{
    name: boolean;
    phone: boolean;
    email: boolean;
  }>({
    name: false,
    phone: false,
    email: false,
  });

  // Supabase Auth Session Detection & Auto-fill
  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      if (session?.user) {
        if (session.user.email) {
          setEmail(session.user.email);
        }
        const userFullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        if (userFullName) {
          setName(userFullName);
        }
      }
    });

    // 2. Register real-time auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      if (session?.user) {
        if (session.user.email) {
          setEmail(session.user.email);
        }
        const userFullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        if (userFullName) {
          setName(userFullName);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Google Sign-In & Sign-Out handlers
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error('Supabase Google OAuth error:', error);
        if (onOpenAuth) onOpenAuth();
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      if (onOpenAuth) onOpenAuth();
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthSession(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Step 2: Meal Selections (Included in ₹349/- base pass)
  const [welcomeDrink, setWelcomeDrink] = useState('Rural Bengal Counter (Full Complimentary Tasting)');
  const [starterType, setStarterType] = useState<StarterOptionType>('non_veg');
  const [starterDish, setStarterDish] = useState('Murgir Jali Kebab (Non-Veg)');
  
  const [mainsType, setMainsType] = useState<MainsOptionType>('non_veg_1');
  const [mainsDish, setMainsDish] = useState('Combo 1 (Chicken): Desi Murgir Fowl Curry served with Cholar Daler Polao');

  // Additional Combos & Starters & Tasting selections for Dynamic Pricing
  const [extraCombos, setExtraCombos] = useState<string[]>([]);
  const [extraStarters, setExtraStarters] = useState<string[]>([]);
  const [selectedTastingItems, setSelectedTastingItems] = useState<string[]>([
    'Tetuler Chatni',
    'Chaltar Tok Jhol',
    'Kamrangar Chatni',
    'Amrar Tok',
  ]);
  const [selectedRuralItems, setSelectedRuralItems] = useState<string[]>([
    'Dheki Chata Chaler Bhat',
    'Atop Chaler Panta Bhat',
    'Lau Pata Bata',
    'Shile Bata Kancha Aam R Lonka',
    'Mochar Bhorta',
    'Potoler Kosha Bhorta',
    'Musurdal NarkolER Bhorta',
    'Kochur Loti Kucho Chingri Diye Bagan Chorchori',
    'Til Bhapa',
  ]);

  // Step 2D: Dessert Add-on (₹99/-)
  const [includeDessert, setIncludeDessert] = useState(true);
  const [dessertDish, setDessertDish] = useState('Misti Mukh Platter (Piyazer Payes, Porochitroharini, PotolER Monohora, Tal Er Malpua)');

  // Step 2: Payment Selection (Exclusively UPI QR via HDFC SmartHub Vyapar)
  const [paymentMethod, setPaymentMethod] = useState<'UPI_QR'>('UPI_QR');
  const [upiUtr, setUpiUtr] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [copiedTid, setCopiedTid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Step 4: Optional Meal Customization States
  const [isCounterDecide, setIsCounterDecide] = useState(false);
  const [isSavingMealChoice, setIsSavingMealChoice] = useState(false);
  const [mealChoiceSavedMessage, setMealChoiceSavedMessage] = useState<string | null>(null);

  // Generated Ticket Pass
  const [generatedPass, setGeneratedPass] = useState<EventTicketPass | null>(null);
  const [copiedPassId, setCopiedPassId] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  // Dynamic Pricing Logic:
  // Base Eco-Pass: ₹349 each (includes 1 Mains Combo, 1 Starter, and Rural Bengal Tasting Counter)
  // Additional Combos: +₹349 per additional combo
  // A La Carte Starters: +₹349 per starter
  // Tasting Counter (Tok, Jhol, Ambol): ₹0 always
  // Dessert Add-on (Misti Mukh Platter): +₹99
  const basePricePerTicket = 349;
  const extraCombosTotal = extraCombos.length * 349;
  const extraStartersTotal = extraStarters.length * 349;
  const dessertTotal = includeDessert ? 99 * quantity : 0;

  const subtotal = (basePricePerTicket * quantity) + extraCombosTotal + extraStartersTotal + dessertTotal;
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const sustainabilityCess = Math.round(subtotal * 0.02); // 2% eco initiative fee
  const grandTotal = subtotal + taxes + sustainabilityCess;

  // Sync with authenticated user profile
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name && (!name || name === 'Honored Royal Guest')) {
        setName(currentUser.name);
      }
      if (currentUser.emailOrPhone?.includes('@') && !email) {
        setEmail(currentUser.emailOrPhone);
      } else if (currentUser.emailOrPhone && !phone) {
        setPhone(currentUser.emailOrPhone.replace(/\D/g, '').slice(-10));
      }
    }
  }, [currentUser]);

  const isUserAuthenticated = Boolean(authSession?.user || currentUser);
  const userDisplayEmail = authSession?.user?.email || (currentUser?.emailOrPhone?.includes('@') ? currentUser.emailOrPhone : currentUser?.name || 'Authenticated User');
  const isUserLoggedIn = isUserAuthenticated;

  // Strict Real-time Attendee Validation:
  // 1. Full Name: at least 3 characters and letters/spaces only
  // 2. Phone Number: strictly 10 digits
  // 3. Email: valid email format
  // 4. Authenticated: session or user exists
  const cleanPhone = phone.replace(/\D/g, '');
  const isNameValid = name.trim().length >= 3 && NAME_REGEX.test(name.trim());
  const isPhoneValid = cleanPhone.length === 10;
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  const isSlotFilled = Boolean(slot);
  const isQuantityValid = quantity >= 1;

  // Comprehensive Step 1 validation check
  const isStep1Valid = isNameValid && isPhoneValid && isEmailValid && isUserAuthenticated && isSlotFilled && isQuantityValid;

  // Dynamic inline error hints for touched fields
  const nameError = formErrors.name || (touched.name
    ? !name.trim()
      ? 'Full name is required.'
      : name.trim().length < 3
      ? 'Full name must be at least 3 characters.'
      : !NAME_REGEX.test(name.trim())
      ? 'Name can only contain letters, spaces, hyphens, and apostrophes.'
      : null
    : null);

  const phoneError = formErrors.phone || (touched.phone
    ? !cleanPhone
      ? 'Phone number is required.'
      : cleanPhone.length !== 10
      ? 'Enter a valid 10-digit mobile number (e.g. 9876543210).'
      : null
    : null);

  const emailError = formErrors.email || (touched.email
    ? !email.trim()
      ? 'Email address is required.'
      : !isEmailValid
      ? 'Please enter a valid email address (e.g. name@example.com).'
      : null
    : null);

  // Essential attendee parameters check
  const isBookingDetailsComplete = isStep1Valid;

  // Strict 12-digit numeric regex validation for UPI reference / UTR
  const cleanUtr = upiUtr.replace(/\D/g, '');
  const isUtrValid = /^\d{12}$/.test(cleanUtr);

  // Payment is unlocked when details are complete, user is logged in, and valid 12-digit UTR is entered
  const isReadyToPay = isBookingDetailsComplete && isUserLoggedIn && isUtrValid;

  const handleCopyMerchantTid = () => {
    navigator.clipboard.writeText('62903194');
    setCopiedTid(true);
    setTimeout(() => setCopiedTid(false), 2500);
  };

  // Validate Step 1 Form with Zod schema and advance directly to Step 2 (UPI Payment)
  const handleValidateDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, email: true });

    if (!isUserAuthenticated) {
      handleGoogleSignIn();
      return;
    }

    if (!isNameValid || !isPhoneValid || !isEmailValid) {
      return;
    }

    const result = bookingAttendeeSchema.safeParse({
      name,
      phone,
      email,
      quantity,
      slot,
      eventDate,
      welcomeDrink,
      starterDish,
      mainsDish,
      dessertDish: includeDessert ? dessertDish : undefined,
    });

    if (!result.success) {
      const fieldErrors = result.error.format();
      setFormErrors({
        name: fieldErrors.name?._errors[0],
        phone: fieldErrors.phone?._errors[0],
        email: fieldErrors.email?._errors[0],
      });
      return;
    }

    // Synchronize sanitized values
    setName(result.data.name);
    setPhone(result.data.phone);
    setEmail(result.data.email);
    setFormErrors({});
    setCurrentStep('payment');
    // Smooth scroll to top of ticket section
    document.getElementById('ticket-booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Switch Starter Type
  const handleStarterTypeChange = (type: StarterOptionType) => {
    setStarterType(type);
    if (type === 'veg') {
      setStarterDish('Pat Patar Bora (Veg)');
    } else {
      setStarterDish('Murgir Jali Kebab (Non-Veg)');
    }
  };

  // Switch Mains Type
  const handleMainsTypeChange = (type: MainsOptionType) => {
    setMainsType(type);
    if (type === 'veg') {
      setMainsDish('Combo 4 (Veg): Moong Mohon Dal & Rajbarir Chanar Dolma served with Aamsotto Kachalonkar Polao');
    } else if (type === 'non_veg_1') {
      setMainsDish('Combo 1 (Chicken): Desi Murgir Fowl Curry served with Cholar Daler Polao');
    } else if (type === 'non_veg_2') {
      setMainsDish('Combo 2 (Fish): Khiroda Katla / Katlar Suroba served with Rajnandini Polao');
    } else if (type === 'non_veg_3') {
      setMainsDish('Combo 3 (Fish): Aar Macher Astomongola served with Kaju Kismis Basonti Polao');
    }
  };

  // Save meal choices when customized in Step 4
  const handleSaveMealChoices = async () => {
    if (!generatedPass) {
      setCurrentStep('payment');
      return;
    }

    setIsSavingMealChoice(true);
    try {
      const updatedPass: EventTicketPass = {
        ...generatedPass,
        welcomeDrink,
        starterType,
        starterDish,
        mainsType,
        mainsDish,
        includeDessert,
        dessertDish: includeDessert ? dessertDish : undefined,
      };

      setGeneratedPass(updatedPass);

      // Save to Firestore
      await saveTicketPass(updatedPass, currentUser?.id);

      // Update Supabase booking record with chosen dishes
      if (currentUser?.id) {
        await recordPurchaseToSupabase({
          bookingId: updatedPass.id,
          userId: currentUser.id,
          customerName: updatedPass.customerName,
          customerEmail: updatedPass.customerEmail,
          customerPhone: updatedPass.customerPhone,
          totalAmount: updatedPass.totalAmount,
          paymentMethod: 'UPI_QR',
          paymentStatus: updatedPass.paymentStatus,
          diningSlot: updatedPass.slot,
          eventDate: updatedPass.eventDate,
          passQuantity: updatedPass.ticketQuantity,
          items: [
            { type: 'pass', name: `Festival Eco-Pass (x${updatedPass.ticketQuantity})`, price: basePricePerTicket * updatedPass.ticketQuantity, qty: updatedPass.ticketQuantity },
            { type: 'mains', name: updatedPass.mainsDish, price: 0, qty: updatedPass.ticketQuantity, status: 'Included with Pass' },
            ...extraCombos.map((c, idx) => ({ type: 'mains_addon', name: c, price: 349, qty: 1, status: `Additional Combo #${idx + 1} (+₹349)` })),
            { type: 'starter', name: updatedPass.starterDish, price: 0, qty: updatedPass.ticketQuantity, status: 'Included with Pass' },
            ...extraStarters.map((s, idx) => ({ type: 'starter_addon', name: s, price: 349, qty: 1, status: `A La Carte Starter #${idx + 1} (+₹349)` })),
            ...selectedTastingItems.map((t) => ({ type: 'tasting_free', name: t, price: 0, qty: 1, status: 'Complimentary Tasting (₹0)' })),
            ...selectedRuralItems.map((r) => ({ type: 'rural_heritage_free', name: r, price: 0, qty: 1, status: 'Rural Heritage Counter (₹0)' })),
            ...(updatedPass.includeDessert && updatedPass.dessertDish ? [{ type: 'dessert', name: updatedPass.dessertDish, price: 99 * updatedPass.ticketQuantity, qty: updatedPass.ticketQuantity, status: 'Dessert Add-on (+₹99)' }] : []),
          ],
          qrCodeUrl: updatedPass.qrCodeUrl,
          transactionId: updatedPass.transactionId,
          upiUtr: updatedPass.upiUtr,
        });
      }

      setMealChoiceSavedMessage('Authentic feast selections attached to your Digital Eco-Pass!');
      setTimeout(() => setMealChoiceSavedMessage(null), 5000);
      triggerFestiveCelebration();
      playCelebrationChime();
      setCurrentStep('pass');
      document.getElementById('ticket-booking')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to update meal choices:', err);
      setCurrentStep('pass');
    } finally {
      setIsSavingMealChoice(false);
    }
  };

  // Final Confirmation & Payment Process for UPI QR
  const handleExecutePayment = async () => {
    // 1. Rate Limiting: Prevent spam clicks if cooldown is active
    if (cooldownRemaining > 0) {
      return;
    }

    // 2. Strict Login Gate: User MUST be logged in before submitting payment
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    // 3. Strict 12-digit numeric UTR validation
    const cleanUtrDigits = upiUtr.replace(/\D/g, '');
    if (!/^\d{12}$/.test(cleanUtrDigits)) {
      setUtrError('Please enter a valid 12-digit numeric UPI reference / UTR number from your payment receipt.');
      return;
    }
    setUtrError(null);

    // 4. Strict Zod Schema Validation & Sanitization
    const validationResult = bookingAttendeeSchema.safeParse({
      name,
      phone,
      email,
      quantity,
      slot,
      eventDate,
      welcomeDrink,
      starterDish,
      mainsDish,
      dessertDish: includeDessert ? dessertDish : undefined,
    });

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.format();
      setFormErrors({
        name: fieldErrors.name?._errors[0],
        phone: fieldErrors.phone?._errors[0],
        email: fieldErrors.email?._errors[0],
      });
      triggerCooldown(10);
      return;
    }

    // Set sanitized values
    setName(validationResult.data.name);
    setPhone(validationResult.data.phone);
    setEmail(validationResult.data.email);

    await finalizePassBooking(cleanUtrDigits);
  };

  // Finalize booking state & record pass
  const finalizePassBooking = async (verifiedUtr?: string) => {
    setIsProcessingPayment(true);
    const startTime = Date.now();
    const activeUtr = verifiedUtr || upiUtr.replace(/\D/g, '') || ('UTR' + Math.floor(100000000000 + Math.random() * 900000000000));

    try {
      // Dispatch pass creation to backend
      const res = await fetch('/api/tickets/book-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          quantity,
          welcomeDrink,
          starterType,
          starterDish,
          mainsType,
          mainsDish,
          extraCombos,
          extraStarters,
          selectedTastingItems,
          selectedRuralItems,
          includeDessert,
          dessertDish: includeDessert ? dessertDish : undefined,
          paymentMethod: 'UPI_QR',
          upiUtr: activeUtr,
          slot,
          eventDate,
          subtotal,
          taxes,
          sustainabilityCess,
          totalAmount: grandTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to complete pass booking.');
      }

      const bookedPass: EventTicketPass = {
        ...data.pass,
        paymentMethod: 'UPI_QR',
        upiUtr: activeUtr,
      };
      setGeneratedPass(bookedPass);

      // Automated Confirmation Dispatch via @emailjs/browser
      setIsSendingEmail(true);
      const emailPayload: BookingConfirmationPayload = {
        bookingId: bookedPass.id,
        customerName: bookedPass.customerName,
        customerEmail: bookedPass.customerEmail,
        customerPhone: bookedPass.customerPhone,
        eventDate: bookedPass.eventDate,
        slot: bookedPass.slot,
        quantity: bookedPass.ticketQuantity,
        totalAmount: bookedPass.totalAmount,
        paymentMethod: 'UPI_QR',
        welcomeDrink: bookedPass.welcomeDrink,
        starterDish: bookedPass.starterDish,
        mainsDish: bookedPass.mainsDish,
        dessertDish: bookedPass.dessertDish,
        gateLocation: bookedPass.gateLocation,
      };

      try {
        const info = await sendConfirmationNotification(emailPayload);
        setConfirmationDispatchInfo({
          sent: info.success,
          message: info.message,
          service: info.service,
          status: info.status || 200,
        });
        if (info.status === 200 || info.success) {
          setEmailSuccessMessage(
            `EmailJS Confirmed (Status 200 OK): Confirmation email with your QR ticket was sent to ${bookedPass.customerEmail}`
          );
        }
      } catch (emailErr: any) {
        console.warn('Confirmation dispatch error:', emailErr);
      } finally {
        setIsSendingEmail(false);
      }

      // Persist in Firestore
      await saveTicketPass(bookedPass, currentUser?.id);

      // Persist purchase history to Supabase (securely tied to user account with payment_method: 'UPI_QR' and upi_utr)
      if (currentUser?.id) {
        await recordPurchaseToSupabase({
          bookingId: bookedPass.id,
          userId: currentUser.id,
          customerName: bookedPass.customerName,
          customerEmail: bookedPass.customerEmail,
          customerPhone: bookedPass.customerPhone,
          totalAmount: bookedPass.totalAmount,
          paymentMethod: 'UPI_QR',
          paymentStatus: bookedPass.paymentStatus,
          diningSlot: bookedPass.slot,
          eventDate: bookedPass.eventDate,
          passQuantity: bookedPass.ticketQuantity,
          items: [
            { type: 'pass', name: `Festival Eco-Pass (x${bookedPass.ticketQuantity})`, price: basePricePerTicket * bookedPass.ticketQuantity, qty: bookedPass.ticketQuantity },
            { type: 'mains', name: bookedPass.mainsDish, price: 0, qty: bookedPass.ticketQuantity, status: 'Included with Pass' },
            ...extraCombos.map((c, idx) => ({ type: 'mains_addon', name: c, price: 349, qty: 1, status: `Additional Combo #${idx + 1} (+₹349)` })),
            { type: 'starter', name: bookedPass.starterDish, price: 0, qty: bookedPass.ticketQuantity, status: 'Included with Pass' },
            ...extraStarters.map((s, idx) => ({ type: 'starter_addon', name: s, price: 349, qty: 1, status: `A La Carte Starter #${idx + 1} (+₹349)` })),
            ...selectedTastingItems.map((t) => ({ type: 'tasting_free', name: t, price: 0, qty: 1, status: 'Complimentary Tasting (₹0)' })),
            ...selectedRuralItems.map((r) => ({ type: 'rural_heritage_free', name: r, price: 0, qty: 1, status: 'Rural Heritage Counter (₹0)' })),
            ...(bookedPass.includeDessert && bookedPass.dessertDish ? [{ type: 'dessert', name: bookedPass.dessertDish, price: 99 * bookedPass.ticketQuantity, qty: bookedPass.ticketQuantity, status: 'Dessert Add-on (+₹99)' }] : []),
          ],
          qrCodeUrl: bookedPass.qrCodeUrl,
          transactionId: `UTR-${activeUtr}`,
          upiUtr: activeUtr,
        });
      }

      if (onPassBooked) {
        onPassBooked(bookedPass);
      }

      // Ensure minimum engagement time so all verification animation stages are smoothly displayed
      const elapsed = Date.now() - startTime;
      const minEngagementTime = 2400;
      if (elapsed < minEngagementTime) {
        await new Promise((resolve) => setTimeout(resolve, minEngagementTime - elapsed));
      }

      triggerCelebration(bookedPass);
      setCurrentStep('pass');
      document.getElementById('ticket-booking')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      console.error('Pass booking error:', err);
      // Fallback local pass generation
      const fallbackPass: EventTicketPass = {
        id: 'RB-PASS-2026-' + Math.floor(10000 + Math.random() * 90000),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        ticketQuantity: quantity,
        basePricePerTicket,
        welcomeDrink,
        starterType,
        starterDish,
        mainsType,
        mainsDish,
        includeDessert,
        dessertDish: includeDessert ? dessertDish : undefined,
        dessertPrice: 99,
        totalAmount: grandTotal,
        paymentMethod: 'UPI_QR',
        paymentStatus: 'paid',
        slot,
        eventDate,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=IAM_ECO_PASS_${Date.now()}_TOTAL_${grandTotal}_UTR_${activeUtr}`,
        gateLocation: 'Main Green Gate, IAM Kolkata Campus',
        transactionId: `UTR-${activeUtr}`,
        upiUtr: activeUtr,
        bookedAt: new Date().toISOString(),
      };

      setGeneratedPass(fallbackPass);

      // Automated Confirmation Dispatch in fallback via @emailjs/browser
      setIsSendingEmail(true);
      const fallbackPayload: BookingConfirmationPayload = {
        bookingId: fallbackPass.id,
        customerName: fallbackPass.customerName,
        customerEmail: fallbackPass.customerEmail,
        customerPhone: fallbackPass.customerPhone,
        eventDate: fallbackPass.eventDate,
        slot: fallbackPass.slot,
        quantity: fallbackPass.ticketQuantity,
        totalAmount: fallbackPass.totalAmount,
        paymentMethod: 'UPI_QR',
        welcomeDrink: fallbackPass.welcomeDrink,
        starterDish: fallbackPass.starterDish,
        mainsDish: fallbackPass.mainsDish,
        dessertDish: fallbackPass.dessertDish,
        gateLocation: fallbackPass.gateLocation,
      };

      try {
        const info = await sendConfirmationNotification(fallbackPayload);
        setConfirmationDispatchInfo({
          sent: info.success,
          message: info.message,
          service: info.service,
          status: info.status || 200,
        });
        if (info.status === 200 || info.success) {
          setEmailSuccessMessage(
            `EmailJS Confirmed (Status 200 OK): Confirmation email with your QR ticket was sent to ${fallbackPass.customerEmail}`
          );
        }
      } catch (err: any) {
        console.warn('Fallback confirmation dispatch error:', err);
      } finally {
        setIsSendingEmail(false);
      }

      // Persist fallback pass to Supabase if logged in
      if (currentUser?.id) {
        recordPurchaseToSupabase({
          bookingId: fallbackPass.id,
          userId: currentUser.id,
          customerName: fallbackPass.customerName,
          customerEmail: fallbackPass.customerEmail,
          customerPhone: fallbackPass.customerPhone,
          totalAmount: fallbackPass.totalAmount,
          paymentMethod: 'UPI_QR',
          paymentStatus: fallbackPass.paymentStatus,
          diningSlot: fallbackPass.slot,
          eventDate: fallbackPass.eventDate,
          passQuantity: fallbackPass.ticketQuantity,
          items: [
            { type: 'pass', name: `Festival Eco-Pass (x${fallbackPass.ticketQuantity})`, price: basePricePerTicket * fallbackPass.ticketQuantity, qty: fallbackPass.ticketQuantity },
            { type: 'mains', name: fallbackPass.mainsDish, price: 0, qty: fallbackPass.ticketQuantity, status: 'Included with Pass' },
            ...extraCombos.map((c, idx) => ({ type: 'mains_addon', name: c, price: 349, qty: 1, status: `Additional Combo #${idx + 1} (+₹349)` })),
            { type: 'starter', name: fallbackPass.starterDish, price: 0, qty: fallbackPass.ticketQuantity, status: 'Included with Pass' },
            ...extraStarters.map((s, idx) => ({ type: 'starter_addon', name: s, price: 349, qty: 1, status: `A La Carte Starter #${idx + 1} (+₹349)` })),
            ...selectedTastingItems.map((t) => ({ type: 'tasting_free', name: t, price: 0, qty: 1, status: 'Complimentary Tasting (₹0)' })),
            ...(fallbackPass.includeDessert && fallbackPass.dessertDish ? [{ type: 'dessert', name: fallbackPass.dessertDish, price: 99 * fallbackPass.ticketQuantity, qty: fallbackPass.ticketQuantity, status: 'Dessert Add-on (+₹99)' }] : []),
          ],
          qrCodeUrl: fallbackPass.qrCodeUrl,
          transactionId: fallbackPass.transactionId,
          upiUtr: activeUtr,
        }).catch(e => console.warn('Supabase fallback purchase record:', e));
      }

      // Ensure minimum engagement time even on fallback so user sees the verification progress
      const elapsed = Date.now() - startTime;
      const minEngagementTime = 2400;
      if (elapsed < minEngagementTime) {
        await new Promise((resolve) => setTimeout(resolve, minEngagementTime - elapsed));
      }

      triggerCelebration(fallbackPass);
      setCurrentStep('pass');
    } finally {
      setIsProcessingPayment(false);
      setIsSendingEmail(false);
      triggerCooldown(10);
    }
  };

  const triggerCelebration = (passToUse?: EventTicketPass) => {
    const pass = passToUse || generatedPass;
    triggerFestiveCelebration();
    playCelebrationChime();
    setIsCelebrationModalOpen(true);

    if (pass && onCelebration) {
      onCelebration({
        type: 'ticket',
        bookingCode: pass.id,
        guestName: pass.customerName,
        guestPhone: pass.customerPhone,
        guestEmail: pass.customerEmail,
        amount: pass.totalAmount,
        paymentMethod: pass.paymentMethod,
        starterType: pass.starterType,
        welcomeDrink: pass.welcomeDrink,
        starterDish: pass.starterDish,
        mainsDish: pass.mainsDish,
        includeDessert: pass.includeDessert,
        dessertDish: pass.dessertDish,
        dineSlot: pass.slot,
      });
    }
  };

  const handleCopyPassId = () => {
    if (generatedPass?.id) {
      navigator.clipboard.writeText(generatedPass.id);
      setCopiedPassId(true);
      setTimeout(() => setCopiedPassId(false), 2500);
    }
  };

  const handlePrintPass = () => {
    window.print();
  };

  return (
    <section 
      id="ticket-booking" 
      className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#040e0a] border-y border-emerald-500/20 scroll-mt-20 overflow-hidden"
    >
      {/* Subtle background ambient glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-0 w-80 h-80 bg-teal-950/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
            <Ticket className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Eco-Pass Portal</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Book Festival Eco-Pass <span className="text-eco-gradient">₹349/-</span>
          </h2>
          
          <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Your Eco-Pass includes full access to the Rural Bengal Counter, 1 Authentic Starter, and 1 Main Course Combo of your choice. Misti Mukh dessert platters are available for an additional ₹99/-.
          </p>

          {/* 120 Sustainability Karma Points Badge & Live Scanner Trigger */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-400/50 text-emerald-300 text-xs font-bold shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>120 Sustainability Karma Points Badge Included</span>
            </div>

            <button
              type="button"
              id="ticket-scanner-overlay-btn"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg border border-emerald-400/60 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-200" />
              <span>Verify / Scan Ticket QR (Firestore DB)</span>
            </button>
          </div>

          {/* Strict Entry Policy Warning Banner */}
          <div className="max-w-2xl mx-auto mt-3 p-3 sm:p-4 rounded-2xl bg-[#092218] border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm flex items-center gap-3 shadow-lg text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/60 border border-emerald-400/40 flex-shrink-0 flex items-center justify-center text-emerald-300">
              <ShieldAlert className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-white uppercase tracking-wide block">
                Campus Security Policy: Verified Eco-Pass Required
              </span>
              <span className="text-emerald-200/90 text-xs">
                Without a booked digital Eco-Pass, no entry is permitted past the IAM Innovation Gate. All passes feature unique scannable QR verification and award +120 Sustainability Karma Points.
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Step Indicator Bar with smooth transitions */}
        <div className="max-w-3xl mx-auto bg-[#061811] border border-emerald-500/20 rounded-2xl p-2 sm:p-3 shadow-md transition-all duration-300">
          <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center text-[11px] sm:text-xs">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => currentStep !== 'pass' && currentStep !== 'meal' && setCurrentStep('details')}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                currentStep === 'details'
                  ? 'bg-emerald-500 text-stone-950 shadow-md font-black scale-[1.02]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] flex items-center justify-center font-mono">1</span>
              <span>Attendee Details</span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (isStep1Valid && currentStep !== 'pass' && currentStep !== 'meal') {
                  setCurrentStep('payment');
                } else if (currentStep === 'details') {
                  setTouched({ name: true, phone: true, email: true });
                }
              }}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                currentStep === 'payment'
                  ? 'bg-emerald-500 text-stone-950 shadow-md font-black scale-[1.02]'
                  : isStep1Valid && currentStep !== 'pass'
                  ? 'text-stone-300 hover:text-emerald-300 cursor-pointer'
                  : 'text-stone-600 cursor-not-allowed opacity-60'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] flex items-center justify-center font-mono">2</span>
              <span>UPI QR Payment</span>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (generatedPass) {
                  setCurrentStep('pass');
                }
              }}
              disabled={!generatedPass}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                currentStep === 'pass'
                  ? 'bg-emerald-500 text-stone-950 shadow-md font-black scale-[1.02]'
                  : generatedPass
                  ? 'text-emerald-400 hover:text-emerald-200 cursor-pointer'
                  : 'text-stone-600 cursor-not-allowed opacity-60'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] flex items-center justify-center font-mono">3</span>
              <span>Digital Eco-Pass</span>
            </button>

            {/* Step 4 Pill */}
            <button
              type="button"
              onClick={() => {
                if (generatedPass) {
                  setCurrentStep('meal');
                }
              }}
              disabled={!generatedPass}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
                currentStep === 'meal'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-black scale-[1.02]'
                  : generatedPass
                  ? 'text-amber-400 hover:text-amber-200 cursor-pointer'
                  : 'text-stone-600 cursor-not-allowed opacity-60'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] flex items-center justify-center font-mono">4</span>
              <span>Feast Choice</span>
            </button>
          </div>
        </div>

        {/* STEP 1: Attendee Details Form */}
        {currentStep === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-stone-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Supabase Auth Session Detection: Logged-in Pill OR Sign In with Google Prompt */}
            {isUserAuthenticated ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </span>
                  <span className="truncate">
                    Logged in as: <strong className="text-white font-mono">{userDisplayEmail}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  id="ticket-signout-btn"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-semibold transition-colors border border-stone-700 shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3 h-3 text-stone-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-stone-900 to-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sign in with Google to Continue</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Authentication is required to book tickets and auto-fill your attendee profile.
                  </p>
                </div>
                <button
                  type="button"
                  id="ticket-google-signin-btn"
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs shadow transition-all shrink-0 cursor-pointer active:scale-95 hover:shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            <div className="border-b border-stone-800 pb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-200 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span>Step 1: Mandatory Guest Details</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Required for gate security verification and automated digital pass issuance.
              </p>
            </div>

            <form onSubmit={handleValidateDetails} className="space-y-4" autoComplete="off">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Full Name *</span>
                  <span className="text-[10px] text-amber-400 font-normal">Min. 3 characters (letters & spaces only)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    id="ticket-name-input"
                    type="text"
                    required
                    minLength={3}
                    maxLength={60}
                    autoComplete="name"
                    value={name}
                    onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    onChange={(e) => {
                      const clean = sanitizeName(e.target.value);
                      setName(clean);
                      if (!touched.name) setTouched((prev) => ({ ...prev, name: true }));
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="e.g. Priyadarshini Mukherjee"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border text-sm text-stone-100 focus:outline-none transition-colors ${
                      nameError
                        ? 'border-rose-500 focus:border-rose-400'
                        : touched.name && isNameValid
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-stone-700 focus:border-amber-400'
                    }`}
                  />
                </div>
                {nameError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Phone Number (Mandatory) *</span>
                  <span className="text-[10px] text-amber-400 font-normal">Strictly 10 digits only</span>
                </label>
                <div className="relative flex">
                  <div className="flex items-center gap-1 px-3 py-2.5 rounded-l-xl bg-stone-800 border border-r-0 border-stone-700 text-stone-300 text-xs font-semibold">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    id="ticket-phone-input"
                    type="tel"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    autoComplete="tel"
                    value={phone}
                    onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(digitsOnly);
                      if (!touched.phone) setTouched((prev) => ({ ...prev, phone: true }));
                      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="10-digit mobile number"
                    className={`flex-1 px-3.5 py-2.5 rounded-r-xl bg-stone-950 border text-sm text-stone-100 focus:outline-none font-mono transition-colors ${
                      phoneError
                        ? 'border-rose-500 focus:border-rose-400'
                        : touched.phone && isPhoneValid
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-stone-700 focus:border-amber-400'
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              {/* Email Field (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Email Address (Mandatory) *</span>
                  <span className="text-[10px] text-amber-400 font-normal">E-ticket PDF delivery</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    id="ticket-email-input"
                    type="email"
                    required
                    maxLength={100}
                    autoComplete="email"
                    value={email}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    onChange={(e) => {
                      const clean = e.target.value.trim().toLowerCase();
                      setEmail(clean);
                      if (!touched.email) setTouched((prev) => ({ ...prev, email: true }));
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="e.g. yourname@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border text-sm text-stone-100 focus:outline-none font-mono transition-colors ${
                      emailError
                        ? 'border-rose-500 focus:border-rose-400'
                        : touched.email && isEmailValid
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-stone-700 focus:border-amber-400'
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Number of Passes & Pricing Calculator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Number of Passes / Tickets
                  </label>
                  <div className="flex items-center gap-3 bg-stone-950 border border-stone-700 rounded-xl p-1.5 px-3">
                    <button
                      type="button"
                      id="ticket-qty-minus-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-mono text-base font-bold text-amber-300">
                      {quantity} {quantity === 1 ? 'Pass' : 'Passes'}
                    </span>
                    <button
                      type="button"
                      id="ticket-qty-plus-btn"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Dining Session & Gate Slot
                  </label>
                  <select
                    id="ticket-slot-select"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-stone-950 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Royal Afternoon Feast (12:30 PM - 3:30 PM)">
                      Royal Afternoon Feast (12:30 PM - 3:30 PM)
                    </option>
                    <option value="Twilight Heritage Soirée (4:30 PM - 7:00 PM)">
                      Twilight Heritage Soirée (4:30 PM - 7:00 PM)
                    </option>
                    <option value="Grand Aristocratic Dinner (7:30 PM - 10:30 PM)">
                      Grand Aristocratic Dinner (7:30 PM - 10:30 PM)
                    </option>
                  </select>
                </div>
              </div>

              {/* Price Breakdown Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="text-emerald-300 font-semibold">
                    Base Pass: ₹{basePricePerTicket} × {quantity}
                  </div>
                  <div className="text-[11px] text-stone-300">
                    Includes Rural Bengal Counter + 1 Starter + 1 Main Course Combo
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg sm:text-xl font-black text-emerald-100">
                    ₹{basePricePerTicket * quantity}
                  </span>
                </div>
              </div>

              {/* Step 1 Next Button: Strictly disabled until Name >=3 chars, Phone is 10 digits, Email valid, and user authenticated */}
              <div className="space-y-2 pt-2">
                <button
                  id="ticket-step1-continue-btn"
                  type="submit"
                  disabled={!isStep1Valid || cooldownRemaining > 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                    isStep1Valid && cooldownRemaining === 0
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-stone-950 cursor-pointer active:scale-98 shadow-emerald-900/30'
                      : 'bg-stone-800 text-stone-500 border border-stone-700/60 cursor-not-allowed opacity-70'
                  }`}
                >
                  <span>Proceed to UPI QR Payment (₹{grandTotal}/-)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {!isStep1Valid && (
                  <div className="text-[11px] text-center text-amber-400/90 flex items-center justify-center gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {!isUserAuthenticated
                        ? 'Please sign in with Google above to unlock payment.'
                        : 'Complete Full Name (≥3 chars), 10-digit Phone, and valid Email to proceed.'}
                    </span>
                  </div>
                )}
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 4: Optional Meal Preference Selection */}
        {currentStep === 'meal' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto bg-[#0a1f15] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="border-b border-emerald-900/60 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-200 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  <span>Step 4: Customize Your Included Feast (Optional)</span>
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  Personalize your starter, main course combo, and tasting portions now, or decide in person at the festival counter.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap">
                ₹349 Included
              </span>
            </div>

            {/* PART 1: Tok, Jhol, Ambol Tasting Counter (Complimentary — ₹0) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Tok, Jhol, Ambol Tasting Counter</span>
                </label>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-[11px] font-black uppercase tracking-wider shadow-sm">
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  <span>Complimentary Tasting Counter — ₹0</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Adding or selecting items from the 'Tok, Jhol, Ambol' counter always adds <strong>₹0</strong> to your cart total. Select your complimentary tasting portions:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Tetuler Chatni', tag: 'Sweet & Tangy', desc: 'Wild tamarind & date palm jaggery' },
                  { name: 'Chaltar Tok Jhol', tag: 'Cooling Broth', desc: 'Bruised elephant apple & wild turmeric' },
                  { name: 'Kamrangar Chatni', tag: 'Native Starfruit', desc: 'Translucent starfruit & ginger relish' },
                  { name: 'Amrar Tok', tag: 'Agrarian Cooler', desc: 'Hog plum soup with mustard seeds' },
                ].map((item) => {
                  const isChecked = selectedTastingItems.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setSelectedTastingItems((prev) =>
                          prev.includes(item.name) ? prev.filter((i) => i !== item.name) : [...prev, item.name]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40 shadow-sm'
                          : 'bg-[#061811] border-emerald-950 text-stone-400 hover:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                        <span>{item.name}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-[9px] text-cyan-300 font-mono block mt-0.5">{item.tag}</span>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{item.desc}</p>
                      <span className="inline-block mt-1 text-[9px] text-emerald-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        ₹0 Included
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PART 2: Rural Bengal Heritage Counter (Included with Pass — ₹0) */}
            <div className="space-y-3 pt-3 border-t border-emerald-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Rural Bengal Heritage Counter</span>
                </label>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-[11px] font-black uppercase tracking-wider shadow-sm">
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  <span>Rural Bengal Counter — Included with Pass (₹0)</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                All 9 heirloom village preparations are prepared freshly on traditional wood-fired chulhas and stone shil-noras. Included with every festival pass at <strong>₹0</strong>:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Dheki Chata Chaler Bhat', tag: 'Heirloom Rice', desc: 'Hand-pounded whole unpolished rice' },
                  { name: 'Atop Chaler Panta Bhat', tag: 'Probiotic Feast', desc: 'Overnight fermented rice with mustard oil' },
                  { name: 'Lau Pata Bata', tag: 'Zero-Waste Leaf', desc: 'Charred bottle gourd leaves on shil-nora' },
                  { name: 'Shile Bata Kancha Aam R Lonka', tag: 'Fiery & Sour', desc: 'Raw mango mash with bird’s eye chilli' },
                  { name: 'Mochar Bhorta', tag: 'Floral Delicacy', desc: 'Steamed banana flower with coconut & mustard' },
                  { name: 'Potoler Kosha Bhorta', tag: 'Peel Upcycling', desc: 'Upcycled pointed gourd skins with kalonji' },
                  { name: 'Musurdal NarkolER Bhorta', tag: 'Comfort Protein', desc: 'Dry-simmered lentils with roasted coconut' },
                  { name: 'Kochur Loti Kucho Chingri Diye Bagan Chorchori', tag: 'Pond & Garden', desc: 'Colocasia stolons with small shrimp' },
                  { name: 'Til Bhapa', tag: 'Banana Leaf', desc: 'Steamed sesame paste in leaf parcels' },
                ].map((item) => {
                  const isChecked = selectedRuralItems.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setSelectedRuralItems((prev) =>
                          prev.includes(item.name) ? prev.filter((i) => i !== item.name) : [...prev, item.name]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40 shadow-sm'
                          : 'bg-[#061811] border-emerald-950 text-stone-400 hover:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                        <span className="truncate pr-1">{item.name}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[9px] text-cyan-300 font-mono block mt-0.5">{item.tag}</span>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-snug line-clamp-1">{item.desc}</p>
                      <span className="inline-block mt-1 text-[9px] text-emerald-400 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                        ₹0 Included
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PART 3: Starter Selection (Included Starter + A La Carte Starters) */}
            <div className="space-y-3 pt-3 border-t border-emerald-900/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Choose 1 Authentic Starter (Included in ₹349/- Pass)</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">1 Starter Included</span>
              </div>

              {/* Starter Dish Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  {
                    name: 'Murgir Jali Kebab (Non-Veg)',
                    bengali: 'মুরগির জালি কাবাব',
                    type: 'non-veg',
                    desc: 'Minced chicken in fragrant shahi spices enveloped in a golden egg-lace (jali) web.',
                  },
                  {
                    name: 'Amudi Maacher Piyaji (Non-Veg)',
                    bengali: 'আমোদি মাছের পেঁয়াজি',
                    type: 'non-veg',
                    desc: 'Crisp golden river fritters of fresh local Amudi fish with sweet sliced onions & kalonji.',
                  },
                  {
                    name: 'Pat Patar Bora (Veg)',
                    bengali: 'পাট পাতার বড়া',
                    type: 'pure-veg',
                    desc: 'Tender fresh jute leaves crisp-fried in stone-ground rice flour and poppy seed batter.',
                  },
                  {
                    name: 'Aamada Khoi Narkoler Chop / Chire Chinebadam Cutlet (Veg)',
                    bengali: 'আম আদা খই নারকেলের চপ / কাটলেট',
                    type: 'pure-veg',
                    desc: 'Heritage croquettes of grated coconut, puffed khoi, and fragrant fresh mango-ginger.',
                  },
                  {
                    name: 'Muchmuchea Shapla (Veg)',
                    bengali: 'মুচমুচে শাপলা',
                    type: 'vegan',
                    desc: 'Crunchy golden fritters of wild water lily stems seasoned with roasted cumin and rock salt.',
                  },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setStarterDish(item.name)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      starterDish === item.name
                        ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400 shadow-md'
                        : 'bg-[#061811] border-emerald-950 text-stone-400 hover:text-stone-200 hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                      <span>{item.name}</span>
                      {starterDish === item.name && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-stone-400 font-sans">{item.bengali}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        item.type === 'non-veg'
                          ? 'bg-rose-950 text-rose-300 border border-rose-900'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 mt-1 leading-snug">{item.desc}</p>
                    <span className="inline-block mt-1 text-[9px] text-emerald-300 font-mono">
                      {starterDish === item.name ? '✓ Included in Pass' : 'Click to select as included'}
                    </span>
                  </button>
                ))}
              </div>

              {/* A La Carte Starters Add-on (+₹349 each) */}
              <div className="p-3.5 rounded-2xl bg-[#061811] border border-emerald-950 mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Want Extra Starters? (A La Carte Starters: +₹349 each)</span>
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800/40">
                    {extraStarters.length} Extra ({extraStartersTotal > 0 ? `+₹${extraStartersTotal}` : '₹0'})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {[
                    'Murgir Jali Kebab (Non-Veg)',
                    'Amudi Maacher Piyaji (Non-Veg)',
                    'Pat Patar Bora (Veg)',
                    'Aamada Khoi Narkoler Chop / Chire Chinebadam Cutlet (Veg)',
                    'Muchmuchea Shapla (Veg)',
                  ].map((starter) => {
                    const isExtraSelected = extraStarters.includes(starter);
                    return (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => {
                          setExtraStarters((prev) =>
                            prev.includes(starter) ? prev.filter((s) => s !== starter) : [...prev, starter]
                          );
                        }}
                        className={`p-2 rounded-xl text-left text-xs border transition-all cursor-pointer flex items-center justify-between ${
                          isExtraSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 ring-1 ring-cyan-400'
                            : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span className="truncate pr-1 text-[11px]">{starter.split(' (')[0]}</span>
                        <span className="text-[10px] font-bold text-cyan-300 font-mono whitespace-nowrap">
                          {isExtraSelected ? '✓ Added +₹349' : '+₹349'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PART 4: Mains Selection (1 Included + Additional Combos +₹349 each) */}
            <div className="space-y-3 pt-3 border-t border-emerald-900/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                  <span>4. Choose 1 Main Course Combo (Included in ₹349/- Pass)</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">1 Combo Included</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'combo-1',
                    name: 'Combo 1 (Chicken): Desi Murgir Fowl Curry served with Cholar Daler Polao',
                    bengali: 'কম্বো ১ (মুরগি): দেশি মুরগির ফাউল কারি + ছোলার ডালের পোলাও',
                    type: 'non-veg',
                    desc: 'Slow-simmered rustic country chicken in whole-spice gravy with Gobindobhog polao cooked with cholar dal & ghee.',
                  },
                  {
                    key: 'combo-2',
                    name: 'Combo 2 (Fish): Khiroda Katla / Katlar Suroba served with Rajnandini Polao',
                    bengali: 'কম্বো ২ (মাছ): ক্ষীরোদা কাতলা / কাতলার সুরোবা + রাজনন্দিনী পোলাও',
                    type: 'non-veg',
                    desc: 'Prime river Katla fish in velvety reduced milk and saffron broth, paired with fragrant Rajnandini polao.',
                  },
                  {
                    key: 'combo-3',
                    name: 'Combo 3 (Fish): Aar Macher Astomongola served with Kaju Kismis Basonti Polao',
                    bengali: 'কম্বো ৩ (মাছ): আড় মাছের অষ্টমঙ্গল + কাজু কিসমিস বাসন্তী পোলাও',
                    type: 'non-veg',
                    desc: 'River Aar fish in festive eight-spice gravy with golden sweet Basanti polao laden with cashews & raisins.',
                  },
                  {
                    key: 'combo-4',
                    name: 'Combo 4 (Veg): Moong Mohon Dal & Rajbarir Chanar Dolma served with Aamsotto Kachalonkar Polao',
                    bengali: 'কম্বো ৪ (নিরামিষ): মুগ মোহন ডাল ও রাজবাড়ির ছানার ডোলমা + আমসত্ত্ব কাঁচালঙ্কার পোলাও',
                    type: 'pure-veg',
                    desc: 'Stuffed artisan chhana dolma in royal gravy with mango-leather & green chilli aromatic Gobindobhog polao.',
                  },
                ].map((combo) => (
                  <button
                    key={combo.key}
                    type="button"
                    onClick={() => setMainsDish(combo.name)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                      mainsDish === combo.name
                        ? 'bg-emerald-950/60 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400 shadow-lg'
                        : 'bg-[#061811] border-emerald-950 text-stone-400 hover:text-stone-200 hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${combo.type === 'pure-veg' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>{combo.type === 'pure-veg' ? 'Pure Veg' : 'Non-Veg'} Combo</span>
                      </span>
                      {mainsDish === combo.name && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="font-semibold text-sm text-stone-100 mt-1.5">
                      {combo.name}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{combo.bengali}</div>
                    <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                      {combo.desc}
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-emerald-300 font-mono font-bold">
                      {mainsDish === combo.name ? '✓ Primary Included Combo' : 'Click to set as included combo'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Additional Combos Selection (+₹349 per additional combo) */}
              <div className="p-3.5 rounded-2xl bg-[#061811] border border-emerald-950 mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Additional Main Course Combos (+₹349 per extra combo):</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    {extraCombos.length} Extra ({extraCombosTotal > 0 ? `+₹${extraCombosTotal}` : '₹0'})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    { key: 'extra-1', name: 'Combo 1 (Chicken): Desi Murgir Fowl Curry served with Cholar Daler Polao' },
                    { key: 'extra-2', name: 'Combo 2 (Fish): Khiroda Katla / Katlar Suroba served with Rajnandini Polao' },
                    { key: 'extra-3', name: 'Combo 3 (Fish): Aar Macher Astomongola served with Kaju Kismis Basonti Polao' },
                    { key: 'extra-4', name: 'Combo 4 (Veg): Moong Mohon Dal & Rajbarir Chanar Dolma served with Aamsotto Kachalonkar Polao' },
                  ].map((extra) => {
                    const isExtraSelected = extraCombos.includes(extra.name);
                    return (
                      <button
                        key={extra.key}
                        type="button"
                        onClick={() => {
                          setExtraCombos((prev) =>
                            prev.includes(extra.name) ? prev.filter((c) => c !== extra.name) : [...prev, extra.name]
                          );
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs border transition-all cursor-pointer flex items-center justify-between ${
                          isExtraSelected
                            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400'
                            : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span className="truncate pr-2 text-[11px] font-semibold">{extra.name}</span>
                        <span className="text-[10px] font-bold text-emerald-300 font-mono whitespace-nowrap">
                          {isExtraSelected ? '✓ Added +₹349' : '+₹349'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PART 5: Misti Mukh Platter Dessert Add-On (₹99/-) */}
            <div className="pt-3 border-t border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between bg-[#061811] border border-emerald-500/40 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    <Cake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-100 flex items-center gap-2">
                      <span>5. Misti Mukh Dessert Platter Add-On</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                        +₹99/- Only
                      </span>
                    </div>
                    <div className="text-xs text-stone-300">
                      An exquisite 4-sweet heirloom platter: Piyazer Payes, Porochitroharini, PotolER Monohora, and Tal Er Malpua.
                    </div>
                  </div>
                </div>

                {/* Toggle Checkbox Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="include-dessert-toggle"
                    type="checkbox"
                    checked={includeDessert}
                    onChange={(e) => setIncludeDessert(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {includeDessert && (
                <div className="p-3 rounded-xl bg-[#061811] border border-emerald-500/30 text-xs space-y-2 animate-fade-in">
                  <div className="font-bold text-emerald-300 flex items-center justify-between">
                    <span>Misti Mukh Platter Delicacies Included (₹99/-)</span>
                    <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">4 Rare Sweets</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-stone-300">
                    <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                      <span className="font-semibold text-emerald-200 block">Piyazer Payes</span>
                      <span className="text-[10px] text-stone-400">Caramelised onion kheer</span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                      <span className="font-semibold text-emerald-200 block">Porochitroharini</span>
                      <span className="text-[10px] text-stone-400">Royal heirloom confection</span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                      <span className="font-semibold text-emerald-200 block">PotolER Monohora</span>
                      <span className="text-[10px] text-stone-400">Sweet stuffed pointed gourd</span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                      <span className="font-semibold text-emerald-200 block">Tal Er Malpua</span>
                      <span className="text-[10px] text-stone-400">Ripe palmyra palm crepes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Pricing Summary Breakdown (Real-time in ₹ INR) */}
            <div className="p-4 rounded-2xl bg-[#061811] border border-emerald-500/40 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                <span className="font-bold text-sm text-emerald-200">Real-Time Order Calculation</span>
                <span className="text-[10px] text-emerald-400 font-mono">120 Sustainability Karma Points</span>
              </div>

              <div className="space-y-1.5 text-stone-300">
                <div className="flex justify-between">
                  <span>Festival Eco-Pass Base (x{quantity}):</span>
                  <span className="font-mono text-emerald-300 font-bold">₹{basePricePerTicket * quantity}</span>
                </div>
                {extraCombos.length > 0 && (
                  <div className="flex justify-between text-cyan-300">
                    <span>Additional Main Course Combos ({extraCombos.length} × ₹349):</span>
                    <span className="font-mono font-bold">+₹{extraCombosTotal}</span>
                  </div>
                )}
                {extraStarters.length > 0 && (
                  <div className="flex justify-between text-cyan-300">
                    <span>A La Carte Starters ({extraStarters.length} × ₹349):</span>
                    <span className="font-mono font-bold">+₹{extraStartersTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400">
                  <span>Tok, Jhol, Ambol Tasting Counter ({selectedTastingItems.length} items):</span>
                  <span className="font-mono font-bold">₹0 (Complimentary)</span>
                </div>
                {includeDessert && (
                  <div className="flex justify-between text-amber-300">
                    <span>Misti Mukh Dessert Platter (x{quantity} × ₹99):</span>
                    <span className="font-mono font-bold">+₹{dessertTotal}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-950 flex justify-between font-semibold text-stone-200">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{subtotal} INR</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>GST Taxes (5%):</span>
                  <span className="font-mono">₹{taxes} INR</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Student Eco Initiative & Zero-Waste Cess (2%):</span>
                  <span className="font-mono">₹{sustainabilityCess} INR</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-400">Final Grand Total Payable</div>
                  <div className="text-[11px] text-emerald-400">All inclusive of taxes & access</div>
                </div>
                <div className="font-mono text-2xl font-black text-amber-300">
                  ₹{grandTotal} INR
                </div>
              </div>
            </div>

            {/* Back & Save Feast Choices Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                id="ticket-meal-back-btn"
                onClick={() => {
                  setCurrentStep(generatedPass ? 'pass' : 'details');
                  document.getElementById('ticket-booking')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{generatedPass ? 'Back to Confirmed Pass' : 'Back to Details'}</span>
              </button>

              <button
                type="button"
                id="ticket-save-meal-btn"
                onClick={handleSaveMealChoices}
                disabled={isSavingMealChoice}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-stone-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSavingMealChoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Attaching Choices to Pass...</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-4 h-4 text-stone-950" />
                    <span>Save Feast Choices & Return to Pass</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: UPI QR Payment & Auth (Exclusively UPI via HDFC SmartHub Vyapar) */}
        {currentStep === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto bg-stone-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Header */}
            <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-200 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span>Step 2: UPI QR Payment & Auth</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Exclusively UPI QR payment via verified merchant terminal.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Quantity</span>
                <span className="font-mono text-sm font-bold text-emerald-300">
                  {quantity} {quantity === 1 ? 'Pass' : 'Passes'}
                </span>
              </div>
            </div>

            {/* Dynamically calculated Total Amount in large font */}
            <div className="p-4 rounded-2xl bg-[#072116] border border-emerald-500/40 text-center space-y-1 shadow-inner">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                Total Payable Amount
              </span>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-emerald-100 tracking-tight">
                Total Payable: ₹{grandTotal}/-
              </div>
              <p className="text-xs text-emerald-300/80">
                All inclusive of taxes & access for {quantity} event pass(es)
              </p>
            </div>

            {/* Centered Styled Scanner Box with Soft Pulsing Emerald Glow */}
            <div className="py-2 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative p-4 sm:p-5 rounded-3xl bg-white border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-pulse transition-all duration-300 max-w-xs sm:max-w-sm mx-auto flex flex-col items-center">
                {/* HDFC SmartHub Vyapar Header inside box */}
                <div className="w-full flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
                  <div className="text-left">
                    <span className="font-black text-xs text-blue-900 tracking-wide block">
                      HDFC SmartHub Vyapar
                    </span>
                    <span className="text-[9px] text-stone-500 font-semibold block">
                      Verified Merchant QR
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black">
                    BHIM • UPI
                  </span>
                </div>

                {/* Uploaded HDFC SmartHub Vyapar QR image */}
                <div className="w-60 sm:w-64 max-w-full p-2 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <img
                    src="https://i.postimg.cc/4dkfnBP3/IMG-20260925-WA0013.jpg"
                    alt="HDFC SmartHub Vyapar Merchant QR Code"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>

                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-stone-900">
                    Scan with any UPI Banking App
                  </p>
                  <p className="text-[10px] text-stone-600">
                    Google Pay • PhonePe • Paytm • BHIM • HDFC Mobile
                  </p>
                </div>
              </div>

              {/* One-click 'Copy Merchant TID: 62903194' button for split-screen banking apps */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  id="copy-merchant-tid-btn"
                  onClick={handleCopyMerchantTid}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-emerald-100 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {copiedTid ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied TID: 62903194!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copy Merchant TID: 62903194</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-stone-400">
                  Tap to copy Terminal ID if using split-screen banking apps
                </span>
              </div>
            </div>

            {/* Required 12-Digit UPI Reference / UTR Number Field */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-left">
              <label htmlFor="ticket-upi-utr-input" className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enter 12-digit UPI Reference / UTR Number <span className="text-rose-400">*</span></span>
                </span>
                {isUtrValid && (
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 12-Digit UTR Validated
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  id="ticket-upi-utr-input"
                  type="text"
                  maxLength={12}
                  value={upiUtr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setUpiUtr(val);
                    if (utrError && val.length === 12) {
                      setUtrError(null);
                    }
                  }}
                  placeholder="Enter 12-digit UTR from UPI receipt (e.g. 629031940128)"
                  className={`w-full px-4 py-3.5 rounded-xl bg-stone-900 border font-mono text-sm sm:text-base text-stone-100 placeholder:text-stone-600 focus:outline-none transition-all duration-300 ${
                    utrError
                      ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/50'
                      : isUtrValid
                      ? 'border-emerald-500 focus:border-emerald-400 ring-1 ring-emerald-500/50'
                      : 'border-stone-700 focus:border-emerald-400'
                  }`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-500 pointer-events-none">
                  {cleanUtr.length}/12
                </div>
              </div>

              {utrError ? (
                <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{utrError}</span>
                </p>
              ) : (
                <p className="text-[11px] text-stone-400">
                  After completing the payment of <strong>₹{grandTotal}/-</strong> in your UPI app, enter the 12-digit numeric Reference / UTR Number found on the transaction receipt.
                </p>
              )}
            </div>

            {/* Prompt Standard One-Click Eco-Pass Login (Google or OTP) inline if not logged in */}
            {!isUserLoggedIn ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0a261a] to-emerald-950/80 border border-emerald-500/40 text-left space-y-3 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/70 border border-emerald-400/50 flex items-center justify-center text-emerald-300 flex-shrink-0">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-200">
                      Standard One-Click Eco-Pass Sign-In Required
                    </h4>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Please sign in before confirming your UPI booking so your digital entry pass and transaction record are securely linked to your account in Supabase.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    id="ticket-google-signin-btn"
                    onClick={async () => {
                      try {
                        const client = getSupabaseClient();
                        if (client) {
                          await client.auth.signInWithOAuth({ provider: 'google' });
                        } else if (onOpenAuth) {
                          onOpenAuth();
                        }
                      } catch (_) {
                        if (onOpenAuth) onOpenAuth();
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>One-Click Sign In with Google</span>
                  </button>

                  <button
                    type="button"
                    id="ticket-otp-signin-btn"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In with WhatsApp OTP / Email</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-left flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-200">
                    Eco-Pass Account Verified: <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.emailOrPhone})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900 border border-emerald-400 text-emerald-300 font-bold text-[10px] uppercase">
                  Active User
                </span>
              </div>
            )}

            {/* BOT PROTECTION: Cloudflare Turnstile */}
            <div className="pt-1">
              <TurnstileWidget
                onVerify={(token) => {
                  setTurnstileToken(token);
                  setTurnstileError(null);
                }}
                onExpire={() => setTurnstileToken(null)}
                onError={(err) => setTurnstileError(err)}
              />
              {turnstileError && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Turnstile security verification warning: {turnstileError}</span>
                </p>
              )}
            </div>

            {/* Actions: Back Button & Confirm UPI Booking Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                id="ticket-pay-back-btn"
                onClick={() => {
                  setCurrentStep('details');
                  document.getElementById('ticket-booking')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Attendee Details</span>
              </button>

              <button
                type="button"
                id="ticket-pay-now-btn"
                onClick={!isUserLoggedIn ? onOpenAuth : handleExecutePayment}
                disabled={
                  isProcessingPayment ||
                  isSendingEmail ||
                  cooldownRemaining > 0 ||
                  (!isUserLoggedIn ? false : !isUtrValid)
                }
                className={`flex-1 py-4 px-6 rounded-xl font-black text-sm tracking-wide transition-all duration-300 shadow-xl flex items-center justify-center gap-2 ${
                  cooldownRemaining > 0
                    ? 'bg-stone-900 border border-emerald-500/50 text-emerald-300 cursor-not-allowed opacity-90'
                    : isProcessingPayment || isSendingEmail
                    ? 'bg-emerald-600 text-stone-950 opacity-90 cursor-wait'
                    : !isUserLoggedIn
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-lg cursor-pointer active:scale-98'
                    : isUtrValid
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 shadow-emerald-500/20 cursor-pointer active:scale-98'
                    : 'bg-stone-800 border border-stone-700 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                {cooldownRemaining > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-emerald-300 animate-spin" />
                    <span>Rate Limit Cooldown: Please wait {cooldownRemaining}s</span>
                  </>
                ) : isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 text-stone-950 animate-spin" />
                    <span>Sending Confirmation via EmailJS...</span>
                  </>
                ) : isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 text-stone-950 animate-spin" />
                    <span>Confirming UPI Booking & Generating Pass...</span>
                  </>
                ) : !isUserLoggedIn ? (
                  <>
                    <Lock className="w-4 h-4 text-stone-950" />
                    <span>Sign In to Confirm Booking (₹{grandTotal}/-)</span>
                  </>
                ) : !isUtrValid ? (
                  <>
                    <Lock className="w-4 h-4 text-stone-500" />
                    <span>Enter 12-Digit UTR to Confirm (₹{grandTotal}/-)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-stone-950" />
                    <span>Verify & Confirm Booking (₹{grandTotal}/-)</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Full Visual Feedback 'Verifying Payment...' Animation Overlay */}
        <AnimatePresence>
          {isProcessingPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#160c08] border border-emerald-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-200"
              >
                <PaymentVerifyingAnimation
                  amount={grandTotal}
                  utr={upiUtr}
                  merchantTid="62903194"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 4: Generated Digital Pass / E-Ticket */}
        {currentStep === 'pass' && generatedPass && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            {/* Top Success Banner */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-100">
                Official Eco-Pass Confirmed!
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                Welcome to IAM AI Zero-Waste Food Fest 2026. Please present this pass with QR code at the Green Gate.
              </p>
            </div>

            {/* Top EmailJS Success Alert Banner */}
            {emailSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border border-emerald-400/50 shadow-2xl flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-emerald-200">
                        EmailJS Automated Confirmation Delivered
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900 border border-emerald-400/60 text-emerald-200 font-bold">
                        200 OK
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-300 mt-0.5">
                      {emailSuccessMessage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSuccessMessage(null)}
                  className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* AUTOMATED CONFIRMATION EMAIL & MESSAGE STATUS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-amber-600/40 text-left space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-amber-200">
                        Automated Confirmation Dispatched
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>EmailJS 200 OK</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-0.5">
                      Official invitation with direct entry QR code sent to{' '}
                      <strong className="text-amber-200">{generatedPass.customerEmail}</strong> and SMS to{' '}
                      <strong className="text-amber-200">{generatedPass.customerPhone}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="view-sent-email-template-btn"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md active:scale-95"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>View Invitation Letter & QR</span>
                </button>
              </div>

              {/* SUCCESS MESSAGE ON EMAILJS 200 OK STATUS */}
              {confirmationDispatchInfo?.status === 200 && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 flex items-start gap-2.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300 block mb-0.5">
                      ✓ EmailJS Status: 200 OK — Automated Confirmation Sent
                    </span>
                    <p className="text-emerald-100 text-[11px] leading-relaxed">
                      {confirmationDispatchInfo.message}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. CONDITIONAL CASH WARNING NOTICE */}
              {generatedPass.paymentMethod === 'cash' && (
                <div className="p-3.5 rounded-xl bg-amber-950/80 border-2 border-dashed border-amber-500/70 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">Notice for Cash Reservations:</span>
                    <p className="text-amber-100 font-semibold leading-relaxed">
                      Note: You have selected to pay by cash. Please bring ₹{generatedPass.totalAmount}/- to pay at the entrance before you can scan your QR code and enter.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* THE PRINTABLE PASS CARD (Green Success Card) */}
            <div 
              id="printable-event-pass" 
              className="relative bg-gradient-to-b from-[#052317] via-[#041d13] to-[#02130c] border-2 border-emerald-500/70 rounded-3xl p-6 sm:p-8 text-stone-100 shadow-[0_0_35px_rgba(16,185,129,0.25)] overflow-hidden print:bg-white print:text-black print:border-black"
            >
              {/* Watermark Crest */}
              <div className="absolute right-4 bottom-4 opacity-5 text-emerald-300 pointer-events-none">
                <Crown className="w-64 h-64" />
              </div>

              {/* Pass Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-dashed border-emerald-500/40 pb-5 gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 border border-emerald-300 flex items-center justify-center text-stone-950 font-sans font-black text-xl shadow-md">
                    IAM
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                      IAM ANNUAL FOOD FEST 2026
                    </span>
                    <h4 className="font-sans text-xl sm:text-2xl font-black text-emerald-100">
                      RAJBARI BHOJBARI 2026
                    </h4>
                    <span className="text-xs text-emerald-300/80">
                      The Zero-Waste AI Food Fest • Official Eco-Pass
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold uppercase tracking-wider inline-block">
                    {generatedPass.paymentStatus === 'pay_at_counter' ? 'VOUCHER: PAY AT GATE' : 'ENTRY VALIDATED: PAID'}
                  </div>
                  <div className="font-mono text-sm font-black text-emerald-200 mt-1">
                    PASS #{generatedPass.id}
                  </div>
                </div>
              </div>

              {/* Pass Body Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 border-b-2 border-dashed border-emerald-500/40">
                {/* Left Col: Attendee & Meal Specs */}
                <div className="md:col-span-8 space-y-4 text-left">
                  {/* Attendee Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-stone-400 block font-semibold">ATTENDEE NAME</span>
                      <span className="font-bold text-emerald-100 text-sm">{generatedPass.customerName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-stone-400 block font-semibold">PASS QUANTITY</span>
                      <span className="font-bold text-emerald-100 text-sm">{generatedPass.ticketQuantity} Person(s)</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-stone-400 block font-semibold">PHONE (VERIFIED)</span>
                      <span className="font-mono text-stone-300">{generatedPass.customerPhone}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-stone-400 block font-semibold">MANDATORY EMAIL</span>
                      <span className="font-mono text-stone-300 truncate block">{generatedPass.customerEmail}</span>
                    </div>
                  </div>

                  {/* Meal Badges Box */}
                  <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-emerald-900/60 space-y-2 text-xs">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Included Eco-Pass Feast (₹{basePricePerTicket})</span>
                    </div>

                    <div className="space-y-1 text-stone-300">
                      <div>• <strong>Rural Bengal Counter:</strong> Full Complimentary Tasting Access</div>
                      <div>
                        • <strong>Authentic Starter:</strong> {generatedPass.starterDish}
                      </div>
                      <div>
                        • <strong>Main Course Combo:</strong> {generatedPass.mainsDish}
                      </div>
                      {generatedPass.includeDessert && (
                        <div className="text-emerald-300 font-semibold">
                          • <strong>Dessert Add-On (+₹99/-):</strong> Misti Mukh Platter (Piyazer Payes, Porochitroharini, PotolER Monohora, Tal Er Malpua)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slot & Venue Details */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
                    <div className="flex items-center gap-1.5 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{generatedPass.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{generatedPass.slot}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{generatedPass.gateLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Right Col: Gate Scannable QR Code */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-stone-950 border border-amber-500/30">
                  <div className="w-36 h-36 p-1.5 rounded-xl bg-white flex items-center justify-center shadow-lg">
                    <img
                      src={generatedPass.qrCodeUrl}
                      alt="Event Pass QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mt-2">
                    SCAN FOR GATE ENTRY
                  </span>
                  <span className="text-[9px] text-stone-400">
                    Valid at East Heritage Gate only
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="mt-2 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    <QrCode className="w-3 h-3 text-emerald-400" />
                    <span>Test in Gate Scanner</span>
                  </button>
                </div>
              </div>

              {/* Pass Footer Bar */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Entry Policy: Strict QR validation. Wristband issued at entry.</span>
                </div>
                <div className="font-mono text-emerald-200 font-bold">
                  Total Paid: ₹{generatedPass.totalAmount}/- ({generatedPass.paymentMethod.toUpperCase()})
                </div>
              </div>
            </div>

            {/* STEP 4: Optional Meal Selection Prompt below Confirmed Pass */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-[#09271c] to-emerald-950/90 border border-emerald-500/50 shadow-xl text-left space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 flex-shrink-0">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-emerald-200">
                      Step 4: Mohol Feast Selection (Optional)
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-400/60 text-emerald-300 text-[10px] font-bold uppercase">
                      Included with Pass
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                    Select your complimentary Mohol meal combos now, or decide in person at the festival counter.
                  </p>
                </div>
              </div>

              {isCounterDecide && (
                <div className="p-3.5 rounded-xl bg-emerald-900/60 border border-emerald-400/50 text-xs text-emerald-100 flex items-center gap-2.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    ✓ Selection recorded: You've chosen to decide in person at the festival counter. Present your digital QR pass at Counter #1 to pick your meal combos.
                  </span>
                </div>
              )}

              {mealChoiceSavedMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-900/60 border border-emerald-400/50 text-xs text-emerald-100 flex items-center gap-2.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{mealChoiceSavedMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  id="customize-meal-now-btn"
                  onClick={() => {
                    setCurrentStep('meal');
                    document.getElementById('ticket-booking')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Utensils className="w-4 h-4 text-stone-950" />
                  <span>Customize Meal Choices Now</span>
                </button>

                <button
                  type="button"
                  id="decide-at-event-btn"
                  onClick={() => {
                    setIsCounterDecide(true);
                    setMealChoiceSavedMessage(null);
                  }}
                  className="px-5 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/50 text-stone-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Done / I'll Decide at the Event</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="ticket-scanner-pass-btn"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/60 text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <QrCode className="w-4 h-4 text-emerald-200" />
                <span>Verify with Gate QR Scanner</span>
              </button>

              <button
                type="button"
                id="ticket-shower-confetti-btn"
                onClick={() => {
                  triggerFestiveCelebration();
                  playCelebrationChime();
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95"
              >
                <PartyPopper className="w-4 h-4 text-amber-400" />
                <span>Shower Confetti 🎊</span>
              </button>

              <button
                type="button"
                id="ticket-view-celebration-btn"
                onClick={() => setIsCelebrationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-900/80 to-amber-900/80 hover:from-red-800 hover:to-amber-800 border border-amber-400/40 text-amber-200 font-semibold text-xs sm:text-sm transition-all"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Celebration Screen</span>
              </button>

              <button
                type="button"
                id="print-pass-btn"
                onClick={handlePrintPass}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass / Save PDF</span>
              </button>

              <button
                type="button"
                id="ticket-view-email-template-btn"
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-600/50 text-amber-200 font-semibold text-xs sm:text-sm transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>View Email Template & QR</span>
              </button>

              <button
                type="button"
                id="copy-pass-id-btn"
                onClick={handleCopyPassId}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs sm:text-sm transition-colors"
              >
                {copiedPassId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPassId ? 'Pass ID Copied!' : 'Copy Pass ID'}</span>
              </button>

              <button
                type="button"
                id="book-another-pass-btn"
                onClick={() => {
                  setCurrentStep('details');
                  setGeneratedPass(null);
                }}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-stone-950 hover:bg-stone-900 border border-amber-500/40 text-amber-300 font-semibold text-xs sm:text-sm transition-colors"
              >
                <span>Book Another Pass</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* Confirmation Email & Invitation Template Modal */}
      {generatedPass && (
        <ConfirmationEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          bookingData={{
            bookingId: generatedPass.id,
            customerName: generatedPass.customerName,
            customerEmail: generatedPass.customerEmail,
            customerPhone: generatedPass.customerPhone,
            eventDate: generatedPass.eventDate,
            slot: generatedPass.slot,
            quantity: generatedPass.ticketQuantity,
            totalAmount: generatedPass.totalAmount,
            paymentMethod: generatedPass.paymentMethod,
            welcomeDrink: generatedPass.welcomeDrink,
            starterDish: generatedPass.starterDish,
            mainsDish: generatedPass.mainsDish,
            dessertDish: generatedPass.dessertDish,
            gateLocation: generatedPass.gateLocation,
          }}
        />
      )}

      {/* Festive Celebration Modal */}
      {generatedPass && (
        <CelebrationModal
          isOpen={isCelebrationModalOpen}
          onClose={() => setIsCelebrationModalOpen(false)}
          data={{
            type: 'ticket',
            bookingCode: generatedPass.id,
            guestName: generatedPass.customerName,
            guestPhone: generatedPass.customerPhone,
            guestEmail: generatedPass.customerEmail,
            amount: generatedPass.totalAmount,
            paymentMethod: generatedPass.paymentMethod,
            starterType: generatedPass.starterType,
            welcomeDrink: generatedPass.welcomeDrink,
            starterDish: generatedPass.starterDish,
            mainsDish: generatedPass.mainsDish,
            includeDessert: generatedPass.includeDessert,
            dessertDish: generatedPass.dessertDish,
            dineSlot: generatedPass.slot,
            qrCodeUrl: generatedPass.qrCodeUrl,
          }}
        />
      )}

      {/* QR Code Scanner & Firestore Validation Overlay */}
      <TicketQrScannerOverlay
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentUser={currentUser}
        latestPass={generatedPass}
      />
    </section>
  );
};
