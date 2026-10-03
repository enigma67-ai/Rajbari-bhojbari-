# Rollback Strategy & Recovery Procedures

**Project**: Rajbari Bhojbari 2026  
**Last Verified**: September 30, 2026  
**Status**: Manual recovery; automated pipeline rollbacks are **NOT** implemented in repository code  

---

## 1. Current Rollback Capability

The current codebase does **not** contain an automated continuous deployment or one-click rollback script within the repository itself. Rollback capability depends entirely on:

1. **Google Cloud Run Revision History** (Platform Managed).
2. **Git Version Control** (`git revert` / git checkout).
3. **Manual Supabase / Firestore Schema Restoration**.

### Capabilities Summary Table

| Layer | Rollback Mechanism | Automated in Repo? | Recovery Time Objective (RTO) |
|---|---|---|---|
| **Frontend & API Container** | Cloud Run Revision Traffic Switch | ❌ No (Manual in GCP Console / gcloud CLI) | ~1-2 minutes |
| **Git Codebase** | `git revert [COMMIT_SHA]` + Rebuild | ❌ No (Manual developer action) | ~3-5 minutes |
| **Database: Supabase (PostgreSQL)** | SQL DDL Scripts in Supabase Editor | ❌ No (Manual SQL execution) | Varies (Manual) |
| **Database: Firebase Firestore** | Firestore Rules redeployment | ❌ No (Manual rule rollback) | ~2 minutes |
| **Secrets / Environment** | Environment Variable re-configuration | ❌ No (Manual in GCP Console) | ~1 minute |

---

## 2. Previous-Version Recovery Process (Step-by-Step)

### Option A: Cloud Run Revision Traffic Shift (Fastest Production Recovery)
Google Cloud Run automatically stores immutable revisions for every deployed container image. If a newly deployed revision encounters runtime errors, traffic can be instantly rolled back to the last known good revision:

1. Open **Google Cloud Console** -> **Cloud Run** -> select service (`ais-pre-...` or `ais-dev-...`).
2. Go to the **Revisions** tab.
3. Identify the previous stable Revision ID (e.g. `rajbari-bhojbari-00042-abc`).
4. Click **Manage Traffic**.
5. Set `100%` traffic allocation to the previous stable revision.
6. Click **Save**. Traffic immediately shifts without rebuilding containers.

*Via Google Cloud CLI (if configured):*
```bash
# Shift 100% of incoming traffic to the previous healthy revision
gcloud run services update-traffic [SERVICE_NAME] \
  --region asia-southeast1 \
  --to-revisions [PREVIOUS_REVISION_NAME]=100
```

---

### Option B: Code-Level Rollback via Git
If a bad build was pushed to the source branch:

1. Identify the failing commit:
   ```bash
   git log --oneline -n 5
   ```
2. Create a clean revert commit:
   ```bash
   git revert HEAD --no-edit
   ```
3. Verify syntax and compilation locally:
   ```bash
   npm run lint
   npm run build
   ```
4. Push the revert commit to trigger the platform builder:
   ```bash
   git push origin main
   ```

---

## 3. Database Migration Considerations & Compatibility

### A. Supabase PostgreSQL
- **Current State**: The repository does **not** utilize an automated migration runner (such as Prisma, Drizzle, or Flyway). The SQL schema is documented in comments within `src/lib/supabase.ts` (lines 14-85).
- **Breaking Changes Risk**:
  - The tables (`public.users`, `public.bookings`, `public.user_logins`, `public.visitor_analytics`) rely on non-null columns such as `customer_name`, `customer_email`, and `total_amount`.
  - If a column is dropped or renamed in a new release, rolling back the application container to an older version that expects the old column will trigger database query errors (`column does not exist`).
- **Required Rollback Precaution**:
  - Always maintain backwards compatibility: Never rename or drop columns in the same release as code changes. Use additive schema changes only.
  - If a destructive table change was applied manually in Supabase, execute a compensating SQL query in the Supabase SQL Editor.

### B. Firebase Firestore
- **Current State**: Firestore is a schemaless NoSQL document store. Collections are defined declaratively in `firebase-blueprint.json` and secured by `firestore.rules`.
- **Rules Rollback**:
  - If a newly deployed `firestore.rules` blocks legitimate client reads/writes (e.g. `permission-denied` on `/tickets/{ticketId}`), roll back the rules file and re-deploy via the Firebase CLI:
    ```bash
    firebase deploy --only firestore:rules
    ```

---

## 4. Configuration & Secrets Rollback

If a bad environment variable breaks runtime execution (e.g. invalid `SMTP_HOST`, corrupted `VITE_SUPABASE_ANON_KEY`, or invalid `VITE_ADMIN_PASSWORD`):

1. **Gate Staff Admin Password**:
   - The password defaults to `K246790` in source code (`AdminGatePage.tsx:87`, `AuthModal.tsx:86`).
   - If an invalid `VITE_ADMIN_PASSWORD` was injected into the environment, removing the override immediately restores the verified operational PIN `K246790`.
2. **Email Credentials**:
   - If `SMTP_PASS` or `SMTP_USER` causes connection timeouts, clearing them causes `server.ts` to automatically fall back to simulation preview mode (`server.ts:830-845`) without crashing or blocking ticket generation.

---

## 5. Deployment Failure Recovery Checklist

When a deployment fails health checks:

- [ ] **Step 1: Check Container Health Probes**
  ```bash
  curl -i https://[APP_URL]/health
  ```
  If this returns 502/503 or fails to respond, inspect Cloud Run runtime logs for crash stack traces (e.g. port binding or missing module errors).
- [ ] **Step 2: Inspect Cloud Run Logs**
  Look for:
  - `Error: Cannot find module '.../dist/server.cjs'` -> indicates `npm run build` was omitted.
  - `EADDRINUSE` -> indicates duplicate port binding.
- [ ] **Step 3: Trigger Traffic Fallback**
  Route traffic to the previous healthy revision via GCP Console as documented in Option A above.
- [ ] **Step 4: Verify Admin Terminal**
  Test `/admin` with `K246790` to ensure gate check-in remains functional for on-site staff.

---

## 6. What Is NOT Implemented (Explicit Gaps)

The following capabilities are **NOT** currently implemented in this project:

- ❌ **Automated Canary Deployments**: No progressive rollout (e.g. 10% -> 50% -> 100%) configured in repository files.
- ❌ **Automated Rollback Triggers**: No automated Cloud Monitoring alerting that triggers a rollback when HTTP 5xx error rate spikes.
- ❌ **Database Down-Migration Scripts**: No automated `down.sql` or rollback migrations exist for Supabase.
- ❌ **Backup / Snapshot Automation**: Automated point-in-time database snapshots must be configured manually inside Supabase and Firebase console dashboards.
