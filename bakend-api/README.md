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
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

4. **Seed the database** (if using Firebase)
   ```bash
   npm run seed
   ```

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