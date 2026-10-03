# Production Release Checklist

**Project**: Rajbari Bhojbari 2026  
**Audience**: Release Engineers, QA Auditors & Gate Operations Staff  
**Last Verified**: September 30, 2026  

---

## 1. Code & Build Validation

- [ ] **Clean Lint & Type Check**:
  Run `npm run lint` (`tsc --noEmit`) to verify zero TypeScript errors, unresolved imports, or broken type signatures.
- [ ] **Clean Production Build**:
  Run `npm run build` and verify that both phases succeed:
  - `dist/index.html` and `dist/assets/*.js` generated via Vite.
  - `dist/server.cjs` and `dist/server.cjs.map` generated via esbuild.
- [ ] **Clean Artifact Verification**:
  Ensure no temporary debug files, `.env` files, or test outputs are accidentally packaged into `dist/`.
- [ ] **Git Working Tree**:
  Ensure working directory is clean (`git status` clean) with all release changes committed.

---

## 2. Environment Configuration & Secrets

- [ ] **Admin Gate Password**:
  Confirm that `VITE_ADMIN_PASSWORD` is configured properly or verify that the operational default `K246790` is accepted for staff terminal check-in.
- [ ] **Platform Secrets Injected**:
  Verify `GEMINI_API_KEY` is present in Cloud Run / AI Studio secrets vault.
- [ ] **Email Delivery Credentials**:
  If live attendee ticket emails are required, verify `SMTP_USER` and `SMTP_PASS` (or SendGrid key) are configured and do not contain placeholder strings (`PASTE_YOUR`). If left empty, verify that simulation preview mode is intended.
- [ ] **EmailJS Keys (Client)**:
  Verify `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` in environment.
- [ ] **Supabase Client Credentials**:
  Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set to valid live Supabase credentials (not the mock development key).

---

## 3. Database Changes & Compatibility

- [ ] **Supabase Tables Intact**:
  Verify the following tables exist and are active in the target Supabase project:
  - `public.users` (profiles & karma)
  - `public.bookings` (purchases & gate passes)
  - `public.user_logins` (authentication audit logs)
  - `public.visitor_analytics` (event tracking)
- [ ] **Non-Breaking Schema Verification**:
  Confirm no required columns have been removed or renamed that would cause errors if an older container version runs.
- [ ] **Firestore Rules Verification**:
  If `firestore.rules` has changed, confirm rules allow read/write access to `/tickets/{ticketId}` and `/users/{userId}` without security regressions.
- [ ] **Database Backup**:
  Take a point-in-time snapshot or export backup of `public.bookings` in the Supabase Dashboard prior to deploying schema modifications.

---

## 4. API & Frontend/Backend Compatibility

- [ ] **Health Endpoint Routing**:
  Verify `/health`, `/_health`, and `/api/health` return HTTP 200 with JSON payloads.
- [ ] **API 404 Guard**:
  Verify that non-existent API routes (`/api/unknown-route`) return a 404 JSON response and do **not** fall through to the HTML index page.
- [ ] **Port Configuration**:
  Verify that the server listens dynamically on `process.env.PORT` (port 8080 on Cloud Run) and not exclusively on port 3000.
- [ ] **CORS / Content Security**:
  Confirm third-party asset domains (`api.qrserver.com`, `checkout.razorpay.com`, `i.postimg.cc`) are permitted to load images and scripts.

---

## 5. Pre-Release Smoke Testing (Core User Journeys)

Execute manual smoke testing on the target staging or release candidate environment:

- [ ] **Journey 1: Festival Landing & Menu**:
  - Landing page loads with Rajbari banner, 19th-century branding, and the 4 Mohol menu sections.
  - Pricing displays correctly (₹349 Base Eco-Pass, ₹99 Dessert Platter, ₹0 Tasting Counter).
- [ ] **Journey 2: Bhoj-Bot AI Concierge**:
  - Floating Bhoj-Bot mascot button opens the concierge modal.
  - Asking a culinary question returns a courteous, context-aware Bengali gastronomy recommendation.
- [ ] **Journey 3: Pass Booking & UPI Payment**:
  - Step 1: Guest details (Name, Phone, Email) accept valid input and enforce 10-digit phone regex and DPDP consent.
  - Step 2: Meal customization (Starter, Mains, Complimentary tasting counter items, optional dessert).
  - Step 3: HDFC SmartHub Vyapar QR code renders with TID `62903194`.
  - Step 4: Entering a valid 12-digit numeric UTR triggers verification and generates the booking confirmation card with a scannable QR pass.
- [ ] **Journey 4: Gate Staff Admin Terminal (`/admin`)**:
  - Navigate to `/admin`.
  - Enter Staff PIN: `K246790`.
  - Confirm booking KPI cards render (Total Bookings, Admitted at Gate, Pending Entry).
  - Open Ticket Scanner Modal and verify camera permission prompt or manual ticket ID entry.
  - Check that search filtering works cleanly and shows empty state when zero results match.
- [ ] **Journey 5: Legal & Policy Modals**:
  - Open Privacy Policy, Terms of Service, Refund Policy, and Cookie Preferences from footer or hash deep-links (`#privacy`, `#terms`, `#refund`).
  - Verify all modal tabs open with authentic event details.
- [ ] **Journey 6: Offline Resilience**:
  - Disconnect network / switch browser to offline mode.
  - Verify `OfflineNoticeBanner` displays and allows opening cached passes.

---

## 6. Logs, Monitoring & Telemetry

- [ ] **Cloud Run Error Logs**:
  Monitor Cloud Run logs during startup for unhandled promise rejections or missing module errors.
- [ ] **Vercel Analytics / Clarity**:
  Verify analytics beacons are sent without throwing client-side JavaScript console errors.
- [ ] **Email Dispatch Logs**:
  Check server console output during a test booking to confirm whether email was sent via live SMTP or logged in simulation preview mode.

---

## 7. Rollback Readiness

- [ ] **Known Stable Revision Identified**:
  Record the current active Cloud Run Revision ID in release notes before routing traffic to the new revision.
- [ ] **Compensating Script Prepared**:
  If database changes are included, have the corresponding compensating SQL script ready to execute in Supabase SQL editor.
- [ ] **Emergency Contact**:
  Confirm on-duty engineering contact is available during the release window.
