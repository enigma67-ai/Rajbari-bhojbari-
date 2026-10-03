# Production Page and State Audit: Rajbari Bhojbari 2026

**Application Type**: Single Page Web Application (Vite + React 19 + TypeScript + Express Full-Stack Server)  
**Domain**: Rajbari Bhojbari 2026 — Zero-Waste AI Food Fest at Institute of Advanced Management (IAM), Salt Lake Sector V, Kolkata  
**Date of Audit**: September 30, 2026  
**Auditor**: Senior Full-Stack Engineer, Security Reviewer & Accessibility Specialist  

---

## 1. Evidence-Based Audit Table

| Category | Page or state | Status | Evidence | Applicability reason | Required action |
|---|---|---|---|---|---|
| Legal | Privacy Policy | EXISTS_NEEDS_IMPROVEMENT | `src/components/DPDPPrivacyModal.tsx`, `src/components/Footer.tsx` | Fest collects attendee Name, Phone, Email for QR pass issuance, Supabase storage, and WhatsApp/Email communications. | Expand existing DPDP 2023 modal into a comprehensive policy modal/view accessible via footer and URL (`#privacy`, `/privacy`). |
| Legal | Terms of Service | APPLICABLE_MISSING | Event passes (₹349 Eco-Pass), cart orders, campus venue rules, no-ticket-no-entry policy. | Users purchasing passes and entering the campus premises require legally binding terms of entry and service. | Create `TermsOfServiceModal` with festival entry rules, pass validity, zero-waste code of conduct, and link in footer and checkout. |
| Legal | Cookie Policy | APPLICABLE_MISSING | `src/main.tsx` (`@vercel/analytics`), `localStorage` keys (`rb_user`, `rb_cart`, `rb_tickets`, `rb_saved_bookings`). | Application stores essential session data, cart state, and analytics data in browser storage. | Create `CookiePolicyModal` detailing essential cookies/local storage keys and Vercel Analytics usage. |
| Legal | Cookie Preferences | APPLICABLE_MISSING | `localStorage` persistence, `@vercel/analytics`, Supabase `visitor_analytics`. | Users should have transparent visibility and control over non-essential analytics tracking. | Create `CookiePreferencesBanner` and management modal storing consent in `rb_cookie_consent`. |
| Legal | Refund Policy | APPLICABLE_MISSING | Pass ticket sales (₹349) and meal purchases via UPI/Card in `TicketBookingSection.tsx` & `PaymentModal.tsx`. | Attendees paying for festival tickets must be informed of zero-waste non-refundable policies and pass transfer terms. | Create `RefundPolicyModal` detailing zero-waste procurement rules, non-refundable pass status, and transferability. |
| Legal | Cancellation Policy | APPLICABLE_MISSING | Dining slot selections in `TicketBookingSection.tsx` and `PaymentModal.tsx`. | Slot-based banquets require clear cancellation and rescheduling parameters. | Integrate cancellation guidelines within legal documentation and booking confirmation flows. |
| Legal | Shipping Policy | NOT_APPLICABLE | `src/components/TicketBookingSection.tsx`, `src/utils/confirmationEmailService.ts`. | Passes are 100% digital QR codes (emailed & downloaded); food is served fresh on-site. No physical shipping. | Exclude from implementation; document digital fulfillment. |
| Legal | Return / Exchange Policy | NOT_APPLICABLE | `src/components/MenuSection.tsx`, perishable zero-waste cuisine. | Freshly cooked Bengali culinary dishes and digital entry QR passes are non-returnable. | Exclude from implementation. |
| Legal | Disclaimer | APPLICABLE_MISSING | `src/data/festData.ts` (allergens like nuts, fish Katla, mustard, prawns), AI recommendations (`BhojBotModal.tsx`). | Dietary allergens, spice warnings, student culinary lab demonstrations, and AI output disclaimers are essential. | Create `AllergenDisclaimerModal` detailing allergens, student training environment, and AI concierge advice limits. |
| Legal | Accessibility Statement | APPLICABLE_MISSING | Public educational event website hosted by IAM Kolkata. | Educational and hospitality institution web presence requires clear accessibility disclosures (digital & physical campus). | Create `AccessibilityStatementModal` detailing keyboard navigation, ARIA landmarks, and physical campus wheelchair access. |
| Legal | Data Processing Agreement (DPA) | NOT_APPLICABLE | B2C consumer application for festival guests. | The application does not process personal data on behalf of corporate business entities under B2B contracts. | Exclude from implementation. |
| Legal | Acceptable Use Policy | APPLICABLE_MISSING | `src/components/FeedbackSection.tsx`, `src/components/BhojBotModal.tsx`. | Community guestbook reviews, AI prompt inputs, and ticketing forms must prohibit abuse and fraud. | Create Acceptable Use section inside Terms & Community Guidelines. |
| Legal | Security Policy | APPLICABLE_MISSING | Supabase RLS, Firebase Auth, AES-256 transmission, Admin Staff PIN (`K246790`). | Attendees and staff need transparency regarding payment reference handling, database security, and data protection. | Create `SecurityPolicyModal` highlighting encryption, gate validation security, and zero plain-text card storage. |
| Legal | Responsible Disclosure | APPLICABLE_MISSING | Academic institution website with public endpoints and admin portal. | Ethical security researchers require a defined channel (`ks7901424@gmail.com`) for responsible vulnerability reporting. | Include vulnerability disclosure protocol in Security Policy. |
| Legal | Community Guidelines | APPLICABLE_MISSING | `src/components/FeedbackSection.tsx`, public reviews, student volunteer interactions. | Public guestbook reviews and zero-waste dining etiquette require respectful community standards. | Create `CommunityGuidelinesModal` linked from the Feedback section and footer. |
| Customer lifecycle | Login | EXISTS_AND_ADEQUATE | `src/components/AuthModal.tsx` | Provides guest email OTP authentication, Google Sign-in, and Staff PIN login (`K246790`). | Retained as working. |
| Customer lifecycle | Register | EXISTS_AND_ADEQUATE | `src/components/AuthModal.tsx`, `src/components/TicketBookingSection.tsx` | Creates user profile in state, `localStorage`, and Supabase `users` table on checkout. | Retained as working. |
| Customer lifecycle | Email Verification | EXISTS_AND_ADEQUATE | `server.ts` (`/api/auth/send-otp`, `/api/auth/verify-otp`) | Real OTP generation, verification, and simulated sandbox test fallback ('123456'). | Retained as working. |
| Customer lifecycle | Forgot Password | NOT_APPLICABLE | `src/components/AuthModal.tsx` | Passwordless system for guests (OTP/Google); Gate Staff uses operational staff PIN (`K246790`). No individual passwords to reset. | Exclude; document passwordless architecture. |
| Customer lifecycle | Reset Password | NOT_APPLICABLE | `src/components/AuthModal.tsx` | No user passwords stored in DB. | Exclude; document passwordless architecture. |
| Customer lifecycle | Onboarding | APPLICABLE_MISSING | New visitors entering `src/App.tsx`. | Visitors benefit from understanding how the 4-Mohol food fest, ₹349 Eco-Pass, and zero-waste dining operate. | Create `FestivalGuideModal` providing an interactive walkthrough of the festival concept, Mohols, and pass usage. |
| Customer lifecycle | Account Settings / Profile | APPLICABLE_MISSING | `Navbar.tsx` shows username and logout, but lacks a centralized pass manager/profile screen. | Logged-in guests need to view their purchased QR passes, check Sustainability Karma, and manage DPDP data rights. | Create `UserProfileModal` displaying attendee details, active QR passes, Sustainability Karma, and data deletion request. |
| Customer lifecycle | Billing / Upgrade / Downgrade / Cancel Subscription | NOT_APPLICABLE | `src/data/festData.ts`, `src/types.ts` | One-off ticket and food purchases. No recurring subscriptions or membership billing tiers. | Exclude from implementation. |
| Customer lifecycle | Payment Success | EXISTS_AND_ADEQUATE | `src/components/CelebrationModal.tsx`, `src/components/PaymentModal.tsx` | Instant celebration chime, canvas confetti, ticket download, QR render, and booking receipt. | Retained as working. |
| Customer lifecycle | Payment Failed | EXISTS_NEEDS_IMPROVEMENT | `src/components/PaymentModal.tsx`, `src/components/TicketBookingSection.tsx` | Errors currently shown as inline banners; lacks structured recovery with clear options. | Add dedicated `PaymentFailedState` view with retry, alternate payment method (UPI/Card/Gate Cash), and concierge helpline. |
| Customer lifecycle | Payment Pending | EXISTS_AND_ADEQUATE | `src/components/PaymentVerifyingAnimation.tsx`, Cash-at-Gate flow | Real-time UTR lookup animation and counter payment state with instructions. | Retained as working. |
| Customer lifecycle | Support & Help Center | APPLICABLE_MISSING | `src/components/ContactSection.tsx`, `src/components/Footer.tsx` | Attendees frequently need answers on entry timings, parking, dress code, directions, and QR retrieval. | Create `HelpCenterModal` with categorized FAQs, search filter, and instant helpline contact actions. |
| UX states | 404 / Unknown Route | APPLICABLE_MISSING | `src/App.tsx` routes only `/` and `/admin`; unknown routes fall back to `/` without explaining. | Invalid URLs should render a styled 404 screen with safe navigation back to home. | Create `NotFoundPage.tsx` integrated into client route resolution. |
| UX states | 403 / Permission Denied | EXISTS_AND_ADEQUATE | `src/components/AdminGatePage.tsx`, `src/components/AuthModal.tsx` | PIN lock protects `/admin` from unauthorized attendees without leaking booking data. | Retained as working. |
| UX states | 500 / Unexpected Server Error | EXISTS_AND_ADEQUATE | `src/components/ErrorBoundary.tsx` | Catches runtime errors with friendly apology, safe error details, and Reload/Home buttons. | Retained as working. |
| UX states | Maintenance Mode | APPLICABLE_MISSING | `server.ts`, `src/App.tsx` | When system undergoes updates, a clean maintenance screen should gracefully inform attendees. | Create `MaintenanceModal` / screen toggleable via state or config. |
| UX states | Offline State | APPLICABLE_MISSING | Attendees navigating venue with poor cellular reception. | Attendees must know that cached QR passes remain valid and available for gate scanning offline. | Create `OfflineNoticeBanner` that monitors `navigator.onLine` and reassures attendees of local pass availability. |
| UX states | Empty State | EXISTS_NEEDS_IMPROVEMENT | `CartDrawer.tsx`, `AdminGatePage.tsx` search filters. | Empty cart and empty search results need clear icons and actionable CTAs. | Polish empty cart view and no-results search states. |
| UX states | No Search Results | EXISTS_AND_ADEQUATE | `src/components/AdminGatePage.tsx` (lines 610-630) | Shows query-specific feedback and reset button when search has 0 matches. | Retained as working. |
| UX states | Loading State | EXISTS_AND_ADEQUATE | `PaymentModal.tsx`, `BhojBotModal.tsx`, `TicketBookingSection.tsx` | Dedicated animated spinners and typing indicators throughout all async actions. | Retained as working. |
| UX states | Error State | EXISTS_AND_ADEQUATE | Form validation schemas (`validation.ts`), alert banners in modals. | Input sanitization, regex checks, and non-blocking toast notifications. | Retained as working. |
| UX states | Success State | EXISTS_AND_ADEQUATE | `CelebrationModal.tsx`, QR receipt cards, green confirmation badges. | Rich visual celebration, audio feedback, and booking codes. | Retained as working. |
| UX states | Session Expired | APPLICABLE_MISSING | `AdminGatePage.tsx` and Supabase auth sessions. | If admin or guest session expires, users should be informed cleanly with a re-authentication prompt. | Implement session expiration notification and prompt. |

---

## 2. Consolidated Missing Information (Unresolved Business/Legal Facts)

To maintain strict truthfulness without inventing facts:
- **Legal Entity Name**: Institute of Advanced Management (IAM), Kolkata (Academic Hospitality Institution).
- **Physical Address**: Salt Lake Sector V, Kolkata, West Bengal 700106.
- **Support & Privacy Email**: `ks7901424@gmail.com` (Verified in repository metadata and `FESTIVAL_INFO`).
- **Helpline Phone**: `+91 83340 55747` (Verified in `FESTIVAL_INFO`).
- **WhatsApp Support**: `+91 73659 28593` (Verified in `FESTIVAL_INFO`).
- **Ticket Price**: ₹349/- per Eco-Pass; Dessert Add-on ₹99/- (Verified in code).
- **Applicable Jurisdiction**: Kolkata, West Bengal, India (Digital Personal Data Protection Act, 2023 & Consumer Protection Act, 2019).
- **Third-Party Data Processors**: Supabase (Database & Auth), Firebase (Sync & Analytics), Vercel Analytics, Google Gemini API (AI Concierge).
- **Refund Terms**: Zero-waste non-refundable policy due to advance procurement of perishable heirloom ingredients; passes transferable upon written request to concierge.
