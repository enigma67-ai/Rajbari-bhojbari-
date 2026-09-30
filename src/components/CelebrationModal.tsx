import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Printer, 
  Copy, 
  Check, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Utensils, 
  PartyPopper,
  Clock,
  Download,
  Share2
} from 'lucide-react';
import { triggerFestiveCelebration, playCelebrationChime } from '../utils/confettiCelebration';
import { StarterOptionType } from '../types';

export interface CelebrationData {
  type: 'ticket' | 'meal';
  title?: string;
  bookingCode: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  amount: number;
  paymentMethod: string;
  qrCodeUrl?: string;
  // Ticket-specific
  starterType?: StarterOptionType | 'veg' | 'non-veg';
  welcomeDrink?: string;
  starterDish?: string;
  mainsDish?: string;
  includeDessert?: boolean;
  dessertDish?: string;
  // Meal-specific
  items?: Array<{ name: string; quantity: number; mohol?: string; price?: number }>;
  dineSlot?: string;
}

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CelebrationData | null;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  // Trigger grand celebration upon opening
  useEffect(() => {
    if (isOpen && data) {
      triggerFestiveCelebration();
      playCelebrationChime();
    }
  }, [isOpen, data]);

  if (!data) return null;

  const handleCopyCode = () => {
    if (data.bookingCode) {
      navigator.clipboard.writeText(data.bookingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReblastConfetti = () => {
    triggerFestiveCelebration();
    playCelebrationChime();
  };

  const handleAddToCalendar = () => {
    // Generate Google Calendar Link for Friday, 9th October 2026
    const title = encodeURIComponent(`IAM AI ZERO-WASTE FOOD FEST 2026 • ${data.type === 'ticket' ? 'Eco Entry Pass' : 'Zero-Waste Dining Feast'}`);
    const details = encodeURIComponent(
      `Pass/Booking Ref: ${data.bookingCode}\nGuest: ${data.guestName}\nStatus: Verified & Confirmed\n\nImportant: Strict Entry Policy — show this pass at the Main Green Gate.\nVenue: IAM Kolkata, Salt Lake Sector 3.`
    );
    const location = encodeURIComponent('Institute of Advanced Management (IAM), Salt Lake Sector 3, Kolkata 700106');
    // Friday, Oct 9, 2026 10:00 to 20:30 IST (04:30 to 15:00 UTC)
    const dates = '20261009T043000Z/20261009T150000Z';
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(gCalUrl, '_blank', 'noopener,noreferrer');
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
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Celebration Modal Content */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="relative w-[95%] sm:w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-auto bg-gradient-to-b from-[#24080c] via-[#1a0507] to-[#120305] border-2 border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-7 z-10 my-8 text-stone-100"
          >
            {/* Ambient Festive Shimmer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 right-0 w-64 h-64 bg-red-800/15 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              id="celebration-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors z-20 cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Celebration Badge */}
            <div className="text-center space-y-3 pt-2">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1, damping: 15 }}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500 via-red-600 to-amber-700 p-0.5 shadow-xl flex items-center justify-center ring-4 ring-amber-400/30"
              >
                <div className="w-full h-full rounded-full bg-[#1c0609] flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
                  </motion.div>
                </div>
              </motion.div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Festival Pass Confirmed</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">
                {data.type === 'ticket' ? 'Official Eco Pass Issued!' : 'Zero-Waste Dining Confirmed!'}
              </h2>

              <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto">
                Welcome to <strong>IAM AI ZERO-WASTE FOOD FEST 2026</strong>. Your reservation has been recorded in the attendee registry and persisted securely.
              </p>
            </div>

            {/* Strict Entry Requirement Notice */}
            <div className="mt-4 p-3 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-3 shadow-md">
              <div className="w-8 h-8 rounded-xl bg-red-900/90 border border-red-400/60 flex-shrink-0 flex items-center justify-center text-red-200">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-left">
                <strong className="text-red-100 uppercase tracking-wide block text-[11px]">
                  Strict Gate Entry Policy: No Ticket, No Entry
                </strong>
                <span className="text-red-200/90 text-[11px]">
                  Show this pass with its scannable QR code at the Main Green Gate on Friday, 9th October 2026.
                </span>
              </div>
            </div>

            {/* Digital Pass Card */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#140305] border-2 border-amber-500/40 space-y-4 shadow-inner relative overflow-hidden">
              {/* Pass Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {data.type === 'ticket' ? 'Festival Pass ID' : 'Banquet Booking Ref'}
                  </span>
                  <div className="font-mono text-lg sm:text-xl font-black text-amber-300 flex items-center gap-2">
                    <span>{data.bookingCode}</span>
                    <button
                      id="celebration-copy-code-btn"
                      onClick={handleCopyCode}
                      className="p-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-300 text-xs transition-colors cursor-pointer"
                      title="Copy Pass ID"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    Payment Status
                  </span>
                  <div className="text-base sm:text-lg font-bold text-amber-300 flex items-center justify-end gap-1.5">
                    <motion.div
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                    <span>Paid ₹{data.amount}/-</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono uppercase">
                    Via {data.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Guest & Event Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Guest Name</span>
                  <span className="font-semibold text-stone-100">{data.guestName}</span>
                </div>
                {data.guestPhone && (
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Verified Phone</span>
                    <span className="font-mono text-stone-200">{data.guestPhone}</span>
                  </div>
                )}
                {data.guestEmail && (
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Email</span>
                    <span className="font-mono text-stone-200 truncate block">{data.guestEmail}</span>
                  </div>
                )}
              </div>

              {/* Ticket Custom Meal Inclusions */}
              {data.type === 'ticket' && (
                <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/20 text-xs space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    <span>Included Eco Thali & Gastronomy Courses</span>
                  </div>
                  <div className="text-stone-300 space-y-1">
                    <div>• <strong>Drink:</strong> {data.welcomeDrink || 'Hydro Botanical Elixir'}</div>
                    <div>
                      • <strong>Starter ({data.starterType?.toUpperCase()}):</strong> {data.starterDish}
                    </div>
                    <div>• <strong>Main Course:</strong> {data.mainsDish}</div>
                    {data.includeDessert && (
                      <div className="text-amber-300 font-semibold">
                        • <strong>Upcycled Dessert Lab (+₹99/-):</strong> {data.dessertDish}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Meal / Mohol Selection if Meal Type */}
              {data.type === 'meal' && data.items && data.items.length > 0 && (
                <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/20 text-xs space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reserved Eco Dishes ({data.items.length} items)</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-stone-300 pr-1">
                    {data.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="text-stone-400">{item.mohol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue & Date Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20 text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Friday, 9th October 2026</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{data.dineSlot || '10:00 AM - 08:30 PM'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>IAM Kolkata Sector 3</span>
                </div>
              </div>
            </div>

            {/* Interactive Action Bar with floating gold glow effects */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                id="celebration-reconfetti-btn"
                onClick={handleReblastConfetti}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900/70 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <PartyPopper className="w-4 h-4 text-amber-400" />
                <span>Shower Confetti 🎊</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="celebration-calendar-btn"
                  onClick={handleAddToCalendar}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add to Calendar</span>
                </button>

                <button
                  type="button"
                  id="celebration-print-btn"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-300" />
                  <span>Print Pass</span>
                </button>

                <motion.button
                  type="button"
                  id="celebration-done-btn"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 text-xs font-black shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)] border border-amber-300/60 transition-all cursor-pointer"
                >
                  <span>Done & View Festival</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
