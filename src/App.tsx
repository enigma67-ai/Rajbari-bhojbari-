import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MenuSection } from './components/MenuSection';
import { ScheduleSection } from './components/ScheduleSection';
import { FeedbackSection } from './components/FeedbackSection';
import { ContactSection } from './components/ContactSection';
import { TicketBookingSection } from './components/TicketBookingSection';
import { Footer } from './components/Footer';
import { AdminGatePage } from './components/AdminGatePage';

// Modals
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { DishDetailModal } from './components/DishDetailModal';
import { BhojBotModal } from './components/BhojBotModal';
import { AIPlateSuggesterModal } from './components/AIPlateSuggesterModal';
import { CelebrationModal, CelebrationData } from './components/CelebrationModal';
import { DPDPPrivacyModal } from './components/DPDPPrivacyModal';

// Types & Data
import { MenuItem, CartItem, UserProfile, EventTicketPass } from './types';
import { Bot, Sparkles, ShoppingBag, Ticket } from 'lucide-react';
import { 
  auth, 
  onAuthStateChanged, 
  logOut, 
  getUserBookings, 
  testFirestoreConnection, 
  SavedBooking 
} from './lib/firebase';
import { 
  supabase,
  recordUserLoginToSupabase, 
  recordVisitorAnalyticsToSupabase 
} from './lib/supabase';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('rb_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // User Bookings & Reservation state (persisted with Firestore)
  const [userBookings, setUserBookings] = useState<SavedBooking[]>(() => {
    try {
      const local = localStorage.getItem('rb_saved_bookings');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // User Booked Event Passes (Mandatory Entry Tickets)
  const [userTickets, setUserTickets] = useState<EventTicketPass[]>(() => {
    try {
      const saved = localStorage.getItem('rb_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rb_tickets', JSON.stringify(userTickets));
    } catch (e) {
      console.error(e);
    }
  }, [userTickets]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('rb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal Open States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isBhojBotOpen, setIsBhojBotOpen] = useState(false);
  const [isPlateSuggesterOpen, setIsPlateSuggesterOpen] = useState(false);
  const [isDPDPModalOpen, setIsDPDPModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [bhojBotInitialQuery, setBhojBotInitialQuery] = useState<string>('');
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  // Persist Cart
  useEffect(() => {
    try {
      localStorage.setItem('rb_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Persist Bookings to local cache & sync with Firestore
  useEffect(() => {
    try {
      localStorage.setItem('rb_saved_bookings', JSON.stringify(userBookings));
    } catch (e) {
      console.error(e);
    }
  }, [userBookings]);

  // Firebase connection test & Auth listener & Visitor Analytics
  useEffect(() => {
    testFirestoreConnection();

    // Track visitor analytics in Supabase & Microsoft Clarity
    recordVisitorAnalyticsToSupabase('page_view', {
      title: typeof document !== 'undefined' ? document.title : 'Rajbari Bhojbari 2026',
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
    });

    const unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser: any) => {
      if (firebaseUser) {
        const userProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Eco Patron',
          emailOrPhone: firebaseUser.email || firebaseUser.phoneNumber || 'google_user',
          role: 'guest',
          institution: 'Sustainable Culinary Patron',
          sustainabilityKarma: 100,
          tokens: ['welcome_patron', 'zero_waste_2026'],
        };
        setCurrentUser(userProfile);
        try {
          localStorage.setItem('rb_user', JSON.stringify(userProfile));
        } catch (_) {}

        // Record login audit in Supabase
        recordUserLoginToSupabase({
          id: userProfile.id,
          name: userProfile.name,
          emailOrPhone: userProfile.emailOrPhone,
          role: userProfile.role,
        }, 'google');

        // Load persisted bookings from Firestore
        getUserBookings(firebaseUser.uid).then((bks) => {
          if (bks && bks.length > 0) {
            setUserBookings(bks);
          }
        });
      }
    });

    // 1. Supabase Check Cached Session on Mount (Safe try-catch wrapper)
    try {
      supabase.auth.getSession()
        .then(({ data }) => {
          const session = data?.session;
          if (session?.user) {
            const userEmail = session?.user?.email || '';
            const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '';
            const phoneFormatted = session?.user?.phone || '';
            const profile: UserProfile = {
              id: session.user.id || 'supabase_user',
              name: userName || (phoneFormatted ? `Eco Guest (${phoneFormatted.slice(-4)})` : 'Eco Guest'),
              emailOrPhone: userEmail || phoneFormatted || 'supabase_user',
              role: (session.user.user_metadata?.role as any) || 'guest',
              institution: session.user.user_metadata?.institution || 'IAM Kolkata',
              sustainabilityKarma: 120,
              tokens: ['welcome_patron', 'zero_waste_2026', 'supabase_auth'],
            };
            setCurrentUser(profile);
            try {
              localStorage.setItem('rb_user', JSON.stringify(profile));
            } catch (_) {}
          }
        })
        .catch((err) => {
          console.warn('Supabase getSession notice:', err);
        });
    } catch (err) {
      console.warn('Initial Supabase session check error:', err);
    }

    // 2. Supabase Auth State Change Listener (OAuth redirects and session refresh)
    let authSubscription: { unsubscribe: () => void } | null = null;
    try {
      const { data: supabaseAuthListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (session?.user) {
            const userEmail = session?.user?.email || '';
            const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '';
            const phoneFormatted = session?.user?.phone || '';
            const profile: UserProfile = {
              id: session.user.id || 'supabase_user',
              name: userName || (phoneFormatted ? `Eco Guest (${phoneFormatted.slice(-4)})` : 'Eco Guest'),
              emailOrPhone: userEmail || phoneFormatted || 'supabase_user',
              role: (session.user.user_metadata?.role as any) || 'guest',
              institution: session.user.user_metadata?.institution || 'IAM Kolkata',
              sustainabilityKarma: 120,
              tokens: ['welcome_patron', 'zero_waste_2026', 'supabase_auth'],
            };
            setCurrentUser(profile);
            try {
              localStorage.setItem('rb_user', JSON.stringify(profile));
            } catch (_) {}

            // Clean the URL by removing OAuth tokens/queries (?code=... or hash) using window.history.replaceState
            if (typeof window !== 'undefined' && (window.location.search.includes('code=') || window.location.hash.includes('access_token'))) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Record login audit in Supabase
            recordUserLoginToSupabase({
              id: profile.id,
              name: profile.name,
              emailOrPhone: profile.emailOrPhone,
              role: profile.role,
            }, 'google');
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            try {
              localStorage.removeItem('rb_user');
            } catch (_) {}
          }
        } catch (authErr) {
          console.warn('Error in auth state change handler:', authErr);
        }
      });
      authSubscription = supabaseAuthListener?.subscription || null;
    } catch (err) {
      console.warn('Supabase onAuthStateChange registration error:', err);
    }

    return () => {
      unsubscribeFirebase();
      authSubscription?.unsubscribe();
    };
  }, []);

  // Persist User
  const handleUserLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('rb_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    // Record login in Supabase
    recordUserLoginToSupabase({
      id: user.id,
      name: user.name,
      emailOrPhone: user.emailOrPhone,
      role: user.role,
      institution: user.institution,
      sustainabilityKarma: user.sustainabilityKarma,
    });

    if (user.id) {
      getUserBookings(user.id).then((bks) => {
        if (bks && bks.length > 0) {
          setUserBookings(bks);
        }
      });
    }
  };

  const handleUserLogout = async () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('rb_user');
      await logOut();
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  // Cart operations
  const handleAddToCart = (dish: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const handleAddMultipleToCart = (dishes: MenuItem[]) => {
    setCart((prev) => {
      const newCart = [...prev];
      for (const dish of dishes) {
        const found = newCart.find((i) => i.dish.id === dish.id);
        if (found) {
          found.quantity += 1;
        } else {
          newCart.push({ dish, quantity: 1 });
        }
      }
      return newCart;
    });
  };

  const handleUpdateQuantity = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dish.id !== dishId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Bhoj-Bot Contextual inquiry
  const handleAskBhojBotAboutDish = (dish: MenuItem) => {
    setBhojBotInitialQuery(`Tell me the century-old story and zero-waste preparation of ${dish.name} (${dish.bengaliName}) from ${dish.moholTitle}.`);
    setIsBhojBotOpen(true);
  };

  // Route Listener for /admin
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p === '/admin' || p.startsWith('/admin') || h === '#admin') return '/admin';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p === '/admin' || p.startsWith('/admin') || h === '#admin') {
        setCurrentRoute('/admin');
      } else {
        setCurrentRoute('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateToAdmin = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin');
    }
    setCurrentRoute('/admin');
  };

  const navigateToHome = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setCurrentRoute('/');
  };

  // If on /admin route, render dedicated Gate Staff Admin page
  if (currentRoute === '/admin') {
    return <AdminGatePage onNavigateToHome={navigateToHome} />;
  }

  // Smooth scroll handler
  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'admin' || sectionId === '/admin') {
      navigateToAdmin();
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartTotalCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#120305] text-amber-50 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      
      {/* Navigation Header */}
      <Navbar
        cartCount={cartTotalCount}
        userBookingsCount={userBookings.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenBhojBot={() => {
          setBhojBotInitialQuery('');
          setIsBhojBotOpen(true);
        }}
        currentUser={currentUser}
        onLogout={handleUserLogout}
        onNavClick={handleNavigate}
      />

      {/* Main Content Sections */}
      <main className="flex-1 space-y-8 sm:space-y-12">
        
        {/* Hero Section */}
        <HeroBanner
          onExploreMenu={() => handleNavigate('menu-section')}
          onOpenBhojBot={() => {
            setBhojBotInitialQuery('');
            setIsBhojBotOpen(true);
          }}
          onViewSchedule={() => handleNavigate('schedule-section')}
          onBookPass={() => handleNavigate('ticket-booking')}
        />

        {/* Mandatory Event Pass & Ticket Booking Section */}
        <TicketBookingSection
          currentUser={currentUser}
          onPassBooked={(pass) => setUserTickets((prev) => [pass, ...prev])}
          onOpenAuth={() => setIsAuthOpen(true)}
          onCelebration={(data) => setCelebrationData(data)}
          onOpenDPDPPolicy={() => setIsDPDPModalOpen(true)}
        />

        {/* Menu Section */}
        <MenuSection
          onSelectDish={(dish) => setSelectedDish(dish)}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          cart={cart}
          onOpenPlateSuggester={() => setIsPlateSuggesterOpen(true)}
        />

        {/* Interactive Event Schedule Section */}
        <ScheduleSection />

        {/* Feedback & Guestbook Section */}
        <FeedbackSection
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Contact & Venue Information Section */}
        <ContactSection />

      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Floating Primary CTA: 'Booking Pass' Button in Royal Red & Gold */}
        <button
          id="floating-booking-pass-btn"
          onClick={() => handleNavigate('ticket-booking')}
          className="group flex items-center gap-2.5 px-4.5 py-3 rounded-full bg-gradient-to-r from-[#991b1b] via-[#7f1d1d] to-[#b45309] hover:from-[#b91c1c] hover:to-[#d97706] text-amber-100 font-extrabold text-xs sm:text-sm border border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Book Your Festival Booking Pass (₹349/-)"
        >
          <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 group-hover:rotate-12 transition-transform">
            <Ticket className="w-3.5 h-3.5" />
          </div>
          <span className="font-display tracking-wide font-black">Booking Pass</span>
          <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            ₹349
          </span>
        </button>

        {/* Floating AI Concierge Mascot Button - Bhoj-Bot (Royal Blue) */}
        <button
          id="floating-bhojbot-btn"
          onClick={() => {
            setBhojBotInitialQuery('');
            setIsBhojBotOpen(true);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1c0507]/95 backdrop-blur-md border border-amber-500/40 text-stone-200 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:scale-105 transition-all cursor-pointer"
        >
          <div className="relative w-8 h-8 rounded-full bg-blue-950/70 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <Bot className="w-4 h-4 text-blue-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400" />
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
              <span>Bhoj-Bot</span>
              <Sparkles className="w-2.5 h-2.5 text-blue-400" />
            </div>
            <div className="text-[9px] text-stone-400">AI Concierge</div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <Footer
        onNavClick={handleNavigate}
        onOpenBhojBot={() => {
          setBhojBotInitialQuery('');
          setIsBhojBotOpen(true);
        }}
        onOpenDPDPPolicy={() => setIsDPDPModalOpen(true)}
      />

      {/* Modals & Drawers */}
      <DPDPPrivacyModal
        isOpen={isDPDPModalOpen}
        onClose={() => setIsDPDPModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleUserLogin}
        onNavigateToAdmin={navigateToAdmin}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => setIsPaymentOpen(true)}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        cart={cart}
        currentUser={currentUser}
        onClearCart={handleClearCart}
        onBookingCreated={(newBooking) => setUserBookings((prev) => [newBooking, ...prev])}
        onCelebration={(data) => setCelebrationData(data)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <DishDetailModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={handleAddToCart}
        onAskBhojBot={handleAskBhojBotAboutDish}
      />

      <BhojBotModal
        isOpen={isBhojBotOpen}
        onClose={() => setIsBhojBotOpen(false)}
        initialQuery={bhojBotInitialQuery}
        contextDish={selectedDish}
        userBookings={userBookings}
        currentUser={currentUser}
        onOpenBookingModal={() => setIsCartOpen(true)}
      />

      <AIPlateSuggesterModal
        isOpen={isPlateSuggesterOpen}
        onClose={() => setIsPlateSuggesterOpen(false)}
        onAddMultipleToCart={handleAddMultipleToCart}
      />

      {/* Global Grand Celebration Modal */}
      <CelebrationModal
        isOpen={!!celebrationData}
        onClose={() => setCelebrationData(null)}
        data={celebrationData}
      />

    </div>
  );
}
