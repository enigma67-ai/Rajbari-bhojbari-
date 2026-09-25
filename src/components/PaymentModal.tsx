import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Leaf, 
  Download, 
  Printer, 
  ArrowRight,
  Loader2,
  Copy,
  Check,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, UserProfile } from '../types';
import { saveUserBooking, SavedBooking } from '../lib/firebase';
import { recordPurchaseToSupabase } from '../lib/supabase';
import { triggerFestiveCelebration, playCelebrationChime } from '../utils/confettiCelebration';
import { CelebrationData } from './CelebrationModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currentUser: UserProfile | null;
  onClearCart: () => void;
  onBookingCreated?: (booking: SavedBooking) => void;
  onCelebration?: (data: CelebrationData) => void;
  onOpenAuth?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cart,
  currentUser,
  onClearCart,
  onBookingCreated,
  onCelebration,
  onOpenAuth,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash'>('upi');
  const [step, setStep] = useState<'review' | 'payment_details' | 'otp_verify' | 'confirmed'>('review');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment Form States
  const [cardDetails, setCardDetails] = useState({
    name: currentUser?.name || '',
    number: '4532 8912 3456 7890',
    expiry: '12/28',
    cvv: '891',
  });
  const [upiVpa, setUpiVpa] = useState(currentUser?.emailOrPhone?.includes('@') ? currentUser.emailOrPhone : 'guest@okhdfcbank');
  const [upiUtr, setUpiUtr] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [copiedTid, setCopiedTid] = useState(false);
  
  // OTP Verification States
  const [intentData, setIntentData] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Confirmed Receipt State
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.dish.price * item.quantity, 0);
  const taxes = Math.round(subtotal * 0.05); // 5% GST Taxes
  const sustainabilityCess = Math.round(subtotal * 0.02); // 2% eco initiative fee
  const grandTotal = subtotal + taxes + sustainabilityCess;

  const handleInitiatePayment = async () => {
    // Require user to be logged in before submitting payment
    if (!currentUser) {
      setErrorMsg('Please log in before submitting payment so your purchase history is securely tied to your personal account.');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          method: paymentMethod,
          items: cart.map(i => ({ id: i.dish.id, name: i.dish.name, qty: i.quantity, price: i.dish.price })),
          customerInfo: {
            name: currentUser?.name || cardDetails.name || 'Honored Eco Guest',
            contact: currentUser?.emailOrPhone || upiVpa,
          },
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) throw new Error((data && data.error) || 'Failed to initiate gateway');

      setIntentData(data);

      if (paymentMethod === 'cash') {
        // Cash counter payment directly confirms with counter pickup voucher
        handleVerifyPayment(data.intentId, '');
      } else {
        // Card or UPI requires fast 2FA OTP verification
        setStep('otp_verify');
        if (data.simulatedPaymentOtp) {
          setOtpInput(data.simulatedPaymentOtp); // Auto-fill for ultra-smooth instant user testing
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed. Please check network.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPayment = async (intentIdToUse?: string, otpToUse?: string) => {
    setErrorMsg('');
    setIsProcessing(true);

    const targetIntentId = intentIdToUse || intentData?.intentId;
    const targetOtp = otpToUse !== undefined ? otpToUse : otpInput;

    try {
      const res = await fetch('/api/payments/verify-and-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: targetIntentId,
          otp: targetOtp,
          upiRef: paymentMethod === 'upi' ? 'UPI' + Date.now() : undefined,
          cardLast4: paymentMethod === 'card' ? cardDetails.number.slice(-4) : undefined,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) throw new Error((data && data.error) || 'OTP verification failed');

      if (data?.booking) {
        setConfirmedBooking(data.booking);
        
        // Save to Firestore so it persists across sessions and BHOJ-Bot remembers it
        const effectiveUserId = currentUser?.id || 'guest_user';
        const bookingRecord: Omit<SavedBooking, 'id'> = {
          userId: effectiveUserId,
          customerName: currentUser?.name || cardDetails.name || 'Honored Eco Guest',
          customerEmail: currentUser?.emailOrPhone || upiVpa || 'guest@iam.ac.in',
          customerPhone: currentUser?.emailOrPhone || '9876543210',
          items: cart.map(i => ({
            id: i.dish.id,
            name: i.dish.name,
            bengaliName: i.dish.bengaliName,
            mohol: i.dish.mohol,
            price: i.dish.price,
            quantity: i.quantity,
          })),
          subtotal,
          serviceCharge: sustainabilityCess,
          totalAmount: grandTotal,
          paymentMethod,
          paymentStatus: 'confirmed',
          dineSlot: 'Eco Dining Slot: 12:30 PM - 02:30 PM',
          seatCount: 2,
          specialRequests: 'Traditional bronze utensils requested',
          bookingCode: data.booking.bookingId || 'RB-2026-' + Math.floor(10000 + Math.random() * 90000),
          createdAt: new Date().toISOString(),
        };

        saveUserBooking(effectiveUserId, bookingRecord).then((saved) => {
          if (onBookingCreated) {
            onBookingCreated(saved);
          }
        });

        // Persist purchase history to Supabase (tied to specific user account)
        if (currentUser?.id) {
          recordPurchaseToSupabase({
            bookingId: data.booking.bookingId || bookingRecord.bookingCode,
            userId: currentUser.id,
            customerName: currentUser.name || bookingRecord.customerName,
            customerEmail: currentUser.emailOrPhone?.includes('@') ? currentUser.emailOrPhone : (bookingRecord.customerEmail || 'guest@iam.ac.in'),
            customerPhone: !currentUser.emailOrPhone?.includes('@') ? currentUser.emailOrPhone : (bookingRecord.customerPhone || ''),
            totalAmount: grandTotal,
            paymentMethod,
            paymentStatus: 'confirmed',
            diningSlot: bookingRecord.dineSlot,
            eventDate: 'Friday, 9th October 2026',
            passQuantity: cart.reduce((acc, i) => acc + i.quantity, 0),
            items: cart.map(i => ({
              id: i.dish.id,
              name: i.dish.name,
              bengaliName: i.dish.bengaliName,
              mohol: i.dish.mohol,
              category: i.dish.category,
              price: i.dish.price,
              quantity: i.quantity,
              totalPrice: i.dish.price * i.quantity,
              status: i.dish.price === 0 ? 'Complimentary Tasting (₹0)' : 'A La Carte / Feast Item',
            })),
            qrCodeUrl: data.booking.qrCodeUrl || '',
            transactionId: data.booking.transactionId || ('TXN-' + Date.now().toString(36).toUpperCase()),
          }).catch(e => console.warn('Supabase meal purchase sync notice:', e));
        }
      }
      setStep('confirmed');
      onClearCart();

      // Trigger grand multi-stage festive confetti and celebratory chime
      triggerFestiveCelebration();
      playCelebrationChime();

      if (onCelebration && data?.booking) {
        onCelebration({
          type: 'meal',
          bookingCode: data.booking.bookingId || 'RB-2026-FEAST',
          guestName: currentUser?.name || cardDetails.name || 'Honored Eco Guest',
          guestPhone: currentUser?.emailOrPhone,
          guestEmail: currentUser?.emailOrPhone,
          amount: grandTotal,
          paymentMethod,
          items: cart.map((i) => ({
            name: i.dish.name,
            quantity: i.quantity,
            mohol: i.dish.mohol,
            price: i.dish.price,
          })),
          dineSlot: 'Eco Dining Slot: 12:30 PM - 02:30 PM',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySimulatedOtp = () => {
    if (intentData?.simulatedPaymentOtp) {
      navigator.clipboard.writeText(intentData.simulatedPaymentOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  const handleCopyMerchantTid = () => {
    navigator.clipboard.writeText('62903194');
    setCopiedTid(true);
    setTimeout(() => setCopiedTid(false), 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />

          <motion.div 
            id="payment-modal-container"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#160c08] border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-stone-200 z-10"
          >
            <motion.button
              id="close-payment-modal-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>

        {/* STEP 1: REVIEW & PORTION PLANNING */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-amber-500/20">
              <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-2xl text-emerald-100">
                  Zero-Waste Feast Checkout
                </h2>
                <p className="text-xs text-emerald-400/80">
                  Secure, Fast & 100% Reliable Gateway • Zero-Waste Portion Planning
                </p>
              </div>
            </div>

            {/* Zero Waste Portion Notice */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2.5">
              <Leaf className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Responsible Portion Planning:</strong> Under our "AI Precision. Zero Waste." charter, your order is freshly coordinated with student production kitchens to eliminate banquet scraps.
              </span>
            </div>

            {/* Items Summary */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.dish.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center">
                      {item.quantity}x
                    </span>
                    <div>
                      <div className="font-bold text-amber-100">{item.dish.name}</div>
                      <div className="text-[11px] text-amber-400/80">{item.dish.moholTitle}</div>
                    </div>
                  </div>
                  <div>
                    {item.dish.price === 0 ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 text-xs font-mono">
                        ₹0 • Complimentary Tasting
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-300 font-mono">
                        ₹{item.dish.price * item.quantity} INR
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Breakdown */}
            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} courses):</span>
                <span className="font-mono font-bold text-stone-200">₹{subtotal} INR</span>
              </div>
              <div className="flex justify-between text-cyan-300">
                <span>Applicable GST Taxes (5%):</span>
                <span className="font-mono">₹{taxes} INR</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Student Green Initiative & Zero-Waste Cess (2%):</span>
                <span className="font-mono">₹{sustainabilityCess} INR</span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between text-base font-bold text-emerald-200">
                <span>Final Total:</span>
                <span className="font-mono text-xl text-amber-300">₹{grandTotal} INR</span>
              </div>
            </div>

            {/* Proceed to Payment Method Selection */}
            <button
              id="proceed-to-payment-methods-btn"
              onClick={() => setStep('payment_details')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-bold text-sm shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Payment Details (₹{grandTotal} INR)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD SELECTION & DETAILS */}
        {step === 'payment_details' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div>
                <h2 className="text-2xl font-bold text-emerald-100">
                  Select Payment Option
                </h2>
                <p className="text-xs text-stone-400">Choose between UPI, Card, or Cash on Counter</p>
              </div>
              <span className="text-xl font-bold text-emerald-300">₹{grandTotal}</span>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                id="pay-opt-upi"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-100 ring-1 ring-amber-400 shadow-md'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">UPI / QR</span>
                <span className="text-[10px] text-emerald-400">Fast & Instant</span>
              </button>

              <button
                type="button"
                id="pay-opt-card"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-100 ring-1 ring-amber-400 shadow-md'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">Card (Debit/Credit)</span>
                <span className="text-[10px] text-stone-400">3D Secure 2FA</span>
              </button>

              <button
                type="button"
                id="pay-opt-cash"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-100 ring-1 ring-amber-400 shadow-md'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">Cash on Counter</span>
                <span className="text-[10px] text-amber-400">Pay at Welcome Desk</span>
              </button>
            </div>

            {/* UPI Option View */}
            {paymentMethod === 'upi' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-emerald-500/30 space-y-4 text-center">
                {/* Dynamically calculated Total Amount in large font */}
                <div className="p-3 rounded-xl bg-[#072116] border border-emerald-500/40 text-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                    Zero-Waste Eco-Plate Checkout
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-200 mt-0.5">
                    Total Payable: ₹{grandTotal}/-
                  </div>
                </div>

                {/* Centered Styled Scanner Box with Soft Pulsing Emerald Glow */}
                <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-pulse max-w-xs mx-auto flex flex-col items-center">
                  <div className="w-full flex items-center justify-between border-b border-stone-200 pb-1.5 mb-2">
                    <span className="font-black text-[11px] text-blue-900">HDFC SmartHub Vyapar</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                      UPI • BHIM
                    </span>
                  </div>

                  <img
                    src="/1790315575567.png"
                    alt="HDFC SmartHub Vyapar QR"
                    className="w-48 h-auto object-contain rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/1790315575567.png';
                    }}
                  />

                  <p className="text-[10px] text-stone-600 font-bold mt-2">
                    Scan with Google Pay, PhonePe, Paytm or BHIM
                  </p>
                </div>

                {/* One-click 'Copy Merchant TID: 62903194' button */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    id="copy-modal-merchant-tid-btn"
                    onClick={handleCopyMerchantTid}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedTid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{copiedTid ? 'Copied TID: 62903194!' : 'Copy Merchant TID: 62903194'}</span>
                  </button>
                  <span className="text-[10px] text-stone-400">
                    Merchant TID: 62903194 • Zero-Fee Direct UPI
                  </span>
                </div>

                <div className="space-y-1 text-left pt-1">
                  <label className="text-xs font-semibold text-stone-300 block">
                    Enter 12-digit UPI Reference / UTR Number
                  </label>
                  <input
                    id="modal-upi-utr-input"
                    type="text"
                    maxLength={12}
                    value={upiUtr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setUpiUtr(val);
                      if (utrError && val.length === 12) setUtrError(null);
                    }}
                    placeholder="e.g. 629031940128"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {/* Card Option View */}
            {paymentMethod === 'card' && (
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-amber-500/20 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-stone-400 block">Cardholder Name</label>
                  <input
                    id="card-name-input"
                    type="text"
                    autoComplete="nope"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    placeholder="Name on Card"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-400 block">Card Number</label>
                  <input
                    id="card-number-input"
                    type="text"
                    autoComplete="nope"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    placeholder="4532 8912 3456 7890"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-stone-200 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-400 block">Expiry (MM/YY)</label>
                    <input
                      id="card-expiry-input"
                      type="text"
                      autoComplete="nope"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      placeholder="12/28"
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-stone-200 font-mono text-center focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-stone-400 block">CVV</label>
                    <input
                      id="card-cvv-input"
                      type="password"
                      maxLength={4}
                      autoComplete="nope"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      placeholder="•••"
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-stone-200 font-mono text-center focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cash Option View */}
            {paymentMethod === 'cash' && (
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-amber-500/20 space-y-2 text-xs text-stone-300">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span>Cash on Counter Booking</span>
                </div>
                <p>
                  You will receive an instant <strong>Digital Order Pass</strong>. Simply present it at the Probesh Mohol Registration Counter, settle in cash, and proceed directly to food pickup without queuing twice!
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Account Login Required Banner */}
            {!currentUser && (
              <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-left space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-200">Account Login Required for Feast Checkout</h5>
                    <p className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">
                      Please sign in before paying so your order receipt and dining tokens are tied to your personal user account in Supabase.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In / Register with OTP or Google</span>
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                id="back-to-review-btn"
                onClick={() => setStep('review')}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold"
              >
                Back
              </button>

              <button
                type="button"
                id="pay-confirm-initiate-btn"
                onClick={!currentUser ? onOpenAuth : handleInitiatePayment}
                disabled={isProcessing}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-bold text-sm tracking-wide shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Secure Gateway...</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Unlock Payment (₹{grandTotal})</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proceed to Verify (₹{grandTotal})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OTP VERIFICATION FOR CARD / UPI */}
        {step === 'otp_verify' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-100">
                Two-Factor Payment Verification
              </h2>
              <p className="text-xs text-stone-400">
                Enter the 6-digit authentication code sent to authorize your ₹{grandTotal} transaction
              </p>
            </div>

            {/* Simulated OTP Display Banner for convenient user testing */}
            {intentData?.simulatedPaymentOtp && (
              <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Simulated Bank OTP Sent:</span>
                  <span className="font-mono text-base font-black tracking-widest text-amber-100">
                    {intentData.simulatedPaymentOtp}
                  </span>
                </div>
                <button
                  type="button"
                  id="copy-simulated-otp-btn"
                  onClick={handleCopySimulatedOtp}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-stone-950 font-bold text-xs hover:bg-amber-500"
                >
                  {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOtp ? 'Copied' : 'Auto-Fill'}</span>
                </button>
              </div>
            )}

            {/* OTP Input Form */}
            <div className="space-y-2">
              <label className="text-xs text-stone-400 uppercase tracking-wider font-semibold block text-center">
                Enter 6-Digit OTP
              </label>
              <input
                id="payment-otp-input"
                type="text"
                maxLength={6}
                autoComplete="nope"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="123456"
                className="w-48 mx-auto block py-3 px-4 rounded-xl bg-black/60 border border-amber-500/40 text-center text-xl font-mono tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs text-center">
                {errorMsg}
              </div>
            )}

            {/* Verify & Authorize Button */}
            <button
              id="verify-payment-otp-btn"
              onClick={() => handleVerifyPayment()}
              disabled={isProcessing || otpInput.length < 4}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-bold text-sm tracking-wide shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating OTP & Issuing Pass...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Generate Food Fest Pass</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 4: CONFIRMED ORDER & DIGITAL FOOD PASS */}
        {step === 'confirmed' && confirmedBooking && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                Transaction Successful & Verified
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-100">
                Eco-Dining Pass Issued!
              </h2>
              <p className="text-xs text-stone-300">
                Present this QR pass at the stall counters on Friday, 9th October 2026.
              </p>
            </div>

            {/* Digital Pass Ticket Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#22130c] to-[#160c08] border-2 border-amber-500/40 text-left space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Festival Pass ID</span>
                  <div className="font-mono text-lg font-black text-amber-300">{confirmedBooking.bookingId}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Total Paid</span>
                  <div className="text-lg font-bold text-emerald-300">₹{confirmedBooking.amount}</div>
                </div>
              </div>

              {/* QR and Counter Pickup Details */}
              <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <img
                    src={confirmedBooking.ticketPassQr}
                    alt="Digital Pass QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1.5 text-xs text-stone-300">
                  <div className="font-semibold text-amber-200">Pickup Counter Allocation:</div>
                  <p className="text-[11px] text-stone-400">
                    Probesh Mohol (Beverages) • Bhoj Mohol (Imperial Mains) • Mati Mohol (Clay Pot Specials) • Mohini Mohol (Confections).
                  </p>
                  <div className="pt-2 text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Eco Impact: {confirmedBooking.sustainabilityScorecard?.plasticSavedGrams}g plastic avoided</span>
                  </div>
                </div>
              </div>

              {/* Txn meta */}
              <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400 flex flex-wrap justify-between gap-2">
                <span>Txn ID: {confirmedBooking.transactionId}</span>
                <span>Date: 9th Oct 2026 • Valid all day</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="confetti-retrigger-btn"
                onClick={() => {
                  triggerFestiveCelebration();
                  playCelebrationChime();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              >
                <span>Shower Confetti 🎊</span>
              </button>

              <button
                type="button"
                id="print-pass-btn"
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </button>

              <motion.button
                type="button"
                id="done-payment-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-md"
              >
                <span>Return to Festival</span>
              </motion.button>
            </div>
          </div>
        )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
