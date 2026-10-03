import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Leaf, 
  UtensilsCrossed, 
  Ticket, 
  Bot, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  QrCode, 
  HeartHandshake 
} from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';

interface FestivalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
  onOpenBhojBot: () => void;
}

export const FestivalGuideModal: React.FC<FestivalGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenBooking,
  onOpenBhojBot,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Rajbari Bhojbari 2026",
      subtitle: "Old Recipes. New Intelligence. Zero Waste.",
      icon: Sparkles,
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-stone-300">
          <p>
            Hosted by <strong>Institute of Advanced Management (IAM), Kolkata</strong> on <strong>Friday, 9th October 2026</strong>, Rajbari Bhojbari revives lost 19th-century aristocratic Bengali banquets using modern culinary AI systems and zero-waste sustainability.
          </p>
          <div className="p-4 rounded-2xl bg-[#2a080c]/60 border border-amber-500/25 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>UN SDG 12 Aligned</span>
            </div>
            <p className="text-stone-300 text-xs">
              Every single dish utilizes whole ingredients—peel-to-stem and nose-to-tail—served in compostable Sal leaf platters and clay cups, leaving zero landfill footprint.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "The 4 Authentic Mohols (Pavilions)",
      subtitle: "Your Culinary Journey Through 19th-Century Bengal",
      icon: UtensilsCrossed,
      content: (
        <div className="space-y-2.5 text-xs text-stone-300">
          <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
            <span className="font-bold text-amber-300 block">1. Provesh Mohol (Welcome & Starters — ₹349)</span>
            <span className="text-stone-400 text-[11px]">Handcrafted artisan appetizers: Raj Angan Jali Kebab, Nawab Bari Amudi Piyaji, and Panchali Patpata Bora.</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
            <span className="font-bold text-emerald-300 block">2. Mohini Mohol (Rural Bengal Tasting — ₹0 Included)</span>
            <span className="text-stone-400 text-[11px]">Complimentary heritage digestive broths, rustic batas, and authentic village bhortas.</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
            <span className="font-bold text-amber-300 block">3. Bhoj Mohol (Main Course Combos — ₹349)</span>
            <span className="text-stone-400 text-[11px]">Celebratory fowl, katla fish, and chanar dalna curries served with aromatic Gobindobhog polao.</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
            <span className="font-bold text-cyan-300 block">4. Mati Mohol (Misti Mukh Confections — ₹99 Add-on)</span>
            <span className="text-stone-400 text-[11px]">Heirloom four-sweet tasting platter from the royal courts of Murshidabad and Krishnanagar.</span>
          </div>
        </div>
      ),
    },
    {
      title: "How the ₹349 Eco-Pass Works",
      subtitle: "Your All-In-One Digital Admission & Dining Key",
      icon: Ticket,
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-stone-300">
          <p>
            To eliminate paper ticket waste, every guest receives an encrypted digital QR code. The pass costs ₹349 and includes:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-stone-300 text-xs">
            <li>Single-day admission for your preferred dining slot.</li>
            <li>1 Starter + 1 Main Course Combo + Complimentary Rural Tasting.</li>
            <li>+120 Sustainability Karma Points.</li>
            <li>Instant email and offline-cached QR code for express entrance scanning.</li>
          </ul>
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
            💡 Pay easily via UPI QR code, Card, or select "Cash at Gate Counter" upon arrival.
          </div>
        </div>
      ),
    },
    {
      title: "Bhoj-Bot AI & Smart Features",
      subtitle: "Your Digital Hospitality Concierge",
      icon: Bot,
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-stone-300">
          <p>
            Meet <strong>Bhoj-Bot</strong>, the official AI concierge stationed around the clock. Ask Bhoj-Bot about:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300">
              ✓ 19th-century forgotten recipe lore
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300">
              ✓ Zero-waste preparation techniques
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300">
              ✓ Salt Lake campus directions & transit
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300">
              ✓ Dietary pairings and dessert tips
            </div>
          </div>
          <p className="text-stone-400 text-xs pt-1">
            Tap the floating Bhoj-Bot button at any time to open your live AI chat companion!
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="festival-guide-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[96%] sm:w-full max-w-xl bg-gradient-to-b from-[#1c0507] via-[#120305] to-[#0a0203] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-200 font-sans space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <IconComponent className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Festival Guide • Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white cursor-pointer"
              aria-label="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Indicator Progress Bar */}
          <div className="flex items-center gap-1.5 w-full">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  idx <= currentStep ? 'bg-amber-400' : 'bg-stone-800'
                }`}
              />
            ))}
          </div>

          {/* Body Content */}
          <div className="space-y-2">
            <h3 id="festival-guide-title" className="text-lg sm:text-xl font-bold font-display text-white">
              {currentStepData.title}
            </h3>
            <p className="text-xs text-amber-400 font-medium pb-2">
              {currentStepData.subtitle}
            </p>
            {currentStepData.content}
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold hover:from-amber-400 hover:to-amber-500 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBhojBot();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Try Bhoj-Bot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBooking();
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  Book Eco-Pass (₹349)
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
