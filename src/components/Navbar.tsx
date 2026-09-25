import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Calendar, 
  Leaf, 
  MessageSquare, 
  PhoneCall, 
  ShoppingBag,
  Award,
  LogOut,
  Menu,
  X,
  KeyRound,
  Ticket,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { IAMChefLogo } from './IAMChefLogo';

interface NavbarProps {
  cartCount: number;
  userBookingsCount?: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenBhojBot: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onNavClick: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  userBookingsCount = 0,
  onOpenCart,
  onOpenAuth,
  onOpenBhojBot,
  currentUser,
  onLogout,
  onNavClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'ticket-booking', label: 'Eco-Pass (₹349)', icon: Ticket, highlight: true },
    { id: 'menu-section', label: 'Zero-Waste Menu', icon: UtensilsCrossed },
    { id: 'schedule-section', label: 'Fest Schedule', icon: Calendar },
    { id: 'feedback-section', label: 'Sustainability Wall', icon: MessageSquare },
    { id: 'contact-section', label: 'Campus Venue', icon: PhoneCall },
  ];

  const handleLinkClick = (id: string) => {
    onNavClick(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#06120d]/95 backdrop-blur-xl border-b border-emerald-500/20 shadow-xl shadow-black/40">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-950 text-emerald-200 text-xs py-1.5 px-4 text-center border-b border-emerald-600/30 flex items-center justify-center gap-2 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>RAJBARI BHOJBARI 2026 • <strong>Friday, 9th October 2026</strong> • The Zero-Waste AI Food Fest</span>
        <span className="hidden md:inline text-cyan-300/90">| IAM Kolkata Campus • Authentic Bengal Heritage</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo / Brand Title with IAM Chef Mascot */}
          <button 
            id="nav-logo-btn"
            onClick={() => handleLinkClick('menu-section')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group transition-transform hover:scale-[1.01]"
          >
            <IAMChefLogo className="w-11 h-11 sm:w-12 sm:h-12" glow={true} />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-extrabold text-base sm:text-xl md:text-2xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  RAJBARI <span className="text-emerald-400">BHOJBARI</span> 2026
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/30">
                  AI FOOD FEST
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-300/70 font-sans tracking-tight">
                Institute of Advanced Management • The Zero-Waste Food Fest
              </p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-300 hover:text-emerald-200 hover:bg-emerald-950/40 transition-all"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* HOSPI / BHOJ-BOT Quick Trigger */}
            <button
              id="nav-bhojbot-btn"
              onClick={onOpenBhojBot}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-500/40 text-emerald-200 hover:text-white hover:border-cyan-400 shadow-md text-xs sm:text-sm font-semibold transition-all group"
            >
              <IAMChefLogo className="w-5 h-5" glow={false} />
              <span className="hidden sm:inline">Ask Hospi AI</span>
              <span className="bg-cyan-400 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                AI
              </span>
            </button>

            {/* Saved Bookings Indicator */}
            {userBookingsCount > 0 && (
              <button
                id="nav-bookings-pill"
                onClick={onOpenBhojBot}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs hover:border-emerald-400 transition-colors"
                title="Hospi AI remembers your bookings"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{userBookingsCount} Eco-Pass{userBookingsCount > 1 ? 'es' : ''}</span>
              </button>
            )}

            {/* Book Pass / Eco-Pass CTA Button */}
            <button
              id="nav-book-pass-cta-btn"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-bold text-xs shadow-md shadow-emerald-950/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="View Eco-Pass & Plate (Opens Cart)"
            >
              <Ticket className="w-3.5 h-3.5 text-stone-950" />
              <span>Eco-Pass ({cartCount > 0 ? cartCount : '₹349'})</span>
            </button>

            {/* Cart / Smart Eco-Plate Button */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-stone-900/80 border border-emerald-500/30 text-stone-200 hover:text-emerald-300 hover:border-emerald-400 transition-colors cursor-pointer"
              title="View Smart Eco-Plate / Cart"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-stone-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#06120d] shadow-sm animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Eco-Pass Login */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-700/60 flex items-center justify-center font-bold text-xs text-emerald-100 border border-emerald-400/40">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="font-semibold text-emerald-100 truncate max-w-[90px]">{currentUser.name}</div>
                    <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                      <Award className="w-3 h-3 inline text-emerald-400" />
                      <span>{currentUser.sustainabilityKarma} pts</span>
                    </div>
                  </div>
                </div>
                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Eco-Pass Login</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Submenu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-emerald-900/60 space-y-1.5 animate-fade-in">
            {/* Mobile User Profile or Login */}
            {currentUser ? (
              <div className="p-3 mb-2 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-200">{currentUser.name}</div>
                  <div className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Award className="w-3 h-3 text-emerald-400" />
                    <span>{currentUser.sustainabilityKarma} eco points</span>
                  </div>
                </div>
                <button
                  id="mobile-nav-logout-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-rose-400 text-xs font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                id="mobile-nav-login-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full mb-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Eco-Pass Login (WhatsApp OTP)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full uppercase font-black">
                  Instant
                </span>
              </button>
            )}

            {/* Mobile View Cart Button */}
            <button
              id="mobile-nav-cart-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCart();
              }}
              className="w-full mb-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>View Eco-Plate & Cart</span>
              </div>
              <span className="bg-emerald-500 text-stone-950 font-black px-2 py-0.5 rounded-full text-[10px]">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </button>

            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  id={`mobile-nav-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-300 hover:text-emerald-200 hover:bg-emerald-950/40 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
};

