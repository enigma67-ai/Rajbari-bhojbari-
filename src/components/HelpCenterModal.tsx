import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  X, 
  Search, 
  PhoneCall, 
  MessageSquare, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  MapPin, 
  Ticket, 
  Utensils, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBhojBot: () => void;
  onOpenBooking: () => void;
}

interface FAQItem {
  id: string;
  category: 'tickets' | 'venue' | 'menu' | 'zero_waste';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'pass-inclusion',
    category: 'tickets',
    question: 'What is included in the ₹349/- Eco-Pass?',
    answer: 'The ₹349 Eco-Pass grants single-day admission to IAM Kolkata on Friday, 9th October 2026. It includes complimentary access to the Rural Bengal Live Tasting Counter (Mohini Mohol), 1 Authentic Starter of your choice (Provesh Mohol), and 1 Celebratory Main Course Combo (Bhoj Mohol). Misti Mukh dessert platters are an optional ₹99 add-on.',
  },
  {
    id: 'entry-policy',
    category: 'tickets',
    question: 'What is the strict entry policy?',
    answer: 'The festival follows a strict "NO TICKET, NO ENTRY" policy. Every attendee requires a verified digital QR pass scanned at the entrance turnstile. Children under 5 enter free when accompanied by a ticket-holding guardian.',
  },
  {
    id: 'offline-pass',
    category: 'tickets',
    question: 'How do I show my ticket if my mobile internet is weak?',
    answer: 'Once booked, your digital QR pass is cached directly in your device browser local storage. You can view your pass anytime from the user profile, take a screenshot, or show the confirmation image received in your email or WhatsApp.',
  },
  {
    id: 'pay-cash',
    category: 'tickets',
    question: 'Can I pay in cash at the festival entrance?',
    answer: 'Yes! Select "Cash at Gate Counter" during pass booking or checkout. Please arrive with exact cash (₹349 per pass) at the Cashier Desk at East Heritage Gate to validate your entry QR code before stepping through the scanner.',
  },
  {
    id: 'pass-transfer',
    category: 'tickets',
    question: 'Can I transfer my pass to someone else?',
    answer: 'Yes! All passes are 100% transferable. Forward the QR pass image or confirmation email to your friend or family member, and they will be admitted upon scanning at the gate.',
  },
  {
    id: 'venue-directions',
    category: 'venue',
    question: 'Where is the venue and how do I reach IAM Kolkata?',
    answer: 'The festival is held at Institute of Advanced Management (IAM), Salt Lake Sector V, Kolkata - 700106. It is conveniently situated near the Salt Lake Stadium and Karunamoyee Metro Station (Green Line). Dedicated student ambassadors will guide you from the campus gate.',
  },
  {
    id: 'parking',
    category: 'venue',
    question: 'Is parking available on campus?',
    answer: 'Designated two-wheeler and four-wheeler visitor parking is available at the adjacent campus perimeter. Carpooling and eco-friendly public transit via the Karunamoyee Metro are strongly encouraged in alignment with our zero-carbon charter.',
  },
  {
    id: 'veg-options',
    category: 'menu',
    question: 'Are there pure vegetarian options available?',
    answer: 'Absolutely! Authentic vegetarian Bengali heritage items include Panchali Patpata Bora, Aamrasa Narkel Raj-Chop, Moong Mohon Rajdal, Rajbari Chanar Shahi Dolma, and the whole range of rustic batas, chorchoris, and bhortas at the Rural Bengal Counter.',
  },
  {
    id: 'zero-waste',
    category: 'zero_waste',
    question: 'What does "Zero-Waste Food Fest" mean in practice?',
    answer: 'Rajbari Bhojbari eliminates single-use plastics entirely. We serve food on 100% biodegradable Sal leaf platters, drinks in earthen clay cups, and practice peel-to-stem cooking (such as Kumro Chhalka & Bichi Chorchori), ensuring whole-ingredient utilization and on-site compost conversion.',
  },
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenBhojBot,
  onOpenBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tickets' | 'venue' | 'menu' | 'zero_waste'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('pass-inclusion');

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQS.filter((faq) => {
      if (selectedCategory !== 'all' && faq.category !== selectedCategory) return false;
      if (!q) return true;
      return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-center-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[96%] sm:w-full max-w-3xl max-h-[88vh] overflow-y-auto mx-auto bg-gradient-to-b from-[#1c0507] via-[#120305] to-[#0a0203] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-200 font-sans space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-amber-500/25">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 id="help-center-modal-title" className="text-lg font-bold text-white font-display">
                  Festival Help Center & FAQs
                </h3>
                <p className="text-xs text-amber-300/90">
                  Instant answers on passes, venue directions, allergens, and fest logistics
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-700/60 cursor-pointer"
              aria-label="Close Help Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Contact Help Desk Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={`tel:${FESTIVAL_INFO.phone}`}
              className="p-3 rounded-2xl bg-stone-900/90 border border-stone-700 hover:border-amber-400/60 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-stone-400 font-semibold uppercase">Phone Helpline</div>
                <div className="text-xs font-mono font-bold text-amber-200">{FESTIVAL_INFO.phone}</div>
              </div>
            </a>

            <a
              href={FESTIVAL_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/35 hover:border-emerald-400 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-emerald-300 font-semibold uppercase">WhatsApp Chat</div>
                <div className="text-xs font-mono font-bold text-emerald-200">{FESTIVAL_INFO.whatsappNumber}</div>
              </div>
            </a>

            <button
              onClick={() => {
                onClose();
                onOpenBhojBot();
              }}
              className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/35 hover:border-blue-400 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-blue-300 font-semibold uppercase">Ask Bhoj-Bot AI</div>
                <div className="text-xs font-bold text-blue-200">24/7 AI Concierge</div>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. ₹349 Eco-Pass, parking, cash, vegetarian, directions)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-400 focus:outline-none text-xs text-stone-200 placeholder-stone-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All FAQs' },
              { id: 'tickets', label: 'Tickets & Passes' },
              { id: 'venue', label: 'Venue & Parking' },
              { id: 'menu', label: 'Menu & Food' },
              { id: 'zero_waste', label: 'Zero-Waste Ethos' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-stone-950 font-bold shadow'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                No matching answers found for "{searchQuery}". Try asking Bhoj-Bot AI or call our concierge desk.
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl bg-stone-900/70 border border-stone-800 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-stone-200 hover:text-amber-200 cursor-pointer"
                    >
                      <span className="flex-1">{faq.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 text-xs text-stone-300 leading-relaxed border-t border-stone-800/60 bg-stone-950/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-stone-400 text-[11px]">
              Still have questions? Email us at <strong className="text-amber-300">{FESTIVAL_INFO.contactEmail}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold hover:scale-105 transition-all cursor-pointer shadow-md"
              >
                Book Eco-Pass (₹349)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
