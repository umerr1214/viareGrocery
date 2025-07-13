# Viare Grocery - AI-Powered In-Store Shopping Assistant

A comprehensive In-store grocery shopping application with AI-powered recommendations, store path optimization, and intelligent product analysis.

## 🚀 Features

### Core Functionality
- **AI-Powered Product Analysis** - Upload product images for detailed recommendations
- **Smart Path Optimization** - Dijkstra's algorithm for efficient store navigation
- **Alternative Product Suggestions** - Find similar products from different brands
- **Category-Based Organization** - Browse products by grocery categories
- **User Authentication** - Secure signup/login with Firebase Auth

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

---

## 🏆 Hackathon Submission

This project was built in under 24 hours as part of Remote Base Hackathon 3.0.  
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
   cd shahi_tukre
   ```

2. **Backend Setup**
   ```bash
   cd bakend-api
   npm install
   cp .env.example .env
   # Add your Firebase and Gemini API keys
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

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Firestore Database
3. Enable Authentication
4. Download service account key
5. Update Firebase config in mobile app

### Gemini AI Setup
1. Get API key from Google AI Studio
2. Add to backend environment variables
3. Configure model (gemini-1.5-flash)

## 📊 Project Structure

```
shahi_tukre/
├── bakend-api/          # Express.js backend
│   ├── routes/          # API endpoints
│   ├── utils/           # Utilities (Dijkstra, Gemini)
│   ├── data/           # Store and product data
│   └── firebase/       # Firebase admin config
├── mobile-app/          # React Native frontend
│   ├── screens/         # App screens
│   ├── navigation/      # Navigation setup
│   ├── firebase/       # Firebase client config
│   └── assets/         # Images and icons
└── shared/             # Shared utilities and models
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
