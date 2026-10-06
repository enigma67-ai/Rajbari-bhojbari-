import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are Bhoj-Bot, the official digital AI hospitality ambassador for "Rajbari Bhojbari: The Lost Flavours of Bengal" (Food Fest 2026), hosted by IAM Institute of Advanced Management in Kolkata on October 9, 2026.

PERSONA RULES:
- You are a highly professional, conversational, and polite hospitality AI.
- NEVER use rigid, robotic templates. ALWAYS generate dynamic, natural, and helpful responses.
- Answer questions directly. If asked a short question, give a short, precise answer.

LOCATION & TIMING:
- Venue: IAM Institute of Advanced Management, AE Block, Sector 1, Bidhannagar (Salt Lake City), Kolkata, West Bengal 700064.
- Event Date: Friday, October 9, 2026.
- Time: Authentic Bengali Lunch service commences promptly at 10:00 AM.

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, history = [], contextDish, userBookings = [] } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Error: GEMINI_API_KEY is missing or empty in environment variables.",
          reply: "Error: GEMINI_API_KEY is missing or empty in environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let bookingsMemory = "";
    if (Array.isArray(userBookings) && userBookings.length > 0) {
      bookingsMemory =
        `\n\n[USER BOOKINGS MEMORY]: The guest currently has active confirmed bookings:\n` +
        userBookings
          .map(
            (b: any, i: number) =>
              `Booking #${i + 1}: Code ${b.bookingCode || "CONFIRMED"}, Slot: ${
                b.dineSlot || "1:00 PM"
              }, Guests: ${b.guestCount || 1}, Items: ${(b.items || [])
                .map((x: any) => x.name)
                .join(", ")}`
          )
          .join("\n");
    }

    const ai = new GoogleGenAI({ apiKey });
    const formattedHistory: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        if (item && item.text) {
          formattedHistory.push({
            role: item.sender === "user" || item.role === "user" ? "user" : "model",
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
        role: "user",
        parts: [{ text: currentPrompt }],
      },
    ];

    const config = {
      systemInstruction: SYSTEM_INSTRUCTION + bookingsMemory,
      temperature: 0.7,
    };

    let response: any;
    let usedModel = "gemini-3.1-flash-lite";

    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config,
      });
      usedModel = "gemini-3.1-flash-lite";
    } catch (primaryErr: any) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config,
        });
        usedModel = "gemini-3.8-flash";
      } catch (secondaryErr: any) {
        const errorMsg =
          secondaryErr?.message || primaryErr?.message || "AI service call failed";
        return new Response(
          JSON.stringify({
            error: `Error: AI service unavailable (${errorMsg})`,
            reply: `Error: AI service unavailable (${errorMsg})`,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (response && response.text) {
      return new Response(
        JSON.stringify({
          reply: response.text,
          source: usedModel,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Error: No response generated by Gemini model.",
        reply: "Error: No response generated by Gemini model.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: `Error: AI request failed (${err?.message || "Internal Server Error"})`,
        reply: `Error: AI request failed (${err?.message || "Internal Server Error"})`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
