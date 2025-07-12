import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const RecommendScreen = () => {
    const navigation = useNavigation();
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-200)).current;

    return (
        <View style={styles.container}>
            {/* Page Heading */}
            <Text style={styles.heading}>Let Viare Help You!</Text>

            {/* AI Cards */}
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AlternativeScreen')}
            >
                <Text style={styles.cardTitle}>Get Alternatives</Text>
                <Text style={styles.cardDesc}>
                    Can’t find your favorite product? Don’t worry! Viare AI will find
                    the best alternatives for you, based on price, ingredients, and demand.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('SuggestionScreen')}
            >
                <Text style={styles.cardTitle}>Get Recommendations</Text>
                <Text style={styles.cardDesc}>
                    Stuck deciding what to buy? Let Viare AI suggest items you’ll love based
                    on your habits, preferences, and what’s trending.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Welcome')}
            >
                <Text style={styles.cardTitle}>Get Optimized Path</Text>
                <Text style={styles.cardDesc}>
                    Save time with a smart aisle-to-aisle route based on your grocery list,
                    so you never backtrack again!
                </Text>
            </TouchableOpacity>

            {/* Logo at bottom */}
            <View style={styles.logoContainer}>
                <Image source={require('../assets/logo.png')} style={styles.logo} />
                <Text style={styles.logoText}>Viare AI</Text>
            </View>
        </View>
    );
};

export default RecommendScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 24,
        paddingTop: 60,
        position: 'relative',
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 30,
        color: '#111827',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#e0f7f5',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0d9488',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        color: '#374151',
    },
    menuButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
    },
    menuIcon: {
        fontSize: 26,
        color: '#0d9488',
    },
    menu: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 200,
        height: '100%',
        backgroundColor: '#e0f7f5',
        paddingTop: 80,
        paddingHorizontal: 20,
        zIndex: 9,
    },
    menuItem: {
        marginVertical: 12,
    },
    menuText: {
        fontSize: 16,
        color: '#0d9488',
        fontWeight: '600',
    },
    logoContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    logo: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    logoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0d9488',
    },
});
