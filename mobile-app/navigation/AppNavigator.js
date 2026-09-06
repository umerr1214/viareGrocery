// navigation/AppNavigator.js
import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PathScreen from '../screens/PathScreen';
import RecommendScreen from '../screens/RecommendScreen';
import AlternativeScreen from '../screens/AlternativeScreen';
import SuggestionScreen from '../screens/SuggestionScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerHomeScreen from '../screens/SellerHomeScreen';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from './AuthContext';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    // Which stack renders is driven purely by auth state + role, so screens no
    // longer need to navigate after sign-in/sign-out - the swap happens here.
    const { user, role, loading } = useAuth();

    if (loading) {
        // LoadingSpinner is an absolutely-positioned overlay, so it needs a
        // parent with a real background or it renders over nothing.
        return (
            <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
                <LoadingSpinner message="Loading..." />
            </View>
        );
    }

    return (
        // No initialRouteName: "Login" only exists in the signed-out stack, so a
        // hard-coded initial route would be invalid once the user is signed in.
        // The first Stack.Screen in each branch is the landing screen.
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                </>
            ) : role === 'store_owner' ? (
                <>
                    <Stack.Screen name="SellerHome" component={SellerHomeScreen} />
                    <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
                </>
            ) : (
                <>
                    {/* Recommend is the customer hub (links to the other three
                        features), so it stays the landing screen exactly as the
                        old navigate('Recommend') after login behaved. */}
                    <Stack.Screen name="Recommend" component={RecommendScreen} />
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="PathScreen" component={PathScreen} />
                    <Stack.Screen name="AlternativeScreen" component={AlternativeScreen} />
                    <Stack.Screen name="SuggestionScreen" component={SuggestionScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
