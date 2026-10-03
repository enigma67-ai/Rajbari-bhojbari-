import React from 'react';
import { Leaf, Bot, Heart, Sparkles, Cpu, Recycle } from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';
import { IAMChefLogo } from './IAMChefLogo';

interface FooterProps {
  onNavClick: (id: string) => void;
  onOpenBhojBot: () => void;
  onOpenDPDPPolicy?: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms' | 'refund' | 'disclaimer' | 'cookies' | 'security' | 'accessibility' | 'community') => void;
  onOpenCookiePreferences?: () => void;
  onOpenGuide?: () => void;
  onOpenHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onNavClick, 
  onOpenBhojBot, 
  onOpenDPDPPolicy,
  onOpenLegal,
  onOpenCookiePreferences,
  onOpenGuide,
  onOpenHelp,
}) => {
  const handleLegalClick = (tab: 'privacy' | 'terms' | 'refund' | 'disclaimer' | 'cookies' | 'security' | 'accessibility' | 'community') => {
    if (onOpenLegal) {
      onOpenLegal(tab);
    } else if (onOpenDPDPPolicy) {
      onOpenDPDPPolicy();
    }
  };

  return (
    <footer className="bg-[#120305] border-t border-amber-500/25 text-stone-300 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-amber-900/60">
        
        {/* Brand Info */}
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-amber-500/40 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <IAMChefLogo size={36} />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-wide block">
                {FESTIVAL_INFO.title}
              </span>
              <span className="text-[10px] text-amber-400 font-medium">
                {FESTIVAL_INFO.subtitle}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            {FESTIVAL_INFO.tagline}. Aligned with UN SDG 12 (Responsible Consumption) & Smart Culinary AI Systems.
          </p>
          <div className="flex items-center gap-2 pt-1 text-emerald-400 text-[11px] font-medium">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Zero-Waste & Compostable Event</span>
          </div>
        </div>

        {/* Four Authentic Counters */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Recycle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Festival Counters</span>
          </h4>
          <ul className="space-y-1.5 text-stone-300 text-xs">
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-amber-300 transition-colors text-left cursor-pointer">
                Authentic Starters (₹349 each)
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-amber-300 transition-colors text-left cursor-pointer">
                Rural Bengal Counter (₹0 Complimentary)
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-amber-300 transition-colors text-left cursor-pointer">
                Main Course Combos (₹349 each)
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('menu-section')} className="hover:text-amber-300 transition-colors text-left cursor-pointer">
                Misti Mukh Platter (+₹99 Add-on)
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('ticket-booking')} className="text-amber-400 font-bold hover:text-amber-300 transition-colors text-left cursor-pointer">
                Book ₹349 Eco-Pass →
              </button>
            </li>
          </ul>
        </div>

        {/* Guest Support & Orientation */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guest Orientation</span>
          </h4>
          <ul className="space-y-1.5 text-stone-300 text-xs">
            {onOpenGuide && (
              <li>
                <button onClick={onOpenGuide} className="hover:text-amber-300 transition-colors cursor-pointer text-left font-semibold text-amber-200">
                  Festival Guide & Tour
                </button>
              </li>
            )}
            {onOpenHelp && (
              <li>
                <button onClick={onOpenHelp} className="hover:text-amber-300 transition-colors cursor-pointer text-left">
                  Help Center & FAQs
                </button>
              </li>
            )}
            <li>
              <button onClick={onOpenBhojBot} className="hover:text-blue-300 transition-colors flex items-center gap-1.5 cursor-pointer">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-400 font-semibold">Ask Bhoj-Bot AI</span>
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('feedback-section')} className="hover:text-amber-300 transition-colors cursor-pointer">
                Sustainability Guestbook
              </button>
            </li>
            <li>
              <button onClick={() => onNavClick('contact-section')} className="hover:text-amber-300 transition-colors cursor-pointer">
                Campus Location & Metro
              </button>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance Center */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Legal & Policies</span>
          </h4>
          <ul className="space-y-1.5 text-stone-300 text-xs">
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('privacy')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Privacy Policy (DPDP Act)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('terms')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Terms of Service & Entry Rules
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('refund')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Refund & Cancellation Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('disclaimer')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Allergen & Culinary Notice
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('cookies')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Cookie & Storage Disclosures
              </button>
            </li>
            {onOpenCookiePreferences && (
              <li>
                <button
                  type="button"
                  onClick={onOpenCookiePreferences}
                  className="text-amber-400 hover:text-amber-300 transition-colors text-left cursor-pointer"
                >
                  Cookie Preferences
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('security')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Security & Disclosure
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('accessibility')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Accessibility Statement
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleLegalClick('community')}
                className="hover:text-amber-300 transition-colors text-left cursor-pointer"
              >
                Community Guidelines
              </button>
            </li>
          </ul>
        </div>

        {/* Academic Host & Helpline */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Host & Concierge Desk
          </h4>
          <p className="text-amber-200 font-semibold text-xs">
            Institute of Advanced Management (IAM)
          </p>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            Salt Lake Sector V, Kolkata, West Bengal 700106. Spearheading sustainable hospitality and AI gastronomy research.
          </p>
          
          <div className="space-y-1 pt-1 text-[11px]">
            <div className="text-stone-300">
              <span className="text-amber-400 font-semibold">Help line & Concierge:</span>{' '}
              <a href="tel:+918334055747" className="text-amber-200 font-mono hover:underline">
                +91 83340 55747
              </a>
            </div>
            <div className="text-stone-300">
              <span className="text-amber-400 font-semibold">Office Communication:</span>{' '}
              <a href="mailto:ks7901424@gmail.com" className="text-amber-200 font-mono hover:underline">
                ks7901424@gmail.com
              </a>
            </div>
          </div>

          {/* WhatsApp Connect Prominent Button */}
          <div className="pt-2">
            <a
              href="https://wa.me/917365928593"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold border border-emerald-400/40 shadow-md shadow-emerald-950/40 hover:scale-105 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>WhatsApp Connect (+91 73659 28593)</span>
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span>© 2026 IAM AI ZERO-WASTE FOOD FEST • Institute of Advanced Management (IAM), Kolkata.</span>
          <button
            type="button"
            onClick={() => handleLegalClick('privacy')}
            className="text-amber-400 hover:text-amber-300 transition-colors underline cursor-pointer"
          >
            DPDP Privacy Notice
          </button>
          <button
            type="button"
            onClick={() => handleLegalClick('terms')}
            className="text-amber-400 hover:text-amber-300 transition-colors underline cursor-pointer"
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => onNavClick('admin')}
            className="text-amber-400 hover:text-amber-300 transition-colors font-mono underline cursor-pointer"
          >
            Gate Staff Terminal (/admin)
          </button>
        </div>
        <div className="flex items-center gap-1 text-amber-300">
          <span>Pioneered with</span>
          <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>by IAM Hospitality Students & Gemini AI</span>
        </div>
      </div>
    </footer>
  );
};
