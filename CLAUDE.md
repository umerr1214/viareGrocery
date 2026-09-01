# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Viare Grocery is an AI-powered in-store shopping assistant built as a hackathon project (Remote Base Hackathon 3.0). It has two independent apps in this monorepo, each with its own `package.json` and `node_modules`:

- `mobile-app/` — React Native (Expo) client
- `bakend-api/` — Express.js backend (note the directory name is misspelled "bakend", not "backend")

The root `package.json` only holds a couple of stray dependencies (`@react-native-firebase/*`, `react-native-linear-gradient`) and is not a workspace root — always `cd` into `mobile-app/` or `bakend-api/` before running npm commands.

## Commands

### Backend (`bakend-api/`)
```
npm install
npm start        # node index.js
npm run dev       # nodemon index.js (auto-restart)
npm run seed      # node scripts/seedAisleMap.js — seeds Firestore aisle map
```
No test suite or linter is configured (`npm test` / `npm run lint` are stubs that no-op). There is no single-test command.

Requires a `.env` in `bakend-api/` with `GEMINI_API_KEY` (required — the process exits at startup if missing), plus `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` for Firestore access. Server listens on `PORT` (default 3001). **Currently the backend is run on port 3000** (set via `PORT=3000` in `.env`); all mobile-app endpoints are configured to match.

### Mobile app (`mobile-app/`)
```
npm install
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
```
Same story on tests/lint — both are no-op stubs.

## Architecture

### Backend request flow
`bakend-api/index.js` wires up Express with `cors`, JSON/urlencoded body parsing, and a shared `multer` memory-storage upload config (5 files max, 10MB each, jpeg/png/webp only). Three route groups exist, but **not all are mounted**:
- `/api/path` → `routes/pathoptimizer.js` (mounted)
- `/api/alternatives` → `routes/alternativeSearch.js` (mounted)
- `routes/suggestRoute.js` exists but is **not mounted** in `index.js` (dead code); the active `/api/suggest-direct` endpoint is defined inline in `index.js` and **now genuinely calls `getGeminiResponse`** (an earlier version returned a hardcoded demo response — that is fixed).

Errors from any route should call `next(err)` to reach the shared `middleware/errorHandler.js`. Request validation lives in `middleware/validation.js` (`validateProducts`, `validateImageUpload`, `validateAlternativeSearch`).

### Path optimization
`routes/pathoptimizer.js` looks up each requested product's aisle via a `productToAisleMap` document read from Firestore (`storeMaps/demoStore`), then calls `utils/dijkstra.js`'s `findShortestPath(graphData, start, stops, end)` against the static store layout in `data/storeGraph.json` (nodes/edges with weights). Despite the "dijkstra" filename, the implementation is brute-force: it tries every permutation of the stop aisles (via BFS between each pair) and keeps the shortest total — fine for the handful of aisles here, but exponential in stop count. `data/productToAisleMap.json` is the same map seeded into Firestore by `scripts/seedAisleMap.js` (and the other `scripts/seed*.js` files seed brands/categories); it's the source of truth for local reference even though the live route reads from Firestore, not the JSON file directly.

### Gemini integration
Two different call styles coexist:
- `utils/gemini.js` uses the `@google/generative-ai` SDK (`getGeminiResponse`) — used by the unmounted `suggestRoute.js`.
- `routes/alternativeSearch.js` calls the Gemini REST API directly via `node-fetch` (text or vision endpoint chosen based on whether an `image` field is present), reading the URL/key from `config/environment.js`.

`config/environment.js` is the single place backend env vars and Gemini API URLs are resolved; both integration styles pull from it.

### Firebase (backend)
`firebase/firestoreService.js` lazily initializes `firebase-admin` from the three `FIREBASE_*` env vars (private key `\n` sequences need un-escaping) and exports the Firestore `db` instance directly — other modules `require` this rather than re-initializing.

### Mobile app structure
- `App.js` / `navigation/AppNavigator.js` — a single native-stack navigator; `Login` is the initial route, followed by `Signup`, `Welcome`, `PathScreen`, `Recommend`, `AlternativeScreen`, `SuggestionScreen`.
- `firebase/firebaseConfig.js` — client-side Firebase init (Auth) using values from `config/environment.js`, which hardcodes dev/production Firebase project keys and picks between them via `__DEV__`. `config/environment.js`'s `apiBaseUrl` is currently `http://192.168.18.140:3000` (the dev machine's LAN IP, port 3000).
- `services/apiService.js` — the single HTTP client to the backend (`fetch` with `AbortController` timeout), reading `apiBaseUrl` from `config/environment.js`. All backend calls **should** go through this (`getOptimizedPath`, `getAlternatives`, `getSuggestions`) rather than calling `fetch` ad hoc from screens.
- `screens/*` — one component per stack route; `PathScreen` renders the optimized path/instructions from `/api/path`, `AlternativeScreen` and `SuggestionScreen` drive the Gemini-backed endpoints.

### Data flow summary
Mobile screens → `apiService` → Express routes → (Firestore for aisle/store data, Gemini API for AI analysis) → JSON response back to the screen.

## Known issues & cleanup suggestions

### Hardcoded backend URLs in screens (tech debt)
As of the port migration to 3000, the backend URL was updated in **four places** and is hardcoded in each:
- `screens/PathScreen.js` → `fetch('http://192.168.18.140:3000/api/path')`
- `screens/SuggestionScreen.js` → `fetch('http://192.168.18.140:3000/api/suggest-direct')` (also duplicated in a `console.log`)
- `screens/AlternativeScreen.js` → `fetch('http://192.168.18.140:3000/api/alternatives')`
- `config/environment.js` → `apiBaseUrl`

**Suggestion:** refactor the three screens to call `services/apiService.js` (`getOptimizedPath`, `getSuggestions`, `getAlternatives`) so the URL lives in exactly one place (`config/environment.js`'s `apiBaseUrl`). The LAN IP (`192.168.18.140`) changes whenever the router reassigns the dev machine's address — when that happens and the app throws `TypeError: Network request failed`, run `ipconfig`, then update the IP in all four locations above (or finish the apiService refactor and update only one).

Notes while testing:
- Physical-device testing requires phone and PC on the same Wi-Fi; `localhost` in `apiBaseUrl` only works for Expo web.
- `SuggestionScreen.js` manually sets `'Content-Type': 'multipart/form-data'` on its `FormData` request. If image uploads fail on web, remove that header — the boundary is generated automatically.
- `bakend-api/index.js` requires `./routes/pathOptimizer` but the file is named `pathoptimizer.js` (lowercase `o`). Windows resolves this case-insensitively; it will crash on a Linux deploy — fix the require to lowercase.
- `AlternativeScreen.js` reads `categoryBrands` directly via the client Firestore SDK; if Firestore security rules deny the read (`Missing or insufficient permissions`), the screen silently falls back to a hardcoded category list. Allow reads on `categoryBrands` in the Firebase Console rules to use seeded data.
