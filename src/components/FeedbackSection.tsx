import React, { useState, useEffect } from 'react';
import { 
  MessageSquareHeart, 
  Star, 
  Send, 
  Leaf, 
  CheckCircle2, 
  User, 
  Sparkles, 
  Quote, 
  ThumbsUp,
  Clock,
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { MENU_ITEMS } from '../data/festData';
import { UserProfile, FeedbackEntry } from '../types';
import { 
  feedbackFormSchema, 
  sanitizeName, 
  sanitizeString 
} from '../utils/validation';

interface FeedbackSectionProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

const DEFAULT_REVIEWS: FeedbackEntry[] = [
  {
    id: "fb_seed_1",
    guestName: "Prof. Ranajit Roy Chowdhury",
    contact: "r.chowdhury@caluniv.ac.in",
    rating: 5,
    sustainabilityRating: 5,
    moholVisited: "Mati Mohol",
    favoriteDish: "Kumro Chhalka & Bichi Chorchori",
    comment: "Extraordinary innovation in zero-waste Bengali cooking! Preparing roasted pumpkin peel crisps with toasted seeds in biodegradable clay pots is true eco-gastronomy.",
    date: "Oct 2026 Preview",
  },
  {
    id: "fb_seed_2",
    guestName: "Smt. Sharmistha Debnath",
    contact: "+91 98301 44521",
    rating: 5,
    sustainabilityRating: 5,
    moholVisited: "Bhoj Mohol",
    favoriteDish: "Dhakai Kachi Morog Pulao",
    comment: "The aroma of Gobindobhog rice and subtle mace in the Morog Pulao transported me back to heirloom family banquets. Bhoj-Bot's pairing suggestion was spot on!",
    date: "Oct 2026 Preview",
  },
  {
    id: "fb_seed_3",
    guestName: "Chef Debarghya Majumdar",
    contact: "debarghya.chef@iam.ac.in",
    rating: 5,
    sustainabilityRating: 5,
    moholVisited: "Mohini Mohol",
    favoriteDish: "Murshidabadi Chhana Mukhi",
    comment: "The crisp outer sugar shell yielding to supple soft chhana inside honors the 1850s Murshidabad nawabi confectioners. Immaculate student craftsmanship.",
    date: "Oct 2026 Preview",
  }
];

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [reviews, setReviews] = useState<FeedbackEntry[]>(() => {
    try {
      const saved = localStorage.getItem('rb_guest_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore JSON parse error
    }
    return DEFAULT_REVIEWS;
  });
  const [rating, setRating] = useState<number>(5);
  const [sustainabilityRating, setSustainabilityRating] = useState<number>(5);
  const [selectedMohol, setSelectedMohol] = useState<string>('overall');
  const [favoriteDish, setFavoriteDish] = useState<string>('Dhakai Kachi Morog Pulao');
  const [comment, setComment] = useState<string>('');
  const [guestName, setGuestName] = useState<string>(currentUser?.name || '');
  const [contact, setContact] = useState<string>(currentUser?.emailOrPhone || '');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string | undefined }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
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

  // Sync user info
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setGuestName(currentUser.name);
      if (currentUser.emailOrPhone) setContact(currentUser.emailOrPhone);
    }
  }, [currentUser]);

  // Load reviews from backend with graceful fallback
  const loadReviews = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;
      const data = await res.json();
      if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
        setReviews(data.reviews);
        try {
          localStorage.setItem('rb_guest_reviews', JSON.stringify(data.reviews));
        } catch {
          // Ignore local storage error
        }
      }
    } catch (err) {
      // Graceful silent fallback to offline/cached reviews
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;

    // Strict Zod validation
    const validation = feedbackFormSchema.safeParse({
      guestName,
      contact: contact || 'Guest Visitor',
      rating,
      sustainabilityRating,
      comment,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.format();
      setFormErrors({
        guestName: fieldErrors.guestName?._errors[0],
        comment: fieldErrors.comment?._errors[0],
      });
      setCooldownRemaining(10); // 10-second cooldown on failed attempt
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    
    // Create new local review entry
    const newEntry: FeedbackEntry = {
      id: "fb_" + Date.now(),
      guestName: sanitizeName(guestName) || "Honored Royal Guest",
      contact: sanitizeString(contact) || "Visitor",
      rating,
      sustainabilityRating,
      moholVisited: selectedMohol,
      favoriteDish,
      comment: sanitizeString(comment),
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    // Optimistic UI update
    setReviews((prev) => {
      const updated = [newEntry, ...prev.filter(r => r.id !== newEntry.id)];
      try {
        localStorage.setItem('rb_guest_reviews', JSON.stringify(updated));
      } catch {
        // Ignore local storage quota error
      }
      return updated;
    });

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: validation.data.guestName,
          contact: validation.data.contact,
          rating,
          sustainabilityRating,
          moholVisited: selectedMohol,
          favoriteDish,
          comment: validation.data.comment,
        }),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && Array.isArray(data.reviews)) {
            setReviews(data.reviews);
            try {
              localStorage.setItem('rb_guest_reviews', JSON.stringify(data.reviews));
            } catch {
              // Ignore
            }
          }
        }
      }
    } catch (err) {
      // Local copy already saved
    } finally {
      setSubmitSuccess(true);
      setComment('');
      setIsSubmitting(false);
      setCooldownRemaining(10); // 10-second cooldown after submission to prevent spam clicks
      setTimeout(() => setSubmitSuccess(false), 5000);
    }
  };

  return (
    <section id="feedback-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-emerald-500/20 font-sans">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <MessageSquareHeart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Eco Guestbook & Community Feedback</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-100">
            Share Your <span className="text-gradient-cyan">Dining Experience</span>
          </h2>
          <p className="text-emerald-100/70 text-sm mt-1 max-w-2xl">
            Your voice guides our hospitality students in refining smart zero-waste cooking techniques and eco-gastronomy ethics.
          </p>
        </div>

        {/* Rating overview badge */}
        <div className="flex items-center gap-3 bg-[#0a1f15] border border-emerald-500/30 px-4 py-2.5 rounded-2xl">
          <div className="flex text-emerald-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
            ))}
          </div>
          <div className="text-xs">
            <span className="font-bold text-emerald-200">4.9 / 5.0</span>
            <span className="text-emerald-400/70 ml-1">({reviews.length} Verified Reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 font-sans">
        
        {/* Form Column */}
        <div className="lg:col-span-6 bg-[#0a1f15] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
            <h3 className="text-xl font-bold text-emerald-100">
              Submit Eco Review
            </h3>
            {!currentUser && (
              <button
                type="button"
                id="feedback-login-link"
                onClick={onOpenAuth}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                Sign in with OTP
              </button>
            )}
          </div>

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>
                Thank you! Your feedback has been recorded in our permanent Eco Guestbook. Thank you for championing sustainable gastronomy!
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            
            {/* Guest Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Your Full Name *</label>
                <input
                  id="feedback-name-input"
                  type="text"
                  required
                  minLength={2}
                  maxLength={60}
                  pattern="^[A-Za-z\u0980-\u09FF\s'.-]+$"
                  title="Name can only contain letters, spaces, hyphens, and apostrophes."
                  value={guestName}
                  onChange={(e) => {
                    const clean = sanitizeName(e.target.value);
                    setGuestName(clean);
                    if (formErrors.guestName) setFormErrors((prev) => ({ ...prev, guestName: undefined }));
                  }}
                  placeholder="e.g. Smt. Ananya Sen"
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400"
                />
                {formErrors.guestName && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{formErrors.guestName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Mobile / Email</label>
                <input
                  id="feedback-contact-input"
                  type="text"
                  maxLength={100}
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value.trim());
                    if (formErrors.contact) setFormErrors((prev) => ({ ...prev, contact: undefined }));
                  }}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400"
                />
                {formErrors.contact && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{formErrors.contact}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Ratings: Flavor & Sustainability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-300 block">
                  Heritage Flavor Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      id={`star-rating-${s}`}
                      onClick={() => setRating(s)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-1">{rating}/5</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400 block flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>Zero-Waste Quotient</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      id={`eco-rating-${s}`}
                      onClick={() => setSustainabilityRating(s)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Leaf
                        className={`w-5 h-5 ${
                          s <= sustainabilityRating ? 'text-emerald-400 fill-emerald-400' : 'text-stone-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-emerald-400 ml-1">{sustainabilityRating}/5</span>
                </div>
              </div>
            </div>

            {/* Mohol and Favorite Dish selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Pavilion Visited</label>
                <select
                  id="feedback-mohol-select"
                  value={selectedMohol}
                  onChange={(e) => setSelectedMohol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="overall">All 4 Zones (Full Experience)</option>
                  <option value="Probesh Mohol">ECO-GENESIS (Hydro Drinks & Welcome)</option>
                  <option value="Bhoj Mohol">CIRCULAR BHOJ (Smart Upcycled Mains)</option>
                  <option value="Mati Mohol">HYDRO-TERRA (Farm-to-Plate Innovations)</option>
                  <option value="Mohini Mohol">ZERO-SWEET (Upcycled Confection Labs)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Favorite Dish</label>
                <select
                  id="feedback-dish-select"
                  value={favoriteDish}
                  onChange={(e) => setFavoriteDish(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                >
                  {MENU_ITEMS.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.moholTitle})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">
                Your Thoughts, Memories & Culinary Impressions *
              </label>
              <textarea
                id="feedback-comment-input"
                required
                rows={3}
                minLength={5}
                maxLength={800}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (formErrors.comment) setFormErrors((prev) => ({ ...prev, comment: undefined }));
                }}
                placeholder="Share your experience of the zero-waste flavors, students' hospitality, or Hospi Bot AI recommendations..."
                className="w-full p-3 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-400 resize-none"
              />
              {formErrors.comment && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{formErrors.comment}</span>
                </p>
              )}
            </div>

            <button
              id="submit-feedback-btn"
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0 || !comment.trim() || !guestName.trim()}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                cooldownRemaining > 0
                  ? 'bg-stone-800 text-emerald-300 border border-emerald-500/40 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-emerald-600/70 text-stone-950 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-stone-950 cursor-pointer'
              }`}
            >
              {cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-emerald-300 animate-spin" />
                  <span>Cooldown Active: Wait {cooldownRemaining}s before next review</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Eco Archive...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Guestbook Review</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Community Reviews Feed Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-emerald-100">
              Community Testimonials
            </h3>
            <span className="text-xs text-cyan-400 font-medium">Live Feed</span>
          </div>

          <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-[#170e0a] border border-amber-500/20 text-xs space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-400/40 flex items-center justify-center font-bold text-amber-300">
                      {rev.guestName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-amber-100 flex items-center gap-1.5">
                        <span>{rev.guestName}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          Verified Guest
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">{rev.date} • {rev.moholVisited}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-stone-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800 text-[11px] text-stone-400">
                  <span className="text-amber-300">
                    Favorite: <strong className="text-amber-100">{rev.favoriteDish}</strong>
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-400" />
                    <span>Eco Rating: {rev.sustainabilityRating}/5</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </section>
  );
};
