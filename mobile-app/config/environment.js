// Environment configuration for mobile app
const ENV = {
  development: {
    // Firebase Configuration
    firebaseApiKey: "AIzaSyD-0F8Q55UXVhXf-to7IiJJ3pZfxU6L3P8",
    firebaseAuthDomain: "viaregrocery.firebaseapp.com",
    firebaseProjectId: "viaregrocery",
    firebaseStorageBucket: "viaregrocery.firebasestorage.app",
    firebaseMessagingSenderId: "964000790612",
    firebaseAppId: "1:964000790612:web:2db983a6999af60e8995c1",
    firebaseMeasurementId: "G-56L4ZMM981",
    
    // Backend API Configuration
    apiBaseUrl: "http://localhost:3001",
    apiTimeout: 10000,
    
    // App Configuration
    appName: "Viare Grocery",
    appVersion: "1.0.0",
    
    // Feature Flags
    enableAnalytics: false,
    enableCrashReporting: false,
    enableOfflineMode: true,
  },
  production: {
    // Firebase Configuration (should be different for production)
    firebaseApiKey: "AIzaSyD-0F8Q55UXVhXf-to7IiJJ3pZfxU6L3P8",
    firebaseAuthDomain: "viaregrocery.firebaseapp.com",
    firebaseProjectId: "viaregrocery",
    firebaseStorageBucket: "viaregrocery.firebasestorage.app",
    firebaseMessagingSenderId: "964000790612",
    firebaseAppId: "1:964000790612:web:2db983a6999af60e8995c1",
    firebaseMeasurementId: "G-56L4ZMM981",
    
    // Backend API Configuration
    apiBaseUrl: "https://your-production-api.com", // Update this
    apiTimeout: 15000,
    
    // App Configuration
    appName: "Viare Grocery",
    appVersion: "1.0.0",
    
    // Feature Flags
    enableAnalytics: true,
    enableCrashReporting: true,
    enableOfflineMode: true,
  }
};

// Get current environment
const getEnvVars = () => {
  if (__DEV__) {
    return ENV.development;
  }
  return ENV.production;
};

export default getEnvVars(); 