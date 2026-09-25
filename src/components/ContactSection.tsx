import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Clock, 
  Compass, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  ExternalLink 
} from 'lucide-react';
import { FESTIVAL_INFO } from '../data/festData';
import { 
  contactFormSchema, 
  sanitizeName, 
  sanitizePhoneDigits, 
  sanitizeString 
} from '../utils/validation';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Table Reservation / General Inquiry',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string | undefined }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // 10-second rate limiting cooldown
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;

    // Strict Zod Validation & Sanitization
    const validation = contactFormSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors = validation.error.format();
      setFormErrors({
        name: fieldErrors.name?._errors[0],
        email: fieldErrors.email?._errors[0],
        phone: fieldErrors.phone?._errors[0],
        message: fieldErrors.message?._errors[0],
      });
      setCooldownRemaining(10); // 10s cooldown after failed attempt
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (res.ok) {
        setIsSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: 'Table Reservation / General Inquiry',
          message: '',
        });
        setTimeout(() => setIsSubmitted(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setCooldownRemaining(10); // 10s cooldown after submission to prevent spam clicks
    }
  };

  return (
    <section id="contact-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-emerald-500/20 font-sans">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connect & Visit</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-100">
            Contact Us & <span className="text-gradient-cyan">Campus Information</span>
          </h2>
          <p className="text-emerald-100/70 text-sm mt-1 max-w-2xl">
            Inquire about group eco-banquet bookings, media passes, or academic AI sustainability research collaborations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 font-sans">
        
        {/* Contact Information & Venue Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0a1f15] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-emerald-100 pb-2 border-b border-emerald-900/60">
              Event Secretariat
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3 text-stone-300">
                <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-200">Festival Venue</div>
                  <div className="leading-relaxed mt-0.5">
                    {FESTIVAL_INFO.venue}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    (Adjacent to Salt Lake Sector V Metro Station)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-300">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-200">Date & Timings</div>
                  <div className="mt-0.5 font-semibold text-amber-100">{FESTIVAL_INFO.date}</div>
                  <div className="text-stone-400">10:00 AM – 9:00 PM IST</div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-300">
                <Phone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-200">Helpline & Concierge</div>
                  <div className="mt-0.5 font-mono text-amber-100">{FESTIVAL_INFO.phone}</div>
                  <div className="text-[11px] text-stone-400">Student Hospitality Desk: +91 33 2357 0001</div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-300">
                <Mail className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-200">Official Communication</div>
                  <div className="mt-0.5 font-mono text-amber-100">{FESTIVAL_INFO.contactEmail}</div>
                </div>
              </div>
            </div>

            {/* Metro & Directions Card */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Guest Travel Guidelines</span>
              </div>
              <p className="text-stone-300 leading-relaxed">
                Metro Green Line direct to Sector V. Ample student-managed electric vehicle parking and green shuttle services available from major IT hubs.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-[#0a1f15] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-emerald-100 pb-2 border-b border-emerald-900/60">
            Send an Inquiry
          </h3>

          {isSubmitted && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>
                Thank you! Your message has been routed to our student festival organizing committee. We will respond within 4 business hours.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Full Name *</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={60}
                  pattern="^[A-Za-z\u0980-\u09FF\s'.-]+$"
                  title="Name can only contain letters, spaces, hyphens, and apostrophes."
                  value={formData.name}
                  onChange={(e) => {
                    const clean = sanitizeName(e.target.value);
                    setFormData({ ...formData, name: clean });
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Dr. Debashis Roy"
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400"
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Email Address *</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={100}
                  pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                  title="Please enter a valid email address."
                  value={formData.email}
                  onChange={(e) => {
                    const clean = e.target.value.trim().toLowerCase();
                    setFormData({ ...formData, email: clean });
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="name@organization.com"
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400"
                />
                {formErrors.email && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{formErrors.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Phone Number (Digits only)</label>
                <input
                  id="contact-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Optional: 10-digit mobile number."
                  value={formData.phone}
                  onChange={(e) => {
                    const clean = sanitizePhoneDigits(e.target.value);
                    setFormData({ ...formData, phone: clean });
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="9830000000"
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400 font-mono"
                />
                {formErrors.phone && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{formErrors.phone}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Subject Inquiry</label>
                <select
                  id="contact-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="Table Reservation / General Inquiry">Table Reservation / General Inquiry</option>
                  <option value="Corporate / Group Eco Banquet (10+ guests)">Corporate / Group Eco Banquet (10+ guests)</option>
                  <option value="Press / Media Pass Request">Press / Media Pass Request</option>
                  <option value="World Tourism Day / Academic AI Collaboration">World Tourism Day / Academic AI Collaboration</option>
                  <option value="Sponsorship & Sustainability Partner Inquiry">Sponsorship & Sustainability Partner Inquiry</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">Message / Request *</label>
              <textarea
                id="contact-message"
                required
                rows={4}
                maxLength={1000}
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (formErrors.message) setFormErrors((prev) => ({ ...prev, message: undefined }));
                }}
                placeholder="Let us know how we can make your festival experience memorable..."
                className="w-full p-3 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400 resize-none"
              />
              {formErrors.message && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{formErrors.message}</span>
                </p>
              )}
            </div>

            <button
              id="submit-contact-btn"
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0}
              className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                cooldownRemaining > 0
                  ? 'bg-stone-800 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-amber-600/70 text-stone-950 cursor-wait'
                  : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 cursor-pointer'
              }`}
            >
              {cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>Cooldown Active: Wait {cooldownRemaining}s before next inquiry</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Message...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message to Organizing Desk</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </section>
  );
};
