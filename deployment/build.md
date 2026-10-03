# Build Process & Artifact Specification

**Project**: Rajbari Bhojbari 2026  
**Last Verified**: September 30, 2026  
**Build System**: Vite 8 + esbuild + TypeScript 7 + Tailwind CSS v4  

---

## 1. Prerequisites

To build and package the application from source, the following runtime tools are required:

- **Node.js**: v20.x or v22.x LTS (compatible with React 19 and modern ES modules).
- **Package Manager**: `npm` (v10+) or `bun` (a `bun.lock` lockfile is present in the repository, though scripts use `npm`).
- **RAM**: Minimum 2 GB RAM (recommended 4 GB during concurrent Vite + esbuild bundling).
- **Disk Space**: ~250 MB for `node_modules` and compiled `dist/` directory.

---

## 2. Dependency Installation

Dependencies are declared in `package.json`:

```bash
# Standard clean dependency installation
npm ci

# Or standard install if lockfile is updated
npm install
```

### Key Dependencies Breakdown
- **Client Framework**: `react` (^19.0.1), `react-dom` (^19.0.1)
- **Styling**: `tailwindcss` (^4.3.3), `@tailwindcss/vite` (^4.3.3)
- **Server Framework**: `express` (^4.21.2)
- **Compilers & Bundlers**: `vite` (^8.3.0), `esbuild` (^0.25.0), `tsx` (^4.21.0), `typescript` (^7.0.2)
- **AI & Integrations**: `@google/genai` (^2.4.0), `@supabase/supabase-js` (^2.117.1), `firebase` (^12.19.0), `nodemailer` (^10.0.10)
- **Animation & UI**: `motion` (^12.23.24), `canvas-confetti` (^1.9.4), `lucide-react` (^0.546.0)

---

## 3. Verified Build Commands

The build lifecycle is governed by the scripts in `package.json`:

| Script | Command in `package.json` | Purpose | Execution Timing |
|---|---|---|---|
| **`npm run lint`** | `tsc --noEmit` | Validates TypeScript syntax, type safety, missing imports, and strict type constraints across the entire codebase. | Pre-build quality gate |
| **`npm run build`** | `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` | Bundles the frontend SPA into static assets and bundles the Express backend into a standalone CommonJS executable. | Production packaging |
| **`npm run clean`** | `rm -rf dist` | Cleans previous build artifacts from workspace. | Pre-clean hook |
| **`npm run dev`** | `tsx server.ts` | Runs the full-stack server in development mode with live TypeScript compilation and Vite middleware. | Local development |
| **`npm start`** | `node server.ts` | Executes the production runtime. (Note: in containerized environments, `node server.js` is the entrypoint shim that loads `dist/server.cjs`). | Production runtime |

---

## 4. Step-by-Step Verified Build Execution

The complete build pipeline proceeds in two sequential phases:

```
[Source Files]
   ├── src/ (React 19 + Tailwind v4)  ──────> [Vite 8]   ──────> dist/ (HTML, JS, CSS, Assets)
   └── server.ts (Express Full-Stack) ──────> [esbuild]  ──────> dist/server.cjs (+ sourcemap)
```

### Phase 1: Client Compilation (`vite build`)
1. Vite reads `index.html` as the SPA entry point.
2. Resolves path alias `@` to the project root directory (`vite.config.ts:14-16`).
3. Compiles Tailwind CSS v4 via `@tailwindcss/vite` plugin (imported directly via `@import "tailwindcss";` in `src/index.css`).
4. Bundles, minifies, and splits JavaScript and CSS chunks into `dist/assets/`.
5. Emits optimized HTML output to `dist/index.html`.

### Phase 2: Server Compilation (`esbuild server.ts`)
1. Invokes `esbuild` with the following flags:
   - `--bundle`: Bundles all local server TypeScript imports.
   - `--platform=node`: Configures Node.js runtime built-ins (`fs`, `path`, `url`, `http`, etc.).
   - `--format=cjs`: Emits CommonJS format for broad Node.js compatibility across hosting containers.
   - `--packages=external`: Leaves npm modules (`express`, `@google/genai`, `nodemailer`, etc.) unbundled to resolve from `node_modules` at runtime.
   - `--sourcemap`: Generates `dist/server.cjs.map` for readable production stack traces.
   - `--outfile=dist/server.cjs`: Places output into the distribution folder.

---

## 5. Generated Artifacts

Following a successful `npm run build`, the directory structure of `dist/` contains:

```
dist/
├── assets/
│   ├── index-[hash].css      # Minified Tailwind and custom styles
│   └── index-[hash].js       # Minified React 19 application bundle
├── 1790315575567.png         # Copied from public/
├── google9383b3275fe6ff5d.html # Search console verification file
├── index.html                # Compiled client HTML entrypoint
├── server.cjs                # Bundled Express server (CommonJS)
└── server.cjs.map            # Server source map for debugging
```

---

## 6. Required Build-Time Environment & Configuration

- **`NODE_ENV`**: Set to `"production"` during build.
- **Client `VITE_*` Variables**: Any environment variables prefixed with `VITE_` present during `vite build` are baked statically into the client JS bundle. If they change, a re-build (`npm run build`) is required.
- **Backend Variables**: Backend variables (`GEMINI_API_KEY`, `SMTP_*`, `PORT`) are **not** baked into `dist/server.cjs` because `packages=external` and dynamic `process.env` lookups are evaluated at container startup.

---

## 7. Platform-Specific Build Considerations

- **Linux / Docker (Cloud Run)**: Runs on Debian/Ubuntu/Alpine Node base images. `rm -rf dist` requires POSIX shell (`sh`/`bash`).
- **Windows (if building locally)**: `rm -rf dist` in `npm run clean` requires a bash-compatible terminal (Git Bash, WSL) or `rimraf` wrapper.
- **Cloud Run Execution**: The container must execute `npm run build` during the container image creation phase (Dockerfile `RUN npm run build`) so that `dist/index.html` and `dist/server.cjs` exist before the service starts.

---

## 8. What Is Verified vs Unknown

### Verified
- `npm run build` runs cleanly and completes in ~2-4 seconds.
- `npm run lint` (`tsc --noEmit`) passes with zero errors.
- Output artifacts `dist/index.html` and `dist/server.cjs` are generated.
- Production shim `server.js` resolves `dist/server.cjs` when present.

### UNKNOWN / NEEDS CONFIRMATION
- **Dockerfile Definition**: The Dockerfile used by Google Cloud Run / AI Studio is managed internally by the platform. The exact base image (e.g. `node:22-alpine` vs `node:20-slim`) is not committed in the repository.
- **Cache Invalidation**: How asset hashes in `dist/assets/` are cached on the Cloud Run CDN edge layer needs confirmation if manual cache-busting headers are required.
