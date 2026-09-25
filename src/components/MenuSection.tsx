import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Leaf, 
  Info, 
  Plus, 
  Minus, 
  Bot, 
  UtensilsCrossed, 
  Layers, 
  Cake, 
  Crown,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { MENU_ITEMS, MOHOL_INFO } from '../data/festData';

interface MenuSectionProps {
  onSelectDish: (dish: MenuItem) => void;
  onAddToCart: (dish: MenuItem) => void;
  onUpdateQuantity?: (dishId: string, delta: number) => void;
  cart: CartItem[];
  onOpenPlateSuggester: () => void;
}

export type TraditionalMoholId = 'all' | 'probesh' | 'bhoj' | 'mohini' | 'matini';

interface MoholDefinition {
  id: TraditionalMoholId;
  name: string;
  subtitle: string;
  bengaliTitle: string;
  tagline: string;
  description: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
}

export const TRADITIONAL_MOHOLS: MoholDefinition[] = [
  {
    id: 'probesh',
    name: 'Provesh Mohol',
    subtitle: 'Welcome & Starters',
    bengaliTitle: 'প্রবেশ মহল (স্বাগতম ও স্টার্টার)',
    tagline: 'Handcrafted Starters (₹349 each) & Rural Bengal Heritage Counter (Included)',
    description: 'Crisp, fragrant heritage appetizers alongside rare foraged wetland delicacies and stone-ground batas from the heart of rural Bengal.',
    badge: 'Starters ₹349 | Rural Counter ₹0',
    icon: Sparkles,
    accentColor: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'bhoj',
    name: 'Bhoj Mohol',
    subtitle: 'Main Course Combos — ₹349 each',
    bengaliTitle: 'ভোজ মহল (প্রধান ব্যঞ্জন কম্বো)',
    tagline: 'Celebratory Main Course Combos (₹349 each)',
    description: 'Rich aristocratic Bengal gravies and royal curries served with heirloom Gobindobhog polao and artisanal rice creations.',
    badge: 'Combos ₹349 each',
    icon: UtensilsCrossed,
    accentColor: 'from-teal-700 to-cyan-950',
  },
  {
    id: 'mohini',
    name: 'Mohini Mohol',
    subtitle: 'Complimentary Tasting Counter — ₹0',
    bengaliTitle: 'মোহিনী মহল (পরিপাক ও চাটনি)',
    tagline: 'Complimentary Tasting Counter — ₹0',
    description: 'Centuries-old palate cleansers, cooling broths, and Ayurvedic digestive chutneys offered complimentary with every festival pass.',
    badge: 'Complimentary Tasting — ₹0',
    icon: Leaf,
    accentColor: 'from-emerald-700 to-green-900',
  },
  {
    id: 'matini',
    name: 'Matini Mohol',
    subtitle: 'Confectionery & Misti Mukh — ₹99',
    bengaliTitle: 'মাতিনী মহল (মিষ্টি মুখ ও মিষ্টান্ন)',
    tagline: 'Heirloom Confectionery Add-on (₹99)',
    description: 'An exquisite four-sweet royal tasting platter celebrating rare, forgotten 19th-century secret confectionery recipes of Bengal.',
    badge: 'Misti Mukh Platter ₹99',
    icon: Cake,
    accentColor: 'from-cyan-600 to-emerald-700',
  },
];

export const MenuSection: React.FC<MenuSectionProps> = ({
  onSelectDish,
  onAddToCart,
  onUpdateQuantity,
  cart,
  onOpenPlateSuggester,
}) => {
  const [selectedMohol, setSelectedMohol] = useState<TraditionalMoholId>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getCartQuantity = (dishId: string) => {
    const found = cart.find((item) => item.dish.id === dishId);
    return found ? found.quantity : 0;
  };

  const handleIncrement = (dish: MenuItem) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(dish.id, 1);
    } else {
      onAddToCart(dish);
    }
  };

  const handleDecrement = (dish: MenuItem) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(dish.id, -1);
    }
  };

  // Helper to determine which traditional Mohol a dish belongs to
  const getDishMoholId = (dish: MenuItem): 'probesh' | 'bhoj' | 'mohini' | 'matini' => {
    if (dish.mohol === 'starters' || dish.mohol === 'rural' || dish.mohol === 'probesh') {
      return 'probesh';
    }
    if (dish.mohol === 'mains' || dish.mohol === 'bhoj') {
      return 'bhoj';
    }
    if (dish.mohol === 'tasting' || dish.mohol === 'mohini' || dish.mohol === 'mati') {
      return 'mohini';
    }
    return 'matini';
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const dishMoholId = getDishMoholId(item);
      const matchMohol = selectedMohol === 'all' || dishMoholId === selectedMohol;
      const matchDietary = dietaryFilter === 'all' || item.dietary === dietaryFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bengaliName.includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ingredients.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchMohol && matchDietary && matchSearch;
    });
  }, [selectedMohol, dietaryFilter, searchQuery]);

  // Group filtered dishes by Mohol
  const groupedDishes = useMemo(() => {
    const groups: {
      probesh: { starters: MenuItem[]; rural: MenuItem[] };
      bhoj: MenuItem[];
      mohini: MenuItem[];
      matini: MenuItem[];
    } = {
      probesh: { starters: [], rural: [] },
      bhoj: [],
      mohini: [],
      matini: [],
    };

    filteredDishes.forEach((dish) => {
      const mId = getDishMoholId(dish);
      if (mId === 'probesh') {
        if (dish.category === 'Starter' || dish.mohol === 'starters') {
          groups.probesh.starters.push(dish);
        } else {
          groups.probesh.rural.push(dish);
        }
      } else if (mId === 'bhoj') {
        groups.bhoj.push(dish);
      } else if (mId === 'mohini') {
        groups.mohini.push(dish);
      } else if (mId === 'matini') {
        groups.matini.push(dish);
      }
    });

    return groups;
  }, [filteredDishes]);

  // Handle anchor scroll
  const handleScrollToMohol = (moholId: TraditionalMoholId) => {
    setSelectedMohol(moholId);
    if (moholId !== 'all') {
      const el = document.getElementById(`mohol-${moholId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section id="menu-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-emerald-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rajbari Bhojbari 2026 • Authentic Bengal Menu</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Authentic Heritage <span className="text-eco-gradient">Zero-Waste Menu</span>
          </h2>
          <p className="text-stone-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Centuries-old authentic recipes of Bengal curated by IAM Kolkata student culinary hospitality ambassadors, prepared with 100% whole-ingredient zero-waste sustainability.
          </p>
        </div>

        {/* AI Plate Suggester Action Button */}
        <button
          id="menu-ai-plate-suggester-btn"
          onClick={onOpenPlateSuggester}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border border-emerald-400/50 hover:border-cyan-300 text-emerald-200 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer hover:scale-[1.02]"
        >
          <Bot className="w-4 h-4 text-cyan-300" />
          <span>AI Smart Plate Suggester</span>
          <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
        </button>
      </div>

      {/* 4. STICKY CATEGORY NAVIGATION PILLS */}
      <div className="sticky top-16 sm:top-20 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-[#040e0a]/95 backdrop-blur-md border-y border-emerald-500/20 shadow-xl transition-all">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {/* All Mohols Tab */}
          <button
            id="tab-mohol-all"
            onClick={() => setSelectedMohol('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedMohol === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black shadow-lg shadow-emerald-500/20 scale-100 ring-1 ring-emerald-300'
                : 'bg-[#092218] border border-emerald-900/80 text-stone-300 hover:text-white hover:border-emerald-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Traditional Mohols</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedMohol === 'all' ? 'bg-black/30 text-stone-900 font-extrabold' : 'bg-black/50 text-emerald-400'
            }`}>
              {MENU_ITEMS.length}
            </span>
          </button>

          {/* Provesh Mohol Pill */}
          <button
            id="tab-mohol-probesh"
            onClick={() => handleScrollToMohol('probesh')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedMohol === 'probesh'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black shadow-lg shadow-emerald-500/20 scale-100 ring-1 ring-emerald-300'
                : 'bg-[#092218] border border-emerald-900/80 text-stone-300 hover:text-white hover:border-emerald-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Provesh Mohol</span>
            <span className="text-[10px] hidden md:inline text-emerald-300/80 font-normal">• Welcome & Starters</span>
          </button>

          {/* Bhoj Mohol Pill */}
          <button
            id="tab-mohol-bhoj"
            onClick={() => handleScrollToMohol('bhoj')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedMohol === 'bhoj'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black shadow-lg shadow-emerald-500/20 scale-100 ring-1 ring-emerald-300'
                : 'bg-[#092218] border border-emerald-900/80 text-stone-300 hover:text-white hover:border-emerald-700'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-teal-300" />
            <span>Bhoj Mohol</span>
            <span className="text-[10px] hidden md:inline text-teal-300/80 font-normal">• Combos (₹349)</span>
          </button>

          {/* Mohini Mohol Pill */}
          <button
            id="tab-mohol-mohini"
            onClick={() => handleScrollToMohol('mohini')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedMohol === 'mohini'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black shadow-lg shadow-emerald-500/20 scale-100 ring-1 ring-emerald-300'
                : 'bg-[#092218] border border-emerald-900/80 text-stone-300 hover:text-white hover:border-emerald-700'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-cyan-300" />
            <span>Mohini Mohol</span>
            <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300 font-bold border border-emerald-500/40">₹0 Free</span>
          </button>

          {/* Matini Mohol Pill */}
          <button
            id="tab-mohol-matini"
            onClick={() => handleScrollToMohol('matini')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedMohol === 'matini'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black shadow-lg shadow-emerald-500/20 scale-100 ring-1 ring-emerald-300'
                : 'bg-[#092218] border border-emerald-900/80 text-stone-300 hover:text-white hover:border-emerald-700'
            }`}
          >
            <Cake className="w-3.5 h-3.5 text-amber-300" />
            <span>Matini Mohol</span>
            <span className="text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300 font-bold border border-amber-500/40">₹99</span>
          </button>
        </div>
      </div>

      {/* Search and Dietary Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#061811] border border-emerald-500/20 p-3 sm:p-4 rounded-2xl my-6 shadow-md">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input
            id="dish-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search zero-waste dishes, peels, ingredients..."
            className="w-full pl-10 pr-4 py-2 bg-stone-900/90 border border-emerald-900/60 text-stone-200 placeholder-stone-500 text-xs sm:text-sm rounded-xl focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {/* Dietary Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <button
            id="filter-dietary-all"
            onClick={() => setDietaryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dietaryFilter === 'all'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            All Plates
          </button>
          <button
            id="filter-dietary-pure-veg"
            onClick={() => setDietaryFilter('pure-veg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dietaryFilter === 'pure-veg'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            Pure Veg
          </button>
          <button
            id="filter-dietary-vegan"
            onClick={() => setDietaryFilter('vegan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dietaryFilter === 'vegan'
                ? 'bg-teal-500 text-stone-950 font-bold shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            100% Vegan
          </button>
          <button
            id="filter-dietary-non-veg"
            onClick={() => setDietaryFilter('non-veg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dietaryFilter === 'non-veg'
                ? 'bg-cyan-500 text-stone-950 font-bold shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            Sustainable Non-Veg
          </button>
        </div>
      </div>

      {/* DISHES SECTIONS (TRADITIONAL MOHOLS) */}
      {filteredDishes.length === 0 ? (
        <div className="text-center py-16 bg-[#061811] border border-emerald-950 rounded-2xl p-8 space-y-3">
          <p className="text-stone-400 text-base">No zero-waste recipes found matching your filters.</p>
          <button
            onClick={() => {
              setSelectedMohol('all');
              setDietaryFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-stone-950 text-xs font-bold hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          
          {/* =========================================================================
              1. PROVESH MOHOL (Welcome & Starters)
              Starters (₹349 each) + Rural Bengal Counter (Included with Pass)
             ========================================================================= */}
          {(selectedMohol === 'all' || selectedMohol === 'probesh') && (
            <section id="mohol-probesh" className="scroll-mt-36 space-y-6">
              {/* Mohol Section Header */}
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#092218] via-[#05160f] to-[#040e0a] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Provesh Mohol
                    </h3>
                    <span className="text-sm sm:text-base text-emerald-400 font-serif italic">
                      (প্রবেশ মহল • স্বাগতম ও স্টার্টার)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
                    Crisp handcrafted starters and authentic Rural Bengal Heritage live counter specialties.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400/50 text-emerald-300 font-bold text-xs shadow-sm">
                    Starters: ₹349 each
                  </span>
                  <span className="px-3 py-1 rounded-full bg-teal-950 border border-teal-400/50 text-teal-300 font-bold text-xs shadow-sm">
                    Rural Counter: Included (₹0)
                  </span>
                </div>
              </div>

              {/* Subsection A: Starters (₹349 each) */}
              {groupedDishes.probesh.starters.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-900/60 pb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-base font-bold text-white tracking-wide uppercase">
                      Handcrafted Starters <span className="text-emerald-400 text-sm font-normal">(₹349 each)</span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedDishes.probesh.starters.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        quantityInCart={getCartQuantity(dish.id)}
                        onSelectDish={onSelectDish}
                        onAddToCart={() => onAddToCart(dish)}
                        onIncrement={() => handleIncrement(dish)}
                        onDecrement={() => handleDecrement(dish)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Subsection B: Rural Bengal Counter (Included with Pass) */}
              {groupedDishes.probesh.rural.length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between border-b border-teal-900/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-teal-400" />
                      <h4 className="text-base font-bold text-white tracking-wide uppercase">
                        Rural Bengal Counter <span className="text-teal-300 text-sm font-normal">(Included with Pass — ₹0)</span>
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-teal-300 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-400/40">
                      Free Tasting Access
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedDishes.probesh.rural.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        quantityInCart={getCartQuantity(dish.id)}
                        onSelectDish={onSelectDish}
                        onAddToCart={() => onAddToCart(dish)}
                        onIncrement={() => handleIncrement(dish)}
                        onDecrement={() => handleDecrement(dish)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =========================================================================
              2. BHOJ MOHOL (Main Course Combos — ₹349 each)
             ========================================================================= */}
          {(selectedMohol === 'all' || selectedMohol === 'bhoj') && groupedDishes.bhoj.length > 0 && (
            <section id="mohol-bhoj" className="scroll-mt-36 space-y-6">
              {/* Mohol Section Header */}
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#061e24] via-[#05171c] to-[#040e0a] border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Bhoj Mohol
                    </h3>
                    <span className="text-sm sm:text-base text-cyan-400 font-serif italic">
                      (ভোজ মহল • প্রধান ব্যঞ্জন কম্বো)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
                    Celebratory Main Course Combos: slow-simmered Bengal curries paired with fragrant slow-cooked polao preparations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-200 font-extrabold text-xs shadow-md">
                    ₹349 per Combo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedDishes.bhoj.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    quantityInCart={getCartQuantity(dish.id)}
                    onSelectDish={onSelectDish}
                    onAddToCart={() => onAddToCart(dish)}
                    onIncrement={() => handleIncrement(dish)}
                    onDecrement={() => handleDecrement(dish)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* =========================================================================
              3. MOHINI MOHOL (Complimentary Tasting Counter — ₹0)
             ========================================================================= */}
          {(selectedMohol === 'all' || selectedMohol === 'mohini') && groupedDishes.mohini.length > 0 && (
            <section id="mohol-mohini" className="scroll-mt-36 space-y-6">
              {/* Mohol Section Header */}
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#092218] via-[#041910] to-[#040e0a] border border-emerald-400/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Mohini Mohol
                    </h3>
                    <span className="text-sm sm:text-base text-emerald-400 font-serif italic">
                      (মোহিনী মহল • টক, ঝোল, অম্বল)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
                    Traditional sweet, sour & digestive chutneys and cooling broths. Full complimentary portion with every festival Eco-Pass.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 font-black text-xs shadow-md uppercase tracking-wider">
                    Complimentary Tasting Counter — ₹0
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groupedDishes.mohini.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    quantityInCart={getCartQuantity(dish.id)}
                    onSelectDish={onSelectDish}
                    onAddToCart={() => onAddToCart(dish)}
                    onIncrement={() => handleIncrement(dish)}
                    onDecrement={() => handleDecrement(dish)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* =========================================================================
              4. MATINI MOHOL (Confectionery & Misti Mukh — ₹99)
             ========================================================================= */}
          {(selectedMohol === 'all' || selectedMohol === 'matini') && groupedDishes.matini.length > 0 && (
            <section id="mohol-matini" className="scroll-mt-36 space-y-6">
              {/* Mohol Section Header */}
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#211406] via-[#150c04] to-[#040e0a] border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Matini Mohol
                    </h3>
                    <span className="text-sm sm:text-base text-amber-400 font-serif italic">
                      (মাতিনী মহল • মিষ্টি মুখ প্লাটার)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
                    An exquisite four-sweet royal tasting platter featuring rare, lost heirloom confections of Bengal.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-400/60 text-amber-200 font-extrabold text-xs shadow-md">
                    Misti Mukh Platter: ₹99
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedDishes.matini.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    quantityInCart={getCartQuantity(dish.id)}
                    onSelectDish={onSelectDish}
                    onAddToCart={() => onAddToCart(dish)}
                    onIncrement={() => handleIncrement(dish)}
                    onDecrement={() => handleDecrement(dish)}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      )}

    </section>
  );
};

// ---------------------------------------------------------------------------
// Reusable Dish Card with Interactive Counter Pill [ - ] [ quantity ] [ + ]
// ---------------------------------------------------------------------------
interface DishCardProps {
  dish: MenuItem;
  quantityInCart: number;
  onSelectDish: (dish: MenuItem) => void;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

const DishCard: React.FC<DishCardProps> = ({
  dish,
  quantityInCart,
  onSelectDish,
  onAddToCart,
  onIncrement,
  onDecrement,
}) => {
  const isFree = dish.price === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      id={`dish-card-${dish.id}`}
      className="group relative bg-[#061811] border border-emerald-500/20 hover:border-cyan-400/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
    >
      {/* Dish Image & Top Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-950">
        <img
          src={dish.imageUrl}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061811] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1">
          <span className="px-2.5 py-0.5 rounded-full bg-black/75 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            {dish.moholTitle}
          </span>

          {dish.isChefSpecial && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-400/50 text-emerald-200 text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
              AI Special
            </span>
          )}
        </div>

        {/* Dietary & Zero Waste Badges */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            dish.dietary === 'pure-veg' 
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' 
              : dish.dietary === 'vegan'
              ? 'bg-teal-950/90 text-teal-300 border border-teal-500/40'
              : 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40'
          }`}>
            {dish.dietary.replace('-', ' ')}
          </span>

          <span className="px-2 py-0.5 rounded bg-[#040e0a]/90 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1 font-mono">
            <Leaf className="w-2.5 h-2.5 text-emerald-400" />
            <span>{dish.wasteScore}% zero-waste</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Prominent Badges for Complimentary & Heritage */}
          {dish.mohol === 'tasting' && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400/60 text-emerald-300 text-[11px] font-black uppercase tracking-wide shadow-md">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Complimentary Tasting — ₹0</span>
              </span>
            </div>
          )}

          {dish.mohol === 'rural' && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950 border border-teal-400/50 text-teal-300 text-[11px] font-bold uppercase tracking-wide">
                <Leaf className="w-3.5 h-3.5 text-teal-400" />
                <span>Rural Bengal Counter — Included with Pass (₹0)</span>
              </span>
            </div>
          )}

          {/* Dish Title & Price */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                {dish.name}
              </h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                {dish.bengaliName}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-lg sm:text-xl font-black font-display ${isFree ? 'text-emerald-400' : 'text-cyan-300'}`}>
                ₹{dish.price}
              </span>
              {isFree && (
                <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Free Tasting
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-stone-300/90 line-clamp-2 mt-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Eco Story / Lore Teaser */}
        <div className="p-2.5 rounded-lg bg-[#04120a] border border-emerald-950 text-[11px] text-emerald-200/90 italic flex items-center justify-between gap-2">
          <span className="truncate">"{dish.sustainabilityStory || dish.historyLore}"</span>
          <button
            id={`dish-view-lore-${dish.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDish(dish);
            }}
            className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold underline whitespace-nowrap not-italic cursor-pointer"
          >
            Eco Story
          </button>
        </div>

        {/* 2. INTERACTIVE CARD QUANTITY CONTROLS (- / +) */}
        <div className="flex items-center gap-2 pt-2 border-t border-emerald-950">
          <button
            id={`dish-detail-btn-${dish.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDish(dish);
            }}
            className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-emerald-900 text-stone-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Inspect Zero-Waste Recipe Details"
            aria-label="Inspect dish details"
          >
            <Info className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {quantityInCart === 0 ? (
                /* Default button: clean single + Add to Eco-Plate */
                <motion.button
                  key="add-btn"
                  id={`dish-add-cart-${dish.id}`}
                  type="button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add to Eco-Plate</span>
                </motion.button>
              ) : (
                /* Active counter pill: [ - ] [ quantity ] [ + ] */
                <motion.div
                  key="counter-pill"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="w-full flex items-center justify-between bg-black/70 border border-emerald-400/80 rounded-xl p-1 shadow-lg ring-1 ring-emerald-500/40"
                >
                  <button
                    id={`dish-decrement-${dish.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecrement();
                    }}
                    className="w-8 h-8 rounded-lg bg-emerald-950/90 hover:bg-emerald-800 text-emerald-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-emerald-800/60"
                    aria-label="Decrease dish quantity"
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="flex items-center gap-1.5 px-2">
                    <span className="font-mono text-sm font-black text-white">
                      {quantityInCart}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                      in plate
                    </span>
                  </div>

                  <button
                    id={`dish-increment-${dish.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrement();
                    }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow border border-emerald-400/40"
                    aria-label="Increase dish quantity"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
export default MenuSection;
