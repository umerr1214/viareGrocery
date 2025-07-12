// navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PathScreen from '../screens/PathScreen';
// import other screens like PathScreen, HomeScreen, etc.

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="PathScreen" component={PathScreen} />
            {/* Add other screens here */}
        </Stack.Navigator>
    );
};

export default AppNavigator;
