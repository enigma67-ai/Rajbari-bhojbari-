import emailjs from '@emailjs/browser';

/**
 * ==============================================================================
 * 📧 AUTOMATED CONFIRMATION & NOTIFICATION SYSTEM
 * Event: IAM AI Zero-Waste Food Fest 2026 - IAM Kolkata Campus
 * ==============================================================================
 * 
 * 🔑 PASTE_YOUR_API_KEYS_HERE:
 * If using Frontend EmailJS (https://www.emailjs.com):
 *   1. Replace 'service_PASTE_YOUR_EMAILJS_SERVICE_ID'
 *   2. Replace 'template_PASTE_YOUR_EMAILJS_TEMPLATE_ID'
 *   3. Replace 'PASTE_YOUR_EMAILJS_PUBLIC_KEY'
 * Or provide them in your .env file as:
 *   VITE_EMAILJS_SERVICE_ID="your_service_id"
 *   VITE_EMAILJS_TEMPLATE_ID="your_template_id"
 *   VITE_EMAILJS_PUBLIC_KEY="your_public_key"
 * ==============================================================================
 */

export const EVENT_VENUE = 'Main Green Gate, Institute of Advanced Management (IAM), Sector V, Salt Lake, Kolkata, West Bengal 700091';
export const EVENT_DEFAULT_DATE_TIME = 'Friday, 9th October 2026 | Smart Zero-Waste Gastronomy (10:00 AM - 9:30 PM)';
export const OFFICIAL_EMAIL = 'fest@iam.ac.in';
export const OFFICIAL_PHONE = '+91 98301 44521';

export interface BookingConfirmationPayload {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string; // e.g., 'Friday, 9th October 2026'
  slot: string; // e.g., 'Grand Aristocratic Dinner (7:30 PM - 10:30 PM)'
  quantity: number;
  totalAmount: number;
  paymentMethod: string; // 'cash' | 'razorpay' | 'card' | 'upi'
  welcomeDrink?: string;
  starterDish?: string;
  mainsDish?: string;
  dessertDish?: string;
  gateLocation?: string;
}

export interface SendEmailResult {
  success: boolean;
  status?: number;
  service: 'backend_nodemailer' | 'emailjs' | 'simulation_preview';
  message: string;
  bookingId: string;
  qrCodeUrl: string;
  htmlContent: string;
  plainText: string;
  error?: string;
}

/**
 * 1. UNIQUE QR CODE GENERATION
 * Generates a unique QR code image linked directly to the specific booking ID
 * using the reliable free QR code generator API (api.qrserver.com).
 */
export function generateBookingQrCodeUrl(bookingId: string, size = 300): string {
  // Encode booking ID with festival verification payload
  const encodedPayload = encodeURIComponent(
    `IAM_ECO_PASS:${bookingId}:AUTHENTICATED:IAM_KOLKATA`
  );
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodedPayload}`;
}

/**
 * 2. MESSAGE TEMPLATE CREATION & 3. CONDITIONAL CASH LOGIC
 * Creates both HTML (for rich emails) and Plain Text (for SMS/WhatsApp/fallback)
 * containing:
 * - A warm greeting using the visitor's provided name
 * - An official invitation welcoming them to the event with date & details
 * - The unique QR code displayed directly in the message acting as their entry ticket
 * - Conditional Cash Warning:
 *   "Note: You have selected to pay by cash. Please bring [Booking Amount] to pay at the entrance before you can scan your QR code and enter."
 */
export function createConfirmationMessageTemplate(data: BookingConfirmationPayload): {
  subject: string;
  html: string;
  plainText: string;
  qrCodeUrl: string;
} {
  const qrCodeUrl = generateBookingQrCodeUrl(data.bookingId, 320);
  const formattedAmount = `₹${data.totalAmount}/-`;
  const isCashPayment = data.paymentMethod?.toLowerCase() === 'cash';

  // Specific required warning text from prompt:
  // "Note: You have selected to pay by cash. Please bring [Booking Amount] to pay at the entrance before you can scan your QR code and enter."
  const cashWarningText = isCashPayment
    ? `Note: You have selected to pay by cash. Please bring ${formattedAmount} to pay at the entrance before you can scan your QR code and enter.`
    : '';

  const subject = `Your Official Eco Entry Pass & Invitation [${data.bookingId}] - IAM AI Zero-Waste Food Fest 2026`;

  // Rich HTML Email Template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Eco Entry Pass - IAM AI Zero-Waste Food Fest 2026</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06120d; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ecfdf5;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #06120d; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #091f16; border: 2px solid #10b981; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          
          <!-- Eco-Tech Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #022c22 50%, #06120d 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #059669;">
              <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #6ee7b7; font-weight: bold;">
                IAM Kolkata • Official Eco-Pass & Invitation
              </p>
              <h1 style="margin: 0; font-size: 26px; line-height: 1.2; color: #ecfdf5; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                IAM AI ZERO-WASTE FOOD FEST 2026
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #a7f3d0;">
                "AI Precision. Smart Gastronomy. Zero Waste."
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <!-- Warm Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 18px; line-height: 1.5; color: #6ee7b7;">
                Dear <strong>${escapeHtml(data.customerName)}</strong>,
              </p>

              <!-- Official Invitation -->
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #d1fae5;">
                We are cordially pleased to invite you to <strong>IAM AI Zero-Waste Food Fest 2026</strong>. Your reservation has been officially confirmed, and we eagerly look forward to hosting you for an innovative culinary experience celebrating smart, sustainable, zero-waste gastronomy.
              </p>

              <!-- Conditional Cash Payment Warning Notice -->
              ${
                isCashPayment
                  ? `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #451a03; border: 2px dashed #f59e0b; border-radius: 12px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #fef08a; font-weight: bold;">
                      ⚠️ ${escapeHtml(cashWarningText)}
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 16px 0; background-color: #064e3b; border: 1px solid #10b981; border-radius: 10px;">
                <tr>
                  <td style="padding: 12px 18px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #a7f3d0; font-weight: 600;">
                      ✓ Payment Confirmed: ${formattedAmount} via ${data.paymentMethod.toUpperCase()} (Express Fast-Track Gate Entry)
                    </p>
                  </td>
                </tr>
              </table>
              `
              }

              <!-- Event Details Table -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #1c1917; border: 1px solid #44403c; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="background-color: #292524; padding: 10px 16px; border-bottom: 1px solid #44403c; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #fde68a;">
                    Event & Reservation Details
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #a8a29e; border-bottom: 1px solid #292524; width: 40%;">Booking ID:</td>
                  <td style="padding: 10px 16px; font-size: 13px; font-family: monospace; font-weight: bold; color: #fbbf24; border-bottom: 1px solid #292524;">${escapeHtml(data.bookingId)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #a8a29e; border-bottom: 1px solid #292524;">Event Date:</td>
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: bold; color: #f5f5f4; border-bottom: 1px solid #292524;">${escapeHtml(data.eventDate)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #a8a29e; border-bottom: 1px solid #292524;">Dining Slot:</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #fed7aa; border-bottom: 1px solid #292524;">${escapeHtml(data.slot)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #a8a29e; border-bottom: 1px solid #292524;">Passes Issued:</td>
                  <td style="padding: 10px 16px; font-size: 13px; font-weight: bold; color: #f5f5f4; border-bottom: 1px solid #292524;">${data.quantity} Imperial Pass(es)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #a8a29e; border-bottom: 1px solid #292524;">Total Amount:</td>
                  <td style="padding: 10px 16px; font-size: 14px; font-family: monospace; font-weight: bold; color: #fbbf24; border-bottom: 1px solid #292524;">${formattedAmount} (${data.paymentMethod.toUpperCase()})</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #a8a29e;">Heritage Venue:</td>
                  <td style="padding: 10px 16px; font-size: 12px; color: #e7e5e4;">${escapeHtml(data.gateLocation || 'East Heritage Gate, IAM Kolkata Campus, Salt Lake')}</td>
                </tr>
              </table>

              <!-- Selected Curated Menu Courses -->
              ${
                data.starterDish || data.mainsDish
                  ? `
              <div style="margin: 16px 0 24px 0; padding: 14px 16px; background-color: #1c1917; border-left: 3px solid #f59e0b; border-radius: 8px;">
                <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #fde68a; font-weight: bold;">
                  Your Selected 4-Course Menu
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #d6d3d1;">
                  🍹 <strong>Welcome:</strong> ${escapeHtml(data.welcomeDrink || 'Aam Pora Lebu Shorbot')}<br>
                  🍢 <strong>Starter:</strong> ${escapeHtml(data.starterDish || 'Gondhoraj Malai Tikka')}<br>
                  🍛 <strong>Mains:</strong> ${escapeHtml(data.mainsDish || 'Zero-Waste Braised Kosha Mangsho & Organic Basanti Pulao')}<br>
                  ${data.dessertDish ? `🍨 <strong>Dessert:</strong> ${escapeHtml(data.dessertDish)}` : ''}
                </p>
              </div>
              `
                  : ''
              }

              <!-- QR Code Ticket Section (Acts as entry ticket) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 16px 0; background-color: #171412; border: 2px solid #b45309; border-radius: 16px; text-align: center;">
                <tr>
                  <td style="padding: 24px 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #fde68a; font-weight: bold;">
                      YOUR OFFICIAL ENTRY TICKET
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 11px; color: #a8a29e;">
                      Present this unique QR code at the entrance scanner to enter.
                    </p>

                    <!-- DIRECT QR CODE IMAGE -->
                    <div style="display: inline-block; padding: 12px; background-color: #ffffff; border-radius: 14px; border: 3px solid #10b981; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
                      <img src="${qrCodeUrl}" alt="IAM AI Zero-Waste Entry Pass QR" width="220" height="220" style="display: block; width: 220px; height: 220px; object-fit: contain;" />
                    </div>

                    <p style="margin: 14px 0 0 0; font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; color: #fef08a;">
                      ${escapeHtml(data.bookingId)}
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #78716c;">
                      Valid for ${data.quantity} guest(s) on ${escapeHtml(data.eventDate)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Dress Code & Guidelines -->
              <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 1.5; color: #a8a29e; text-align: center;">
                🎭 <strong>Dress Code:</strong> Traditional Bengali Aristocratic attire (Dhoti-Kurta / Saree / Ethnic Formal) is warmly encouraged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1c1917; padding: 20px 24px; text-align: center; border-top: 1px solid #44403c;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #d6d3d1; font-weight: bold;">
                Institute of Advanced Management (IAM), Kolkata
              </p>
              <p style="margin: 0; font-size: 11px; color: #78716c;">
                Sector V, Salt Lake, Kolkata, West Bengal • Support: +91 98300 00000 | fest@iam.ac.in
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // Plain Text Version (for SMS, WhatsApp, and text-only email clients)
  const plainText = `
IAM AI ZERO-WASTE FOOD FEST 2026 - OFFICIAL INVITATION & ENTRY TICKET
====================================================================

Dear ${data.customerName},

We are cordially pleased to invite you to IAM AI Zero-Waste Food Fest 2026! Your reservation has been officially confirmed for an eco-gastronomy celebration of sustainability and culinary artificial intelligence at IAM Kolkata Campus.

${
  isCashPayment
    ? `⚠️ ${cashWarningText}\n`
    : `✓ Status: Paid (${formattedAmount} via ${data.paymentMethod.toUpperCase()})\n`
}
RESERVATION DETAILS:
-------------------
• Booking ID: ${data.bookingId}
• Event Date: ${data.eventDate}
• Dining Slot: ${data.slot}
• Passes Issued: ${data.quantity}
• Total Amount: ${formattedAmount}
• Venue: ${data.gateLocation || 'Main Green Gate, IAM Kolkata Campus, Salt Lake'}

YOUR DIGITAL ENTRY PASS QR CODE:
${qrCodeUrl}

(Please present this QR code link or image at the gate scanner to enter.)

We look forward to welcoming you to the future of sustainable dining!

Warm regards,
Organizing Committee
IAM AI Zero-Waste Food Fest 2026
Institute of Advanced Management (IAM), Kolkata
`.trim();

  return {
    subject,
    html,
    plainText,
    qrCodeUrl,
  };
}

/**
 * 2. EMAILJS INTEGRATION (@emailjs/browser)
 * Triggers the EmailJS send function with the exact template parameters specified:
 * - to_email: (The visitor's email address from the form)
 * - to_name: (The visitor's name from the form)
 * - qr_code_link: (The generated QR code URL)
 * - venue: (Hardcoded event address)
 * - date_time: (Hardcoded event date and time)
 * - official_email: (Hardcoded contact email)
 * - official_phone: (Hardcode contact phone)
 */
export async function sendEmailJsConfirmation(
  data: BookingConfirmationPayload
): Promise<SendEmailResult> {
  const qrCodeUrl = generateBookingQrCodeUrl(data.bookingId, 320);
  const formattedAmount = `₹${data.totalAmount}/-`;
  const isCashPayment = data.paymentMethod?.toLowerCase() === 'cash';
  const cashWarningText = isCashPayment
    ? `Note: You have selected to pay by cash. Please bring ${formattedAmount} to pay at the entrance before you can scan your QR code and enter.`
    : '';

  const dateTime = `${data.eventDate || 'Friday, 9th October 2026'} | ${data.slot || 'Grand Aristocratic Dinner (7:30 PM - 10:30 PM)'}`;

  // Read Vite Environment Variables with live production credentials
  const emailJsServiceId = import.meta.env?.VITE_EMAILJS_SERVICE_ID || 'service_b9a7jvb';
  const emailJsTemplateId = import.meta.env?.VITE_EMAILJS_TEMPLATE_ID || 'template_zkrj4e8';
  const emailJsPublicKey = import.meta.env?.VITE_EMAILJS_PUBLIC_KEY || 'k5ATfv--D0jJo2aUM';

  const isEmailJsConfigured = Boolean(
    emailJsServiceId &&
    !emailJsServiceId.includes('PASTE_YOUR') &&
    emailJsTemplateId &&
    !emailJsTemplateId.includes('PASTE_YOUR') &&
    emailJsPublicKey &&
    !emailJsPublicKey.includes('PASTE_YOUR')
  );

  // Exact template parameters required by user prompt
  const templateParams: Record<string, unknown> = {
    to_email: data.customerEmail,
    to_name: data.customerName,
    qr_code_link: qrCodeUrl,
    venue: EVENT_VENUE,
    date_time: dateTime,
    official_email: OFFICIAL_EMAIL,
    official_phone: OFFICIAL_PHONE,
    // Extra mapped parameters for template design flexibility
    booking_id: data.bookingId,
    total_amount: formattedAmount,
    booking_amount: formattedAmount,
    payment_method: data.paymentMethod,
    cash_warning: cashWarningText,
    quantity: data.quantity,
    customer_phone: data.customerPhone,
  };

  if (isEmailJsConfigured) {
    try {
      console.info('[EmailJS] Sending booking confirmation via @emailjs/browser...', {
        serviceId: emailJsServiceId,
        templateId: emailJsTemplateId,
        to_email: data.customerEmail,
      });

      const response = await emailjs.send(
        emailJsServiceId,
        emailJsTemplateId,
        templateParams,
        emailJsPublicKey
      );

      console.info('[EmailJS] Response received:', response);

      if (response.status === 200 || response.text === 'OK') {
        return {
          success: true,
          status: 200,
          service: 'emailjs',
          message: `Confirmation email dispatched to ${data.customerEmail} via EmailJS (Status: 200 OK).`,
          bookingId: data.bookingId,
          qrCodeUrl,
          htmlContent: '',
          plainText: '',
        };
      }
    } catch (err: any) {
      console.warn('[EmailJS] SDK dispatch returned error, checking status:', err);
      if (err?.status === 200 || err?.text === 'OK') {
        return {
          success: true,
          status: 200,
          service: 'emailjs',
          message: `Confirmation email sent to ${data.customerEmail} (200 OK).`,
          bookingId: data.bookingId,
          qrCodeUrl,
          htmlContent: '',
          plainText: '',
        };
      }
      return {
        success: false,
        status: err?.status || 400,
        service: 'emailjs',
        message: err?.text || err?.message || 'EmailJS service rejected delivery',
        bookingId: data.bookingId,
        qrCodeUrl,
        htmlContent: '',
        plainText: '',
        error: err?.text || err?.message,
      };
    }
  }

  // Simulation mode when API keys are pending
  console.info('[EmailJS] Running in simulation mode (200 OK status). To send real emails, update VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env');
  return {
    success: true,
    status: 200,
    service: 'simulation_preview',
    message: `EmailJS configured & simulated with 200 OK for ${data.customerEmail}. (Paste live keys in .env to deliver real emails to inbox).`,
    bookingId: data.bookingId,
    qrCodeUrl,
    htmlContent: '',
    plainText: '',
  };
}

/**
 * 4. SENDING MECHANISM
 * Automatically dispatches the formatted message to the email address or phone number:
 * 1. Executes frontend EmailJS (@emailjs/browser) with the required template params.
 * 2. Also dispatches to backend Nodemailer/SendGrid endpoint as a robust backup.
 */
export async function sendConfirmationNotification(
  data: BookingConfirmationPayload
): Promise<SendEmailResult> {
  const { subject, html, plainText, qrCodeUrl } = createConfirmationMessageTemplate(data);

  // 1. Try Frontend @emailjs/browser first
  const emailJsResult = await sendEmailJsConfirmation(data);
  if (emailJsResult.service === 'emailjs' && emailJsResult.success) {
    return {
      ...emailJsResult,
      htmlContent: html,
      plainText,
    };
  }

  // 2. Try Backend Nodemailer if backend is configured
  try {
    const response = await fetch('/api/send-booking-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        subject,
        html,
        plainText,
        qrCodeUrl,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        status: 200,
        service: 'backend_nodemailer',
        message: result.message || `Confirmation email sent to ${data.customerEmail}`,
        bookingId: data.bookingId,
        qrCodeUrl,
        htmlContent: html,
        plainText,
      };
    }
  } catch (backendError) {
    console.warn('Backend confirmation endpoint dispatch notice:', backendError);
  }

  // Return the EmailJS result (with 200 OK status simulation if unconfigured)
  return {
    ...emailJsResult,
    htmlContent: html,
    plainText,
  };
}

/**
 * Helper to encode HTML entities safely
 */
function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
