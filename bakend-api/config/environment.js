const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Firebase configuration
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  
  // API URLs
  geminiTextApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
  geminiVisionApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
  
  // File upload limits
  maxFileSize: process.env.MAX_FILE_SIZE || '50mb',
  maxFiles: process.env.MAX_FILES || 10
};

// Validate required environment variables
const requiredEnvVars = ['GEMINI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

module.exports = config; 