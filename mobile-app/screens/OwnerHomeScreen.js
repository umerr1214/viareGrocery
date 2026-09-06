import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { useAuth } from '../navigation/AuthContext';

// Deliberately a stub. It exists so the customer/store_owner navigation split is
// provably wired end to end - not to do anything yet. Replace the body with real
// owner features (and add matching requireRole('store_owner') endpoints on the
// backend) when that work is scoped.
const OwnerHomeScreen = () => {
    const { user, role, logout } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.logoRow}>
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.logoText}>Viare Grocery</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.badge}>STORE OWNER</Text>
                <Text style={styles.heading}>You're signed in as a store owner</Text>
                <Text style={styles.body}>
                    Owner tools aren't built yet. This screen only confirms that the
                    role split is working: your token carried the store_owner claim, so
                    the app rendered this stack instead of the customer one.
                </Text>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{user?.email || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={styles.detailValue}>{role}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={logout}>
                <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
};

export default OwnerHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 20,
        justifyContent: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoImage: {
        width: 48,
        height: 48,
        marginRight: 8,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '300',
        letterSpacing: 1,
        color: '#14b8a6',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#ccfbf1',
        color: '#0f766e',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 12,
        overflow: 'hidden',
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6b7280',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingVertical: 10,
    },
    detailLabel: {
        fontSize: 13,
        color: '#9ca3af',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
        flexShrink: 1,
        textAlign: 'right',
        marginLeft: 12,
    },
    button: {
        backgroundColor: '#0d9488',
        paddingVertical: 12,
        borderRadius: 999,
        marginTop: 24,
        width: '60%',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
        textAlign: 'center',
    },
});
