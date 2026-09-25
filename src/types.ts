export type MoholType = 'starters' | 'tasting' | 'mains' | 'rural' | 'desserts' | 'probesh' | 'bhoj' | 'mati' | 'mohini' | 'matini';

export interface MenuItem {
  id: string;
  name: string;
  bengaliName: string;
  mohol: MoholType;
  moholTitle: string;
  category: 'Starter' | 'Complimentary Tasting' | 'Main Course Combo' | 'Dessert Add-on' | 'Rural Bengal Heritage' | 'Mocktail' | 'Main Course' | 'Rural Sustainable' | 'Royal Confection' | 'Artisan Confection';
  price: number;
  dietary: 'pure-veg' | 'non-veg' | 'vegan';
  spiceLevel: 'Mild' | 'Medium' | 'Rich & Aromatic';
  description: string;
  historyLore: string; // The authentic forgotten recipe story
  sustainabilityStory: string; // "AI Precision. Zero Waste."
  wasteScore: number; // 0-100 (100 = 0 waste / whole ingredient utilized)
  ingredients: string[];
  imageUrl: string;
  isChefSpecial?: boolean;
}

export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  bengaliSubtitle: string;
  location: string;
  category: 'Ceremony' | 'Culinary Demo' | 'Live Music & Folk' | 'Hospitality Lab';
  speakerOrChef: string;
  description: string;
  sustainabilityFocus?: string;
  isHighlight?: boolean;
}

export interface CartItem {
  dish: MenuItem;
  quantity: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  emailOrPhone: string;
  role: 'guest' | 'student_ambassador' | 'faculty_judge' | 'royal_patron';
  institution?: string;
  sustainabilityKarma: number;
  tokens: string[];
}

export interface PaymentDetails {
  method: 'upi' | 'card' | 'cash';
  amount: number;
  currency: string;
  upiId?: string;
  cardLast4?: string;
  cardHolder?: string;
  transactionId?: string;
  otpVerified?: boolean;
  status: 'pending' | 'otp_required' | 'processing' | 'completed' | 'failed';
  bookingId?: string;
  ticketPassQr?: string;
  timestamp: string;
}

export interface FeedbackEntry {
  id: string;
  guestName: string;
  contact?: string;
  rating: number;
  sustainabilityRating: number;
  moholVisited: string;
  favoriteDish: string;
  comment: string;
  date: string;
}

export interface FeedbackSubmission {
  id: string;
  guestName: string;
  emailOrPhone: string;
  role: string;
  overallRating: number;
  tasteRating: number;
  sustainabilityRating: number;
  bhojBotRating: number;
  ambienceRating: number;
  favoriteDishId: string;
  comments: string;
  wouldRecommend: boolean;
  timestamp: string;
  certificateId: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bhojbot';
  text: string;
  suggestedDishes?: MenuItem[];
  timestamp: string;
  source?: string;
  groundingType?: 'maps' | 'search' | 'none';
  searchQueries?: string[];
  isBookingRecall?: boolean;
}

export type StarterOptionType = 'veg' | 'non_veg';
export type MainsOptionType = 'veg' | 'non_veg_1' | 'non_veg_2' | 'non_veg_3';

export interface EventTicketPass {
  id: string; // e.g. "RB-PASS-2026-98124"
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  ticketQuantity: number;
  basePricePerTicket: number; // 349
  welcomeDrink: string;
  starterType: StarterOptionType;
  starterDish: string;
  mainsType: MainsOptionType;
  mainsDish: string;
  includeDessert: boolean;
  dessertDish?: string;
  dessertPrice: number; // 99
  totalAmount: number;
  paymentMethod: 'razorpay' | 'stripe' | 'card' | 'upi' | 'cash' | 'UPI_QR';
  paymentStatus: 'paid' | 'pay_at_counter';
  slot: string;
  eventDate: string;
  qrCodeUrl: string;
  gateLocation: string;
  transactionId?: string;
  upiUtr?: string;
  razorpayPaymentId?: string;
  bookedAt: string;
}
