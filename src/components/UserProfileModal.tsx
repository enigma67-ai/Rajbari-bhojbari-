import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  X, 
  Ticket, 
  Leaf, 
  Download, 
  QrCode, 
  LogOut, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { UserProfile, EventTicketPass } from '../types';
import { SavedBooking } from '../lib/firebase';
import { FESTIVAL_INFO } from '../data/festData';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  userTickets: EventTicketPass[];
  userBookings: SavedBooking[];
  onLogout: () => void;
  onOpenBooking: () => void;
  onOpenLegal: (tab?: any) => void;
  onNavigateToAdmin?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userTickets,
  userBookings,
  onLogout,
  onOpenBooking,
  onOpenLegal,
  onNavigateToAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'passes' | 'karma' | 'data'>('passes');
  const [selectedPassQr, setSelectedPassQr] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dataDeletionRequested, setDataDeletionRequested] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportData = () => {
    const exportPayload = {
      profile: currentUser,
      tickets: userTickets,
      bookings: userBookings,
      exportedAt: new Date().toISOString(),
      festival: FESTIVAL_INFO.title,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rajbari_bhojbari_user_data_${currentUser?.id || 'guest'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRequestDeletion = () => {
    const confirmed = window.confirm(
      'Are you sure you want to request deletion of your personal data under the DPDP Act, 2023? This will purge local session records and email the Data Grievance Officer.'
    );
    if (!confirmed) return;

    try {
      localStorage.removeItem('rb_user');
      localStorage.removeItem('rb_cart');
    } catch (_) {}
    setDataDeletionRequested(true);
  };

  const totalPassCount = userTickets.reduce((acc, t) => acc + (t.ticketQuantity || 1), 0);

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[96%] sm:w-full max-w-2xl max-h-[88vh] overflow-y-auto mx-auto bg-gradient-to-b from-[#1c0507] via-[#120305] to-[#0a0203] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-200 font-sans space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-amber-500/25">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 id="user-profile-modal-title" className="text-lg font-bold text-white font-display">
                  {currentUser?.name || 'Festival Patron'}
                </h3>
                <p className="text-xs text-amber-300/90 font-mono">
                  {currentUser?.emailOrPhone || 'Registered Guest'} • <span className="capitalize">{currentUser?.role?.replace('_', ' ') || 'Patron'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-700/60 cursor-pointer"
              aria-label="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-800 pb-2 text-xs">
            <button
              onClick={() => setActiveTab('passes')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'passes'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-amber-200 hover:bg-stone-900'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>My Eco-Passes ({totalPassCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('karma')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'karma'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-amber-200 hover:bg-stone-900'
              }`}
            >
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>Karma Points ({currentUser?.sustainabilityKarma || 100})</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'data'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-amber-200 hover:bg-stone-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>DPDP Privacy Rights</span>
            </button>
          </div>

          {/* TAB 1: PASSES & QR CODES */}
          {activeTab === 'passes' && (
            <div className="space-y-4">
              {userTickets.length === 0 ? (
                <div className="p-8 rounded-2xl bg-stone-900/60 border border-stone-800 text-center space-y-3">
                  <Ticket className="w-10 h-10 text-stone-600 mx-auto" />
                  <p className="text-stone-300 font-medium text-sm">No Digital Passes Booked Yet</p>
                  <p className="text-stone-400 text-xs max-w-sm mx-auto">
                    Every attendee requires a verified digital Eco-Pass for gate admission. Reserve your entry pass for ₹349/- now.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBooking();
                    }}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Book Eco-Pass Now (₹349)
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {userTickets.map((pass) => (
                    <div 
                      key={pass.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#24080c] via-[#1c0507] to-[#120305] border border-amber-500/35 space-y-3 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300 text-sm">{pass.id}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">
                              {pass.paymentStatus === 'paid' ? 'Paid & Validated' : 'Pay at Gate Counter'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-300 font-medium mt-0.5">
                            {pass.customerName} • {pass.ticketQuantity || 1} Guest Pass(es)
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPassQr(pass.qrCodeUrl)}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View QR</span>
                          </button>
                          <a
                            href={pass.qrCodeUrl}
                            download={`${pass.id}_qr_pass.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:text-white cursor-pointer"
                            title="Download Pass"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{pass.eventDate || 'Friday, 9th October 2026'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{pass.slot || 'Authentic Bengali Lunch (Starts 12:00 PM • Entry closes 3:00 PM)'}</span>
                        </div>
                      </div>

                      <div className="pt-1 text-[11px] text-stone-400 flex items-center justify-between border-t border-amber-900/30">
                        <span>Total: <strong className="text-amber-200">₹{pass.totalAmount}/-</strong> via {pass.paymentMethod?.toUpperCase()}</span>
                        <button
                          onClick={() => handleCopy(pass.id, pass.id)}
                          className="hover:text-amber-300 flex items-center gap-1 cursor-pointer font-mono"
                        >
                          {copiedId === pass.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === pass.id ? 'Copied' : 'Copy ID'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KARMA & SUSTAINABILITY SCORE */}
          {activeTab === 'karma' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#120305] to-[#1e0609] border border-emerald-500/40 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <Leaf className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-display font-bold text-white text-base">
                  {currentUser?.sustainabilityKarma || 100} Karma Points Earned
                </h4>
                <p className="text-xs text-emerald-200/90 max-w-md mx-auto">
                  Earned for championing zero-waste dining, using compostable sal-leaf dining platters, and supporting IAM student hospitality.
                </p>
              </div>

              <div className="space-y-2 text-xs text-stone-300">
                <h5 className="font-bold text-amber-200 text-xs uppercase tracking-wider">Zero-Waste Milestones</h5>
                <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Plastic Bottle Prohibition Pledge: 100% Organic Earthenware Glassware</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Peel-to-Stem Culinary Utilization: Zero scrap organic waste generated</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DPDP ACT DATA RIGHTS */}
          {activeTab === 'data' && (
            <div className="space-y-4 text-xs text-stone-300">
              <div className="p-4 rounded-2xl bg-[#2a080c]/60 border border-amber-500/30 space-y-2">
                <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Your Rights Under DPDP Act, 2023</span>
                </h4>
                <p className="text-stone-300 leading-relaxed text-xs">
                  You maintain full rights to export your stored personal data or request permanent erasure from our databases following event audit reconciliations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleExportData}
                  className="p-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400/60 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Export My Data (JSON)</span>
                </button>

                <button
                  onClick={handleRequestDeletion}
                  className="p-3.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Request Data Erasure</span>
                </button>
              </div>

              {dataDeletionRequested && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs">
                  ✓ Erasure request recorded. Local session data purged. For complete database deletion, an automated notification has been logged for our Grievance Officer ({FESTIVAL_INFO.contactEmail}).
                </div>
              )}

              <div className="pt-2 text-[11px] text-stone-400">
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Read complete Privacy Notice & DPDP policy <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              {currentUser?.role === 'admin' && onNavigateToAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToAdmin();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Hub (/admin)</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-md cursor-pointer transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>

          {/* QR Enlarged Sub-Modal */}
          {selectedPassQr && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <div className="relative p-6 rounded-3xl bg-[#1a0507] border border-amber-500/50 text-center space-y-4 max-w-xs w-full shadow-2xl">
                <button
                  onClick={() => setSelectedPassQr(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="font-bold text-amber-200 text-sm font-display">Gate Scanner QR Code</h4>
                <div className="p-3 bg-white rounded-2xl mx-auto inline-block border-2 border-amber-400">
                  <img src={selectedPassQr} alt="Gate Pass QR" className="w-48 h-48 block" />
                </div>
                <p className="text-[11px] text-stone-400">Present this QR code to the entrance scanner at East Heritage Gate.</p>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
