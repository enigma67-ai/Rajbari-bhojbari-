import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Leaf, 
  MessageSquare, 
  PhoneCall, 
  ShoppingBag,
  LogOut, 
  Menu, 
  X, 
  KeyRound, 
  Ticket, 
  Sparkles,
  Bot,
  User,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { UserProfile } from '../types';
import { IAMChefLogo } from './IAMChefLogo';

interface NavbarProps {
  cartCount?: number;
  cartTotal?: number;
  userBookingsCount?: number;
  userTicketsCount?: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenGuide?: () => void;
  onOpenHelp?: () => void;
  onOpenBhojBot: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onNavClick: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount = 0,
  cartTotal = 0,
  userBookingsCount = 0,
  userTicketsCount = 0,
  onOpenCart,
  onOpenAuth,
  onOpenProfile,
  onOpenGuide,
  onOpenHelp,
  onOpenBhojBot,
  currentUser,
  onLogout,
  onNavClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'ticket-booking', label: 'Booking Pass (₹349)', icon: Ticket, highlight: true },
    { id: 'menu-section', label: 'Zero-Waste Menu', icon: UtensilsCrossed },
    { id: 'feedback-section', label: 'Sustainability Wall', icon: MessageSquare },
    { id: 'contact-section', label: 'Campus Venue', icon: PhoneCall },
  ];

  const handleLinkClick = (id: string) => {
    onNavClick(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#160406]/95 backdrop-blur-xl border-b border-amber-500/25 shadow-xl shadow-black/50 w-full max-w-[100vw] overflow-hidden">
      {/* Top Banner Notice */}
      <div className="w-full bg-gradient-to-r from-red-950 via-[#26080c] to-stone-950 text-amber-200 text-xs py-1.5 px-3 sm:px-4 text-center border-b border-amber-600/30 font-medium overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mx-auto text-center justify-center min-w-0 overflow-hidden">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs truncate">
              RAJBARI BHOJBARI 2026 • <strong>Fri, 9th Oct 2026</strong>
              <span className="hidden sm:inline"> • The Zero-Waste AI Food Fest</span>
              <span className="hidden md:inline text-amber-300/90"> | IAM Kolkata Campus</span>
            </span>
          </div>
        
          <div className="hidden sm:flex items-center gap-3 text-[11px] shrink-0">
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="text-amber-300 hover:text-amber-100 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <BookOpen className="w-3 h-3 text-amber-400" />
                <span>Festival Guide</span>
              </button>
            )}
            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                className="text-stone-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>Help & FAQs</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-4 min-w-0">
          
          {/* Logo / Brand Title with IAM Chef Mascot */}
          <button 
            id="nav-logo-btn"
            onClick={() => handleLinkClick('menu-section')}
            className="flex items-center gap-1.5 sm:gap-3 text-left group transition-transform hover:scale-[1.01] cursor-pointer min-w-0 shrink"
          >
            <IAMChefLogo className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 shrink-0" glow={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-display font-extrabold text-xs xs:text-sm sm:text-lg md:text-xl lg:text-2xl tracking-tight text-white group-hover:text-amber-300 transition-colors truncate">
                  RAJBARI <span className="text-amber-400">BHOJBARI</span> 2026
                </span>
                <span className="hidden md:inline-block bg-emerald-950/60 text-emerald-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/40 shrink-0">
                  AI FOOD FEST
                </span>
              </div>
              <p className="text-[8px] xs:text-[9px] sm:text-xs text-amber-200/70 font-sans tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
                Institute of Advanced Management • Zero-Waste Fest
              </p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-red-950/50 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Bhoj-Bot Quick Trigger */}
            <button
              id="nav-bhojbot-btn"
              onClick={onOpenBhojBot}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:text-white hover:border-blue-400 shadow-md text-xs font-semibold transition-all group cursor-pointer shrink-0"
              title="Ask Bhoj-Bot"
            >
              <Bot className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="hidden lg:inline font-bold text-blue-400">Ask Bhoj-Bot</span>
              <span className="hidden sm:inline bg-blue-500 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                AI
              </span>
            </button>

            {/* Cart / Smart Plate Drawer Button with Live Counter & Total Value Display */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-red-950 via-[#2a080d] to-stone-900 border border-amber-500/50 hover:border-amber-400 text-stone-200 hover:text-amber-300 transition-all cursor-pointer shrink-0 shadow-md group"
              title="View Smart Plate / Cart"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-emerald-500 text-stone-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] uppercase font-bold text-amber-300/80 hidden xs:block">Plate</span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-300">
                  ₹{cartTotal}
                </span>
              </div>
            </button>

            {/* User Profile / Login Button */}
            {currentUser ? (
              <button
                id="nav-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-950/60 border border-amber-400/50 text-amber-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-md"
                title="View My Passes & Account"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline max-w-[80px] truncate">{currentUser.name.split(' ')[0]}</span>
                {(userTicketsCount > 0 || userBookingsCount > 0) && (
                  <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {userTicketsCount || userBookingsCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                id="nav-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-400 text-stone-200 hover:text-amber-200 text-xs font-semibold transition-all cursor-pointer shrink-0"
                title="Sign In"
              >
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Primary Action Button: 'Booking Pass' (hidden on mobile since bottom floating CTA and mobile menu have it) */}
            <button
              id="nav-booking-pass-btn"
              onClick={() => handleLinkClick('ticket-booking')}
              className="hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-950/50 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <Ticket className="w-3.5 h-3.5 text-stone-950 shrink-0" />
              <span className="whitespace-nowrap">Booking Pass</span>
            </button>

            {/* Gate Staff Admin Portal Trigger */}
            <button
              id="nav-admin-portal-btn"
              onClick={() => onNavClick('admin')}
              className="hidden xs:flex p-2 sm:p-2.5 rounded-xl bg-stone-900/80 border border-amber-500/30 text-amber-400 hover:text-amber-200 hover:border-amber-400 transition-colors cursor-pointer shrink-0"
              title="Gate Staff Admin Portal"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Submenu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-amber-900/60 space-y-1.5 animate-fade-in">
            {/* Primary Mobile Action: Booking Pass */}
            <button
              id="mobile-nav-booking-pass-btn"
              onClick={() => handleLinkClick('ticket-booking')}
              className="w-full mb-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-md text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-stone-950" />
                <span>Booking Pass</span>
              </div>
              <span className="text-[10px] bg-black/20 text-stone-950 px-2 py-0.5 rounded-full font-black">
                ₹349 Entry
              </span>
            </button>

            {/* Profile or Sign in on Mobile */}
            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenProfile) onOpenProfile();
                }}
                className="w-full mb-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-950/80 border border-amber-500/40 text-amber-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>My Passes & Account ({currentUser.name})</span>
                </div>
                <span className="text-amber-400 font-mono text-[11px]">View →</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full mb-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-stone-900 border border-stone-800 text-stone-200 text-left"
              >
                <User className="w-4 h-4 text-stone-400" />
                <span>Guest Sign In / Register</span>
              </button>
            )}

            {/* Mobile View Cart Button */}
            <button
              id="mobile-nav-cart-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCart();
              }}
              className="w-full mb-2 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-red-950/80 border border-amber-500/40 text-amber-200 hover:bg-red-900 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>View Food Plate & Cart</span>
              </div>
              <span className="text-amber-300 font-mono">₹{cartTotal}</span>
            </button>

            {/* Orientation & Help */}
            <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
              {onOpenGuide && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGuide();
                  }}
                  className="px-3 py-2 rounded-xl bg-stone-900/80 border border-stone-800 text-amber-300 text-xs font-semibold flex items-center gap-1.5 text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Festival Guide</span>
                </button>
              )}
              {onOpenHelp && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenHelp();
                  }}
                  className="px-3 py-2 rounded-xl bg-stone-900/80 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5 text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Help & FAQs</span>
                </button>
              )}
            </div>

            {/* Mobile Nav Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  id={`mobile-nav-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-300 hover:text-amber-200 hover:bg-red-950/50 transition-colors text-left cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Mobile Admin Staff Portal */}
            <button
              id="mobile-nav-admin-login-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavClick('admin');
              }}
              className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 bg-black/50 border border-amber-500/30 text-left cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Gate Staff Admin Portal</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

