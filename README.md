# Viare Grocery - AI-Powered In-Store Shopping Assistant

A comprehensive In-store grocery shopping application with AI-powered recommendations, store path optimization, and intelligent product analysis.

## 🚀 Features

### Core Functionality
- **AI-Powered Product Analysis** - Upload product images for detailed recommendations
- **Smart Path Optimization** - Dijkstra's algorithm for efficient store navigation
- **Alternative Product Suggestions** - Find similar products from different brands
- **Category-Based Organization** - Browse products by grocery categories
- **User Authentication** - Secure signup/login with Firebase Auth
- **Role-Based Access Control** - Customer and store-owner roles, enforced server-side

### AI Integration
- **Google Gemini AI** - Advanced product analysis and recommendations
- **Image Recognition** - Upload product photos for instant analysis
- **Smart Recommendations** - Quality assessment, pricing, and health considerations

### Store Navigation
- **Path Optimization** - Find shortest routes between products
- **Aisle Mapping** - Organized store layout with product locations
- **Efficient Shopping** - Minimize time spent in store

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **React Navigation** - Screen navigation
- **Firebase SDK** - Authentication and database integration

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Firebase Admin** - Server-side Firebase operations
- **Multer** - File upload handling

### Database & Cloud
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Authentication** - User management

### AI & APIs
- **Google Gemini AI** - Product analysis and recommendations
- **Custom Algorithms** - Path optimization and product matching

## 📱 Screens

1. **Welcome Screen** - App introduction and navigation
2. **Login/Signup** - User authentication
3. **Recommend Screen** - AI-powered feature cards
4. **Alternative Screen** - Product alternatives with AI
5. **Suggestion Screen** - Image-based product analysis
6. **Path Screen** - Store navigation optimization
7. **Owner Home** - Store-owner landing screen, rendered only for the `store_owner` role

---

## 🏆 Hackathon Submission

This project was built at a hackathon.  
We set out to revolutionize physical retail with the intelligence and personalization of online shopping — and we’re just getting started.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo CLI
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd viareGrocery
   ```

2. **Backend Setup**
   ```bash
   cd bakend-api
   npm install
   cp .env.example .env
   # Add your Firebase and Gemini API keys
   npm run seed        # one-time: load store data into Firestore (required for Path Optimization)
   npm start
   ```

3. **Mobile App Setup**
   ```bash
   cd mobile-app
   npm install
   npx expo start
   ```

### Environment Variables

Create `.env` file in `bakend-api/`:
```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

### Database Seeding

A new Firestore database starts empty, so you must seed it **once** for the **Path Optimization** feature (`POST /api/path`) to work. Run these from `bakend-api/` after adding your Firebase credentials to `.env`:

```bash
npm run seed          # required — writes the product→aisle map (storeMaps/demoStore)
npm run check-seed    # optional — verify the seed data was written
```

Without seeding, `/api/path` returns `404 Store map not found`. The AI features (image analysis and product alternatives) call Gemini directly and need **no** seeding.

Optional reference data (not required by any current endpoint):

```bash
node scripts/seedCategory.js
node scripts/seedBrand.js
node scripts/seedCategoryBrands.js
```

See [`bakend-api/README.md`](bakend-api/README.md) for full details.

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Firestore Database
3. Enable Authentication
4. Download service account key
5. Update Firebase config in mobile app

### Firestore Security Rules

Rules live in the **Firebase Console** → Firestore Database → **Rules** tab, and the Console is the source of truth for the `viaregrocery` project. This project does not use the Firebase CLI, so there is deliberately no `firestore.rules` / `firebase.json` / `.firebaserc` in the repo — edit in the Console and remember to click **Publish**.

Rules govern **only the mobile client**. Everything in `bakend-api/` uses the Firebase Admin SDK, which bypasses security rules entirely — so the seed scripts and `makeStoreOwner.js` keep working regardless of how tight the rules get.

| Path | Client access |
|---|---|
| `users/{uid}` | read and create own document only; `role` is immutable on update; delete denied |
| `storeMaps/**`, `categoryBrands/**` | read-only, and only while signed in |
| anything else | denied (Firestore default) |

Three details that are easy to break if the rules are ever rewritten:

- **Never add a blanket `match /{document=**} { allow read: if request.auth != null; }`.** Firestore rules are *additive* — a request is allowed if **any** matching block allows it — so a catch-all would override the self-only guard on `users/{uid}` and let every signed-in customer read every other customer's email and name. Enumerate the catalog collections instead.
- **`categoryBrands` needs a recursive wildcard** (`match /categoryBrands/{doc=**}`), because `AlternativeScreen` falls back to a `categoryBrands/{category}/brands` subcollection. A single-segment pattern would not match it and that code path would start throwing `PERMISSION_DENIED`.
- **Profile creation is pinned to `role: 'customer'`** and updates compare `request.resource.data.role == resource.data.role`, so a client can never promote itself. `store_owner` is granted server-side by `npm run make-owner` in `bakend-api/`, which sets a Firebase custom claim — the backend authorises requests from that claim, never from the client-writable document.

### Gemini AI Setup
1. Get API key from Google AI Studio
2. Add to backend environment variables
3. Configure model (gemini-1.5-flash)

## 🔐 Authentication & Roles

Every backend API route and every app screen is gated by Firebase Authentication, and users are split into two roles.

### Roles

| Role | How it is granted | What it sees |
|---|---|---|
| `customer` | automatically at signup | Recommend hub → Alternatives, Suggestions, Path Optimization |
| `store_owner` | `npm run make-owner -- <email>` in `bakend-api/` | Owner home (a stub for now) |

The authoritative role is a **Firebase custom claim** inside the ID token, so the backend reads it from the token it already verified — no extra database lookup per request. `users/{uid}` in Firestore is a client-readable copy that the app falls back to, and if neither is present the role defaults to `customer`.

### Protected endpoints

`bakend-api/middleware/authMiddleware.js` provides two middlewares:

- **`authenticate`** — requires `Authorization: Bearer <idToken>`, verifies it with `admin.auth().verifyIdToken()`, and attaches `req.user = { uid, email, role }`. Returns **401** when the token is missing or invalid.
- **`requireRole(...roles)`** — returns **403** unless `req.user.role` is in the list.

| Endpoint | Protection |
|---|---|
| `GET /health` | public |
| `POST /api/suggest-direct` | `authenticate`, placed *before* `multer` so unauthenticated callers are rejected without the server buffering their upload |
| `POST /api/path` | `authenticate` |
| `POST /api/alternatives` | `authenticate` |
| `GET /api/owner/ping` | `authenticate` + `requireRole('store_owner')` |

`/api/owner/ping` is a throwaway proof endpoint — it exists only to demonstrate the role split (customer token → 403, owner token → 200). Delete or repurpose it once a real owner endpoint lands.

### Mobile app

`mobile-app/navigation/AuthContext.js` exposes `{ user, role, loading, logout }` through `useAuth()`, and `AppNavigator.js` renders one of three stacks from it:

| Auth state | Stack |
|---|---|
| signed out | `Login`, `Signup` |
| `store_owner` | `OwnerHome` |
| `customer` | `Recommend` (landing), `Welcome`, `PathScreen`, `AlternativeScreen`, `SuggestionScreen` |

Because the swap is driven by auth state, **screens no longer navigate after sign-in or sign-out**. `LoginScreen` and `SignupScreen` used to call `navigation.navigate()`, which raced the stack change and could target a route that no longer existed.

Every backend call must now carry a token. `mobile-app/services/apiService.js` exports `getAuthHeaders()`, which `PathScreen`, `AlternativeScreen` and `SuggestionScreen` spread into the headers of their own `fetch` calls.

### Granting store-owner access

```bash
cd bakend-api
npm run make-owner -- owner@example.com
```

The account must already exist — sign up in the app first. The script sets the `role: 'store_owner'` custom claim and merges the role into `users/{uid}`, and it is idempotent. Custom claims only reach the client on the next token refresh, so **the owner must sign out and back in**.

### Known gaps

- `OwnerHomeScreen` is intentionally a stub — no owner features exist yet.
- `bakend-api/routes/suggestRoute.js` is **not mounted** in `index.js`. It also predates the auth work and carries no `authenticate` guard, so if it is ever mounted it must be given one.
- `AlternativeScreen` and `SuggestionScreen` hardcode a LAN IP (`http://192.168.18.140:3000`) instead of using `config.apiBaseUrl` like `PathScreen` does.

## 📊 Project Structure

```
viareGrocery/
├── bakend-api/          # Express.js backend
│   ├── routes/          # API endpoints (pathoptimizer, alternativeSearch)
│   ├── middleware/      # auth (authenticate / requireRole), validation, error handling
│   ├── scripts/         # Firestore seeding + makeStoreOwner.js role grant
│   ├── config/          # Environment configuration
│   ├── utils/           # Utilities (Dijkstra, Gemini)
│   ├── data/            # Store and product data
│   └── firebase/        # Admin SDK init + Firestore service
├── mobile-app/          # React Native frontend
│   ├── screens/         # App screens (including OwnerHomeScreen)
│   ├── navigation/      # AppNavigator + AuthContext (role-based stacks)
│   ├── services/        # apiService, including getAuthHeaders()
│   ├── components/      # ErrorBoundary, LoadingSpinner
│   ├── config/          # Environment configuration
│   ├── firebase/        # Firebase client config
│   └── assets/          # Images and icons
└── README.md
```

## 🎯 Key Features

### AI Product Analysis
- Upload product images
- Get detailed quality assessment
- Price and value comparison
- Health and nutritional information
- Storage recommendations

### Smart Navigation
- Dijkstra's algorithm implementation
- Store aisle mapping
- Optimal path calculation
- Product location tracking

### Alternative Products
- AI-powered product suggestions
- Brand comparison
- Similar product recommendations
- Category-based alternatives

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent product analysis
- Firebase for backend services
- React Native community for mobile development tools
- Expo team for development platform

---

**Built with ❤️ by Team Shahi Tukre**
