import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MenuSection } from './components/MenuSection';
import { ScheduleSection } from './components/ScheduleSection';
import { FeedbackSection } from './components/FeedbackSection';
import { ContactSection } from './components/ContactSection';
import { TicketBookingSection } from './components/TicketBookingSection';
import { Footer } from './components/Footer';

// Modals
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { DishDetailModal } from './components/DishDetailModal';
import { BhojBotModal } from './components/BhojBotModal';
import { AIPlateSuggesterModal } from './components/AIPlateSuggesterModal';
import { CelebrationModal, CelebrationData } from './components/CelebrationModal';

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
      return local ? JSON.parse(local) : [
        {
          id: 'seed_rb_1',
          userId: 'guest_demo',
          customerName: 'Smt. Sharmistha Debnath',
          customerEmail: 'sharmistha@iam.ac.in',
          customerPhone: '+91 98301 44521',
          items: [
            { id: 'bhoj_1', name: 'Dhakai Kachi Morog Pulao', mohol: 'BHOJ MOHOL', price: 360, quantity: 2 },
            { id: 'mohini_1', name: 'Murshidabadi Chhana Mukhi', mohol: 'MOHINI MOHOL', price: 160, quantity: 2 }
          ],
          subtotal: 1040,
          serviceCharge: 21,
          totalAmount: 1061,
          paymentMethod: 'upi',
          paymentStatus: 'confirmed',
          dineSlot: 'Lunch Banquet: 12:30 PM - 02:30 PM',
          seatCount: 2,
          specialRequests: 'Near stage for Baul folk music recital',
          bookingCode: 'RB-2026-88192',
          createdAt: '2026-10-09T12:30:00Z'
        }
      ];
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

  // Smooth scroll handler
  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartTotalCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#06120d] text-emerald-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-stone-950">
      
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
        {/* Floating Cart Pill if items are present */}
        {cartTotalCount > 0 && (
          <button
            id="floating-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-2xl transition-transform hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Eco Plate ({cartTotalCount})</span>
          </button>
        )}

        {/* Floating AI Concierge Mascot Button */}
        <button
          id="floating-bhojbot-btn"
          onClick={() => {
            setBhojBotInitialQuery('');
            setIsBhojBotOpen(true);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0d2218]/90 backdrop-blur-md border border-emerald-500/40 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:border-emerald-400 hover:scale-105 transition-all"
        >
          <div className="relative w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400" />
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-[11px] font-bold text-emerald-100 flex items-center gap-1">
              <span>HOSPI BOT</span>
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            </div>
            <div className="text-[9px] text-emerald-400/80">AI Eco Concierge</div>
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
      />

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleUserLogin}
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
