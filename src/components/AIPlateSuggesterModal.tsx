import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Bot, 
  Leaf, 
  Check, 
  UtensilsCrossed, 
  Users, 
  ArrowRight,
  Flame,
  Plus
} from 'lucide-react';
import { MenuItem } from '../types';
import { MENU_ITEMS } from '../data/festData';

interface AIPlateSuggesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMultipleToCart: (dishes: MenuItem[]) => void;
}

export const AIPlateSuggesterModal: React.FC<AIPlateSuggesterModalProps> = ({
  isOpen,
  onClose,
  onAddMultipleToCart,
}) => {
  const [dietary, setDietary] = useState<'pure-veg' | 'non-veg'>('pure-veg');
  const [partySize, setPartySize] = useState<number>(2);
  const [spicePreference, setSpicePreference] = useState<string>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlate, setGeneratedPlate] = useState<any | null>(null);

  const handleGeneratePlate = async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/suggest-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preference: dietary,
          partySize,
          spicePreference,
        }),
      });

      if (res.ok) {
        try {
          const data = await res.json();
          setGeneratedPlate(data);
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAllToCart = () => {
    if (!generatedPlate || !generatedPlate.recommendedDishes) return;

    const matchedDishes: MenuItem[] = [];
    for (const rec of generatedPlate.recommendedDishes) {
      const match = MENU_ITEMS.find((d) => d.name.toLowerCase() === rec.name.toLowerCase());
      if (match) matchedDishes.push(match);
    }

    if (matchedDishes.length > 0) {
      onAddMultipleToCart(matchedDishes);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          <motion.div 
            id="ai-plate-suggester-modal"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a0507] border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-stone-200 z-10"
          >
            <motion.button
              id="close-ai-plate-suggester-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-red-950/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-amber-500/25">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              AI Eco-Plate Suggester
            </h2>
            <p className="text-xs text-emerald-400 font-sans">
              Algorithmic gastronomy balancing palate, sustainability, and zero-waste limits
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          
          {/* Dietary Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Dietary Profile
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-stone-900/90 p-1 rounded-xl border border-stone-800">
              <button
                type="button"
                id="diet-choice-veg"
                onClick={() => setDietary('pure-veg')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  dietary === 'pure-veg' ? 'bg-amber-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Pure Veg
              </button>
              <button
                type="button"
                id="diet-choice-nonveg"
                onClick={() => setDietary('non-veg')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  dietary === 'non-veg' ? 'bg-amber-600 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Sustainable Non-Veg
              </button>
            </div>
          </div>

          {/* Party Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Diners & Guests</span>
            </label>
            <select
              id="plate-suggester-party-size"
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={1}>Solo Eco Diner (1)</option>
              <option value={2}>Eco Pair / Companions (2)</option>
              <option value={4}>Family Table (4)</option>
              <option value={6}>Group Tasting Table (6)</option>
              <option value={10}>Eco Banquet Party (10)</option>
            </select>
          </div>

          {/* Spice Comfort */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Spice Depth</span>
            </label>
            <select
              id="plate-suggester-spice"
              value={spicePreference}
              onChange={(e) => setSpicePreference(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="mild">Mild & Fragrant</option>
              <option value="medium">Balanced Zamindar Seasoning</option>
              <option value="rich">Rich, Aromatic & Pungent</option>
            </select>
          </div>

        </div>

        {/* Generate Button */}
        <button
          id="generate-smart-plate-btn"
          onClick={handleGeneratePlate}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.25)] border border-amber-300/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          {isLoading ? (
            <>
              <Bot className="w-4 h-4 animate-spin text-stone-950" />
              <span>Synthesizing Eco-Plate Sequence...</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              <span>Generate AI Eco-Plate Sequence</span>
            </>
          )}
        </button>

        {/* Generated Plate Output */}
        {generatedPlate && (
          <div className="mt-6 p-5 rounded-2xl bg-[#140305] border border-amber-500/30 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                  AI Recommendation
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-amber-200">
                  {generatedPlate.title}
                </h3>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 text-xs font-semibold border border-emerald-500/40 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>{generatedPlate.zeroWasteMetric}</span>
              </span>
            </div>

            {/* Dishes list */}
            <div className="space-y-2">
              {generatedPlate.recommendedDishes.map((dish: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{dish.name}</div>
                      <div className="text-[11px] text-stone-400">{dish.role}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-amber-300 font-medium px-2 py-0.5 rounded bg-black/40 border border-amber-500/20">
                    {dish.mohol}
                  </span>
                </div>
              ))}
            </div>

            {/* Rational note */}
            <div className="p-3 rounded-xl bg-stone-900/50 border border-stone-800/80 text-xs text-stone-300 leading-relaxed italic">
              "{generatedPlate.pairingReason}"
            </div>

            {/* Add All Button */}
            <motion.button
              id="add-all-suggested-dishes-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddAllToCart}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add All Courses to Eco Plate</span>
            </motion.button>
          </div>
        )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
