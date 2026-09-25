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
  onViewSchedule?: () => void;
  onOpenSchedule?: () => void;
  onBookPass?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreMenu,
  onOpenBhojBot,
  onViewSchedule,
  onOpenSchedule,
  onBookPass,
}) => {
  const handleScheduleClick = () => {
    if (onViewSchedule) onViewSchedule();
    else if (onOpenSchedule) onOpenSchedule();
  };

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
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat border-b border-emerald-500/20 py-12 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${heroBgImage})`,
      }}
    >
      {/* Crucial Dark Overlay: Darkens the background so white 'Rajbari Bhojbari' text, green buttons, and countdown remain crystal clear */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/85 via-black/80 to-green-950/85 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-black/60 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/30 via-teal-900/20 to-transparent" />
      
      {/* Subtle Digital Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#34d399 1px, transparent 1px), linear-gradient(to right, #34d399 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing Tech Orbs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main Hero Copy & Eco-Futuristic Accents */}
          <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
            
            {/* World Tourism Day & AI Theme Badges */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wide shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>IAM Annual Food Fest 2026</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs font-medium">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>World Tourism Day: AI & Sustainable Gastronomy</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                <Recycle className="w-3 h-3 text-emerald-400" />
                <span>100% Zero Food Waste</span>
              </span>
            </div>

            {/* Main Hero Headline - Tech Sans-Serif */}
            <div className="space-y-3">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
                Rajbari Bhojbari:{' '}
                <span className="text-eco-gradient block sm:inline">
                  The Zero-Waste AI Food Fest
                </span>
              </h1>
              <p className="font-display text-lg sm:text-2xl text-emerald-300/90 font-semibold tracking-tight">
                "Authentic Heritage Flavours. Smart Gastronomy. Zero Waste."
              </p>
            </div>

            {/* Narrative Description */}
            <p className="text-stone-300 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
              Step into a celebration of authentic heritage Bengal gastronomy at the <strong>Institute of Advanced Management (IAM) Kolkata Campus</strong>. Experience centuries-old culinary traditions crafted with zero-waste sustainability, live rural tasting counters, and real-time guidance from <strong>Hospi (Bhoj-Bot AI)</strong>.
            </p>

            {/* Event Key Facts Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-emerald-200/90">
              <div className="flex items-center gap-2 bg-[#061a12]/80 border border-emerald-500/30 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>{FESTIVAL_INFO.date} • 10 AM to 9:30 PM</span>
              </div>
              <div className="flex items-center gap-2 bg-[#061a12]/80 border border-emerald-500/30 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>IAM Kolkata Campus • Smart Eco-Court</span>
              </div>
              <div className="flex items-center gap-2 bg-[#061a12]/80 border border-emerald-500/30 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">+120 Sustainability Karma Points</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              {onBookPass && (
                <button
                  id="hero-book-pass-btn"
                  onClick={onBookPass}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-950/60 border border-emerald-300/60 transition-all hover:scale-[1.03] active:scale-95 ring-2 ring-emerald-400/30 cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-stone-950" />
                  <span>Book Eco-Pass (₹349/-)</span>
                  <span className="px-1.5 py-0.5 rounded bg-black/25 text-emerald-950 text-[10px] font-black uppercase">
                    All Access
                  </span>
                </button>
              )}

              <button
                id="hero-explore-menu-btn"
                onClick={onExploreMenu}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#092218]/90 hover:bg-[#0d2d20] text-emerald-200 border border-emerald-500/40 font-semibold text-sm transition-all hover:border-cyan-400 cursor-pointer shadow-md"
              >
                <span>Zero-Waste Menu</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                id="hero-schedule-btn"
                onClick={handleScheduleClick}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#092218]/90 hover:bg-[#0d2d20] text-emerald-200 border border-emerald-500/40 font-semibold text-sm transition-all hover:border-cyan-400 cursor-pointer shadow-md"
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Fest Schedule</span>
              </button>

              <button
                id="hero-bhojbot-btn"
                onClick={onOpenBhojBot}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 text-emerald-200 border border-cyan-500/40 font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                <IAMChefLogo className="w-5 h-5" glow={false} />
                <span>Ask Hospi AI</span>
              </button>
            </div>

            {/* Event Formula Tag */}
            <div className="pt-2 text-xs text-stone-400 border-t border-emerald-900/60 flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
              <span className="font-semibold text-emerald-300">Sustainable Fest Formula: </span>
              <span className="text-emerald-100/90 font-mono">Artificial Intelligence + Zero-Waste Gastronomy + Sustainable Hospitality + Student Innovation</span>
            </div>

          </div>

          {/* Right Column: Festive Countdown & Smart Eco-Pavilions Card */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Countdown Box */}
            <div className="bg-[#071a13]/85 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/10">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grand Fest Countdown</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-300/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                  Oct 9, 2026
                </span>
              </div>

              {/* Digits Grid */}
              <div className="grid grid-cols-4 gap-2 pt-4 text-center">
                <div className="bg-[#040e0a]/90 border border-emerald-500/25 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">{timeLeft.days}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Days</div>
                </div>
                <div className="bg-[#040e0a]/90 border border-emerald-500/25 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">{timeLeft.hours}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Hours</div>
                </div>
                <div className="bg-[#040e0a]/90 border border-emerald-500/25 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">{timeLeft.minutes}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Mins</div>
                </div>
                <div className="bg-[#040e0a]/90 border border-emerald-500/25 rounded-2xl p-2.5 sm:p-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">{timeLeft.seconds}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mt-0.5">Secs</div>
                </div>
              </div>

              {/* Live Eco Metrics */}
              <div className="mt-4 pt-3 border-t border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">Target Kitchen Diversion:</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    100% Upcycled & Composted
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">AI Concierge:</span>
                  <span className="font-mono text-cyan-300 font-semibold">Hospi • Live on WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Slogan Banner */}
            <div className="bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/30 rounded-2xl p-4 text-center backdrop-blur-md">
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
