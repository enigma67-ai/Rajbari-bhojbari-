import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Leaf, 
  History, 
  Plus, 
  Bot, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MenuItem } from '../types';

interface DishDetailModalProps {
  dish: MenuItem | null;
  onClose: () => void;
  onAddToCart: (dish: MenuItem) => void;
  onAskBhojBot: (dish: MenuItem) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  dish,
  onClose,
  onAddToCart,
  onAskBhojBot,
}) => {
  return (
    <AnimatePresence>
      {dish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          <motion.div 
            id="dish-detail-modal-container"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#170e0a] border border-amber-500/40 rounded-2xl shadow-2xl text-stone-200 z-10"
          >
            {/* Close Button */}
            <motion.button
              id="close-dish-modal-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-stone-300 hover:text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Hero Image */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden">
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#170e0a] via-transparent to-black/40" />
              
              {/* Badge overlays */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-semibold backdrop-blur-md uppercase tracking-wider">
                  {dish.moholTitle}
                </span>
                {dish.isChefSpecial && (
                  <span className="px-2.5 py-1 rounded-full bg-red-900/90 border border-red-500/50 text-amber-200 text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Royal Specialty
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
                  {dish.name}
                </h2>
                <p className="font-sans text-emerald-400 font-semibold text-sm">
                  {dish.bengaliName}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Price, Dietary, Spice Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-xl bg-stone-900/80 border border-emerald-500/20">
                <div>
                  <span className="text-xs text-stone-400 uppercase tracking-wider block">Festival Price</span>
                  <span className="text-2xl font-bold text-emerald-300">₹{dish.price}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    dish.dietary === 'pure-veg' 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                      : dish.dietary === 'vegan'
                      ? 'bg-teal-950 text-teal-300 border border-teal-500/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}>
                    {dish.dietary.replace('-', ' ')}
                  </span>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-800 text-amber-200 border border-stone-700">
                    Spice: {dish.spiceLevel}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">Culinary Profile</h3>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {dish.description}
                </p>
              </div>

              {/* Century-Old Lore */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-950/40 to-stone-900/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Century-Old Royal Heritage Lore</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed italic">
                  "{dish.historyLore}"
                </p>
              </div>

              {/* Sustainability & Zero Waste Story */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/30 space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span>Royal Flavours. Zero Waste.</span>
                  </div>
                  <span className="text-xs bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-200">
                    {dish.wasteScore}% Sustainability Quotient
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  {dish.sustainabilityStory}
                </p>
              </div>

              {/* Ingredients Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Heirloom Ingredients</h3>
                <div className="flex flex-wrap gap-1.5">
                  {dish.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-xs text-amber-200/90"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-amber-500/20">
                <motion.button
                  id="modal-ask-bhojbot-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    onAskBhojBot(dish);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>Ask Hospi Bot About This Recipe</span>
                </motion.button>

                <motion.button
                  id="modal-add-to-cart-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onAddToCart(dish);
                    onClose();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-stone-950 font-bold text-sm shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Eco Plate (₹{dish.price})</span>
                </motion.button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
