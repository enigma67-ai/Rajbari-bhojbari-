import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  Leaf, 
  ArrowRight,
  Ticket,
  Cpu,
  Recycle,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';
import { IAMChefLogo } from './IAMChefLogo';
import heroBgImage from '../assets/1790315575567.png';

interface HeroBannerProps {
  onExploreMenu: () => void;
  onOpenBhojBot: () => void;
  onBookPass?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreMenu,
  onOpenBhojBot,
  onBookPass,
}) => {
  // Countdown to Friday 9th October 2026 10:00 AM IST
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date('2026-10-09T10:00:00+05:30').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat border-b border-amber-500/25 py-10 sm:py-16 md:py-20 lg:py-24 px-3 sm:px-6 lg:px-8 w-full max-w-[100vw]"
      style={{
        backgroundImage: `url(${heroBgImage})`,
      }}
    >
      {/* Crucial Royal Red & Gold Heritage Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/90 via-[#200508]/85 to-[#150406]/95 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-black/55 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/30 via-red-950/30 to-transparent" />
      
      {/* Subtle Digital Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #f59e0b 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing Royal Gold & Crimson Orbs */}
      <div className="absolute -top-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main Hero Copy & Royal Red Accents */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6 text-center lg:text-left min-w-0 w-full">
            
            {/* World Tourism Day & AI Theme Badges */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-red-950/80 border border-amber-500/40 text-amber-200 text-[11px] sm:text-xs font-semibold tracking-wide shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>IAM Annual Food Fest 2026</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-medium">
                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>World Tourism Day: AI & Gastronomy</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-[11px] font-bold border border-emerald-400/30">
                <Recycle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% Zero Food Waste</span>
              </span>
            </div>

            {/* Main Hero Headline */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] break-words">
                Rajbari Bhojbari:{' '}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent block sm:inline">
                  The Zero-Waste AI Food Fest
                </span>
              </h1>
              <p className="font-display text-base sm:text-xl md:text-2xl text-amber-200/90 font-semibold tracking-tight break-words">
                "Authentic Heritage Flavours. Smart Gastronomy. Zero Waste."
              </p>
            </div>

            {/* Narrative Description */}
            <p className="text-stone-300 text-xs sm:text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed break-words">
              Step into a celebration of authentic heritage Bengal gastronomy at the <strong>Institute of Advanced Management (IAM) Kolkata Campus</strong>. Experience centuries-old culinary traditions crafted with zero-waste sustainability, live rural tasting counters, and real-time guidance from <strong>Bhoj-Bot</strong>.
            </p>

            {/* Event Key Facts Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-amber-200/90">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#200609]/85 border border-amber-500/30 px-3 py-1.5 sm:py-2 rounded-xl backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span>{FESTIVAL_INFO.date} • 10 AM to 9:30 PM</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#200609]/85 border border-amber-500/30 px-3 py-1.5 sm:py-2 rounded-xl backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span>IAM Kolkata Campus • Smart Eco-Court</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#200609]/85 border border-amber-500/30 px-3 py-1.5 sm:py-2 rounded-xl backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-semibold">4 Authentic Bengali Mohols</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-2">
              {onBookPass && (
                <button
                  id="hero-book-pass-btn"
                  onClick={onBookPass}
                  className="flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] border border-amber-300/60 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-stone-950 shrink-0" />
                  <span>Booking Pass (₹349/-)</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/25 text-stone-950 text-[10px] font-black uppercase">
                    All Access
                  </span>
                </button>
              )}

              <button
                id="hero-explore-menu-btn"
                onClick={onExploreMenu}
                className="flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-[#24080c]/90 hover:bg-[#340c12] text-amber-100 border border-amber-500/40 font-semibold text-xs sm:text-sm transition-all hover:border-amber-400 cursor-pointer shadow-md"
              >
                <span>Zero-Waste Menu</span>
                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
              </button>

              <button
                id="hero-bhojbot-btn"
                onClick={onOpenBhojBot}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 border border-blue-500/40 font-semibold text-xs sm:text-sm transition-all shadow-md cursor-pointer hover:border-blue-400"
              >
                <IAMChefLogo className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" glow={false} />
                <span className="text-blue-300 font-bold">Ask Bhoj-Bot</span>
              </button>
            </div>

            {/* Event Formula Tag */}
            <div className="pt-2 text-[11px] sm:text-xs text-stone-400 border-t border-amber-900/60 flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
              <span className="font-semibold text-amber-300">Sustainable Fest Formula: </span>
              <span className="text-amber-100/90 font-mono break-words">AI + Zero-Waste Gastronomy + Sustainable Hospitality</span>
            </div>

          </div>

          {/* Right Column: Festive Countdown & Smart Eco-Pavilions Card */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Countdown Box */}
            <div className="bg-[#1c0609]/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl ring-1 ring-amber-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Grand Fest Countdown</span>
                </span>
                <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-700/50">
                  Oct 9, 2026
                </span>
              </div>

              {/* Digits Grid */}
              <div className="grid grid-cols-4 gap-2 pt-4 text-center">
                <div className="bg-[#120305]/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">{timeLeft.days}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Days</div>
                </div>
                <div className="bg-[#120305]/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">{timeLeft.hours}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Hours</div>
                </div>
                <div className="bg-[#120305]/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">{timeLeft.minutes}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Mins</div>
                </div>
                <div className="bg-[#120305]/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">{timeLeft.seconds}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Secs</div>
                </div>
              </div>

              {/* Live Eco Metrics */}
              <div className="mt-4 pt-3 border-t border-amber-500/20 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">Target Kitchen Diversion:</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    100% Upcycled & Composted
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">AI Concierge:</span>
                  <span className="font-mono text-blue-300 font-semibold">Bhoj-Bot • Live Chat</span>
                </div>
              </div>
            </div>

            {/* Slogan Banner */}
            <div className="bg-gradient-to-r from-red-950/90 to-[#2c080d]/90 border border-amber-500/30 rounded-2xl p-4 text-center backdrop-blur-md">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
                Official Festival Mission
              </span>
              <span className="text-sm font-display font-extrabold text-white mt-1 block">
                "Smart Gastronomy. Zero Waste. Sustainable Future."
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
