import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Home, Compass, PhoneCall, ArrowLeft } from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';
import { IAMChefLogo } from './IAMChefLogo';

interface NotFoundPageProps {
  onNavigateToHome: () => void;
  onNavigateToAdmin?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateToHome,
  onNavigateToAdmin,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#120305] text-amber-50 flex items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-stone-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-lg w-full bg-gradient-to-b from-[#24080c] via-[#1c0507] to-[#120305] border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
          <IAMChefLogo size={44} />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest px-3 py-1 rounded-full bg-red-950/80 border border-amber-500/30">
            Error 404 • Destination Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white pt-2">
            Lost in the Royal Courtyard
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
            The banquet pavilion or link you requested does not exist or has moved. Return to the main festival grounds to explore our 19th-century recipes and zero-waste dining passes.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#2a080c]/60 border border-amber-500/20 text-xs text-amber-200/90 text-left space-y-1">
          <span className="font-bold block text-amber-300">Quick Destination Guide:</span>
          <ul className="space-y-1 text-[11px] text-stone-300">
            <li>• <strong>Festival Grounds:</strong> Live menu, ₹349 Eco-Pass booking, and schedule.</li>
            <li>• <strong>Gate Staff Portal:</strong> Authorized entrance verification terminal (`/admin`).</li>
            <li>• <strong>Concierge Desk:</strong> Direct phone helpline at {FESTIVAL_INFO.phone}.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onNavigateToHome}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/50"
          >
            <Home className="w-4 h-4" />
            <span>Return to Festival Grounds</span>
          </button>
          
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="py-3 px-4 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-400/60 text-stone-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Gate Terminal (/admin)</span>
            </button>
          )}
        </div>

        <div className="pt-2 text-[11px] text-stone-400">
          IAM Annual Food Fest 2026 • Institute of Advanced Management (IAM), Kolkata
        </div>
      </motion.div>
    </div>
  );
};
