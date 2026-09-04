# Shahi Tukre Backend API

A smart grocery shopping assistant backend API that provides product recommendations, path optimization, and alternative product suggestions using AI.

## 🚀 Features

- **Product Analysis**: AI-powered product identification and quality assessment
- **Path Optimization**: Dijkstra's algorithm for optimal shopping routes
- **Alternative Products**: Smart recommendations for product alternatives
- **Image Processing**: Support for product image analysis
- **Firebase Integration**: Store mapping and product data management

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Google Gemini API key
- Firebase project (optional, for store mapping)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd bakend-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

4. **Seed the database** (required for the Path Optimization feature)
   ```bash
   npm run seed
   ```

   Writes the product→aisle map to Firestore. Without it, `POST /api/path` returns
   `404 Store map not found`. See **Database Seeding** below for optional reference
   data and verification.

## 🌱 Database Seeding

The backend keeps its store-layout data in **Firebase Firestore**, and a fresh database
starts empty. You must seed it before the **Path Optimization** feature works.

> The AI features (`POST /api/suggest-direct` and `POST /api/alternatives`) call Google
> Gemini directly and need **no** seeding — only a valid `GEMINI_API_KEY`.

### Required — for `POST /api/path`

```bash
npm run seed
```

- Runs `scripts/seedAisleMap.js`.
- Creates the `storeMaps/demoStore` document containing `productToAisleMap`
  (product name → aisle).
- If this document is missing, `POST /api/path` responds with
  `404 { "error": "Store map not found" }`.

> The store **graph** (`data/storeGraph.json`) ships with the repo and is loaded
> locally, so it does **not** need seeding.

### Optional — reference data

These populate category/brand lookups. No current endpoint reads them, but they are
handy if you extend the app:

```bash
node scripts/seedCategory.js         # storeMaps/categoryList    → categories[]
node scripts/seedBrand.js            # storeMaps/brandList       → brands[]
node scripts/seedCategoryBrands.js   # categoryBrands/<category> → brands[]
```

### Verify the seed data

```bash
npm run check-seed
```

Runs `scripts/checkSeedData.js` and prints ✅/❌ for each expected document
(`storeMaps/demoStore`, `storeMaps/categoryList`, `storeMaps/brandList`, and the
`categoryBrands` collection).

### Prerequisites

- A Firestore database must exist in your Firebase project — create it in the
  [Firebase console](https://console.firebase.google.com/) first.
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, and `FIREBASE_CLIENT_EMAIL` must be
  set in `.env` using your Firebase **service account** key.

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## 📚 API Endpoints

### Health Check
```
GET /health
```
Returns server status and environment information.

### Product Analysis
```
POST /api/suggest-direct
```
Analyze product images and provide recommendations.

**Request:**
- `files`: Array of image files
- `category`: Product category (optional)

**Response:**
```json
{
  "recommendation": "Detailed product analysis and recommendations..."
}
```

### Path Optimization
```
POST /api/path
```
Find the optimal shopping route for a list of products.

**Request:**
```json
{
  "products": ["Apple", "Bread", "Milk"]
}
```

**Response:**
```json
{
  "path": ["Entrance", "Aisle15", "Aisle3", "Counter"],
  "instructions": [
    "Start at Entrance",
    "Go to Aisle15 – Pick Apple",
    "Go to Aisle3 – Pick Bread",
    "Proceed to Counter"
  ]
}
```

### Alternative Products
```
POST /api/alternatives
```
Find alternative products for a given item.

**Request (Image-based):**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Request (Text-based):**
```json
{
  "productName": "Olpers Milk",
  "category": "Dairy",
  "brand": "Olpers"
}
```

**Response:**
```json
{
  "success": true,
  "alternative": "Detailed alternative product recommendations..."
}
```

## 🏗️ Project Structure

```
bakend-api/
├── config/
│   └── environment.js          # Environment configuration
├── data/
│   ├── productToAisleMap.json  # Product to aisle mapping
│   └── storeGraph.json         # Store layout graph
├── firebase/
│   └── firestoreService.js     # Firebase configuration
├── middleware/
│   ├── errorHandler.js         # Global error handling
│   └── validation.js           # Input validation
├── routes/
│   ├── alternativeSearch.js    # Alternative products endpoint
│   ├── pathOptimizer.js        # Path optimization endpoint
│   └── suggestRoute.js         # Product suggestion endpoint
├── scripts/
│   └── seedAisleMap.js         # Database seeding script
├── utils/
│   ├── dijkstra.js             # Path finding algorithm
│   └── gemini.js               # AI integration
├── index.js                    # Main application file
└── package.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `MAX_FILE_SIZE` | Maximum file upload size | `50mb` |
| `MAX_FILES` | Maximum number of files | `10` |

### File Upload Limits

- **File Size**: 10MB per file
- **File Count**: Maximum 5 files per request
- **Supported Formats**: JPEG, PNG, WebP

## 🧪 Testing

Currently, no automated tests are configured. To add tests:

1. Install testing framework (Jest recommended)
2. Create test files in `__tests__/` directory
3. Update `package.json` test script

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production environment variables
3. Ensure all required API keys are set

### Process Management
Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start index.js --name "shahi-tukre-backend"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please open an issue in the repository. 