# Environment Configuration & Specifications

**Project**: Rajbari Bhojbari 2026 (IAM Kolkata Zero-Waste AI Food Fest)  
**Last Verified**: September 30, 2026  
**Status**: Verified against repository code, manifests, and runtime metadata  

---

## 1. Verified Environments

Based on repository inspection, runtime URLs in metadata, and `server.ts` configuration, the application operates across the following tiers:

| Environment | Host / Runtime | Verified URL / Port | Purpose & Configuration |
|---|---|---|---|
| **Local / Dev Sandbox** | Node.js (v20+ / v22+) via `tsx server.ts` | `http://localhost:3000` / `http://0.0.0.0:3000` | Local developer and AI Studio interactive sandbox. Runs Express with Vite in `middlewareMode` (`server.ts` lines 981-995). HMR client port configured to 443 with WSS for cloud proxy compatibility. |
| **Development Cloud Run** | Google Cloud Run (`asia-southeast1`) | `https://ais-dev-rdsjv4jp2hdzb22j7intmu-849396732859.asia-southeast1.run.app` | Active development preview deployed via AI Studio. Serves compiled assets or runs with development flags. Injected with platform secrets. |
| **Shared / Staging Cloud Run** | Google Cloud Run (`asia-southeast1`) | `https://ais-pre-rdsjv4jp2hdzb22j7intmu-849396732859.asia-southeast1.run.app` | Pre-release shared testing URL for stakeholders, committee review, and simulated payment passes. |
| **Production Tier** | Containerized Node.js on Cloud Run | Port resolved from `process.env.PORT` (defaults to `8080`) | Serves pre-built Vite client from `dist/` and bundled CommonJS backend from `dist/server.cjs` via entrypoint shim `server.js`. |

---

## 2. Environment Variables & Configuration Matrix

Variables are categorized by whether they are consumed on the **Backend (Node.js/Express)**, **Frontend (Vite/Client Bundle)**, or **Platform Injected**.

### A. Backend Variables (`server.ts`, `server.js`)

| Variable | Type / Default | Purpose | Verified Status |
|---|---|---|---|
| `NODE_ENV` | `string` (`"production"` \| `"development"`) | Sets runtime optimization mode. When set to `"production"`, Express serves pre-built static files from `dist/`. When not set or development, Vite `middlewareMode` is activated. | Verified in `server.js:6`, `server.ts:12-15`. |
| `PORT` | `number` (Dev: `3000`, Prod: `8080`) | Port listener for HTTP server. In production, Cloud Run injects `PORT=8080`. Local dev uses `3000`. | Verified in `server.ts:18`. |
| `GEMINI_API_KEY` | `string` (Secret) | Google Gemini API key used by backend client (`GoogleGenAI` in `server.ts:28-39`) to serve `/api/gemini/chat` and `/api/recommend-plates`. Injected by platform from user secrets. | Verified in `server.ts:28`, `.env.example:4`. |
| `APP_URL` | `string` | Base hosting URL of the application. Injected by Cloud Run for self-referential redirects and asset generation. | Verified in `.env.example:9`. |
| `SMTP_HOST` | `string` (`"smtp.gmail.com"`) | SMTP server hostname for Nodemailer automated ticket pass email delivery. | Verified in `server.ts:780`, `.env.example:20`. |
| `SMTP_PORT` | `number` (`587`) | SMTP port (465 for SSL, 587 for STARTTLS). | Verified in `server.ts:781`, `.env.example:21`. |
| `SMTP_USER` | `string` (Secret) | Authenticated username / email for sending transactional tickets. | Verified in `server.ts:784`, `.env.example:22`. |
| `SMTP_PASS` | `string` (Secret) | App password or SMTP secret. If empty or containing `"PASTE_YOUR"`, backend falls back to simulated email preview without failing. | Verified in `server.ts:785`, `server.ts:791-797`. |
| `EMAIL_FROM` | `string` | Display sender name and email header (e.g. `Rajbari Bhojbari Food Fest <fest@iam.ac.in>`). | Verified in `server.ts:786`, `.env.example:24`. |
| `SENDGRID_API_KEY` | `string` (Secret) | SendGrid fallback key for transactional email dispatch. | Verified in `.env.example:27`. |

### B. Frontend Variables (`src/`, bundled at build time via `import.meta.env`)

*Note: Vite requires the `VITE_` prefix for client-accessible variables.*

| Variable | Default Fallback in Code | Purpose | Verified Status |
|---|---|---|---|
| `VITE_ADMIN_PASSWORD` | `"K246790"` | Operational PIN for Gate Staff Admin Terminal check-in (`/admin`). Checked in `AdminGatePage.tsx:87` and `AuthModal.tsx:86`. | Verified in `AdminGatePage.tsx`, `AuthModal.tsx`. |
| `VITE_SUPABASE_URL` | `"https://rrvjsyppggtthqfxvquq.supabase.co"` | Supabase project API gateway endpoint for authentication, guest records, and bookings sync. | Verified in `src/lib/supabase.ts:94-95`. |
| `VITE_SUPABASE_ANON_KEY` | Fallback mock JWT anon key | Public anon key for Supabase client initialization. | Verified in `src/lib/supabase.ts:97-98`. |
| `VITE_GEMINI_API_KEY` | Optional / Empty | Frontend direct fallback for `BhojBotModal.tsx` when client initiates browser-side Gemini calls. | Verified in `BhojBotModal.tsx`. |
| `VITE_EMAILJS_SERVICE_ID` | `"service_b9a7jvb"` | Client-side EmailJS service identifier for instant pass emailing. | Verified in `.env.example:41`, `confirmationEmailService.ts`. |
| `VITE_EMAILJS_TEMPLATE_ID` | `"template_zkrj4e8"` | Client-side EmailJS template identifier. | Verified in `.env.example:42`, `confirmationEmailService.ts`. |
| `VITE_EMAILJS_PUBLIC_KEY` | `"k5ATfv--D0jJo2aUM"` | Client-side EmailJS public API key. | Verified in `.env.example:43`, `confirmationEmailService.ts`. |
| `VITE_RAZORPAY_KEY_ID` | `"rzp_test_PASTE_YOUR_API_KEY_HERE"` | Public Razorpay key ID for drop-in checkout modal script. | Verified in `paymentGateway.ts:16-18`. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `"pk_test_PASTE_YOUR_STRIPE_KEY_HERE"` | Optional Stripe publishable key. | Verified in `paymentGateway.ts:22-24`. |
| `VITE_PAYPAL_CLIENT_ID` | `"PASTE_YOUR_PAYPAL_CLIENT_ID_HERE"` | Optional PayPal client ID. | Verified in `paymentGateway.ts:28-30`. |
| `VITE_CLARITY_PROJECT_ID` | `"PASTE_YOUR_CLARITY_PROJECT_ID_HERE"` | Microsoft Clarity visitor analytics project token. | Verified in `index.html:33`. |

---

## 3. Configuration Differences Between Environments

| Feature / Behavior | Development (`npm run dev`) | Production (`npm run build` + `npm start`) |
|---|---|---|
| **Server Engine** | `tsx server.ts` | `node server.js` -> executes `dist/server.cjs` |
| **Vite Integration** | Middleware mode inside Express (`app.use(vite.middlewares)`) | Static asset serving (`express.static(distPath)`) with SPA catch-all |
| **Port Binding** | `3000` (forced by dev environment rules) | `process.env.PORT` or `8080` |
| **HMR** | Disabled / Suppressed in client proxy (`vite.config.ts`, `index.html`) | Not applicable (static files) |
| **Source Maps** | On-the-fly TS transpilation | Inline / external `.map` via esbuild and Vite bundle |
| **Email Dispatch** | Simulates and logs delivery payloads if SMTP unconfigured | Attempts live SMTP dispatch; gracefully logs and returns simulated payload if credentials absent |
| **Admin Password** | Evaluates `VITE_ADMIN_PASSWORD` or fallback `K246790` | Evaluates `VITE_ADMIN_PASSWORD` or fallback `K246790` |

---

## 4. Secrets Handling & Storage

1. **Platform Managed Secrets**:
   - `GEMINI_API_KEY`: Injected directly into the runtime container by the AI Studio platform. Never exposed to git or static client bundles.
2. **Environment Files**:
   - `.env` and `.env.local` are explicitly ignored in `.gitignore:7` (`.env*`, `!.env.example`).
   - `.env.example` contains sanitised placeholders for developer onboarding.
3. **Hardcoded Fallbacks in Repository**:
   - `src/lib/firebase.ts` loads public Firebase configuration from `firebase-applet-config.json` (Public API key, Project ID, App ID). This is standard for Firebase client SDKs.
   - `src/lib/supabase.ts` contains fallback project URL and placeholder anon key to prevent runtime instantiation crashes when unconfigured.
   - `AdminGatePage.tsx` and `AuthModal.tsx` define operational fallback PIN `K246790`.

---

## 5. Required External Services & Dependencies

1. **Google Cloud Run**: Container execution runtime.
2. **Firebase Firestore & Auth**:
   - Project: `neat-yolk-xpthm`
   - Database ID: `ai-studio-rajbaribhojbari-f8655d74-e2c5-47b7-ac5a-607e29aa312a`
   - Governed by: `firestore.rules` and `firebase-blueprint.json`
3. **Supabase PostgreSQL & Auth**:
   - Endpoint: `https://rrvjsyppggtthqfxvquq.supabase.co`
   - Tables: `public.users`, `public.bookings`, `public.user_logins`, `public.visitor_analytics`
4. **Google Gemini API**:
   - Models: `@google/genai` (Gemini 2.5/3 Flash) for concierge recommendations and Bhoj-Bot dialogue.
5. **QR Code Generator API**:
   - `https://api.qrserver.com/v1/create-qr-code/` for dynamic digital pass issuance.
6. **Vercel Analytics**:
   - Injected in `src/main.tsx` (`@vercel/analytics/react`).

---

## 6. What Is Verified vs Unknown

### Verified
- Exact port assignments (3000 for dev, 8080/PORT for production).
- Fallback admin authentication logic (`K246790`).
- Dual-mode Vite middleware vs pre-built static distribution.
- All environment variable names referenced in `server.ts`, `src/lib/supabase.ts`, `src/utils/paymentGateway.ts`, and `.env.example`.
- In-memory mock fallbacks for payments, OTPs, and email preview when external gateways are unconfigured.

### UNKNOWN / NEEDS CONFIRMATION
- **Live SMTP Server Credentials**: Current repo uses placeholder `"PASTE_YOUR_EMAIL_HERE@gmail.com"` in `.env.example`. Real production credentials need confirmation by project administrator if live emails are required.
- **Supabase Production Anon Key**: The fallback key in `src/lib/supabase.ts:98` is a mock development JWT (`...mock_key`). Confirmation is needed whether live Supabase production keys are injected via Cloud Run environment settings.
- **Custom Domain & DNS**: Whether a custom domain (e.g. `rajbaribhojbari.iam.ac.in`) will be mapped to the Cloud Run service via Cloud DNS / Firebase Hosting.
