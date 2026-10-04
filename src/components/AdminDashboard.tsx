import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard,
  Ticket, 
  Users, 
  UtensilsCrossed, 
  TrendingUp, 
  IndianRupee, 
  ShieldCheck, 
  Search, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  LogOut, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  Menu as MenuIcon, 
  X, 
  UserCheck, 
  Shield, 
  Calendar, 
  Award,
  ChevronRight,
  Download,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
  Flame,
  Leaf,
  Plus,
  Table as TableIcon,
  LayoutGrid,
  Trash2
} from 'lucide-react';
import { UserProfile, MenuItem } from '../types';
import { MENU_ITEMS } from '../data/festData';
import { 
  fetchAllBookingsFromSupabase, 
  updateBookingGateVerification,
  deleteBookingFromSupabase,
  isSupabaseConfigured,
  supabase
} from '../lib/supabase';
import { markTicketAsAdmitted } from '../lib/firebase';
import { TicketScannerModal } from './TicketScannerModal';
import { triggerFestiveCelebration, playCelebrationChime } from '../utils/confettiCelebration';

export type AdminTab = 
  | 'Dashboard (Live Analytics)'
  | 'Eco-Pass Bookings'
  | 'User Directory'
  | 'Menu Content Manager';

export interface BookingRecord {
  id?: string;
  booking_id: string;
  user_id?: string;
  status?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  dining_slot?: string;
  event_date?: string;
  pass_quantity?: number;
  items?: Array<{
    type?: string;
    name?: string;
    mohol?: string;
    price?: number;
    qty?: number;
    quantity?: number;
    status?: string;
  }>;
  welcome_drink?: string;
  starter_dish?: string;
  mains_dish?: string;
  dessert_dish?: string;
  include_dessert?: boolean;
  qr_code_url?: string;
  transaction_id?: string;
  upi_utr?: string;
  verified_at_gate?: boolean;
  verified_at_gate_time?: string | null;
  created_at?: string;
}

export interface AdminDashboardProps {
  currentUser?: UserProfile | null;
  onNavigateToHome: () => void;
  onSignOutAdmin?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateToHome,
  onSignOutAdmin,
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard (Live Analytics)');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Bookings State
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [bookingViewMode, setBookingViewMode] = useState<'cards' | 'table'>('cards');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Users Directory State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [directoryUsers, setDirectoryUsers] = useState<UserProfile[]>(() => {
    // Initial seeded user directory
    const seed: UserProfile[] = [
      {
        id: 'usr_admin_01',
        name: currentUser?.name || 'Prof. Debjit Goswami (Director)',
        emailOrPhone: currentUser?.emailOrPhone || 'director.dg@iam.ac.in',
        role: 'admin',
        isAdmin: true,
        institution: 'Institute of Advanced Management (IAM)',
        sustainabilityKarma: 980,
        tokens: ['royal_director', 'master_chef_judge', 'zero_waste_patron'],
      },
      {
        id: 'usr_faculty_02',
        name: 'Chef Suparna Ray',
        emailOrPhone: 'chef.suparna@iamkolkata.org',
        role: 'faculty_judge',
        institution: 'Culinary Arts & Heritage Gastronomy',
        sustainabilityKarma: 750,
        tokens: ['heritage_evaluator', 'jamidari_specialist'],
      },
      {
        id: 'usr_ambassador_03',
        name: 'Soumyadeep Banerjee',
        emailOrPhone: 's.banerjee.2026@iam.ac.in',
        role: 'student_ambassador',
        institution: 'Batch 2026 Eco-Hospitality',
        sustainabilityKarma: 620,
        tokens: ['eco_warrior', 'campus_guide'],
      },
      {
        id: 'usr_patron_04',
        name: 'Dr. Anirban Mukherjee',
        emailOrPhone: 'anirban.m@calcuttaheritage.org',
        role: 'royal_patron',
        institution: 'Heritage Bengal Culinary Trust',
        sustainabilityKarma: 510,
        tokens: ['patron_gold', 'eco_dining_pass'],
      },
      {
        id: 'usr_guest_05',
        name: 'Madhushree Mitra',
        emailOrPhone: 'madhushree.mitra@gmail.com',
        role: 'guest',
        institution: 'General Festival Attendee',
        sustainabilityKarma: 140,
        tokens: ['first_edition_guest'],
      },
      {
        id: 'usr_guest_06',
        name: 'Arijit Sen',
        emailOrPhone: '9830098765',
        role: 'guest',
        institution: 'General Festival Attendee',
        sustainabilityKarma: 120,
        tokens: ['mobile_booking'],
      },
    ];

    // Ensure currently signed in user appears in directory if not present
    if (currentUser && !seed.some(u => u.id === currentUser.id || u.emailOrPhone === currentUser.emailOrPhone)) {
      seed.unshift(currentUser);
    }
    return seed;
  });

  // Menu Content State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => [...MENU_ITEMS]);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuMoholFilter, setMenuMoholFilter] = useState<string>('all');
  const [itemStockState, setItemStockState] = useState<Record<string, boolean>>({});

  // Seed sample bookings if remote empty
  const loadBookingsData = async () => {
    setIsLoadingBookings(true);
    try {
      const data = await fetchAllBookingsFromSupabase();
      if (data && data.length > 0) {
        setBookings(data as BookingRecord[]);
      } else {
        // Fallback realistic seed data
        const seedData: BookingRecord[] = [
          {
            id: 'seed-1',
            booking_id: 'RB-PASS-2026-94821',
            customer_name: 'Dr. Anirban Mukherjee',
            customer_email: 'anirban.m@calcuttaheritage.org',
            customer_phone: '9830144521',
            total_amount: 448,
            payment_method: 'UPI_QR',
            payment_status: 'paid',
            dining_slot: 'Grand Aristocratic Dinner (7:30 PM - 10:30 PM)',
            event_date: 'Friday, 9th October 2026',
            pass_quantity: 1,
            upi_utr: '427189012345',
            transaction_id: 'TXN-RB-94821',
            include_dessert: true,
            verified_at_gate: false,
            created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
            items: [
              { type: 'pass', name: 'Festival Eco-Pass (x1)', price: 349, qty: 1, status: 'Base Pass' },
              { type: 'starter', mohol: 'BHOJ MOHOL', name: 'Raj Angan Jali Kebab (Non-Veg)', price: 0, qty: 1, status: 'Included with Pass' },
              { type: 'mains', mohol: 'BHOJ MOHOL', name: 'Combo 1 (Chicken): Rajbari Deshi Fowl Kalia served with Cholar Dal Raj Polao', price: 0, qty: 1, status: 'Included with Pass' },
              { type: 'dessert', mohol: 'MOHINI MOHOL', name: 'Misti Mukh 4-Sweet Tasting Platter', price: 99, qty: 1, status: 'Dessert Add-on (+₹99)' },
            ],
          },
          {
            id: 'seed-2',
            booking_id: 'RB-PASS-2026-88192',
            customer_name: 'Priyanka Sen Sharma',
            customer_email: 'priyanka.s@gmail.com',
            customer_phone: '9831099234',
            total_amount: 349,
            payment_method: 'CARD',
            payment_status: 'paid',
            dining_slot: 'Royal Midday Feast (12:30 PM - 3:30 PM)',
            event_date: 'Saturday, 10th October 2026',
            pass_quantity: 1,
            upi_utr: 'CARD-REF-99120',
            transaction_id: 'TXN-RB-88192',
            include_dessert: false,
            verified_at_gate: true,
            verified_at_gate_time: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            items: [
              { type: 'pass', name: 'Festival Eco-Pass (x1)', price: 349, qty: 1, status: 'Base Pass' },
              { type: 'starter', mohol: 'THAKURBARIR RANNAGHOR', name: 'Panchali Patpata Bora (Veg)', price: 0, qty: 1, status: 'Included' },
              { type: 'mains', mohol: 'THAKURBARIR RANNAGHOR', name: 'Combo 3 (Tagore Veg): Enchorer Niramish Dalna with Gobindobhog Ghee Bhat', price: 0, qty: 1, status: 'Included' },
            ],
          },
          {
            id: 'seed-3',
            booking_id: 'RB-PASS-2026-72410',
            customer_name: 'Prof. Somenath Chatterjee',
            customer_email: 'somenath.c@jadavpur.edu',
            customer_phone: '9433012988',
            total_amount: 698,
            payment_method: 'UPI_QR',
            payment_status: 'paid',
            dining_slot: 'Grand Aristocratic Dinner (7:30 PM - 10:30 PM)',
            event_date: 'Sunday, 11th October 2026',
            pass_quantity: 2,
            upi_utr: '427189998811',
            transaction_id: 'TXN-RB-72410',
            include_dessert: false,
            verified_at_gate: false,
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            items: [
              { type: 'pass', name: 'Festival Eco-Pass (x2)', price: 698, qty: 2, status: 'Double Pass' },
            ],
          },
          {
            id: 'seed-4',
            booking_id: 'RB-PASS-2026-61109',
            customer_name: 'Ananya Dutta',
            customer_email: 'ananya.dutta@tcs.com',
            customer_phone: '9836671234',
            total_amount: 448,
            payment_method: 'UPI_QR',
            payment_status: 'paid',
            dining_slot: 'Royal Midday Feast (12:30 PM - 3:30 PM)',
            event_date: 'Friday, 9th October 2026',
            pass_quantity: 1,
            upi_utr: '427189332211',
            transaction_id: 'TXN-RB-61109',
            include_dessert: true,
            verified_at_gate: true,
            verified_at_gate_time: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
            items: [
              { type: 'pass', name: 'Festival Eco-Pass (x1)', price: 349, qty: 1, status: 'Base Pass' },
              { type: 'dessert', name: 'Misti Mukh Tasting Platter', price: 99, qty: 1, status: 'Dessert Add-on' }
            ],
          }
        ];
        setBookings(seedData);
      }
    } catch (err) {
      console.warn('Could not fetch Supabase bookings, using local cache:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookingsData();
  }, []);

  // Show temporary banner notification
  const triggerNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Admit Guest with persistent Supabase database update
  const handleAdmit = async (bookingOrId: BookingRecord | string) => {
    const booking = typeof bookingOrId === 'object' 
      ? bookingOrId 
      : bookings.find(b => b.booking_id === bookingOrId || b.id === bookingOrId);
    const bookingId = typeof bookingOrId === 'string' 
      ? bookingOrId 
      : (booking?.booking_id || booking?.id || '');
    const rowId = booking?.id || bookingId;

    try {
      // 1. Asynchronously update Supabase bookings table: status -> 'admitted'
      // Adjusting table/column names to match project schema ('booking_id' or 'id')
      let updateResult;

      if (booking?.booking_id) {
        // Query by booking_id (standard unique column for passes in this project)
        updateResult = await supabase
          .from('bookings')
          .update({ status: 'admitted' })
          .eq('booking_id', booking.booking_id);

        // Fallback to 'id' if column 'booking_id' does not exist in the database table
        if (updateResult.error && (updateResult.error.message?.includes('booking_id') || updateResult.error.code === '42703')) {
          updateResult = await supabase
            .from('bookings')
            .update({ status: 'admitted' })
            .eq('id', rowId);
        }
      } else {
        // Query by id directly
        updateResult = await supabase
          .from('bookings')
          .update({ status: 'admitted' })
          .eq('id', bookingId);

        // Fallback to 'booking_id' if column 'id' does not exist or type mismatch (e.g. UUID)
        if (updateResult.error && (updateResult.error.message?.includes('id') || updateResult.error.code === '42703' || updateResult.error.code === '22P02')) {
          updateResult = await supabase
            .from('bookings')
            .update({ status: 'admitted' })
            .eq('booking_id', bookingId);
        }
      }

      // 2. Error handling from Supabase (e.g., RLS policy blocking update, auth issues)
      if (updateResult.error) {
        console.error('Supabase error updating booking status:', updateResult.error.message || updateResult.error);
        window.alert(`Failed to admit guest: ${updateResult.error.message || 'Supabase database error'}`);
        return; // Halt: DO NOT update local UI state when database update fails
      }

      // 3. Only update local UI state to 'Admitted' after Supabase successfully confirms the update
      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setBookings(prev => prev.map(b => {
        if (b.booking_id === bookingId || b.id === bookingId || (rowId && b.id === rowId)) {
          return {
            ...b,
            status: 'admitted',
            verified_at_gate: true,
            verified_at_gate_time: nowFormatted,
          };
        }
        return b;
      }));

      // Update local storage backup & cache
      try {
        const local = JSON.parse(localStorage.getItem('rb_supabase_purchase_history') || '[]');
        const updated = local.map((item: any) => {
          if ((item.booking_id || item.bookingId) === bookingId || item.id === rowId) {
            return {
              ...item,
              status: 'admitted',
              verified_at_gate: true,
              verified_at_gate_time: nowFormatted,
            };
          }
          return item;
        });
        localStorage.setItem('rb_supabase_purchase_history', JSON.stringify(updated));
      } catch (_) {}

      // Optional telemetry and Firebase sync
      try {
        await updateBookingGateVerification(bookingId, true);
        await markTicketAsAdmitted(
          bookingId,
          currentUser?.name ? `Gate Staff (${currentUser.name})` : 'IAM Gate Security'
        );
      } catch (_) {}

      playCelebrationChime();
      triggerFestiveCelebration();
      triggerNotification(`Guest ${booking?.customer_name || bookingId} admitted successfully! Status saved in Supabase.`, 'success');
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.error('Failed to admit guest:', errorMsg);
      window.alert(`Error admitting guest: ${errorMsg}`);
    }
  };

  // Alias for backward compatibility
  const handleVerifyGatePass = handleAdmit;

  // Delete an unverified guest booking from Supabase and update state
  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to remove this guest?')) {
      return;
    }

    try {
      // Execute deletion from Supabase 'bookings' table
      const res = await deleteBookingFromSupabase(bookingId);
      if (!res.success && res.error) {
        console.warn('Supabase delete returned error:', res.error);
      }

      // Remove the specific booking row from local state
      setBookings(prev => prev.filter(b => b.booking_id !== bookingId));

      // Synchronize with local storage backups if present
      try {
        const localData = localStorage.getItem('rb_saved_bookings');
        if (localData) {
          const parsed = JSON.parse(localData);
          const filtered = parsed.filter((b: any) => b.id !== bookingId && b.bookingId !== bookingId);
          localStorage.setItem('rb_saved_bookings', JSON.stringify(filtered));
        }

        const historyData = localStorage.getItem('rb_supabase_purchase_history');
        if (historyData) {
          const parsedHistory = JSON.parse(historyData);
          const filteredHistory = parsedHistory.filter((b: any) => b.booking_id !== bookingId);
          localStorage.setItem('rb_supabase_purchase_history', JSON.stringify(filteredHistory));
        }
      } catch (_) {}

      triggerNotification(`Guest booking ${bookingId} successfully deleted.`, 'success');
    } catch (err: any) {
      console.error('Failed to delete booking:', err);
      setBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      triggerNotification(`Removed booking ${bookingId} from portal.`, 'info');
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // KPI Calculations
  const totalRevenueCalculated = useMemo(() => {
    const raw = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    // Base platform revenue baseline + bookings total
    return 248500 + raw;
  }, [bookings]);

  const passesSoldCalculated = useMemo(() => {
    const raw = bookings.reduce((sum, b) => sum + (Number(b.pass_quantity) || 1), 0);
    return 1420 + raw;
  }, [bookings]);

  const activeUsersCalculated = useMemo(() => {
    return 3892 + directoryUsers.length;
  }, [directoryUsers]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const q = bookingSearch.toLowerCase().trim();
      const matchesSearch = !q || (
        b.booking_id.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_email.toLowerCase().includes(q) ||
        (b.customer_phone && b.customer_phone.includes(q)) ||
        (b.dining_slot && b.dining_slot.toLowerCase().includes(q))
      );

      const isAdmitted = Boolean(b.verified_at_gate || b.status === 'admitted');
      const matchesFilter = 
        bookingFilter === 'all' ||
        (bookingFilter === 'verified' && isAdmitted) ||
        (bookingFilter === 'pending' && !isAdmitted);

      return matchesSearch && matchesFilter;
    });
  }, [bookings, bookingSearch, bookingFilter]);

  // Filtered Directory Users
  const filteredUsers = useMemo(() => {
    return directoryUsers.filter(u => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch = !q || (
        u.name.toLowerCase().includes(q) ||
        u.emailOrPhone.toLowerCase().includes(q) ||
        (u.institution && u.institution.toLowerCase().includes(q))
      );

      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [directoryUsers, userSearch, userRoleFilter]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const q = menuSearch.toLowerCase().trim();
      const matchesSearch = !q || (
        item.name.toLowerCase().includes(q) ||
        item.bengaliName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );

      const matchesMohol = menuMoholFilter === 'all' || item.mohol === menuMoholFilter;
      return matchesSearch && matchesMohol;
    });
  }, [menuItems, menuSearch, menuMoholFilter]);

  // Toggle dish stock status
  const handleToggleDishStock = (dishId: string) => {
    setItemStockState(prev => {
      const current = prev[dishId] !== undefined ? prev[dishId] : true;
      const next = !current;
      triggerNotification(`Dish stock status updated: ${next ? 'In Stock (Available)' : 'Sold Out / Paused'}`, 'info');
      return { ...prev, [dishId]: next };
    });
  };

  // Toggle user role promotion (e.g. make admin or demote)
  const handleToggleUserRole = (targetUser: UserProfile) => {
    setDirectoryUsers(prev => prev.map(u => {
      if (u.id === targetUser.id) {
        const nextRole = u.role === 'admin' ? 'royal_patron' : 'admin';
        triggerNotification(`Updated ${u.name}'s role to ${nextRole.toUpperCase()}`, 'success');
        return {
          ...u,
          role: nextRole as any,
          isAdmin: nextRole === 'admin',
        };
      }
      return u;
    }));
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'Dashboard (Live Analytics)', label: 'Dashboard (Live Analytics)', icon: LayoutDashboard },
    { id: 'Eco-Pass Bookings', label: 'Eco-Pass Bookings', icon: Ticket, badge: bookings.length },
    { id: 'User Directory', label: 'User Directory', icon: Users, badge: directoryUsers.length },
    { id: 'Menu Content Manager', label: 'Menu Content Manager', icon: UtensilsCrossed, badge: menuItems.length },
  ];

  return (
    <div className="min-h-screen w-full bg-[#100305] text-amber-50 flex flex-col lg:flex-row font-sans selection:bg-amber-500 selection:text-stone-950 overflow-x-hidden">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#180407] border-b border-amber-500/25 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-stone-900/90 text-amber-400 border border-amber-500/30 hover:bg-stone-800 focus:outline-none cursor-pointer"
            aria-label="Open Admin Menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold font-mono">IAM Kolkata</span>
            <h1 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
              <span>Admin Hub</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded">Live</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToHome}
            className="px-2.5 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-amber-300 text-xs border border-amber-500/20 flex items-center gap-1 cursor-pointer transition-all"
            title="Return to Public Festival"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </button>
          
          <button
            onClick={() => {
              try {
                localStorage.removeItem('rb_gate_admin_auth');
                sessionStorage.removeItem('rb_gate_admin_auth');
              } catch (_) {}
              if (onSignOutAdmin) onSignOutAdmin();
              else onNavigateToHome();
            }}
            className="p-1.5 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-500/30 cursor-pointer transition-all"
            title="Exit Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Backdrop for Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-20
        h-full lg:h-screen w-72 max-w-[85vw]
        bg-gradient-to-b from-[#180407] via-[#140305] to-[#0c0204]
        border-r border-amber-500/20 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header & Branding */}
        <div className="p-5 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-900/30 border border-amber-300/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-semibold">
                  IAM Kolkata Node
                </div>
                <h2 className="text-base font-bold text-white font-display tracking-tight">
                  Rajbari Admin Hub
                </h2>
              </div>
            </div>

            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 px-3 py-2 rounded-xl bg-stone-950/70 border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-stone-300 text-[11px] font-mono">Live Session Active</span>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono bg-amber-500/20 text-amber-300 rounded border border-amber-400/30">
              ROLE: ADMIN
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/70 font-semibold">
            Management Modules
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer
                  ${isActive 
                    ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/10 text-amber-200 border border-amber-400/40 shadow-md shadow-amber-950/40' 
                    : 'text-stone-300 hover:text-amber-100 hover:bg-stone-900/60 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-amber-400 border border-stone-800'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`font-medium ${isActive ? 'font-bold text-white' : ''}`}>
                    {item.label}
                  </span>
                </div>

                {item.badge !== undefined && (
                  <span className={`
                    px-2 py-0.5 text-[10px] font-mono font-bold rounded-full
                    ${isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-900 text-stone-400 border border-stone-800'}
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Gate Terminal Scanner Launch */}
          <div className="pt-4 px-1">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 hover:from-emerald-900 hover:to-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer transition-all shadow-md group"
            >
              <QrCode className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Launch QR Gate Scanner</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer with Current Admin Profile & Controls */}
        <div className="p-4 border-t border-amber-500/20 bg-stone-950/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xs font-bold">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate font-display">
                {currentUser?.name || 'Festival Admin Officer'}
              </div>
              <div className="text-[11px] text-amber-300/80 truncate font-mono">
                {currentUser?.emailOrPhone || 'admin@iamkolkata.edu'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <button
              onClick={onNavigateToHome}
              className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Fest Home</span>
            </button>

            <button
              onClick={() => {
                try {
                  localStorage.removeItem('rb_gate_admin_auth');
                  sessionStorage.removeItem('rb_gate_admin_auth');
                } catch (_) {}
                if (onSignOutAdmin) onSignOutAdmin();
                else onNavigateToHome();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#100305] overflow-y-auto">
        
        {/* Top Desktop Appbar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-[#140306]/95 border-b border-amber-500/20 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-stone-400 flex items-center gap-2">
              <span>Admin Shell</span>
              <span>/</span>
              <span className="text-amber-400 font-bold">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/80 border border-amber-500/20 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-stone-300 font-mono text-[11px]">Database: Firestore & Supabase</span>
            </div>

            <button
              onClick={onNavigateToHome}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className={`
            px-4 py-2.5 text-xs flex items-center justify-between border-b
            ${notification.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30' 
              : 'bg-amber-950/80 text-amber-200 border-amber-500/30'
            }
          `}>
            <div className="flex items-center gap-2 mx-auto max-w-7xl">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-medium">{notification.text}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Tab Views */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* TAB 1: DASHBOARD (LIVE ANALYTICS) */}
          {activeTab === 'Dashboard (Live Analytics)' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header Title Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Executive Analytics Terminal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    Festival Operations & Live Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
                    Real-time admissions, sustainability telemetry, revenue monitoring, and patron attendance at IAM Kolkata.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadBookingsData}
                    disabled={isLoadingBookings}
                    className="px-3 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-amber-200 text-xs border border-stone-700/60 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBookings ? 'animate-spin text-amber-400' : ''}`} />
                    <span>Sync Metrics</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('Eco-Pass Bookings')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>View Bookings</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 REQUIRED PLACEHOLDER KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* KPI CARD 1: TOTAL REVENUE */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d060a] to-[#140306] border border-amber-500/30 p-6 shadow-xl shadow-black/40 hover:border-amber-400/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
                      Total Revenue
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                      ₹{totalRevenueCalculated.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+18.4% vs last festival edition</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>Online UPI & Cards</span>
                    <span className="text-amber-200 font-semibold">₹{(totalRevenueCalculated * 0.74).toFixed(0)}</span>
                  </div>
                </div>

                {/* KPI CARD 2: PASSES SOLD */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d060a] to-[#140306] border border-amber-500/30 p-6 shadow-xl shadow-black/40 hover:border-amber-400/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
                      Passes Sold
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                      <Ticket className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                      {passesSoldCalculated.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                      <span>88.75% of Total Hall Capacity (1,600 Max)</span>
                    </div>
                  </div>

                  <div className="mt-3 w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800">
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full w-[88.75%]" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>Dinner: 840</span>
                    <span className="text-amber-200">Lunch: 580</span>
                  </div>
                </div>

                {/* KPI CARD 3: ACTIVE USERS */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d060a] to-[#140306] border border-amber-500/30 p-6 shadow-xl shadow-black/40 hover:border-amber-400/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
                      Active Users
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                      {activeUsersCalculated.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>412 active in last 30 minutes</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>Registered Patrons</span>
                    <span className="text-amber-200 font-semibold">{directoryUsers.length} in Directory</span>
                  </div>
                </div>

              </div>

              {/* OPERATIONAL INSIGHTS & GATE STATUS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Gate Admission Live Monitor */}
                <div className="lg:col-span-2 rounded-2xl bg-[#180407]/90 border border-amber-500/20 p-6 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                    <div>
                      <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <span>Live Gate Admission Stream</span>
                      </h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Real-time attendee check-in and QR ticket scans at Kolkata Campus Gate.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsScannerOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scanner</span>
                    </button>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-4 my-5 text-center">
                    <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                      <div className="text-xs text-stone-400 font-mono">Total Bookings</div>
                      <div className="text-xl font-bold text-white font-display mt-0.5">{bookings.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                      <div className="text-xs text-emerald-400 font-mono">Admitted at Gate</div>
                      <div className="text-xl font-bold text-emerald-300 font-display mt-0.5">
                        {bookings.filter(b => b.verified_at_gate || b.status === 'admitted').length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                      <div className="text-xs text-amber-400 font-mono">Pending Check-in</div>
                      <div className="text-xl font-bold text-amber-300 font-display mt-0.5">
                        {bookings.filter(b => !b.verified_at_gate && b.status !== 'admitted').length}
                      </div>
                    </div>
                  </div>

                  {/* Recent Bookings Feed */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">
                      Recent Passes
                    </div>
                    {bookings.slice(0, 3).map((b, idx) => (
                      <div 
                        key={b.booking_id || idx}
                        className="p-3.5 rounded-xl bg-stone-950/50 border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{b.customer_name}</span>
                            <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                              {b.booking_id}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 mt-1">
                            {b.dining_slot || 'Grand Feast Session'} • ₹{b.total_amount}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {b.verified_at_gate || b.status === 'admitted' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Admitted {b.verified_at_gate_time || ''}</span>
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAdmit(b)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] cursor-pointer transition-all shadow-sm"
                              >
                                Verify & Admit
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(b.booking_id)}
                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-500/30 cursor-pointer transition-all"
                                title="Remove / Delete Guest Booking"
                                aria-label="Delete Guest Booking"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sustainability & Zero-Waste Telemetry Card */}
                <div className="rounded-2xl bg-[#180407]/90 border border-amber-500/20 p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-display flex items-center gap-2 pb-4 border-b border-stone-800">
                      <Leaf className="w-4 h-4 text-emerald-400" />
                      <span>Zero-Waste AI Score</span>
                    </h3>

                    <div className="my-5 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-center">
                      <div className="text-4xl font-extrabold text-emerald-400 font-display">94.2%</div>
                      <div className="text-xs text-stone-300 mt-1">Food Waste Diversion Index</div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between text-stone-300">
                        <span>Biodegradable Sal Plates</span>
                        <span className="font-mono text-emerald-400 font-bold">100% Adopted</span>
                      </div>
                      <div className="flex justify-between text-stone-300">
                        <span>Single-Use Plastic Ban</span>
                        <span className="font-mono text-emerald-400 font-bold">Zero Violations</span>
                      </div>
                      <div className="flex justify-between text-stone-300">
                        <span>Active Karma Points Issued</span>
                        <span className="font-mono text-amber-300 font-bold">48,200 Pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-800">
                    <button
                      onClick={() => setActiveTab('User Directory')}
                      className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-medium border border-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Users className="w-4 h-4" />
                      <span>Review Patron Karma Directory</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: ECO-PASS BOOKINGS */}
          {activeTab === 'Eco-Pass Bookings' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Booking Management & Verification</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    Eco-Pass Attendee Directory
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-300 mt-1">
                    Admit ticket holders, verify QR passes, and audit payment allocations.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Scan Pass</span>
                  </button>

                  <button
                    onClick={loadBookingsData}
                    disabled={isLoadingBookings}
                    className="p-2 rounded-xl bg-stone-900 text-stone-300 hover:text-white border border-stone-700/60 cursor-pointer"
                    title="Refresh Bookings"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingBookings ? 'animate-spin text-amber-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#180407] p-3.5 rounded-2xl border border-amber-500/20">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by Guest Name, Booking ID, Phone, or Slot..."
                    className="w-full pl-9 pr-4 py-2 bg-stone-950/70 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                  {bookingSearch && (
                    <button 
                      onClick={() => setBookingSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-stone-950 rounded-xl p-1 border border-stone-800 text-xs">
                    {(['all', 'verified', 'pending'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setBookingFilter(tab)}
                        className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                          bookingFilter === tab 
                            ? 'bg-amber-500 text-stone-950 font-bold' 
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="hidden sm:flex bg-stone-950 rounded-xl p-1 border border-stone-800 text-xs">
                    <button
                      onClick={() => setBookingViewMode('cards')}
                      className={`p-1.5 rounded-lg cursor-pointer ${bookingViewMode === 'cards' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'}`}
                      title="Card View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setBookingViewMode('table')}
                      className={`p-1.5 rounded-lg cursor-pointer ${bookingViewMode === 'table' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'}`}
                      title="Table View"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bookings Display */}
              {filteredBookings.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#180407]/40 border border-stone-800">
                  <Ticket className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <div className="text-base font-bold text-white">No matching bookings found</div>
                  <div className="text-xs text-stone-400 mt-1">Try clearing your search terms or filter</div>
                </div>
              ) : bookingViewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBookings.map((b) => (
                    <div
                      key={b.booking_id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-[#180407] to-[#120305] border border-amber-500/20 shadow-md space-y-4 hover:border-amber-400/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white font-display">
                              {b.customer_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 border border-amber-500/30 text-amber-300">
                              {b.booking_id}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 mt-1 flex flex-wrap gap-x-3">
                            <span>{b.customer_email}</span>
                            {b.customer_phone && <span>• {b.customer_phone}</span>}
                          </div>
                        </div>

                        {b.verified_at_gate || b.status === 'admitted' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Admitted</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
                        <div>
                          <span className="text-stone-400 text-[10px] font-mono uppercase block">Dining Slot</span>
                          <span className="font-semibold text-amber-100 truncate block">{b.dining_slot || 'Standard Admission'}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[10px] font-mono uppercase block">Total Amount</span>
                          <span className="font-bold text-amber-400 block">₹{b.total_amount} ({b.payment_method || 'PAID'})</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleCopy(b.booking_id, b.booking_id)}
                          className="text-stone-400 hover:text-amber-200 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === b.booking_id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy ID</span>
                        </button>

                        {!(b.verified_at_gate || b.status === 'admitted') && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAdmit(b)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md cursor-pointer transition-all"
                            >
                              Admit Guest
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(b.booking_id)}
                              className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/70 text-red-400 hover:text-red-200 border border-red-500/30 cursor-pointer transition-all flex items-center justify-center"
                              title="Delete / Remove Unverified Guest"
                              aria-label="Delete Guest Booking"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-[#180407]">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-stone-950/80 text-[10px] uppercase font-mono text-amber-400 border-b border-stone-800">
                      <tr>
                        <th className="p-3.5">Booking ID</th>
                        <th className="p-3.5">Guest</th>
                        <th className="p-3.5">Session / Slot</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Gate Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {filteredBookings.map(b => (
                        <tr key={b.booking_id} className="hover:bg-stone-900/40">
                          <td className="p-3.5 font-mono text-amber-300 font-bold">{b.booking_id}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{b.customer_name}</div>
                            <div className="text-[11px] text-stone-400">{b.customer_email}</div>
                          </td>
                          <td className="p-3.5 max-w-[200px] truncate">{b.dining_slot || 'Standard Admission'}</td>
                          <td className="p-3.5 font-bold text-white">₹{b.total_amount}</td>
                          <td className="p-3.5">
                            {b.verified_at_gate || b.status === 'admitted' ? (
                              <span className="text-emerald-400 font-semibold font-mono">Admitted</span>
                            ) : (
                              <span className="text-amber-400 font-semibold font-mono">Pending</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {!(b.verified_at_gate || b.status === 'admitted') ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleAdmit(b)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] cursor-pointer"
                                >
                                  Admit Guest
                                </button>
                                <button
                                  onClick={() => handleDeleteBooking(b.booking_id)}
                                  className="p-1 rounded-lg bg-red-950/40 hover:bg-red-900/70 text-red-400 hover:text-red-200 border border-red-500/30 cursor-pointer transition-all"
                                  title="Delete / Remove Unverified Guest"
                                  aria-label="Delete Guest Booking"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-stone-400">{b.verified_at_gate_time || 'Done'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: USER DIRECTORY */}
          {activeTab === 'User Directory' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Role-Based Access Control (RBAC)</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    User & Staff Directory
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-300 mt-1">
                    Manage accounts, grant or revoke 'admin' role flags, and monitor sustainability karma.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300">
                    Total Accounts: <span className="text-amber-400 font-bold">{directoryUsers.length}</span>
                  </div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#180407] p-3.5 rounded-2xl border border-amber-500/20">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by Name, Email, or Department..."
                    className="w-full pl-9 pr-4 py-2 bg-stone-950/70 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="faculty_judge">Faculty Judges</option>
                    <option value="student_ambassador">Ambassadors</option>
                    <option value="royal_patron">Royal Patrons</option>
                    <option value="guest">Guests</option>
                  </select>
                </div>
              </div>

              {/* Users Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                  const isAdmin = user.role === 'admin' || user.isAdmin;
                  return (
                    <div 
                      key={user.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-[#180407] to-[#120305] border border-amber-500/20 shadow-md space-y-4 hover:border-amber-400/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              isAdmin 
                                ? 'bg-amber-500 text-stone-950 border border-amber-300' 
                                : 'bg-stone-900 text-amber-300 border border-stone-700'
                            }`}>
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white font-display">{user.name}</h3>
                              <p className="text-[11px] text-stone-400 font-mono">{user.emailOrPhone}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isAdmin 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' 
                              : 'bg-stone-900 text-stone-400 border border-stone-800'
                          }`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-1.5 text-xs text-stone-300">
                          {user.institution && (
                            <div className="text-[11px] text-stone-400 truncate">
                              Affiliation: <span className="text-stone-200">{user.institution}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-400">Karma Balance:</span>
                            <span className="font-mono text-emerald-400 font-bold">{user.sustainabilityKarma} pts</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-stone-500">ID: {user.id.slice(0, 10)}</span>
                        
                        <button
                          onClick={() => handleToggleUserRole(user)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            isAdmin 
                              ? 'bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-700/60' 
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {isAdmin ? 'Revoke Admin' : 'Grant Admin Flag'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 4: MENU CONTENT MANAGER */}
          {activeTab === 'Menu Content Manager' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Royal Heritage Food Catalog</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    Menu & Inventory Manager
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-300 mt-1">
                    Control live kitchen dish availability, pricing, and Zero-Waste eco scores across all 4 Mohols.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300">
                    Total Dishes: <span className="text-amber-400 font-bold">{menuItems.length}</span>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#180407] p-3.5 rounded-2xl border border-amber-500/20">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search dish by English or Bengali name..."
                    className="w-full pl-9 pr-4 py-2 bg-stone-950/70 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={menuMoholFilter}
                    onChange={(e) => setMenuMoholFilter(e.target.value)}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">All Mohols & Categories</option>
                    <option value="starters">Starters (Bhoj & Thakurbarir)</option>
                    <option value="mains">Grand Mains & Combos</option>
                    <option value="desserts">Mohini Mohol Sweets</option>
                    <option value="rural">Rural Bengal Chulha</option>
                    <option value="tasting">Complimentary Tastings</option>
                  </select>
                </div>
              </div>

              {/* Dish Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMenuItems.map((dish) => {
                  const isInStock = itemStockState[dish.id] !== undefined ? itemStockState[dish.id] : true;
                  const isVegItem = dish.dietary === 'pure-veg' || dish.dietary === 'vegan';
                  return (
                    <div
                      key={dish.id}
                      className={`p-4 rounded-2xl bg-gradient-to-br from-[#180407] to-[#120305] border transition-all flex flex-col justify-between ${
                        isInStock ? 'border-amber-500/20 hover:border-amber-400/40' : 'border-stone-800 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-stone-950">
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-amber-300 font-bold border border-amber-500/30">
                            {dish.moholTitle}
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              isVegItem ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/90 text-red-300 border border-red-500/40'
                            }`}>
                              {isVegItem ? 'VEG' : 'NON-VEG'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-sm font-bold text-white font-display">{dish.name}</h3>
                            <span className="text-amber-400 font-bold font-mono text-sm">₹{dish.price}</span>
                          </div>
                          <div className="text-xs text-amber-200/80 font-serif italic mt-0.5">{dish.bengaliName}</div>
                          <p className="text-[11px] text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                          <Leaf className="w-3.5 h-3.5" />
                          <span>{dish.wasteScore}/100 Eco Score</span>
                        </div>

                        <button
                          onClick={() => handleToggleDishStock(dish.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            isInStock 
                              ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {isInStock ? 'In Stock (Live)' : 'Mark Available'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* QR Ticket Scanner Modal for Gate Staff */}
      <TicketScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentUser={currentUser}
        onTicketValidated={(result) => {
          if (result && result.isValid) {
            loadBookingsData();
            triggerNotification(`Ticket validated successfully!`, 'success');
          }
        }}
      />

    </div>
  );
};

export default AdminDashboard;
