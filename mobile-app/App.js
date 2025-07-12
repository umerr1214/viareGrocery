// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import LoginScreen  from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
export default function App() {
    return (
        <NavigationContainer>
            <AppNavigator />

        </NavigationContainer>
    );
}
