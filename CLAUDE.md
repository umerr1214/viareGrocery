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

Requires a `.env` in `bakend-api/` with `GEMINI_API_KEY` (required — the process exits at startup if missing), plus `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` for Firestore access. Server listens on `PORT` (default 3001).

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
- `routes/suggestRoute.js` exists but is **not mounted** in `index.js`; the currently-active `/api/suggest-direct` endpoint is defined inline in `index.js` and returns a **hardcoded** demo response rather than calling Gemini — the real prompt is built but unused. If you need to make product-suggestion actually call Gemini, either swap in `suggestRoute.js`'s handler or replace the hardcoded response in `index.js` with a real `getGeminiResponse` call.

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
- `firebase/firebaseConfig.js` — client-side Firebase init (Auth) using values from `config/environment.js`, which hardcodes dev/production Firebase project keys and picks between them via `__DEV__`.
- `services/apiService.js` — the single HTTP client to the backend (`fetch` with `AbortController` timeout). All backend calls should go through this (`getOptimizedPath`, `getAlternatives`, `getSuggestions`) rather than calling `fetch` ad hoc from screens.
- `screens/*` — one component per stack route; `PathScreen` renders the optimized path/instructions from `/api/path`, `AlternativeScreen` and `SuggestionScreen` drive the Gemini-backed endpoints.

### Data flow summary
Mobile screens → `apiService` → Express routes → (Firestore for aisle/store data, Gemini API for AI analysis) → JSON response back to the screen.
