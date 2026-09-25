import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Leaf, 
  ArrowRight,
  ShieldCheck, 
  Crown,
  Sparkles,
  UtensilsCrossed,
  Cake,
  Ticket,
  AlertCircle
} from 'lucide-react';
import { CartItem, MenuItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (dishId: string, delta: number) => void;
  onRemoveItem: (dishId: string) => void;
  onProceedToCheckout: () => void;
}

interface MoholCartGroup {
  id: 'probesh' | 'bhoj' | 'mohini' | 'matini';
  title: string;
  subtitle: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
  items: CartItem[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const totalItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  // Group cart items by Traditional Mohol
  const groupedCart = useMemo(() => {
    const groups: {
      probesh: CartItem[];
      bhoj: CartItem[];
      mohini: CartItem[];
      matini: CartItem[];
    } = {
      probesh: [],
      bhoj: [],
      mohini: [],
      matini: [],
    };

    cart.forEach((item) => {
      const m = item.dish.mohol;
      if (m === 'starters' || m === 'rural' || m === 'probesh') {
        groups.probesh.push(item);
      } else if (m === 'mains' || m === 'bhoj') {
        groups.bhoj.push(item);
      } else if (m === 'tasting' || m === 'mohini' || m === 'mati') {
        groups.mohini.push(item);
      } else {
        groups.matini.push(item);
      }
    });

    const list: MoholCartGroup[] = [];

    if (groups.probesh.length > 0) {
      list.push({
        id: 'probesh',
        title: 'Provesh Mohol',
        subtitle: 'Welcome & Starters',
        badge: 'Starters & Rural Counter',
        icon: Sparkles,
        accentColor: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
        items: groups.probesh,
      });
    }

    if (groups.bhoj.length > 0) {
      list.push({
        id: 'bhoj',
        title: 'Bhoj Mohol',
        subtitle: 'Main Course Combos',
        badge: '₹349 each',
        icon: UtensilsCrossed,
        accentColor: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300',
        items: groups.bhoj,
      });
    }

    if (groups.mohini.length > 0) {
      list.push({
        id: 'mohini',
        title: 'Mohini Mohol',
        subtitle: 'Complimentary Tasting Counter',
        badge: '₹0 Free',
        icon: Leaf,
        accentColor: 'border-teal-500/40 bg-teal-950/40 text-teal-300',
        items: groups.mohini,
      });
    }

    if (groups.matini.length > 0) {
      list.push({
        id: 'matini',
        title: 'Matini Mohol',
        subtitle: 'Confectionery & Misti Mukh',
        badge: '₹99 Platter',
        icon: Cake,
        accentColor: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
        items: groups.matini,
      });
    }

    return list;
  }, [cart]);

  // Pricing calculations
  const subtotal = cart.reduce((acc, i) => acc + i.dish.price * i.quantity, 0);
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const sustainabilityCess = Math.round(subtotal * 0.02); // 2% eco cess
  const grandTotal = subtotal + taxes + sustainabilityCess;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div 
              id="cart-drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-lg bg-gradient-to-b from-[#092218] via-[#051710] to-[#020a06] border-l border-emerald-500/30 p-5 sm:p-6 flex flex-col justify-between shadow-2xl text-emerald-100 z-10"
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                      <ShoppingBag className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-display font-extrabold text-white tracking-wide">
                          Your Eco-Plate
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">
                          Cart
                        </span>
                      </div>
                      <p className="text-xs text-emerald-300/80 mt-0.5">
                        {totalItemsCount} {totalItemsCount === 1 ? 'course' : 'courses'} selected across traditional Mohols
                      </p>
                    </div>
                  </div>

                  <button
                    id="close-cart-drawer-btn"
                    onClick={onClose}
                    className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close cart"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sustainability banner */}
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>Zero-Waste Gastronomy:</strong> 100% whole-ingredient culinary preparations supporting IAM student kitchens.
                  </span>
                </div>
              </div>

              {/* Cart Items List Grouped by Mohol */}
              <div className="flex-1 overflow-y-auto my-4 space-y-5 pr-1.5 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-500/40">
                      <Leaf className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-bold text-base">Your Eco-Plate is currently empty.</p>
                      <p className="text-xs text-stone-400 max-w-xs mx-auto">
                        Explore our traditional Mohols and tap <strong>+ Add to Eco-Plate</strong> to select your festival dishes!
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      Browse Bengal Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedCart.map((group) => {
                      const Icon = group.icon;

                      return (
                        <div key={group.id} className="space-y-2.5">
                          {/* Mohol Group Header */}
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-sm ${group.accentColor}`}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <div>
                                <span className="font-bold text-xs sm:text-sm tracking-wide block">
                                  {group.title}
                                </span>
                                <span className="text-[10px] opacity-80 block">
                                  {group.subtitle}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-bold border border-white/10 uppercase">
                              {group.badge}
                            </span>
                          </div>

                          {/* Items in this Mohol */}
                          <div className="space-y-2">
                            {group.items.map((item) => {
                              const isFree = item.dish.price === 0;

                              return (
                                <motion.div
                                  key={item.dish.id}
                                  layout
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="p-3 rounded-2xl bg-[#092015] border border-emerald-900/60 hover:border-emerald-700/60 flex items-center justify-between gap-3 text-xs shadow-sm transition-all"
                                >
                                  {/* Dish Image Thumbnail */}
                                  <img
                                    src={item.dish.imageUrl}
                                    alt={item.dish.name}
                                    className="w-12 h-12 object-cover rounded-xl border border-emerald-800/80 flex-shrink-0"
                                  />

                                  {/* Dish Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white truncate text-xs sm:text-sm">
                                      {item.dish.name}
                                    </div>
                                    <div className="text-[10px] text-emerald-400 font-medium truncate">
                                      {item.dish.bengaliName}
                                    </div>

                                    {/* Price Badge */}
                                    <div className="mt-1 flex items-center gap-2">
                                      {isFree ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-400/50">
                                          <Leaf className="w-3 h-3 text-emerald-400" />
                                          ₹0 • Complimentary Tasting
                                        </span>
                                      ) : (
                                        <div className="text-emerald-300 font-bold text-xs flex items-center gap-1">
                                          <span>₹{item.dish.price * item.quantity}</span>
                                          {item.quantity > 1 && (
                                            <span className="text-[10px] text-stone-400 font-normal">
                                              (₹{item.dish.price} each)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Inline [ - ] [ quantity ] [ + ] Buttons */}
                                  <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-emerald-800/80 shadow-inner flex-shrink-0">
                                    <button
                                      id={`cart-decrease-${item.dish.id}`}
                                      type="button"
                                      onClick={() => onUpdateQuantity(item.dish.id, -1)}
                                      className="w-7 h-7 rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-200 hover:text-white flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus className="w-3 h-3 stroke-[2.5]" />
                                    </button>

                                    <span className="w-5 text-center font-mono font-black text-xs text-white">
                                      {item.quantity}
                                    </span>

                                    <button
                                      id={`cart-increase-${item.dish.id}`}
                                      type="button"
                                      onClick={() => onUpdateQuantity(item.dish.id, 1)}
                                      className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 flex items-center justify-center font-bold transition-colors active:scale-90 cursor-pointer"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                  </div>

                                  {/* Remove Trash Button */}
                                  <button
                                    id={`cart-remove-${item.dish.id}`}
                                    type="button"
                                    onClick={() => onRemoveItem(item.dish.id)}
                                    className="p-1.5 text-stone-400 hover:text-rose-400 transition-colors flex-shrink-0 cursor-pointer"
                                    title="Remove from Eco-Plate"
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live Calculation Breakdown & Checkout Button */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-emerald-500/20 space-y-3">
                  {/* Calculation Breakdown Table */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-emerald-900/60 space-y-1.5 text-xs text-stone-300">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Items Subtotal:</span>
                      <span className="font-semibold text-white">₹{subtotal}/-</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Ticket className="w-3 h-3 text-emerald-400" />
                        <span>Festival Pass Access:</span>
                      </span>
                      <span className="text-emerald-300 font-medium">
                        1 Starter + 1 Combo + Rural Counter
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">GST (5%):</span>
                      <span className="font-mono text-stone-300">₹{taxes}/-</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">Eco Sustainability Cess (2%):</span>
                      <span className="font-mono text-stone-300">₹{sustainabilityCess}/-</span>
                    </div>

                    <div className="pt-1.5 border-t border-emerald-950 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm block">Grand Total:</span>
                        <span className="text-[10px] text-emerald-400">All inclusive in ₹ INR</span>
                      </div>
                      <span className="text-2xl font-black font-display text-emerald-300">
                        ₹{grandTotal}/-
                      </span>
                    </div>
                  </div>

                  {/* Prominent 'Proceed to Checkout / Book Pass' Button */}
                  <button
                    id="drawer-proceed-checkout-btn"
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceedToCheckout();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 cursor-pointer"
                  >
                    <span>Proceed to Checkout / Book Pass (₹{grandTotal}/-)</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <p className="text-center text-[10px] text-stone-400">
                    🔒 256-Bit SSL Encrypted • Instant QR Digital Pass Issued Upon Confirmation
                  </p>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
