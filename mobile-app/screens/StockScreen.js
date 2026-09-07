import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../navigation/AuthContext';
import config from '../config/environment';
import { getAuthHeaders } from '../services/apiService';

// Per-status presentation. Mirrors the palette used across the owner screens
// (green = healthy, amber = low, red = out) and the emoji/glyph icon strategy
// the mobile app uses instead of @expo/vector-icons.
const STATUS_META = {
    out: { short: 'OUT', color: '#b91c1c', bg: '#fdecec' },
    low: { short: 'LOW', color: '#b45309', bg: '#fdf3e3' },
    ok: { short: 'OK', color: '#26834b', bg: '#e3f3e8' },
};

const StockScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useState(new Animated.Value(-200))[0];
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    // Categories the owner has tapped open. A Set so several can stay expanded
    // at once while scrolling a long catalogue.
    const [expanded, setExpanded] = useState(() => new Set());

    useEffect(() => {
        let active = true;

        const loadInventory = async () => {
            setLoading(true);
            setError(null);

            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${config.apiBaseUrl}/api/owner/inventory`, { headers });
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || `Request failed (${response.status})`);
                }

                if (active) setInventory(data);
            } catch (requestError) {
                if (active) setError(requestError.message || 'Unable to load stock.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadInventory();
        return () => { active = false; };
    }, [reloadToken]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        Animated.timing(slideAnim, {
            toValue: menuOpen ? -200 : 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    };

    const toggleCategory = (name) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const summary = inventory?.summary;
    const categories = inventory?.categories || [];

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={() => navigation.navigate('SellerHome')} style={styles.menuItem}>
                    <Text style={styles.menuText}>Back to Home</Text>
                </TouchableOpacity>

                {/* Bottom-anchored via signOutItem's marginTop:'auto' on the full-height drawer */}
                <TouchableOpacity onPress={logout} style={styles.signOutItem}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>STOCK OVERVIEW</Text>
                    <Text style={styles.subtitle}>
                        Live inventory by category. Tap a category to see the items you hold and what needs restocking.
                    </Text>
                </View>

                {loading && (
                    <View style={styles.statusPanel}>
                        <ActivityIndicator size="small" color="#26834b" />
                        <Text style={styles.statusText}>Loading your stock...</Text>
                    </View>
                )}

                {!loading && error && (
                    <View style={styles.statusPanel}>
                        <Text style={styles.statusTitle}>Could not load stock</Text>
                        <Text style={styles.statusText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => setReloadToken((value) => value + 1)}>
                            <Text style={styles.retryText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loading && !error && categories.length === 0 && (
                    <View style={styles.statusPanel}>
                        <Text style={styles.statusTitle}>No stock recorded yet</Text>
                        <Text style={styles.statusText}>
                            Seed the demo store inventory (node scripts/seedInventory.js) and your categories will appear here.
                        </Text>
                    </View>
                )}

                {!loading && !error && categories.length > 0 && <>
                    <View style={styles.metricRow}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricValue}>{summary?.products ?? 0}</Text>
                            <Text style={styles.metricLabel}>ITEMS TRACKED</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricValue, styles.metricLow]}>{summary?.lowStock ?? 0}</Text>
                            <Text style={styles.metricLabel}>LOW STOCK</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricValue, styles.metricOut]}>{summary?.outOfStock ?? 0}</Text>
                            <Text style={styles.metricLabel}>OUT OF STOCK</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Categories</Text>
                    <Text style={styles.sectionSubtitle}>Flagged first — out of stock, then low</Text>

                    {categories.map((cat) => {
                        const isOpen = expanded.has(cat.category);
                        return (
                            <View key={cat.category} style={styles.categoryCard}>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityState={{ expanded: isOpen }}
                                    onPress={() => toggleCategory(cat.category)}
                                    style={styles.categoryHeader}
                                >
                                    <View style={styles.categoryLeft}>
                                        <Text style={styles.categoryName}>{cat.category}</Text>
                                        <Text style={styles.categoryMeta}>{cat.productCount} items</Text>
                                    </View>

                                    <View style={styles.categoryRight}>
                                        {cat.outCount > 0 && (
                                            <View style={[styles.flag, styles.flagOut]}>
                                                <Text style={styles.flagTextOut}>{cat.outCount} out</Text>
                                            </View>
                                        )}
                                        {cat.lowCount > 0 && (
                                            <View style={[styles.flag, styles.flagLow]}>
                                                <Text style={styles.flagTextLow}>{cat.lowCount} low</Text>
                                            </View>
                                        )}
                                        <Text style={styles.chevron}>{isOpen ? '▾' : '▸'}</Text>
                                    </View>
                                </TouchableOpacity>

                                {isOpen && (
                                    <View style={styles.productList}>
                                        {cat.products.map((product) => {
                                            const meta = STATUS_META[product.status] || STATUS_META.ok;
                                            return (
                                                <View key={product.id} style={styles.productRow}>
                                                    <View style={styles.productInfo}>
                                                        <Text style={styles.productName}>{product.name}</Text>
                                                        <Text style={styles.productMeta}>
                                                            {[product.brand, product.aisle].filter(Boolean).join(' · ')}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.productStock}>
                                                        <Text style={styles.qty}>{product.quantity}</Text>
                                                        <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
                                                            <Text style={[styles.statusChipText, { color: meta.color }]}>{meta.short}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </>}
            </ScrollView>
        </SafeAreaView>
    );
};

export default StockScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f7f5' },
    content: { padding: 22, paddingTop: 80, paddingBottom: 36 },
    menuButton: { position: 'absolute', top: 40, left: 20, zIndex: 10 },
    menuIcon: { fontSize: 26, color: '#0d9488' },
    // top+bottom (not height:'100%') so the drawer spans the full screen even
    // though the SafeAreaView parent shrinks its content box by the top inset.
    menu: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 200,
        backgroundColor: '#e0f7f5',
        paddingTop: 80,
        paddingHorizontal: 20,
        zIndex: 9,
    },
    menuItem: { marginVertical: 12 },
    menuText: { fontSize: 16, color: '#0d9488', fontWeight: '600' },
    signOutItem: {
        marginTop: 'auto',
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(13, 148, 136, 0.25)',
    },
    signOutText: { fontSize: 16, color: '#b91c1c', fontWeight: '600' },
    header: { marginBottom: 22 },
    title: { color: '#17211b', fontSize: 32, fontWeight: '800' },
    subtitle: { color: '#68746c', fontSize: 14, marginTop: 6, lineHeight: 20, maxWidth: 320 },
    statusPanel: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e5ebe6', marginBottom: 14 },
    statusTitle: { color: '#344139', fontSize: 15, fontWeight: '800', textAlign: 'center' },
    statusText: { color: '#7b867e', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
    retryButton: { backgroundColor: '#1e3a2b', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, marginTop: 15 },
    retryText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    metricRow: { flexDirection: 'row', gap: 9, marginBottom: 26 },
    metricCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 13, padding: 14, borderWidth: 1, borderColor: '#e5ebe6' },
    metricValue: { color: '#17211b', fontSize: 22, fontWeight: '800' },
    metricLow: { color: '#b45309' },
    metricOut: { color: '#b91c1c' },
    metricLabel: { color: '#7b867e', fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginTop: 6 },
    sectionTitle: { color: '#17211b', fontSize: 20, fontWeight: '800' },
    sectionSubtitle: { color: '#7b867e', fontSize: 12, marginTop: 4, marginBottom: 14 },
    categoryCard: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e5ebe6', marginBottom: 10, overflow: 'hidden' },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
    categoryLeft: { flex: 1, paddingRight: 8 },
    categoryName: { color: '#17211b', fontSize: 16, fontWeight: '800' },
    categoryMeta: { color: '#7b867e', fontSize: 12, marginTop: 3 },
    categoryRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    flag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    flagOut: { backgroundColor: '#fdecec' },
    flagLow: { backgroundColor: '#fdf3e3' },
    flagTextOut: { color: '#b91c1c', fontSize: 11, fontWeight: '800' },
    flagTextLow: { color: '#b45309', fontSize: 11, fontWeight: '800' },
    chevron: { color: '#9aa39c', fontSize: 16, fontWeight: '800', marginLeft: 2 },
    productList: { borderTopWidth: 1, borderTopColor: '#eef2ef' },
    productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f2f5f2' },
    productInfo: { flex: 1, paddingRight: 10 },
    productName: { color: '#344139', fontSize: 14, fontWeight: '700' },
    productMeta: { color: '#9aa39c', fontSize: 12, marginTop: 3 },
    productStock: { alignItems: 'flex-end' },
    qty: { color: '#17211b', fontSize: 16, fontWeight: '800' },
    statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 5 },
    statusChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
