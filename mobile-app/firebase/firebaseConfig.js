import { initializeApp } from 'firebase/app';
import {
    initializeAuth,
    getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyD-0F8Q55UXVhXf-to7IiJJ3pZfxU6L3P8",
    authDomain: "viaregrocery.firebaseapp.com",
    projectId: "viaregrocery",
    storageBucket: "viaregrocery.firebasestorage.app",
    messagingSenderId: "964000790612",
    appId: "1:964000790612:web:2db983a6999af60e8995c1",
    measurementId: "G-56L4ZMM981"

};

const app = initializeApp(firebaseConfig);

// Use persistent auth for React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
