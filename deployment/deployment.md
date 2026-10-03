# Deployment Guide & Architecture

**Project**: Rajbari Bhojbari 2026  
**Last Verified**: September 30, 2026  
**Target Platform**: Google Cloud Run (Containerized Node.js Full-Stack)  

---

## 1. Actual Deployment Architecture

The application is architected as a containerized full-stack Node.js Express service serving both a React 19 Single Page Application and a REST API layer:

```
                          [User Web Browser]
                                  │
                                  ▼ (HTTPS: 443)
              [Google Cloud Run Load Balancer / Edge]
                                  │
                                  ▼ (Port 8080 / process.env.PORT)
            ┌───────────────────────────────────────────────┐
            │               Node.js Container               │
            │                                               │
            │  Entrypoint: server.js                        │
            │      └── dist/server.cjs (Express Backend)    │
            │                                               │
            │  Routes:                                      │
            │   ├── /health, /_health, /api/health          │
            │   ├── /api/gemini/chat                        │
            │   ├── /api/tickets/*                          │
            │   ├── /api/payments/*                         │
            │   ├── /api/auth/*                             │
            │   ├── /api/feedback/*                         │
            │   ├── /api/contact/*                          │
            │   └── /* ──> dist/index.html (SPA Fallback)   │
            └───────────────┬───────────────────────────────┘
                            │
       ┌────────────────────┼─────────────────────┐
       ▼                    ▼                     ▼
[Google Gemini API]    [Firebase Firestore]   [Supabase PostgreSQL]
(AI Concierge)         ( neat-yolk-xpthm )    ( rrvjsyppggtthqfxvquq )
```

---

## 2. Deployment Prerequisites

Before deploying to the hosting target:

1. **Target Cloud Platform**: Google Cloud Project configured with Cloud Run API enabled.
2. **Platform Secrets**: `GEMINI_API_KEY` configured in the project secrets vault.
3. **Build Artifacts**: Clean build completed (`npm run lint` followed by `npm run build`). Both `dist/index.html` and `dist/server.cjs` must be present.
4. **Environment Variables**:
   - `PORT`: Set by Cloud Run container manager (defaults to `8080`).
   - `NODE_ENV`: Set to `"production"`.
   - `VITE_ADMIN_PASSWORD`: Configured to `K246790` (or injected override).

---

## 3. Exact Verified Deployment Steps

### Method A: Automated Platform Deployment (Google AI Studio / Cloud Run)
1. The platform automatically triggers a rebuild when code changes are committed.
2. Dependencies are installed (`npm ci`).
3. Build command runs:
   ```bash
   npm run build
   ```
4. The container image is packaged with the built `dist/` directory.
5. Container starts with:
   ```bash
   node server.js
   ```
   *Note: `server.js` verifies the presence of `dist/server.cjs` and dynamically imports it using `pathToFileURL` to ensure reliable ESM resolution (`server.js:8-14`).*
6. Cloud Run performs liveness and readiness probe checks on `/health` or `/_health`.
7. Once healthy, traffic is routed to the new revision.

### Method B: Manual Docker Container Deployment (Reference)
If creating a standalone Docker container for self-hosting:

```dockerfile
# 1. Base Image
FROM node:22-alpine AS runner
WORKDIR /app

# 2. Install dependencies & build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run lint
RUN npm run build

# 3. Environment & Port
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# 4. Start command
CMD ["node", "server.js"]
```

```bash
# Build and run commands
docker build -t rajbari-bhojbari:latest .
docker run -p 8080:8080 -e GEMINI_API_KEY="your-api-key" rajbari-bhojbari:latest
```

---

## 4. Services Involved

| Service Name | Provider | Responsibility | Communication Protocol |
|---|---|---|---|
| **Cloud Run Web Service** | Google Cloud Platform | Hosts the Express HTTP server, routes API requests, serves static bundle | HTTPS (port 443 incoming, port 8080 container) |
| **Firestore Database** | Google Firebase (`neat-yolk-xpthm`) | Stores bookings, tickets, and feedback documents | HTTPS / gRPC with auto-detected long polling |
| **Supabase PostgreSQL** | Supabase (`rrvjsyppggtthqfxvquq`) | Records purchases, guest user logins, and analytics audit | HTTPS REST (`/rest/v1`) & Realtime |
| **Google Gemini API** | Google Cloud / GenAI | Generates conversational recommendations and festival advice | HTTPS (`generativelanguage.googleapis.com`) |
| **QR Code Server** | Open Source (`api.qrserver.com`) | Dynamic rendering of QR code PNGs for digital event passes | HTTPS GET |
| **Vercel Analytics** | Vercel | Anonymous page view and performance metrics | HTTPS beacon (`/_vercel/insights`) |

---

## 5. Health & Verification Steps

Following deployment, execute these verification checks in order:

### 1. HTTP Liveness & Readiness Probes
```bash
# General health probe (used by Cloud Run)
curl -s -i https://[YOUR_APP_URL]/health
# Expected: HTTP 200 OK
# Body: {"status":"ok","timestamp":"..."}

# API specific health probe
curl -s -i https://[YOUR_APP_URL]/api/health
# Expected: HTTP 200 OK
# Body: {"status":"ok","fest":"RAJBARI BHOJBARI 2026","time":"..."}
```

### 2. Static Asset Delivery Check
```bash
# Check that index.html returns valid HTML and not a blank error
curl -s -I https://[YOUR_APP_URL]/
# Expected: HTTP 200 OK with content-type: text/html

# Check that hashed assets in dist/assets/ are accessible
curl -s -I https://[YOUR_APP_URL]/assets/iam-chef-logo.svg
# Expected: HTTP 200 OK
```

### 3. API 404 Guard Verification
```bash
# Verify that non-existent API routes return 404 JSON, NOT index.html
curl -s https://[YOUR_APP_URL]/api/non-existent-route
# Expected: HTTP 404 Not Found
# Body: {"error":"API route not found: GET /api/non-existent-route"}
```

### 4. Admin Gate Terminal Authentication Check
1. Navigate to `https://[YOUR_APP_URL]/admin`.
2. Enter the Gate Staff PIN: `K246790`.
3. Verify that the staff verification dashboard renders with booking KPIs and the live scanner modal.

---

## 6. Common Deployment Failure Points Found in the Project

| Issue / Failure Mode | Cause | Observed Mitigation in Code |
|---|---|---|
| **Missing `dist/server.cjs`** | Running `npm start` before running `npm run build`. `server.js` tries to fall back to `./server.ts`, which Node cannot execute natively without `tsx`. | Ensure the build pipeline always runs `npm run build` before container packaging. |
| **Cloud Run Port Mismatch** | Listening on hardcoded port 3000 in production instead of reading `process.env.PORT`. | Mitigated in `server.ts:18` (`const PORT = isProduction ? (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080) : 3000`). |
| **In-Memory Store Loss on Scale-Down** | Cloud Run scales containers to 0 instances when idle. When scaled back up, in-memory Maps (`bookingsStore`, `otpStore`) reset. | Persistent state must rely on Supabase (`public.bookings`) and Firebase Firestore, not in-memory memory maps. |
| **WebSocket HMR Reconnection Errors** | Vite dev server attempting HMR through Cloud Run reverse proxy. | Suppressed in `index.html:40-69` (event listeners prevent browser unhandled rejection modals for `WebSocket`/`vite:ws`). |
| **API Route Catch-all Collisions** | SPA catch-all `app.get("*", ...)` catching failed API calls and returning `index.html` with 200 OK instead of a 404 JSON error. | Mitigated in `server.ts:975-978` (`app.all("/api/*", ...)` explicitly intercepts unmatched API routes). |

---

## 7. What Is Verified vs Unknown

### Verified
- Exact Cloud Run service endpoints from metadata.
- Health check endpoints (`/health`, `/_health`, `/api/health`).
- Production entrypoint logic in `server.js` and `server.ts`.
- Exact port resolution order (`PORT` env var -> `8080` -> `3000`).

### UNKNOWN / NEEDS CONFIRMATION
- **Autoscaling Boundaries**: Minimum and maximum Cloud Run container instance count (e.g. `min-instances=0` vs `min-instances=1`) is configured outside the repository in GCP Cloud Run console.
- **CPU Allocation**: Whether CPU is always allocated or only allocated during request processing.
