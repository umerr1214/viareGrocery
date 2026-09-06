import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../navigation/AuthContext';

const SellerHomeScreen = ({ navigation }) => {
    const { logout } = useAuth();

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.navBar}>
                    <View>
                        <Text style={styles.navBrand}>VIARE</Text>
                        <Text style={styles.navRole}>STORE OWNER</Text>
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

                <Text style={styles.heading}>Store operations</Text>
                <Text style={styles.subtitle}>Use customer route activity to make smarter placement decisions.</Text>

                <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('SellerDashboard')}
                    style={styles.card}
                >
                    <Text style={styles.cardTitle}>Know Hot Aisles</Text>
                    <Text style={styles.cardDesc}>
                        See store insights, prioritise placements, and optimise your store using customer route activity.
                    </Text>
                   </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default SellerHomeScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f7f5' },
    container: { flex: 1, padding: 22, paddingTop: 8 },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 },
    navBrand: {color: '#0d9488', fontSize: 16, fontWeight: '900',    letterSpacing: 2,},
    navRole: { color: '#8a958d', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 3 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d8e1da', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
    logoutIcon: { color: '#8c4b32', fontSize: 17, fontWeight: '800', marginRight: 5 },
    logoutText: { color: '#8c4b32', fontSize: 12, fontWeight: '800' },
    heading: { color: '#17211b', fontSize: 30, fontWeight: '800' },
    subtitle: { color: '#68746c', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 28, maxWidth: 320 },
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
    cardAction: { color: '#f5c16c', fontSize: 13, fontWeight: '800', marginTop: 24 },
});