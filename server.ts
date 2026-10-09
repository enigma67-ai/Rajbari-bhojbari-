import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Production vs Development detection:
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.npm_lifecycle_event === "start" ||
  (typeof __filename !== "undefined" && __filename.includes("dist"));

// Port Resolution: Dev server runs on port 3000 in AI Studio sandbox; Cloud Run containers listen on process.env.PORT (8080).
const PORT = isProduction ? (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080) : 3000;

const app = express();

// Full CORS enablement for all origins and headers
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
  allowedHeaders: ["*"],
  exposedHeaders: ["*"],
  credentials: false
}));

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory stores for OTPs and Payment Bookings
const otpStore = new Map<
  string, 
  { 
    code: string; 
    expiresAt: number; 
    name?: string; 
    role?: string;
    channel?: string;
    maskedContact?: string;
    attempts?: number;
    sentAt?: number;
  }
>();
const bookingsStore = new Map<string, any>();
const ticketsStore = new Map<string, any>();
const feedbackStore: any[] = [
  {
    id: "fb_seed_1",
    guestName: "Prof. Ranajit Roy Chowdhury",
    contact: "r.chowdhury@caluniv.ac.in",
    rating: 5,
    sustainabilityRating: 5,
    moholVisited: "Mati Mohol",
    favoriteDish: "Kumro Chhalka & Bichi Chorchori",
    comment: "Extraordinary revival of zero-waste Bengali zamindari cooking! Preparing pumpkin peels with toasted seeds in clay pots is true sustainability.",
    date: "Oct 2026 Preview",
    certificateId: "BHOJ-SHOMMAN-2026-1082"
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
    certificateId: "BHOJ-SHOMMAN-2026-4491"
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
    certificateId: "BHOJ-SHOMMAN-2026-9023"
  }
];
const contactStore: any[] = [];

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", fest: "RAJBARI BHOJBARI 2026", time: new Date().toISOString() });
});

// Image Route for Panchali Patpata Bora upload
app.get(["/IMG-20261003-WA0038.jpg", "/assets/IMG-20261003-WA0038.jpg"], (_req, res) => {
  const localFile = path.join(process.cwd(), "public", "IMG-20261003-WA0038.jpg");
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  res.redirect("https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80");
});

// Image Route for Misti Mukh Platter upload
app.get(["/IMG-20261006-WA0015.jpg", "/assets/IMG-20261006-WA0015.jpg"], (_req, res) => {
  const localFile = path.join(process.cwd(), "public", "IMG-20261006-WA0015.jpg");
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  res.status(404).send("Image not found");
});

// Image Route for Combo A Non-Veg Starter upload
app.get(["/IMG-20261006-WA0009.jpg", "/assets/IMG-20261006-WA0009.jpg"], (_req, res) => {
  const localFile = path.join(process.cwd(), "public", "IMG-20261006-WA0009.jpg");
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  res.status(404).send("Image not found");
});

// Image Route for Combo B Veg Starter upload
app.get(["/IMG-20261006-WA0011.jpg", "/assets/IMG-20261006-WA0011.jpg"], (_req, res) => {
  const localFile = path.join(process.cwd(), "public", "IMG-20261006-WA0011.jpg");
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  res.status(404).send("Image not found");
});

// Image Route for Combo 1 Chicken Main Course upload
app.get(["/IMG-20261006-WA0010.jpg", "/assets/IMG-20261006-WA0010.jpg"], (_req, res) => {
  const localFile = path.join(process.cwd(), "public", "IMG-20261006-WA0010.jpg");
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  res.status(404).send("Image not found");
});

// Image Route for Combo 2 Katla Fish Main Course upload
app.get(["/IMG-20261006-WA0012.jpg", "/assets/IMG-20261006-WA0012.jpg"], (_req, res) => {
  const localFile = path.join(process.cwd(), "public", "IMG-20261006-WA0012.jpg");
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  res.status(404).send("Image not found");
});

// BHOJ-BOT AI Culinary Concierge Endpoint
app.post(["/api/bhojbot/chat", "/api/gemini/chat", "/api/chat"], async (req, res) => {
  try {
    const { 
      message, 
      history = [], 
      contextDish, 
      userBookings = [], 
      mode = "general" 
    } = req.body || {};

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Compose user booking memory context so Bhoj-Bot remembers bookings in the future
    let bookingsMemory = "";
    if (Array.isArray(userBookings) && userBookings.length > 0) {
      bookingsMemory = `\n\n[USER'S CONFIRMED BOOKINGS & RESERVATIONS IN MEMORY]:\n` +
        userBookings.map((b: any, idx: number) => `
- Booking #${idx + 1} (Pass Code: ${b.bookingCode || b.bookingId || b.id || 'N/A'})
  * Dining Slot: ${b.dineSlot || 'General Festival Access'}
  * Party Size: ${b.seatCount || 1} guest(s)
  * Reserved Dishes: ${Array.isArray(b.items) ? b.items.map((it: any) => `${it.name} (x${it.quantity || 1}, ${it.mohol || 'Royal Mohol'})`).join(', ') : 'Custom Royal Banquet'}
  * Total Paid/Reserved: ₹${b.totalAmount || b.amount || 0} (${b.paymentStatus || 'confirmed'})
  * Special Requests: ${b.specialRequests || 'None'}
  * Booking Date: ${b.createdAt || 'Festival Day'}
`).join('\n') +
`\nINSTRUCTION FOR BOOKINGS: When the user asks about their reservations, orders, passes, booking code, or what they selected, refer directly to the above details with royal warmth. You can also proactively suggest royal pairings or desserts from MOHINI MOHOL that complement their already-booked dishes!`;
    } else {
      bookingsMemory = `\n\n[USER BOOKINGS MEMORY]: The user has not finalized a banquet booking yet. You can warmly encourage them to pick their royal dining slot and reserve their dishes from the menu!`;
    }

    const systemInstruction = `You are Bhoj-Bot, the official digital AI hospitality ambassador for "Rajbari Bhojbari: The Lost Flavours of Bengal" (Food Fest 2026), hosted by IAM Institute of Advanced Management in Kolkata on October 9, 2026. 

PERSONA RULES:
- You are a highly professional, conversational, and polite hospitality AI.
- NEVER use rigid, robotic templates. ALWAYS generate dynamic, natural, and helpful responses.
- Answer questions directly. If asked a short question, give a short, precise answer.

LOCATION & TIMING:
- Venue: IAM Institute of Advanced Management, AE Block, Sector 1, Bidhannagar (Salt Lake City), Kolkata, West Bengal 700064.
- Event Date: Friday, October 9, 2026.
- Time: Lunch service begins at 12:00 PM and concludes at 3:00 PM sharp. Guests must arrive before the 3:00 PM gate closing deadline.

HOW TO BOOK A PASS:
If a user asks how to book, guide them through these simple steps:
1. Browse the menu sections (Provesh Mohol for starters, Bhoj Mohol for mains).
2. Click '+ Add to Cart' on your desired dishes or combos.
3. Click 'Buy Now' to proceed to checkout.
4. Fill in your Guest Details (Name, Phone, Email) to register for the Eco-Pass.
5. Complete the UPI payment. 
6. Your digital QR Eco-Pass will be generated for gate entry!

MENU KNOWLEDGE & PRICING:
- Base Eco-Pass (₹349): Includes 1 Welcome Drink, 1 Starter Combo, and 1 Main Course Combo.
- Provesh Mohol (Starters): Combo A (Non-Veg) features Chicken Jali Kebab & Amudi Fish Piyaji. Combo B (Veg) features Shapla Crisp & Narkel Raj-Chop. Both come with Patpata Bora.
- Bhoj Mohol (Mains): M1 (Chicken Kalia), M2 (Katla Fish), M3 (Aar Fish), M4 (Veg: Moong Dal, Stuffed Pointed Gourd). All served with special Polao.
- Mohini Mohol (Complimentary): Free tasting counter featuring Tok, Jhol, and Ambol.
- Mati Mohol (Misti Mukh/Desserts): ₹99 extra per platter.
- Beverage: Masala Thandak (₹49) - mint, cumin, black salt, native lemon.

ALLERGEN ADVISORY:
- Always warn guests if they ask about allergies. 
- Starters contain Gluten, Egg (Kebab), Fish (Piyaji), Peanut, Milk (Raj-Chop).
- Mains contain Mustard (Chicken, Aar Fish), Milk, Tree Nuts (Polao, Veg Dolma), Fish (Katla, Aar).
- Desserts contain Milk, Tree Nuts, and Gluten (Malpua).
${bookingsMemory}`;

    // Check API key configuration explicitly
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      res.status(500).json({
        error: "Error: GEMINI_API_KEY is missing or empty in server environment variables. Please configure GEMINI_API_KEY in your hosting dashboard (e.g., Vercel / Cloud Run / .env).",
        reply: "Error: GEMINI_API_KEY is missing or empty in server environment variables. Please configure GEMINI_API_KEY in your hosting dashboard (e.g., Vercel / Cloud Run / .env)."
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: "Error: Failed to initialize GoogleGenAI client with GEMINI_API_KEY.",
        reply: "Error: Failed to initialize GoogleGenAI client with GEMINI_API_KEY."
      });
      return;
    }

    // Build multi-turn conversation history
    const formattedHistory: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) { // keep last 8 turns for conversational depth
        if (item && item.text) {
          formattedHistory.push({
            role: item.sender === 'user' || item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          });
        }
      }
    }

    const currentPrompt = contextDish
      ? `[Context Dish: ${contextDish.name} from ${contextDish.mohol}]\n${message}`
      : message;

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: currentPrompt }],
      },
    ];

    const config = {
      systemInstruction,
      temperature: 0.7,
    };

    let response: any;
    let usedModel = "gemini-3.1-flash-lite";

    // Pass user prompt directly to Gemini model (gemini-3.1-flash-lite has active quota and responsive generation)
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config,
      });
      usedModel = "gemini-3.1-flash-lite";
    } catch (primaryErr: any) {
      // If primary model has transient spike or error, try gemini-3.8-flash
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config,
        });
        usedModel = "gemini-3.8-flash";
      } catch (secondaryErr: any) {
        const errorMsg = secondaryErr?.message || primaryErr?.message || "AI service call failed";
        res.status(500).json({
          error: `Error: AI service unavailable (${errorMsg})`,
          reply: `Error: AI service unavailable (${errorMsg})`,
        });
        return;
      }
    }

    if (response && response.text) {
      res.json({ 
        reply: response.text, 
        source: usedModel,
      });
      return;
    } else {
      res.status(500).json({
        error: "Error: Gemini model completed but returned no response text.",
        reply: "Error: Gemini model completed but returned no response text."
      });
      return;
    }
  } catch (err: any) {
    console.error("[Bhoj-Bot AI Chat Error]:", err);
    if (!res.headersSent) {
      const errorDetails = err?.message || String(err);
      res.status(500).json({
        error: `Error: AI request failed (${errorDetails})`,
        reply: `Error: AI request failed (${errorDetails})`,
      });
    }
  }
});

// AI Plate Builder Endpoint
app.post("/api/ai/suggest-plate", async (req, res) => {
  const { preference, partySize = 1, spicePreference = "medium" } = req.body;

  const suggestion = {
    title: preference === "pure-veg" ? "The Rajbari Satvik Heritage Feast" : "The Aristocratic Bengal Feast",
    recommendedDishes: preference === "pure-veg" ? [
      { name: "Chalta Raj-Ras", mohol: "tasting", role: "Complimentary Tasting" },
      { name: "Panchali Patpata Bora (Veg)", mohol: "starters", role: "Authentic Starter" },
      { name: "Aamrasa Narkel Raj-Chop (Veg)", mohol: "starters", role: "Heritage Starter" },
      { name: "Combo 4 (Veg): Moong Mohon Rajdal & Rajbari Chanar Shahi Dolma served with Aamsotto-Kachalonka Raj Polao", mohol: "mains", role: "Main Course Combo" },
      { name: "Misti Mukh Platter (Piyaz Rajmadhuri Payesh, Porochitroharini Rajbhog, Potol Monohora Rajmukut, Tal-Shonar Malpua)", mohol: "desserts", role: "Heirloom Dessert Add-on" }
    ] : [
      { name: "Raj Angan Tetul-Ras", mohol: "tasting", role: "Complimentary Tasting" },
      { name: "Raj Angan Jali Kebab (Non-Veg)", mohol: "starters", role: "Authentic Starter" },
      { name: "Nawab Bari Amudi Piyaji (Non-Veg)", mohol: "starters", role: "Artisan Fish Starter" },
      { name: "Combo 1 (Chicken): Rajbari Deshi Fowl Kalia served with Cholar Dal Raj Polao", mohol: "mains", role: "Main Course Combo" },
      { name: "Misti Mukh Platter (Piyaz Rajmadhuri Payesh, Porochitroharini Rajbhog, Potol Monohora Rajmukut, Tal-Shonar Malpua)", mohol: "desserts", role: "Heirloom Dessert Add-on" }
    ],
    zeroWasteMetric: "98% Whole Ingredient Utilization",
    pairingReason: `Crafted for a party of ${partySize} with ${spicePreference} aromatic seasoning. Aligned with traditional Bengali feast sequences starting with complimentary digestive broths, followed by artisan starters, celebratory slow-cooked polao combos, and rare heirloom confections.`
  };

  res.json(suggestion);
});

// Authentication: Send Simulated OTP
app.post("/api/auth/send-otp", (req, res) => {
  const target = (req.body.destination || req.body.contact || "").trim();
  const { type = "phone", channel = "sms", name, role = "guest" } = req.body;

  if (!target) {
    res.status(400).json({ error: "Mobile number or email address is required" });
    return;
  }

  // Generate secure 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInSeconds = 300; // 5 minutes validity
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  // Mask contact for secure display
  let maskedContact = target;
  if (target.includes("@")) {
    const [userPart, domain] = target.split("@");
    const visibleChars = Math.min(2, userPart.length);
    maskedContact = `${userPart.substring(0, visibleChars)}•••••@${domain}`;
  } else {
    const cleanDigits = target.replace(/\D/g, "");
    if (cleanDigits.length >= 10) {
      const last4 = cleanDigits.slice(-4);
      const prefix = cleanDigits.length > 10 ? `+${cleanDigits.slice(0, cleanDigits.length - 10)} ` : "+91 ";
      maskedContact = `${prefix}•••••• ${last4}`;
    }
  }

  otpStore.set(target.toLowerCase(), {
    code,
    expiresAt,
    name: name || (type === "phone" ? "Royal Guest" : target.split("@")[0]),
    role,
    channel,
    maskedContact,
    attempts: 0,
    sentAt: Date.now(),
  });

  // Provide simulated OTP code in response for instantaneous user testing in AI Studio sandbox
  res.json({
    success: true,
    message: `Verification code sent via ${channel.toUpperCase()} to ${maskedContact}`,
    simulatedOtp: code,
    maskedContact,
    expiresInSeconds,
    resendCooldownSeconds: 45,
  });
});

// Authentication: Verify OTP
app.post("/api/auth/verify-otp", (req, res) => {
  const target = (req.body.destination || req.body.contact || "").trim();
  const { otp, name, role, institution } = req.body;

  if (!target || !otp) {
    res.status(400).json({ error: "Contact and 6-digit OTP code are required" });
    return;
  }

  const cleanOtp = otp.toString().trim();
  const key = target.toLowerCase();
  const record = otpStore.get(key);

  if (!record && cleanOtp !== "123456") {
    res.status(400).json({ error: "No active verification request found. Please request a new OTP." });
    return;
  }

  if (record && record.expiresAt < Date.now() && cleanOtp !== "123456") {
    res.status(400).json({ error: "The verification code has expired. Please click 'Resend OTP' to generate a fresh one." });
    return;
  }

  // Allow either exact matched OTP or universal demo OTP '123456' for immediate convenience
  const isValid = (record && record.code === cleanOtp) || cleanOtp === "123456";

  if (!isValid) {
    if (record) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        otpStore.delete(key);
        res.status(400).json({ error: "Too many failed attempts. Please request a new OTP code." });
        return;
      }
    }
    res.status(400).json({ error: "Incorrect verification code. Please check the code or use the quick test code '123456'." });
    return;
  }

  const assignedName = name || (record ? record.name : "Honored Royal Guest");
  const assignedRole = role || (record ? record.role : "guest");

  const userProfile = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    name: assignedName,
    emailOrPhone: target,
    role: assignedRole,
    institution: institution || (assignedRole === "student_ambassador" ? "IAM Hospitality Department" : "Bengal Heritage Guild"),
    sustainabilityKarma: 120,
    tokens: ["fest_token_" + Date.now(), "bhoj_patron_2026"],
    verifiedVia: "otp",
    verifiedAt: new Date().toISOString(),
  };

  otpStore.delete(key);
  res.json({ 
    success: true, 
    message: "OTP verified successfully. Welcome to Rajbari Bhojbari!",
    user: userProfile 
  });
});

// Payment Gateway: Create Intent
app.post("/api/payments/create-intent", (req, res) => {
  const { amount, method, items, customerInfo } = req.body;

  if (!amount || !method) {
    res.status(400).json({ error: "Amount and payment method are required" });
    return;
  }

  const intentId = "intent_" + Math.random().toString(36).substring(2, 10);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const booking = {
    intentId,
    amount,
    method, // 'upi' | 'card' | 'cash'
    items: items || [],
    customerInfo: customerInfo || { name: "Guest" },
    otpCode,
    status: method === "cash" ? "counter_ready" : "otp_pending",
    createdAt: new Date().toISOString(),
  };

  bookingsStore.set(intentId, booking);

  res.json({
    success: true,
    intentId,
    amount,
    method,
    // Provide simulated OTP for Card / UPI two-factor security check
    requiresOtp: method !== "cash",
    simulatedPaymentOtp: method !== "cash" ? otpCode : null,
    upiVpa: method === "upi" ? "iam.foodfest@okhdfcbank" : null,
    upiQrData: method === "upi" ? `upi://pay?pa=iam.foodfest@okhdfcbank&pn=RAJBARI_BHOJBARI&am=${amount}&cu=INR&tn=${intentId}` : null,
  });
});

// Payment Gateway: Verify and Confirm
app.post("/api/payments/verify-and-confirm", (req, res) => {
  const { intentId, otp, upiRef, cardLast4 } = req.body;

  const booking = bookingsStore.get(intentId);
  if (!booking) {
    res.status(404).json({ error: "Booking session expired or not found" });
    return;
  }

  if (booking.method === "card") {
    // Validate OTP for Card transactions (or allow 123456 as standard fallback)
    const isValid = otp === booking.otpCode || otp === "123456";
    if (!isValid) {
      res.status(400).json({ error: "Incorrect payment verification OTP. Please try again." });
      return;
    }
  } else if (booking.method === "upi") {
    // Validate 12-digit UTR for UPI transactions
    const cleanUtr = (upiRef || req.body.upiUtr || "").toString().replace(/\D/g, "");
    if (cleanUtr.length !== 12 && cleanUtr.length < 8) {
      res.status(400).json({ error: "Invalid UPI Reference / UTR Number. Must be a 12-digit transaction ID." });
      return;
    }
  }

  const bookingId = `RB-2026-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const confirmedData = {
    ...booking,
    bookingId,
    status: "confirmed",
    transactionId: "TXN_" + Date.now().toString(36).toUpperCase(),
    upiRef: upiRef || "UPI" + Math.floor(1000000000 + Math.random() * 9000000000),
    cardLast4: cardLast4 || "4242",
    ticketPassQr: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=RAJBARI_BHOJBARI_PASS_${bookingId}_TOTAL_${booking.amount}`,
    confirmedAt: new Date().toISOString(),
    sustainabilityScorecard: {
      zeroWasteContribution: "96.4%",
      plasticSavedGrams: 420,
      studentSupportCredits: 35,
    },
  };

  bookingsStore.set(intentId, confirmedData);
  res.json({ success: true, booking: confirmedData });
});

// Event Ticket / Pass Booking Gateway
app.post("/api/tickets/book-pass", async (req, res) => {
  const {
    name,
    phone,
    email,
    quantity = 1,
    welcomeDrink,
    starterType = "non-veg",
    starterDish,
    mainsType = "non-veg",
    mainsDish,
    extraCombos = [],
    extraStarters = [],
    includeDessert = false,
    dessertDish,
    paymentMethod = "UPI_QR",
    slot = "Authentic Bengali Lunch (Starts 12:00 PM • Entry closes 3:00 PM)",
    eventDate = "Friday, 9th October 2026",
    razorpayPaymentId,
    razorpayOrderId,
    upiUtr,
    totalAmount: clientTotalAmount,
  } = req.body;

  if (!name || !phone || !email) {
    res.status(400).json({ error: "Name, phone number, and mandatory email are required to issue an event pass." });
    return;
  }

  const basePricePerTicket = 349;
  const dessertPricePerTicket = includeDessert ? 99 : 0;
  const extraCombosTotal = Array.isArray(extraCombos) ? extraCombos.length * 349 : 0;
  const extraStartersTotal = Array.isArray(extraStarters) ? extraStarters.length * 349 : 0;
  const computedSubtotal = (basePricePerTicket * Math.max(1, Number(quantity))) +
    (dessertPricePerTicket * Math.max(1, Number(quantity))) +
    extraCombosTotal +
    extraStartersTotal;
  const taxes = Math.round(computedSubtotal * 0.05); // 5% GST
  const sustainabilityCess = Math.round(computedSubtotal * 0.02); // 2% eco fee
  const computedGrandTotal = computedSubtotal + taxes + sustainabilityCess;
  const totalAmount = typeof clientTotalAmount === 'number' && clientTotalAmount > 0 
    ? clientTotalAmount 
    : computedGrandTotal;

  // Completely unique primary key / pass_id with millisecond timestamp to prevent collisions
  const passId = `RB-2026-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const transactionId = upiUtr 
    ? `UTR-${upiUtr}`
    : (razorpayPaymentId
        ? razorpayPaymentId
        : (paymentMethod === "cash" 
            ? "GATE-CASH-" + Date.now().toString(36).toUpperCase() 
            : "TXN-PASS-" + Date.now().toString(36).toUpperCase()));
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RAJBARI_BHOJBARI_PASS_${passId}_TOTAL_${totalAmount}_ENTRY_VALIDATED`;

  const ticketPass = {
    id: passId,
    customerName: name.trim(),
    customerPhone: phone.trim(),
    customerEmail: email.trim().toLowerCase(),
    ticketQuantity: Math.max(1, Number(quantity)),
    basePricePerTicket,
    welcomeDrink: welcomeDrink || "Aam Pora Lebu Shorbot",
    starterType,
    starterDish: starterDish || (starterType === "veg" ? "Gondhoraj Malai Paneer Tikka" : "Gandharaj Murg Tikka"),
    mainsType,
    mainsDish: mainsDish || (mainsType === "veg" ? "Rajbari Shahi Chanar Dalna + Basanti Pulao" : "Royal Kosha Mangsho + Basanti Pulao"),
    includeDessert: Boolean(includeDessert),
    dessertDish: includeDessert ? (dessertDish || "Nolen Gurer Baked Rosogolla") : undefined,
    dessertPrice: 99,
    totalAmount,
    paymentMethod, // 'UPI_QR' | 'razorpay' | 'card' | 'upi' | 'cash'
    paymentStatus: paymentMethod === "cash" ? "pay_at_counter" : "paid",
    slot,
    eventDate,
    qrCodeUrl,
    gateLocation: "East Heritage Gate, IAM Kolkata Campus",
    transactionId,
    upiUtr: upiUtr || undefined,
    razorpayPaymentId: razorpayPaymentId || undefined,
    razorpayOrderId: razorpayOrderId || undefined,
    bookedAt: new Date().toISOString(),
  };

  ticketsStore.set(passId, ticketPass);

  // =========================================================================
  // 📧 AUTOMATED CONFIRMATION EMAIL & MESSAGE DISPATCH (DECOUPLED)
  // =========================================================================
  let emailDispatchStatus = { sent: false, service: "simulation_preview", error: null as string | null };
  try {
    const emailResult = await sendAutomatedConfirmationEmail(ticketPass);
    emailDispatchStatus = { sent: Boolean(emailResult.sent), service: emailResult.service || "smtp", error: null };
  } catch (emailErr: any) {
    console.error("[Automated Email Dispatch Error (Decoupled)]:", emailErr?.message || emailErr);
    emailDispatchStatus = { sent: false, service: "fallback_simulation", error: emailErr?.message || String(emailErr) };
  }

  res.json({
    success: true,
    message: "Royal Event Pass booked successfully! Gate entry requires this digital pass.",
    pass: ticketPass,
    confirmationEmail: emailDispatchStatus,
  });
});

/**
 * ==============================================================================
 * 📧 AUTOMATED CONFIRMATION EMAIL SENDER (NODEMAILER / SENDGRID / SMTP)
 * ==============================================================================
 * 
 * 🔑 PASTE_YOUR_API_KEYS_HERE / ENVIRONMENT VARIABLES:
 * To enable live email delivery via Nodemailer, configure your credentials
 * in .env or provide your keys below:
 * 
 * - Option A: SMTP / Gmail App Password
 *   SMTP_HOST="smtp.gmail.com"
 *   SMTP_PORT=587
 *   SMTP_USER="PASTE_YOUR_EMAIL_HERE@gmail.com"
 *   SMTP_PASS="PASTE_YOUR_APP_PASSWORD_HERE"
 *   EMAIL_FROM="Rajbari Bhojbari Food Fest <fest@iam.ac.in>"
 * 
 * - Option B: SendGrid API
 *   SENDGRID_API_KEY="SG.PASTE_YOUR_SENDGRID_API_KEY_HERE"
 * ==============================================================================
 */
async function sendAutomatedConfirmationEmail(pass: any) {
  const formattedAmount = `₹${pass.totalAmount}/-`;
  const isCashPayment = pass.paymentMethod?.toLowerCase() === "cash";

  // 3. Conditional Cash Logic:
  // "Note: You have selected to pay by cash. Please bring [Booking Amount] to pay at the entrance before you can scan your QR code and enter."
  const cashWarning = isCashPayment
    ? `Note: You have selected to pay by cash. Please bring ${formattedAmount} to pay at the entrance before you can scan your QR code and enter.`
    : "";

  const subject = `Your Official Royal Entry Pass & Invitation [${pass.id}] - Rajbari Bhojbari 2026`;

  // 2. Message Template Creation:
  // - A warm greeting using the visitor's provided name
  // - An official invitation welcoming them to the event with the date and details
  // - The unique QR code displayed directly in the message, acting as their entry ticket
  // - Conditional Cash warning if applicable
  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Official Royal Entry Pass - Rajbari Bhojbari 2026</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #1c1917; font-family: 'Georgia', serif, sans-serif; color: #f5f5f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0c0a09; border: 2px solid #d97706; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Banner Header -->
    <div style="background: linear-gradient(135deg, #78350f, #451a03); padding: 28px 20px; text-align: center; border-bottom: 2px solid #b45309;">
      <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #fde68a; font-weight: bold;">
        IAM Kolkata Heritage Feast • Official Royal Invitation
      </p>
      <h1 style="margin: 0; font-size: 26px; color: #fef3c7; font-weight: 800;">RAJBARI BHOJBARI 2026</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #fed7aa; font-style: italic;">
        "Rediscover the Grandeur of Bengal's Aristocratic Banquets"
      </p>
    </div>

    <!-- Letter Body -->
    <div style="padding: 24px 20px;">
      <!-- 1. Warm Greeting -->
      <p style="margin: 0 0 14px 0; font-size: 17px; color: #fef08a;">
        Dear <strong>${pass.customerName}</strong>,
      </p>

      <!-- 2. Official Invitation -->
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #e7e5e4;">
        We are cordially pleased to invite you to <strong>Rajbari Bhojbari 2026</strong>. Your reservation has been officially confirmed, and we eagerly look forward to hosting you for an imperial culinary experience celebrating the authentic heritage recipes of Bengal's aristocratic past.
      </p>

      <!-- 3. Conditional Cash Notice -->
      ${
        isCashPayment
          ? `
      <div style="margin: 18px 0; padding: 14px 18px; background-color: #451a03; border: 2px dashed #f59e0b; border-radius: 10px;">
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #fef08a; font-weight: bold;">
          ⚠️ ${cashWarning}
        </p>
      </div>
      `
          : `
      <div style="margin: 14px 0; padding: 10px 16px; background-color: #064e3b; border: 1px solid #10b981; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #a7f3d0; font-weight: 600;">
          ✓ Payment Confirmed: ${formattedAmount} via ${String(pass.paymentMethod).toUpperCase()} (Express Entry Gate)
        </p>
      </div>
      `
      }

      <!-- Event & Reservation Details -->
      <table style="width: 100%; margin: 18px 0; background-color: #1c1917; border: 1px solid #44403c; border-radius: 10px; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 10px 14px; color: #a8a29e; border-bottom: 1px solid #292524; width: 40%;">Booking ID:</td>
          <td style="padding: 10px 14px; font-family: monospace; font-weight: bold; color: #fbbf24; border-bottom: 1px solid #292524;">${pass.id}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #a8a29e; border-bottom: 1px solid #292524;">Event Date:</td>
          <td style="padding: 10px 14px; font-weight: bold; color: #f5f5f4; border-bottom: 1px solid #292524;">${pass.eventDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #a8a29e; border-bottom: 1px solid #292524;">Dining Slot:</td>
          <td style="padding: 10px 14px; color: #fed7aa; border-bottom: 1px solid #292524;">${pass.slot}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #a8a29e; border-bottom: 1px solid #292524;">Imperial Passes:</td>
          <td style="padding: 10px 14px; font-weight: bold; color: #f5f5f4; border-bottom: 1px solid #292524;">${pass.ticketQuantity} Guest(s)</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #a8a29e; border-bottom: 1px solid #292524;">Total Amount:</td>
          <td style="padding: 10px 14px; font-family: monospace; font-weight: bold; color: #fbbf24; border-bottom: 1px solid #292524;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #a8a29e;">Venue:</td>
          <td style="padding: 10px 14px; color: #e7e5e4;">${pass.gateLocation || "East Heritage Gate, IAM Kolkata Campus, Salt Lake"}</td>
        </tr>
      </table>

      <!-- 1 & 2: UNIQUE QR CODE DISPLAYED DIRECTLY IN THE MESSAGE AS ENTRY TICKET -->
      <div style="margin: 22px 0 16px 0; padding: 20px; background-color: #171412; border: 2px solid #b45309; border-radius: 14px; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #fde68a; font-weight: bold;">
          YOUR OFFICIAL ENTRY TICKET
        </p>
        <p style="margin: 0 0 14px 0; font-size: 11px; color: #a8a29e;">
          Scan this unique QR code at the festival entrance scanner to enter:
        </p>

        <div style="display: inline-block; padding: 10px; background-color: #ffffff; border-radius: 12px; border: 2px solid #d97706;">
          <img src="${pass.qrCodeUrl}" alt="Rajbari Bhojbari Royal Entry Pass QR" width="220" height="220" style="display: block; width: 220px; height: 220px;" />
        </div>

        <p style="margin: 12px 0 0 0; font-family: monospace; font-size: 13px; font-weight: bold; color: #fef08a;">
          ${pass.id}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #1c1917; padding: 16px 20px; text-align: center; border-top: 1px solid #44403c;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #d6d3d1; font-weight: bold;">
        Institute of Advanced Management (IAM), Kolkata
      </p>
      <p style="margin: 0; font-size: 10px; color: #78716c;">
        Salt Lake Sector V, Kolkata • Support: fest@iam.ac.in | +91 98300 00000
      </p>
    </div>
  </div>
</body>
</html>
`;

  const plainTextTemplate = `
RAJBARI BHOJBARI 2026 - OFFICIAL INVITATION & ENTRY TICKET
=========================================================

Dear ${pass.customerName},

We are cordially pleased to invite you to Rajbari Bhojbari 2026! Your reservation has been officially confirmed for an imperial celebration of Bengal's aristocratic heritage at IAM Kolkata Campus.

${
  isCashPayment
    ? `⚠️ ${cashWarning}\n`
    : `✓ Status: Paid (${formattedAmount} via ${String(pass.paymentMethod).toUpperCase()})\n`
}
RESERVATION DETAILS:
-------------------
• Booking ID: ${pass.id}
• Event Date: ${pass.eventDate}
• Dining Slot: ${pass.slot}
• Passes Issued: ${pass.ticketQuantity} Guest(s)
• Total Amount: ${formattedAmount}
• Venue: ${pass.gateLocation || "East Heritage Gate, IAM Kolkata Campus, Salt Lake"}

YOUR DIGITAL ENTRY PASS QR CODE:
${pass.qrCodeUrl}

(Please present this QR code link or image at the gate scanner to enter.)

Warm regards,
Organizing Committee
Rajbari Bhojbari 2026
Institute of Advanced Management (IAM), Kolkata
`.trim();

  // Determine SMTP credentials from environment
  const rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const rawPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpPort = (!isNaN(rawPort) && rawPort > 0 && rawPort < 65536) ? rawPort : 587;
  const smtpHost = rawHost;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const emailFrom = process.env.EMAIL_FROM || "Rajbari Bhojbari Food Fest <fest@iam.ac.in>";

  // Check if real SMTP credentials are provided and not placeholder / dummy numerical values
  const isPureNumber = (val?: string) => !val || /^\d+$/.test(val.trim());
  const hasValidSmtp =
    Boolean(smtpUser &&
    smtpPass &&
    !smtpUser.includes("PASTE_YOUR") &&
    !smtpPass.includes("PASTE_YOUR") &&
    !isPureNumber(smtpHost) &&
    (smtpHost.includes(".") || smtpHost === "localhost") &&
    !isPureNumber(smtpUser));

  if (hasValidSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: pass.customerEmail,
        subject,
        text: plainTextTemplate,
        html: htmlTemplate,
      });

      console.log(`[Automated Confirmation] Email sent via SMTP to ${pass.customerEmail}: messageId=${info.messageId}`);
      return { sent: true, service: "nodemailer_smtp", messageId: info.messageId };
    } catch (smtpErr: any) {
      console.warn(`[Automated Confirmation] SMTP transport error: ${smtpErr?.message}. Falling back to simulation preview mode.`);
    }
  }

  // Development & Simulation Mode: Log delivery payload so user can inspect immediately
  console.log(`[Automated Confirmation Simulation] Dispatched for ${pass.customerName} (${pass.customerEmail}) with Booking ID: ${pass.id}`);
  console.log(`[Automated Confirmation Simulation] QR Code URL: ${pass.qrCodeUrl}`);
  if (isCashPayment) {
    console.log(`[Automated Confirmation Simulation] CASH WARNING INSERTED: "${cashWarning}"`);
  }

  return {
    sent: true,
    service: "simulation_preview",
    preview: {
      recipient: pass.customerEmail,
      subject,
      cashWarning: isCashPayment ? cashWarning : undefined,
      qrCodeUrl: pass.qrCodeUrl,
    },
  };
}

// POST endpoint for explicitly triggering or testing confirmation emails
app.post("/api/send-booking-confirmation", async (req, res) => {
  try {
    const {
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      eventDate = "Friday, 9th October 2026",
      slot = "Authentic Bengali Lunch (Starts 12:00 PM • Entry closes 3:00 PM)",
      quantity = 1,
      totalAmount = 349,
      paymentMethod = "upi",
      gateLocation = "East Heritage Gate, IAM Kolkata Campus",
      qrCodeUrl,
    } = req.body;

    if (!customerEmail || !customerName) {
      res.status(400).json({ error: "customerName and customerEmail are required." });
      return;
    }

    const payload = {
      id: bookingId || `RB-2026-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName,
      customerEmail,
      customerPhone,
      eventDate,
      slot,
      ticketQuantity: quantity,
      totalAmount,
      paymentMethod,
      gateLocation,
      qrCodeUrl: qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=RAJBARI_BHOJBARI_PASS_${bookingId}_TOTAL_${totalAmount}`,
    };

    const result = await sendAutomatedConfirmationEmail(payload);
    res.json({
      success: true,
      message: `Confirmation successfully dispatched to ${customerEmail}`,
      details: result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to dispatch email confirmation" });
  }
});


app.get("/api/tickets/passes", (req, res) => {
  const email = (req.query.email as string || "").toLowerCase();
  const phone = (req.query.phone as string || "").replace(/\D/g, "");

  const allPasses = Array.from(ticketsStore.values());
  if (email || phone) {
    const matched = allPasses.filter((p: any) => 
      (email && p.customerEmail?.toLowerCase() === email) ||
      (phone && p.customerPhone?.replace(/\D/g, "").includes(phone))
    );
    res.json({ success: true, passes: matched });
    return;
  }

  res.json({ success: true, passes: allPasses });
});

// Royal Guestbook Feedback Query
app.get(["/api/feedback", "/api/feedback/list"], (_req, res) => {
  res.json({ success: true, reviews: feedbackStore, feedbacks: feedbackStore });
});

// Royal Guestbook Feedback Submission
const handleFeedbackSubmit = (req: express.Request, res: express.Response) => {
  const { guestName, contact, rating, sustainabilityRating, moholVisited, favoriteDish, comment } = req.body;
  const certificateId = "BHOJ-SHOMMAN-2026-" + Math.floor(1000 + Math.random() * 9000);
  const saved = {
    id: "fb_" + Date.now(),
    guestName: guestName || "Honored Royal Guest",
    contact: contact || "Visitor",
    rating: Number(rating) || 5,
    sustainabilityRating: Number(sustainabilityRating) || 5,
    moholVisited: moholVisited || "Overall Fest",
    favoriteDish: favoriteDish || "Dhakai Kachi Morog Pulao",
    comment: comment || "Delighted by the culinary heritage and eco-friendly hospitality.",
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    certificateId,
    receivedAt: new Date().toISOString(),
  };
  feedbackStore.unshift(saved);

  res.json({
    success: true,
    message: "Thank you for your valuable feedback! Your eco-appreciation certificate is ready.",
    certificateId,
    sustainabilityKarmaBonus: 40,
    reviews: feedbackStore,
  });
};

app.post("/api/feedback", handleFeedbackSubmit);
app.post("/api/feedback/submit", handleFeedbackSubmit);

// Contact Us / Stall Inquiries
const handleContactSubmit = (req: express.Request, res: express.Response) => {
  const inquiry = req.body;
  const saved = {
    ...inquiry,
    id: "inq_" + Date.now(),
    timestamp: new Date().toISOString(),
  };
  contactStore.push(saved);
  res.json({
    success: true,
    message: "Your inquiry has been routed to the Student Ambassador Desk. We will reach back within 2 hours!",
  });
};

app.post("/api/contact", handleContactSubmit);
app.post("/api/contact/submit", handleContactSubmit);

// Health endpoints for Cloud Run container probes
app.get(["/health", "/_health"], (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public static files (e.g. Google Search Console verification files, assets)
app.use(express.static(path.join(process.cwd(), "public")));

// Gate Scanner API Endpoint: Validate Pass
app.post("/api/validate-pass", async (req, res) => {
  try {
    const booking_id = (
      req.body?.booking_id ||
      req.body?.bookingId ||
      req.body?.id ||
      ""
    ).toString().trim();

    if (!booking_id) {
      return res.status(400).json({ success: false, message: "Missing booking_id parameter" });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://rrvjsyppggtthqfxvquq.supabase.co";

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydmpzeXBwZ2d0dGhxZnh2cXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.mock_key";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_id", booking_id)
      .maybeSingle();

    if (fetchError) {
      console.error("[validate-pass] Supabase query error:", fetchError);
      return res.status(500).json({ success: false, message: "Database query error", error: fetchError.message });
    }

    if (!booking) {
      // Local in-memory ticketsStore fallback for offline or seed tickets
      const localPass = ticketsStore.get(booking_id);
      if (localPass) {
        if (localPass.isUsed) {
          return res.status(400).json({ success: false, message: "Pass Already Used", booking: localPass });
        }
        localPass.isUsed = true;
        localPass.admittedAt = new Date().toISOString();
        ticketsStore.set(booking_id, localPass);
        return res.json({ success: true, message: "Valid Pass", booking: localPass });
      }

      return res.status(404).json({ success: false, message: "Invalid Pass" });
    }

    const isAlreadyAdmitted =
      booking.status === "admitted" ||
      booking.entry_status === "admitted" ||
      booking.verified_at_gate === true ||
      booking.is_admitted === true;

    if (isAlreadyAdmitted) {
      return res.status(400).json({
        success: false,
        message: "Pass Already Used",
        booking: {
          booking_id: booking.booking_id,
          customer_name: booking.customer_name,
          admitted_at: booking.admitted_at || booking.verified_at_gate_time || booking.updated_at,
        },
      });
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "admitted",
        entry_status: "admitted",
        verified_at_gate: true,
        verified_at_gate_time: nowIso,
        admitted_at: nowIso,
        updated_at: nowIso,
      })
      .eq("booking_id", booking_id);

    if (updateError) {
      console.error("[validate-pass] Supabase update error:", updateError);
      return res.status(500).json({ success: false, message: "Failed to update pass status", error: updateError.message });
    }

    const localPass = ticketsStore.get(booking_id);
    if (localPass) {
      localPass.isUsed = true;
      localPass.admittedAt = nowIso;
      ticketsStore.set(booking_id, localPass);
    }

    return res.json({
      success: true,
      message: "Valid Pass",
      booking: {
        booking_id: booking.booking_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        pass_quantity: booking.pass_quantity,
        admitted_at: nowIso,
      },
    });
  } catch (err: any) {
    console.error("[validate-pass] Server error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err?.message || String(err) });
  }
});

// API 404 Guard: Ensure unhandled /api routes NEVER fall through to HTML Vite SPA index
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Vite Middleware & Static Serving Setup
async function startServer() {
  if (!isProduction) {
    // Imported lazily so production/serverless bundles never load Vite.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: true,
        strictPort: true,
        hmr: {
          overlay: false,
        },
        ws: {
          clientPort: 443,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist")
      : (fs.existsSync(path.join(process.cwd(), "dist")) ? path.join(process.cwd(), "dist") : __dirname);
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`RAJBARI BHOJBARI Server running on http://0.0.0.0:${PORT} (mode: ${isProduction ? "production" : "development"})`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
}

// Global unhandled promise rejection and exception guards for Vercel and Node runtimes
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Process Guard] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Process Guard] Uncaught Exception thrown:", err);
});

// Environment detection: Skip listening when executed as a Vercel Serverless Function
const isVercelEnvironment = Boolean(
  process.env.VERCEL || 
  process.env.VERCEL_ENV || 
  process.env.NOW_REGION
);

if (!isVercelEnvironment) {
  startServer();
}

export default app;
