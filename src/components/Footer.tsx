import React from 'react';
import { Leaf, Bot, Heart, Sparkles, Cpu, Recycle } from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';
import { IAMChefLogo } from './IAMChefLogo';

interface FooterProps {
  onNavClick: (id: string) => void;
  onOpenBhojBot: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick, onOpenBhojBot }) => {
  return (
    <footer className="bg-[#030a06] border-t border-emerald-500/20 text-emerald-100/70 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-emerald-950/70">
        
        {/* Brand Info */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <IAMChefLogo size={36} />
            </div>
            <div>
              <span className="font-bold text-emerald-100 text-sm tracking-wide block">
                {FESTIVAL_INFO.title}
              </span>
              <span className="text-[10px] text-cyan-400 font-medium">
                {FESTIVAL_INFO.subtitle}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-200/70 leading-relaxed">
            {FESTIVAL_INFO.tagline}. Aligned with UN SDG 12 (Responsible Consumption) & Smart Culinary AI Systems.
          </p>
          <div className="flex items-center gap-2 pt-1 text-emerald-400 text-[11px] font-medium">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Zero-Waste & Compostable Event</span>
          </div>
        </div>

        {/* Four Authentic Counters */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Recycle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Festival Counters</span>
          </h4>
          <ul className="space-y-1.5 text-emerald-100/70 text-xs">
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-emerald-300 transition-colors text-left">
                Authentic Starters (₹349 each)
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-emerald-300 transition-colors text-left">
                Rural Bengal Counter (₹0 Complimentary)
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-emerald-300 transition-colors text-left">
                Main Course Combos (₹349 each)
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-emerald-300 transition-colors text-left">
                Misti Mukh Platter (+₹99 Add-on)
              </button>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Features</span>
          </h4>
          <ul className="space-y-1.5 text-emerald-100/70 text-xs">
            <li>
              <button onClick={() => onNavClick('ticket-booking')} className="hover:text-emerald-300 transition-colors">
                Book Eco-Pass & Meal Vouchers
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('schedule-section')} className="hover:text-emerald-300 transition-colors">
                AI Schedule & Live Workshops
              </button>
            </li>
            <li>
              <button onClick={onOpenBhojBot} className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hospi Bot AI Eco Concierge</span>
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('feedback-section')} className="hover:text-emerald-300 transition-colors">
                Eco Guestbook & Feedback
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('contact-section')} className="hover:text-emerald-300 transition-colors">
                Campus Location & Eco-Transit
              </button>
            </li>
          </ul>
        </div>

        {/* Academic Host */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Host Institution
          </h4>
          <p className="text-emerald-100 font-semibold text-xs">
            Institute of Advanced Management (IAM)
          </p>
          <p className="text-[11px] text-emerald-200/70 leading-relaxed">
            Salt Lake Sector V, Kolkata, West Bengal. Spearheading sustainable hospitality, smart zero-waste cooking, and AI gastronomy research.
          </p>
          <div className="pt-2 text-[11px] text-cyan-400">
            Helpline: {FESTIVAL_INFO.phone}
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-emerald-400/60">
        <div>
          © 2026 IAM AI ZERO-WASTE FOOD FEST • Institute of Advanced Management (IAM). All rights reserved.
        </div>
        <div className="flex items-center gap-1 text-emerald-300/80">
          <span>Pioneered with</span>
          <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>by IAM Hospitality Students & Gemini AI</span>
        </div>
      </div>
    </footer>
  );
};
