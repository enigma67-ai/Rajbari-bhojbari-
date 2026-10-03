import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  Mail, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Cookie, 
  HeartHandshake, 
  Accessibility, 
  Sparkles, 
  Scale, 
  ShieldAlert, 
  Ban, 
  PhoneCall, 
  ExternalLink 
} from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';

export type LegalTabType = 
  | 'privacy' 
  | 'terms' 
  | 'refund' 
  | 'disclaimer' 
  | 'cookies' 
  | 'security' 
  | 'accessibility' 
  | 'community';

interface LegalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabType;
}

export const LegalCenterModal: React.FC<LegalCenterModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const tabs: { id: LegalTabType; label: string; icon: any }[] = [
    { id: 'privacy', label: 'Privacy Policy (DPDP)', icon: ShieldCheck },
    { id: 'terms', label: 'Terms of Service', icon: Scale },
    { id: 'refund', label: 'Refund & Cancellation', icon: Ban },
    { id: 'disclaimer', label: 'Allergen & Culinary Disclaimer', icon: AlertCircle },
    { id: 'cookies', label: 'Cookie & Storage Policy', icon: Cookie },
    { id: 'security', label: 'Security & Disclosure', icon: Lock },
    { id: 'accessibility', label: 'Accessibility Statement', icon: Accessibility },
    { id: 'community', label: 'Community Guidelines', icon: HeartHandshake },
  ];

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-center-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-[96%] sm:w-full max-w-4xl h-[90vh] max-h-[850px] mx-auto bg-gradient-to-b from-[#1c0507] via-[#120305] to-[#0a0203] border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-200 font-sans"
        >
          {/* Top Bar Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#24080c] via-[#1c0507] to-[#24080c] border-b border-amber-500/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 id="legal-center-title" className="text-base sm:text-lg font-display font-bold text-amber-100 tracking-wide">
                  Festival Legal & Compliance Center
                </h2>
                <p className="text-[11px] text-amber-400/80 font-medium">
                  {FESTIVAL_INFO.title} • Institute of Advanced Management (IAM), Kolkata
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-700/60 transition-colors cursor-pointer"
              aria-label="Close Legal Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Container: Left Tab Nav + Right Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Desktop Side Tabs / Mobile Horizontal Bar */}
            <div className="w-full md:w-64 bg-[#140305] border-b md:border-b-0 md:border-r border-amber-900/40 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 flex-shrink-0 scrollbar-none">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow-md shadow-amber-950/40'
                        : 'text-stone-300 hover:text-amber-200 hover:bg-red-950/40'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-stone-950' : 'text-amber-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm text-stone-300 leading-relaxed">
              
              {/* TAB 1: PRIVACY POLICY */}
              {activeTab === 'privacy' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Statutory Compliance</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Privacy Policy & Digital Personal Data Notice
                    </h3>
                    <p className="text-xs text-stone-400">
                      Pursuant to the Digital Personal Data Protection Act, 2023 (DPDP Act, India)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#2a080c]/60 border border-amber-500/20 space-y-1">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>1. Data Fiduciary Identity</span>
                    </div>
                    <p className="text-stone-200">
                      The Data Fiduciary is <strong>Institute of Advanced Management (IAM), Kolkata Campus</strong>, operating the <em>Rajbari Bhojbari 2026: Zero-Waste AI Food Fest</em> at Salt Lake Sector V, Kolkata, West Bengal 700106.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">2. Personal Data We Collect</h4>
                    <p>To process your event pass and provide food festival services, we collect:</p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li><strong>Identity & Contact Data:</strong> Full Name, Email Address, and Mobile Phone Number.</li>
                      <li><strong>Booking & Dining Preferences:</strong> Selected meal slot, dietary selections (veg / non-veg starter & main combo), dessert add-ons.</li>
                      <li><strong>Payment References:</strong> Bank UPI reference (UTR), transaction ID, and timestamp. We <em>never</em> store raw credit/debit card numbers or CVVs.</li>
                      <li><strong>Technical Data:</strong> Device browser user-agent, session identifiers, and visit metrics strictly for service delivery.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">3. Specific Purposes of Processing</h4>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li>Generating your unique tamper-evident digital QR entry pass.</li>
                      <li>Verifying authorized admission at the East Heritage Gate via staff barcode scanner.</li>
                      <li>Transmitting instant booking confirmations and passes via Email and WhatsApp.</li>
                      <li>Accurately allocating zero-waste culinary portions to eliminate food wastage.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">4. Data Storage, Processors & Retention</h4>
                    <p>
                      Your data is stored securely using Supabase (PostgreSQL with Row Level Security) and Google Cloud Platform (GCP). Data is retained for 30 days post-event (until November 9, 2026) for audit, lost pass inquiries, and tax accounting compliance, after which personal identifiable records are permanently purged.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">5. Your Statutory Rights (DPDP Act, 2023)</h4>
                    <p>You possess the statutory right to:</p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li><strong>Access & Summary:</strong> Request an export of your personal data held in our systems.</li>
                      <li><strong>Correction & Updation:</strong> Rectify inaccurate contact or dining details.</li>
                      <li><strong>Erasure & Revocation:</strong> Withdraw consent and request data deletion post-event.</li>
                    </ul>
                    <p className="pt-1">
                      To exercise any of these rights, contact our designated Grievance Officer at:{' '}
                      <a href={`mailto:${FESTIVAL_INFO.contactEmail}`} className="text-amber-300 font-mono underline">
                        {FESTIVAL_INFO.contactEmail}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: TERMS OF SERVICE */}
              {activeTab === 'terms' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Campus Entry & Event Terms</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Terms of Service & Festival Admission Rules
                    </h3>
                    <p className="text-xs text-stone-400">
                      Applicable to all attendees, ticket holders, and festival patrons.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-amber-200 font-bold text-xs uppercase tracking-wide">Strict Entry Policy</h4>
                      <p className="text-stone-300 text-xs mt-0.5">
                        <strong>NO TICKET, NO ENTRY.</strong> Every visitor (including students, patrons, and guests) must possess an authenticated digital QR Eco-Pass scanned and admitted at the gate.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">1. Eco-Pass Inclusions (₹349 per person)</h4>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li>Single-day admission to IAM Kolkata campus on Friday, 9th October 2026 for the booked dining slot.</li>
                      <li>Full complimentary access to the Rural Bengal Live Tasting Counter (Mohini Mohol).</li>
                      <li>One (1) authentic handcrafted starter of choice (Provesh Mohol).</li>
                      <li>One (1) main course royal combo of choice (Bhoj Mohol).</li>
                      <li>Misti Mukh dessert platters are an optional culinary add-on at ₹99/-.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">2. Zero-Waste Code of Conduct</h4>
                    <p>
                      Rajbari Bhojbari is an environmentally committed festival aligned with UN Sustainable Development Goal 12. Attendees agree to:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li>Utilize provided compostable Sal-leaf dining plates and earthen clay cups.</li>
                      <li>Dispose of organic remnants in designated wet-waste composting chutes.</li>
                      <li>Refrain from bringing single-use plastic bottles or non-biodegradable packaging onto campus premises.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">3. Campus Safety & Decorum</h4>
                    <p>
                      Institute of Advanced Management reserves the right to deny admission or escort out any individual engaging in disorderly conduct, harassment of student hospitality volunteers, or unauthorized commercial solicitation.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: REFUND & CANCELLATION */}
              {activeTab === 'refund' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Procurement Policy</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Cancellation, Rescheduling & Refund Policy
                    </h3>
                    <p className="text-xs text-stone-400">
                      Zero-waste ingredient preparation and culinary reservation parameters.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#2a080c]/80 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                      <Ban className="w-4 h-4 text-amber-400" />
                      <span>Zero-Waste Non-Refundable Nature of Passes</span>
                    </div>
                    <p className="text-stone-300 text-xs leading-relaxed">
                      Due to our strict zero-waste charter, culinary ingredients (including organic Gobindobhog rice, Deshi fowl, artisanal Katla fish, and handcrafted chhana) are procured in exact quantities corresponding to confirmed passes. Consequently, <strong>all Eco-Pass purchases are non-refundable</strong> once confirmed.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Pass Transferability</h4>
                    <p>
                      While passes are non-refundable, they are <strong>100% transferable</strong> to friends, family members, or colleagues. To transfer a pass, simply forward your digital QR pass image or PDF confirmation to the attendee who will present it at the entry scanner.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Dining Slot Adjustments</h4>
                    <p>
                      If you cannot attend during your selected dining slot (e.g. Afternoon Feast vs. Grand Evening Dinner), you may request a slot change up to 24 hours prior to the festival by emailing{' '}
                      <a href={`mailto:${FESTIVAL_INFO.contactEmail}`} className="text-amber-300 underline font-mono">
                        {FESTIVAL_INFO.contactEmail}
                      </a>{' '}
                      or messaging our concierge on WhatsApp at{' '}
                      <a href={FESTIVAL_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">
                        {FESTIVAL_INFO.whatsappNumber}
                      </a>
                      , subject to slot seating capacity.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Event Rescheduling / Force Majeure</h4>
                    <p>
                      In the unlikely event of severe weather or institutional directive postponing the event, all passes will remain automatically valid for the rescheduled date.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: ALLERGEN & CULINARY DISCLAIMER */}
              {activeTab === 'disclaimer' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Health & Safety</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Allergen Disclosure & AI Advisory Disclaimer
                    </h3>
                    <p className="text-xs text-stone-400">
                      Important culinary ingredients, allergen indicators, and AI guidance limitations.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-400/40 space-y-2">
                    <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Allergen Notice (Food Safety Compliance)</span>
                    </h4>
                    <p className="text-stone-300 text-xs">
                      Our dishes are prepared in an active culinary training kitchen at IAM Kolkata. The menu features traditional Bengali ingredients that may contain or come into contact with common allergens:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <span className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200">Dairy / Chhana / Ghee</span>
                      <span className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200">Mustard (Shorshe)</span>
                      <span className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200">Freshwater Fish (Katla)</span>
                      <span className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200">Shrimp / Prawns (Chingri)</span>
                      <span className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200">Cashew & Kismis (Nuts)</span>
                      <span className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200">Gluten / Wheat</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Spice Levels & Traditional Ingredients</h4>
                    <p>
                      Our recipes reflect authentic 19th-century Zamindari and Nawabi preparations with whole ground spices (Radhuni, Gorom Moshla, Posto, and green chillies). If you require mild seasonings or have severe food allergies, please inform our student service team at your dining station.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Bhoj-Bot AI Advice Disclaimer</h4>
                    <p>
                      The Bhoj-Bot AI Culinary Concierge provides cultural history, menu recommendations, and directions based on Google Gemini intelligence. AI responses are intended for informational and cultural enrichment; guests with medical dietary restrictions must independently confirm dish ingredients with on-site chefs.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: COOKIES & LOCAL STORAGE */}
              {activeTab === 'cookies' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Browser Storage</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Cookie & Local Storage Policy
                    </h3>
                    <p className="text-xs text-stone-400">
                      Transparency regarding data cached locally on your device browser.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p>
                      This application uses browser local storage (`localStorage`) and session storage to provide a seamless booking and dining experience without forcing invasive third-party tracking.
                    </p>

                    <h4 className="font-bold text-amber-200 text-sm pt-2">Local Storage Key Disclosures</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
                        <code className="text-amber-300 font-mono font-bold">rb_tickets</code>
                        <span className="block text-stone-400 text-[11px] mt-0.5">Stores your confirmed Eco-Pass QR codes locally so you can display them at the gate scanner even without active internet connection.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
                        <code className="text-amber-300 font-mono font-bold">rb_cart</code>
                        <span className="block text-stone-400 text-[11px] mt-0.5">Preserves your selected menu dishes and quantities across page reloads.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
                        <code className="text-amber-300 font-mono font-bold">rb_user</code>
                        <span className="block text-stone-400 text-[11px] mt-0.5">Retains your guest session profile, name, and Sustainability Karma score.</span>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800">
                        <code className="text-amber-300 font-mono font-bold">rb_cookie_consent</code>
                        <span className="block text-stone-400 text-[11px] mt-0.5">Records your cookie and analytics consent preferences.</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Analytics Storage</h4>
                    <p>
                      We utilize privacy-friendly Vercel Analytics (`@vercel/analytics`) to assess aggregate site health and page load latency without capturing individual cross-site tracking fingerprints.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 6: SECURITY & RESPONSIBLE DISCLOSURE */}
              {activeTab === 'security' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Infrastructure Protection</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Security Architecture & Responsible Disclosure
                    </h3>
                    <p className="text-xs text-stone-400">
                      Technical measures safeguarding ticket authenticity and attendee data.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Security Controls Implemented</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-stone-300">
                      <li><strong>Cryptographic Pass Verification:</strong> Every digital pass contains a verified signature payload validated against Supabase database records at the entry turnstile.</li>
                      <li><strong>End-to-End Encryption in Transit:</strong> All HTTP API calls and WebSocket connections utilize TLS 1.3 / HTTPS encryption.</li>
                      <li><strong>Zero Card Data Exposure:</strong> Card transactions and UPI payments use direct provider interfaces or bank UTR reference matching; raw payment credentials are never captured on application servers.</li>
                      <li><strong>Role-Based Gate Authorization:</strong> The Gate Staff terminal (`/admin`) enforces staff PIN authentication (`K246790`) and session isolation.</li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-amber-200 text-sm">Responsible Vulnerability Disclosure</h4>
                    <p>
                      We welcome constructive reports from ethical security researchers. If you identify a security vulnerability affecting our web application or databases, please report it directly to our technical desk at:
                    </p>
                    <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between font-mono text-xs">
                      <span className="text-amber-300">{FESTIVAL_INFO.contactEmail}</span>
                      <a href={`mailto:${FESTIVAL_INFO.contactEmail}?subject=Security%20Vulnerability%20Report`} className="text-amber-400 hover:underline flex items-center gap-1">
                        Report Issue <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-stone-400 text-xs">
                      Please allow 48 hours for our development team to triage and resolve reported issues prior to any public disclosure.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 7: ACCESSIBILITY STATEMENT */}
              {activeTab === 'accessibility' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Inclusive Participation</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Accessibility Statement (Digital & On-Campus)
                    </h3>
                    <p className="text-xs text-stone-400">
                      Ensuring an accessible and barrier-free experience for all patrons.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">Digital Web Accessibility</h4>
                    <p>We endeavor to make our digital booking platform compliant with WCAG 2.1 Level AA standards:</p>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li><strong>Semantic HTML:</strong> Proper heading hierarchies, ARIA landmarks, and dialog roles.</li>
                      <li><strong>Keyboard Navigation:</strong> Fully operable tab sequences and visible focus rings.</li>
                      <li><strong>Color Contrast:</strong> Minimum 4.5:1 text-to-background contrast ratios for legibility.</li>
                      <li><strong>Screen Reader Support:</strong> Descriptive alt attributes on dish photography and QR badges.</li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-amber-200 text-sm">On-Site Campus Physical Accessibility</h4>
                    <ul className="list-disc pl-5 space-y-1 text-stone-300">
                      <li><strong>Wheelchair Access:</strong> Step-free entrance ramp at East Heritage Gate and ground-floor dining pavilions across Provesh and Bhoj Mohols.</li>
                      <li><strong>Volunteer Assistance:</strong> Dedicated IAM hospitality student ambassadors stationed at the entrance to escort patrons requiring mobility or visual assistance.</li>
                      <li><strong>Accessible Restrooms:</strong> Dedicated ground-floor accessible restrooms adjacent to the main hospitality block.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 8: COMMUNITY GUIDELINES */}
              {activeTab === 'community' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Fest Etiquette</span>
                    <h3 className="text-lg font-bold text-white font-display mt-0.5">
                      Community Guidelines & Zero-Waste Culture
                    </h3>
                    <p className="text-xs text-stone-400">
                      Shared values fostering sustainable gastronomy, courtesy, and student hospitality.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">1. Respect for Student Chefs & Hospitality Ambassadors</h4>
                    <p>
                      Rajbari Bhojbari is envisioned, crafted, and served by the aspiring culinary and hospitality students of IAM Kolkata. We ask all guests to engage with our student staff with courtesy, encouragement, and warmth.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">2. Respectful Guestbook Reviews</h4>
                    <p>
                      Our public guestbook celebrates culinary dialogue. Content containing profanity, defamatory speech, commercial advertising, or hate speech will be moderated and removed in accordance with our acceptable use charter.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-200 text-sm">3. Zero-Waste Mindfulness</h4>
                    <p>
                      Bengal's zamindari culinary tradition cherishes every grain. We encourage guests to taste mindfully, finish portions served on their Sal platters, and celebrate traditional nose-to-tail and peel-to-stem sustainable techniques.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-[#140305] border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 text-xs">
            <div className="flex items-center gap-2 text-stone-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Effective Date: 9th October 2026 • Kolkata Jurisdiction</span>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${FESTIVAL_INFO.contactEmail}`}
                className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
              >
                Contact Legal Desk
              </a>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-md cursor-pointer transition-all"
              >
                I Understand & Close
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
