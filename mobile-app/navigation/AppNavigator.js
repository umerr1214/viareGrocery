// navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PathScreen from '../screens/PathScreen';
import RecommendScreen from '../screens/RecommendScreen';
import AlternativeScreen from '../screens/AlternativeScreen';
import SuggestionScreen from '../screens/SuggestionScreen';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="PathScreen" component={PathScreen} />
            <Stack.Screen name="Recommend" component={RecommendScreen} />
            <Stack.Screen name="AlternativeScreen" component={AlternativeScreen} />
            <Stack.Screen name="SuggestionScreen" component={SuggestionScreen} />
            { }
        </Stack.Navigator>
    );
};

export default AppNavigator;
