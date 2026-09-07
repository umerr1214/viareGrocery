import React, { useEffect, useMemo, useState } from 'react';
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

/* const defaultAisleVisits = [
    { aisle: 'Fresh Produce', code: 'A01', visits: 184 },
    { aisle: 'Dairy & Eggs', code: 'A04', visits: 156 },
    { aisle: 'Snacks', code: 'A09', visits: 132 },
    { aisle: 'Beverages', code: 'A07', visits: 118 },
    { aisle: 'Pantry Staples', code: 'A02', visits: 97 },
    { aisle: 'Frozen Foods', code: 'A06', visits: 74 },
];
*/
const periods = ['Today', '7 days', '30 days'];

// Maps each tab label to the ?period= value GET /api/owner/aisle-stats expects.
const periodParams = {
    'Today': 'today',
    '7 days': '7d',
    '30 days': '30d',
};

const SellerDashboardScreen = ({ route, navigation }) => {
    const { logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useState(new Animated.Value(-200))[0];
    const [selectedPeriod, setSelectedPeriod] = useState('7 days');
    const previewAisles = route?.params?.aisleVisits;
    const [aisleVisits, setAisleVisits] = useState(previewAisles || []);
    const [loading, setLoading] = useState(!previewAisles);
    const [error, setError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (previewAisles) {
            setAisleVisits(previewAisles);
            setLoading(false);
            return undefined;
        }

        let active = true;

        const loadAisleVisits = async () => {
            setLoading(true);
            setError(null);

            try {
                const headers = await getAuthHeaders();
                const period = periodParams[selectedPeriod] || '7d';
                const response = await fetch(
                    `${config.apiBaseUrl}/api/owner/aisle-stats?limit=100&period=${period}`,
                    { headers }
                );
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || `Request failed (${response.status})`);
                }

                if (active) {
                    setAisleVisits(Array.isArray(data.aisles) ? data.aisles : []);
                }
            } catch (requestError) {
                if (active) {
                    setError(requestError.message || 'Unable to load aisle activity.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadAisleVisits();
        return () => { active = false; };
    }, [previewAisles, reloadToken, selectedPeriod]);

    // The API returns every aisle document, including aisles with no visits inside
    // the selected window, so zero-visit rows are dropped here instead of being
    // rendered as empty bars with a count of 0.
    const scoreboard = useMemo(
        () => [...aisleVisits]
            .filter((item) => (item.visits || 0) > 0)
            .sort((first, second) => second.visits - first.visits)
            .slice(0, 5),
        [aisleVisits]
    );

    const totalVisits = scoreboard.reduce((total, item) => total + item.visits, 0);
    const hotAisle = scoreboard[0];
    const averageVisits = scoreboard.length ? Math.round(totalVisits / scoreboard.length) : 0;

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        Animated.timing(slideAnim, {
            toValue: menuOpen ? -200 : 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    };

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
                    <View>
                        <Text style={styles.title}>SELLER INSIGHTS</Text>
                      </View>
                </View>

                <View style={styles.periodRow}>
                    {periods.map((period) => (
                        <TouchableOpacity
                            key={period}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedPeriod === period }}
                            onPress={() => setSelectedPeriod(period)}
                            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
                        >
                            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading && (
                    <View style={styles.statusPanel}>
                        <ActivityIndicator size="small" color="#26834b" />
                        <Text style={styles.statusText}>Loading aisle activity...</Text>
                    </View>
                )}

                {!loading && error && (
                    <View style={styles.statusPanel}>
                        <Text style={styles.statusTitle}>Could not load aisle activity</Text>
                        <Text style={styles.statusText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => setReloadToken((value) => value + 1)}>
                            <Text style={styles.retryText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loading && !error && aisleVisits.length === 0 && (
                    <View style={styles.statusPanel}>
                        <Text style={styles.statusTitle}>No aisle activity yet</Text>
                        <Text style={styles.statusText}>Customer route visits will appear here after the first completed route.</Text>
                    </View>
                )}

                {!loading && !error && aisleVisits.length > 0 && scoreboard.length === 0 && (
                    <View style={styles.statusPanel}>
                        <Text style={styles.statusTitle}>No visits in this period</Text>
                        <Text style={styles.statusText}>
                            {selectedPeriod === 'Today'
                                ? 'No customer route has touched an aisle today yet. Try a longer window.'
                                : `No customer route touched an aisle in the last ${selectedPeriod}.`}
                        </Text>
                    </View>
                )}

                {!loading && !error && scoreboard.length > 0 && <>
                <View style={styles.hotCard}>
                    <View style={styles.hotCardTop}>
                        <Text style={styles.hotLabel}>HOT AISLE</Text>
                    </View>
                    <Text style={styles.hotAisleName}>{hotAisle?.aisle || 'No aisle data yet'}</Text>
                    <Text style={styles.hotAisleMeta}>
                        {hotAisle ? `${hotAisle.visits} customer route visits · ${selectedPeriod.toUpperCase()}` : 'Waiting for route data'}
                    </Text>
                    <View style={styles.hotProgressTrack}>
                        <View style={styles.hotProgressFill} />
                    </View>
                    <Text style={styles.hotHint}>Prioritise displays and replenishment here first.</Text>
                </View>

                <View style={styles.metricRow}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricValue}>{totalVisits}</Text>
                        <Text style={styles.metricLabel}>ROUTE VISITS</Text>
                    </View>
        
                    <View style={styles.metricCard}>
                        <Text style={styles.metricValue}>{averageVisits}</Text>
                        <Text style={styles.metricLabel}>AVG. VISITS</Text>
                    </View>
                </View>

                <View style={styles.scoreboardHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Most Visited Aisles</Text>
                        <Text style={styles.sectionSubtitle}>Ranked by customer route visits</Text>
                    </View>
                    <Text style={styles.periodCaption}>{selectedPeriod.toUpperCase()}</Text>
                </View>

                <View style={styles.scoreboard}>
                    {scoreboard.map((item, index) => {
                        const share = hotAisle ? item.visits / hotAisle.visits : 0;
                        return (
                            <View key={item.code || item.aisle} style={styles.scoreRow}>
                                <Text style={[styles.rank, index === 0 && styles.rankHot]}>{String(index + 1).padStart(2, '0')}</Text>
                                <View style={styles.scoreDetails}>
                                    <View style={styles.scoreNameRow}>
                                        <Text style={styles.aisleName}>{item.aisle}</Text>
                                        <Text style={styles.visitCount}>{item.visits}</Text>
                                    </View>
                                    <View style={styles.scoreTrack}>
                                        <View style={[styles.scoreFill, { width: `${Math.max(share * 100, 3)}%` }, index === 0 && styles.scoreFillHot]} />
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
                </>}
            </ScrollView>
        </SafeAreaView>
    );
};

export default SellerDashboardScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f7f5' },
    content: { padding: 22, paddingTop: 80, paddingBottom: 36 },
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
    menuItem: {
        marginVertical: 12,
    },
    menuText: {
        fontSize: 16,
        color: '#0d9488',
        fontWeight: '600',
    },
    signOutItem: {
        marginTop: 'auto',
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(13, 148, 136, 0.25)',
    },
    signOutText: {
        fontSize: 16,
        color: '#b91c1c',
        fontWeight: '600',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    eyebrow: { color: '#b45309', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
    title: { color: '#17211b', fontSize: 32, fontWeight: '800' },
    subtitle: { color: '#68746c', fontSize: 14, marginTop: 5, maxWidth: 235, lineHeight: 20 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f3e8', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#26834b', marginRight: 6 },
    liveText: { color: '#26834b', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    periodRow: { flexDirection: 'row', backgroundColor: '#e7ede9', borderRadius: 10, padding: 4, marginBottom: 18 },
    periodButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 7 },
    periodButtonActive: { backgroundColor: '#ffffff', shadowColor: '#17211b', shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
    periodText: { color: '#768078', fontSize: 13, fontWeight: '700' },
    periodTextActive: { color: '#17211b' },
    statusPanel: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e5ebe6', marginBottom: 14 },
    statusTitle: { color: '#344139', fontSize: 15, fontWeight: '800', textAlign: 'center' },
    statusText: { color: '#7b867e', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
    retryButton: { backgroundColor: '#1e3a2b', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, marginTop: 15 },
    retryText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    hotCard: { backgroundColor: '#1e3a2b', borderRadius: 18, padding: 21, marginBottom: 14 },
    hotCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hotLabel: { color: '#b8d6bd', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    flame: { color: '#f5c16c', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    hotAisleName: { color: '#ffffff', fontSize: 26, fontWeight: '800', marginTop: 16 },
    hotAisleMeta: { color: '#c7d8ca', fontSize: 13, marginTop: 5 },
    hotProgressTrack: { height: 7, backgroundColor: '#42614c', borderRadius: 4, marginTop: 21, overflow: 'hidden' },
    hotProgressFill: { width: '82%', height: '100%', backgroundColor: '#f5c16c', borderRadius: 4 },
    hotHint: { color: '#b8d6bd', fontSize: 12, marginTop: 11 },
    metricRow: { flexDirection: 'row', gap: 9, marginBottom: 28 },
    metricCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 13, padding: 14, borderWidth: 1, borderColor: '#e5ebe6' },
    metricValue: { color: '#17211b', fontSize: 22, fontWeight: '800' },
    metricLabel: { color: '#7b867e', fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginTop: 6 },
    scoreboardHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { color: '#17211b', fontSize: 20, fontWeight: '800' },
    sectionSubtitle: { color: '#7b867e', fontSize: 12, marginTop: 4 },
    periodCaption: { color: '#b45309', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    scoreboard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#e5ebe6' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: 1, borderBottomColor: '#eef2ef' },
    rank: { width: 30, color: '#9aa39c', fontSize: 12, fontWeight: '800' },
    rankHot: { color: '#b45309' },
    scoreDetails: { flex: 1 },
    scoreNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
    aisleName: { color: '#344139', fontSize: 14, fontWeight: '700' },
    visitCount: { color: '#17211b', fontSize: 14, fontWeight: '800' },
    scoreTrack: { height: 6, backgroundColor: '#edf1ed', borderRadius: 4, overflow: 'hidden' },
    scoreFill: { height: '100%', backgroundColor: '#9fc2a7', borderRadius: 4 },
    scoreFillHot: { backgroundColor: '#e2a94f' },
    footerNote: { backgroundColor: '#fff8ec', borderRadius: 13, padding: 15, marginTop: 16, borderWidth: 1, borderColor: '#f4e3c3' },
    footerTitle: { color: '#925d13', fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
    footerText: { color: '#765e36', fontSize: 13, lineHeight: 19, marginTop: 5 },
});