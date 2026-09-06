import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../navigation/AuthContext';
import {get, getDatabase, ref} from "firebase/database";

const RecommendScreen = () => {
    const navigation = useNavigation();
    const { logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-200)).current;

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.navBar}>
                    <View>
                        <Text style={styles.navBrand}>VIARE</Text>
                        <Text style={styles.navRole}>CUSTOMER</Text>
                    </View>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Sign out"
                        onPress={logout}
                        style={styles.logoutButton}
                    >
                        <Text style={styles.logoutIcon}>↪</Text>
                        <Text style={styles.logoutText}>Sign out</Text>
                    </TouchableOpacity>
                </View>

            {/* Page Heading */}
            <Text style={styles.heading}>Let Viare Help You!</Text>

            {/* AI Cards */}
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AlternativeScreen')}
            >
                <Text style={styles.cardTitle}>Get Alternatives</Text>
                <Text style={styles.cardDesc}>
                    Can’t find your favorite product at the store? Don’t worry! Viare AI will help you choose
                    the best ones for you, based on price, ingredients, and demand.
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
                <Text style={styles.cardTitle}>Get Store Navigation</Text>
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
        </SafeAreaView>
    );
};

export default RecommendScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 24,
        paddingTop: 8,
        position: 'relative',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    navBrand: {
        color: '#0d9488',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    navRole: {
        color: '#6b7280',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginTop: 3,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 9,
        paddingHorizontal: 11,
        paddingVertical: 8,
    },
    logoutIcon: {
        color: '#8c4b32',
        fontSize: 17,
        fontWeight: '800',
        marginRight: 5,
    },
    logoutText: {
        color: '#8c4b32',
        fontSize: 12,
        fontWeight: '800',
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
