import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  MapPin, 
  Globe, 
  Calendar, 
  UtensilsCrossed, 
  RefreshCw,
  Loader2,
  CheckCircle2,
  BookmarkCheck,
  Zap,
  BookOpen,
  Leaf
} from 'lucide-react';
import { MenuItem, ChatMessage, UserProfile } from '../types';
import { SavedBooking, saveChatMessage, getUserChatHistory } from '../lib/firebase';
import { IAMChefLogo } from './IAMChefLogo';

interface BhojBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDishToCart?: (dish: MenuItem) => void;
  initialQuery?: string;
  contextDish?: MenuItem | null;
  userBookings?: SavedBooking[];
  currentUser?: UserProfile | null;
  onOpenBookingModal?: () => void;
}

const BHOJ_BOT_SYSTEM_PROMPT = `You are Bhoj-Bot, the official digital AI hospitality ambassador for "Rajbari Bhojbari: The Lost Flavours of Bengal" (Food Fest 2026), hosted by IAM Institute of Advanced Management in Kolkata on October 9, 2026. 

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
- Desserts contain Milk, Tree Nuts, and Gluten (Malpua).`;

export const BhojBotModal: React.FC<BhojBotModalProps> = ({
  isOpen,
  onClose,
  onAddDishToCart,
  initialQuery,
  contextDish,
  userBookings = [],
  currentUser,
  onOpenBookingModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bhojbot',
      text: "Welcome to Rajbari Bhojbari: The Lost Flavours of Bengal! I am Bhoj-Bot, your digital AI hospitality ambassador for Food Fest 2026 hosted by IAM Kolkata on October 9, 2026. How may I assist you with our menu selections, allergen guidance, or festival arrangements today?",
      timestamp: '12:00 PM',
      source: 'gemini-3.8-flash',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'complex' | 'fast'>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore when user is logged in
  useEffect(() => {
    if (currentUser?.id && isOpen) {
      getUserChatHistory(currentUser.id).then((history) => {
        if (history.length > 0) {
          const loadedMessages: ChatMessage[] = history.map((h) => ({
            id: h.id,
            sender: h.role === 'user' ? 'user' : 'bhojbot',
            text: h.text,
            timestamp: new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: h.source || 'gemini-3.5-flash',
          }));
          setMessages((prev) => {
            // keep welcome then append or restore
            return [prev[0], ...loadedMessages];
          });
        }
      });
    }
  }, [currentUser?.id, isOpen]);

  // Dynamic preset prompts reflecting booking system memory & Google tools
  const presetPrompts = [
    "What is included in the ₹349/- Eco-Pass & gate entry policy?",
    ...(userBookings.length > 0 ? ["Show my Eco-Pass booking details & reserved dishes"] : ["How do I reserve a zero-waste dining slot?"]),
    "How do I reach IAM Kolkata venue? (Google Maps directions)",
    "What is the story of Muchmuchea Shapla & Pat Patar Bora?",
    "Recommend an authentic Bengali zero-waste feast",
    "What are the zero-waste cooking techniques used at the fest?",
  ];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle initial query if passed
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: userMessageTime,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    // Save user message to Firestore if logged in
    if (currentUser?.id) {
      saveChatMessage(currentUser.id, {
        role: 'user',
        text: textToSend,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      // Build conversation history for multi-turn chat
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          text: m.text,
        }));

      let reply = "";
      let source = "gemini-3.5-flash";
      let groundingType: 'maps' | 'search' | 'none' = 'none';
      let searchQueries: string[] = [];

      // 1. Check for client-side API Key from import.meta.env.VITE_GEMINI_API_KEY
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

      if (apiKey) {
        try {
          const contents = [
            ...historyPayload.map((h) => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }],
            })),
            {
              role: 'user',
              parts: [{ text: textToSend }],
            },
          ];

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: BHOJ_BOT_SYSTEM_PROMPT }],
                },
                contents,
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 600,
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResult && textResult.trim()) {
              reply = textResult.trim();
              source = "gemini-3.1-flash-lite";
            }
          }
        } catch (_) {
          // Quietly route through backend endpoint
        }
      }

      // 2. If client API key not available or direct request returned empty, route via server proxy
      if (!reply) {
        try {
          const payload = JSON.stringify({
            message: textToSend,
            history: historyPayload,
            contextDish: contextDish || undefined,
            userBookings, // Pass confirmed bookings memory so Bhoj-Bot remembers
            systemPrompt: BHOJ_BOT_SYSTEM_PROMPT,
            mode: chatMode,
          });

          // Primary route: /api/chat (Vercel Serverless Function & Express Backend)
          let res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });

          // Fallback to /api/gemini/chat if /api/chat returns 404
          if (res.status === 404) {
            try {
              const fallbackRes = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
              });
              if (fallbackRes.ok || fallbackRes.status !== 404) {
                res = fallbackRes;
              }
            } catch {
              // keep primary 404 response
            }
          }

          let data: any = null;
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            try {
              data = await res.json();
            } catch {
              data = null;
            }
          }

          if (res.ok) {
            if (data && data.reply) reply = data.reply;
            if (data && data.source) source = data.source;
            if (data && data.groundingType) groundingType = data.groundingType;
            if (data && data.searchQueries) searchQueries = data.searchQueries;
          } else {
            if (res.status === 404) {
              reply = "Error: Backend route not found (404). Please ensure 'api/chat.ts' is deployed in the root 'api/' directory of your Vercel project.";
            } else {
              const rawText = !data ? await res.text().catch(() => '') : '';
              const errorMsg = data?.error || data?.reply || rawText || `Server returned status ${res.status}`;
              reply = errorMsg.startsWith('Error:') ? errorMsg : `Error: ${errorMsg}`;
            }
          }
        } catch (fetchErr: any) {
          reply = `Error: Connection to AI backend failed (${fetchErr?.message || 'Network error'})`;
        }
      }

      if (!reply) {
        reply = "Error: No response generated by AI model. Please try again.";
      }

      const isBookingRecall = textToSend.toLowerCase().includes('booking') || 
                              textToSend.toLowerCase().includes('order') || 
                              textToSend.toLowerCase().includes('pass') ||
                              textToSend.toLowerCase().includes('reservation');

      const botMessage: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bhojbot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source,
        groundingType,
        searchQueries,
        isBookingRecall: isBookingRecall && userBookings.length > 0,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Save bot response to Firestore if logged in
      if (currentUser?.id) {
        saveChatMessage(currentUser.id, {
          role: 'assistant',
          text: reply,
          source,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (_) {
      const errorMessage: ChatMessage = {
        id: 'bot_err_' + Date.now(),
        sender: 'bhojbot',
        text: "Pranam! Rajbari Bhojbari 2026 is taking place on Friday, 9th October at IAM Kolkata Campus. Our ₹349 Zero-Waste Eco-Pass gives you access to authentic 19th-century recipes like Raj Angan Jali Kebab, Panchali Patpata Bora, and Polao. Please use 'Buy Now' or 'Add to Cart' to reserve your passes!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'bhojbot-curated-engine',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        sender: 'bhojbot',
        text: "Pranam! Conversation reset. I am ready with fresh memory of your bookings and Bengal's aristocratic recipes. What would you like to explore?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'gemini-3.5-flash',
      },
    ]);
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
            id="bhojbot-modal-container"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[95%] sm:w-full max-w-2xl h-[88vh] max-h-[85vh] sm:max-h-[88vh] mx-auto flex flex-col bg-[#180406] border border-amber-500/35 rounded-3xl shadow-2xl overflow-hidden z-10 ring-1 ring-amber-500/20 backdrop-blur-2xl"
          >
            {/* Header with IAM Chef Mascot Logo */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#120305] via-[#24080c] to-[#120305] border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IAMChefLogo className="w-10 h-10" glow={true} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-black text-blue-400">Bhoj-Bot</h3>
                    <span className="bg-blue-950/50 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-500/40 uppercase">
                      AI Concierge
                    </span>
                    {userBookings.length > 0 && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                        <BookmarkCheck className="w-3 h-3 text-amber-400" />
                        <span>Eco-Pass ({userBookings.length})</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-200/80 font-sans flex items-center gap-1.5">
                    <span>IAM Zero-Waste Food Fest</span>
                    <span>•</span>
                    <span className="text-blue-300 font-mono">Gemini & Google Maps Grounded</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearChat}
                  title="Reset conversation thread"
                  className="p-2 rounded-full text-stone-400 hover:text-amber-300 hover:bg-red-950/60 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.button>
                <motion.button
                  id="close-bhojbot-modal-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-red-950/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Model & Capability Mode Selector */}
            <div className="px-4 py-2 bg-[#120305] border-b border-amber-900/50 flex items-center justify-between text-xs overflow-x-auto gap-2">
              <div className="flex items-center gap-1.5 text-stone-400 font-medium whitespace-nowrap text-[11px]">
                <span>Intelligence Mode:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setChatMode('general')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    chatMode === 'general'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-amber-200 border border-stone-800'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Heritage Concierge</span>
                </button>
                <button
                  onClick={() => setChatMode('complex')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    chatMode === 'complex'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-amber-200 border border-stone-800'
                  }`}
                >
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  <span>Royal Recipes</span>
                </button>
                <button
                  onClick={() => setChatMode('fast')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    chatMode === 'fast'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-amber-200 border border-stone-800'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Fast Q&A</span>
                </button>
              </div>
            </div>

            {/* Remembered Booking Quick Bar */}
            {userBookings.length > 0 && (
              <div className="px-4 py-2 bg-gradient-to-r from-red-950/60 via-[#1e0609] to-amber-950/40 border-b border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-200 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">
                    Latest Eco-Pass: <strong className="font-mono">{userBookings[0].bookingCode}</strong> • {userBookings[0].dineSlot} ({userBookings[0].items?.length || 1} course)
                  </span>
                </div>
                <button
                  onClick={() => handleSendMessage("Review my active Eco-Pass booking and recommend zero-waste pairing dishes")}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold flex-shrink-0 ml-2 cursor-pointer"
                >
                  Ask Bhoj-Bot About It →
                </button>
              </div>
            )}

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#24080c]/60 via-[#180406] to-[#120305]">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bhojbot' && (
                    <div className="flex-shrink-0 mt-0.5">
                      <IAMChefLogo className="w-8 h-8" glow={false} />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-medium rounded-tr-none shadow-amber-950/40'
                        : 'bg-[#24080c] border border-amber-500/25 text-stone-200 rounded-tl-none space-y-2'
                    }`}
                  >
                    {/* Bot Grounding & Memory Badges */}
                    {msg.sender === 'bhojbot' && (msg.groundingType === 'maps' || msg.groundingType === 'search' || msg.isBookingRecall) && (
                      <div className="flex flex-wrap items-center gap-1.5 pb-1 text-[10px]">
                        {msg.groundingType === 'maps' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40 flex items-center gap-1 font-semibold">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span>Google Maps Grounded • IAM Kolkata</span>
                          </span>
                        )}
                        {msg.groundingType === 'search' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold">
                            <Globe className="w-3 h-3 text-amber-400" />
                            <span>Google Search Grounded</span>
                          </span>
                        )}
                        {msg.isBookingRecall && (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold">
                            <BookmarkCheck className="w-3 h-3 text-amber-400" />
                            <span>Retrieved from Eco-Pass Memory</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      {msg.sender === 'bhojbot' && msg.source && (
                        <span className="text-amber-400/80 font-mono text-[9px]">
                          model: {msg.source}
                        </span>
                      )}
                      <div className={`ml-auto ${msg.sender === 'user' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <IAMChefLogo className="w-8 h-8" glow={true} />
                  </div>
                  <div className="bg-[#24080c] border border-amber-500/25 text-stone-300 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2.5 text-xs shadow-md">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-amber-200">Bhoj-Bot is typing</span>
                      <span className="inline-flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Preset Prompt Pills */}
            <div className="px-4 py-2 bg-[#120305] border-t border-amber-900/50 overflow-x-auto scrollbar-none flex items-center gap-2">
              <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1 whitespace-nowrap">
                <Sparkles className="w-3 h-3" /> Quick Prompts:
              </span>
              {presetPrompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  id={`preset-prompt-${i}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-stone-900 border border-amber-500/20 text-[11px] text-stone-300 hover:text-amber-200 hover:border-amber-400 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-[#140305] border-t border-amber-500/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }}
                autoComplete="off"
                className="flex items-center gap-2"
              >
                <input
                  id="bhojbot-chat-input"
                  type="text"
                  autoComplete="nope"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about zero-waste recipes, Eco-Passes, Salt Lake directions, or pairings..."
                  className="flex-1 px-4 py-3 rounded-xl bg-stone-900/90 border border-stone-700 text-stone-200 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
                <motion.button
                  id="bhojbot-chat-send-btn"
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-stone-950 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center cursor-pointer font-bold"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
