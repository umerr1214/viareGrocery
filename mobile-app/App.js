// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './navigation/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
    return (
        <ErrorBoundary>
            {/* AuthProvider sits outside NavigationContainer: it only depends on
                Firebase auth state, while AppNavigator inside it consumes the
                context to choose which stack to render. */}
            <AuthProvider>
                <NavigationContainer>
                    <StatusBar style="auto" />
                    <AppNavigator />
                </NavigationContainer>
            </AuthProvider>
        </ErrorBoundary>
    );
}
