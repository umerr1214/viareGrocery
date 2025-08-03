# Shahi Tukre Mobile App

A React Native mobile application for the Shahi Tukre grocery shopping assistant, built with Expo.

## 🚀 Features

- **User Authentication**: Firebase-based login and signup
- **Product Analysis**: AI-powered product recommendations
- **Path Optimization**: Smart shopping route planning
- **Alternative Products**: Find better product alternatives
- **Image Processing**: Product image analysis
- **Offline Support**: Basic offline functionality
- **Cross-Platform**: Works on iOS, Android, and Web

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project
- Backend API running (see backend README)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `config/environment.js` with your Firebase credentials
   - Ensure Firebase project is properly configured

4. **Configure Backend API**
   - Update `config/environment.js` with your backend API URL
   - Ensure backend server is running

## 🏃‍♂️ Running the Application

### Development
```bash
npm start
```

### Platform-specific
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Building for Production
```bash
# Android APK
npm run build:android

# iOS
npm run build:ios
```

## 📱 App Structure

```
mobile-app/
├── components/
│   ├── ErrorBoundary.js      # Error handling component
│   └── LoadingSpinner.js     # Loading indicator
├── config/
│   └── environment.js        # Environment configuration
├── firebase/
│   └── firebaseConfig.js     # Firebase setup
├── navigation/
│   └── AppNavigator.js       # Navigation configuration
├── screens/
│   ├── LoginScreen.js        # User login
│   ├── SignupScreen.js       # User registration
│   ├── WelcomeScreen.js      # Welcome screen
│   ├── PathScreen.js         # Path optimization
│   ├── RecommendScreen.js    # Product recommendations
│   ├── AlternativeScreen.js  # Product alternatives
│   └── SuggestionScreen.js   # AI suggestions
├── services/
│   └── apiService.js         # Backend API communication
├── utils/
│   └── validation.js         # Form validation utilities
├── assets/                   # Images and static files
├── App.js                    # Main app component
└── package.json
```

## 🔧 Configuration

### Environment Variables

The app uses environment-based configuration in `config/environment.js`:

| Variable | Description | Default |
|----------|-------------|---------|
| `firebaseApiKey` | Firebase API key | Required |
| `firebaseAuthDomain` | Firebase auth domain | Required |
| `firebaseProjectId` | Firebase project ID | Required |
| `apiBaseUrl` | Backend API URL | `http://localhost:3001` |
| `apiTimeout` | API request timeout | `10000` ms |

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Update configuration in `config/environment.js`

## 📚 API Integration

The app communicates with the backend API through the `apiService.js`:

- **Health Check**: `/health`
- **Path Optimization**: `POST /api/path`
- **Product Alternatives**: `POST /api/alternatives`
- **Product Suggestions**: `POST /api/suggest-direct`

## 🎨 UI/UX Features

- **Modern Design**: Clean, intuitive interface
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time input validation
- **Responsive Layout**: Works on different screen sizes

## 🔒 Security Features

- **Input Validation**: All user inputs are validated
- **Error Boundaries**: Graceful error handling
- **Secure API Calls**: Proper authentication and authorization
- **Environment Configuration**: Secure credential management

## 🧪 Testing

Currently, no automated tests are configured. To add tests:

1. Install testing framework (Jest recommended)
2. Create test files in `__tests__/` directory
3. Update `package.json` test script

## 🚀 Deployment

### Expo Build

1. **Configure app.json** with your app details
2. **Build for platforms**:
   ```bash
   npm run build:android
   npm run build:ios
   ```

### App Store Deployment

1. **Build production version**
2. **Submit to app stores**:
   - Google Play Store (Android)
   - Apple App Store (iOS)

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

## 🔗 Related Projects

- [Backend API](../bakend-api/README.md) - Server-side API
- [Shared Models](../shared/README.md) - Shared data models 