import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Image,
    Modal,
    Dimensions,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';

const PathScreen = ({ route, navigation }) => {
    const { shoppingData } = route.params;
    const [instructions, setInstructions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const slideAnim = useState(new Animated.Value(-200))[0];

    useEffect(() => {
        const fetchPath = async () => {
            try {
                const response = await fetch('http://192.168.18.140:3000/api/path', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shoppingData),
                });

                const data = await response.json();
                setInstructions(data.instructions);
            } catch (err) {
                console.error(err);
                Alert.alert("Error", "Failed to fetch path. Check server or IP.");
            } finally {
                setLoading(false);
            }
        };

        fetchPath();
    }, []);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        Animated.timing(slideAnim, {
            toValue: menuOpen ? -200 : 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    };

    const handleExit = () => navigation.navigate('Welcome');
    const handleRecommendations = () => navigation.navigate('Recommend');

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>

            <TouchableOpacity onPress={handleRecommendations} style={styles.menuItem}>
                <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
                <TouchableOpacity onPress={handleExit} style={styles.menuItem}>
                    <Text style={styles.menuText}>New List</Text>
                </TouchableOpacity>
            </Animated.View>

            <Text style={styles.heading}>Your Shopping Path</Text>

            {/* Store Map Preview */}
            <View style={styles.mapContainer}>
                <TouchableOpacity onPress={() => setMapModalVisible(true)} style={styles.mapTouchable}>
                    <Image
                        source={require('../assets/store-map.png')}
                        style={styles.storeMap}
                        resizeMode="contain"
                        onLoad={() => console.log('Map image loaded successfully')}
                        onError={(error) => {
                            console.log('Map image error:', error);
                            Alert.alert('Error', 'Failed to load store map image');
                        }}
                    />
                    <View style={styles.zoomHint}>
                        <Text style={styles.zoomHintText}>Tap to zoom</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#14b8a6" />
            ) : (
                <FlatList
                    data={instructions}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Text style={styles.instruction}>• {item}</Text>
                    )}
                />
            )}

            {/* Zoomable Map Modal */}
            <Modal
                visible={mapModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMapModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Store Map</Text>
                        <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalScrollView}>
                        <ImageZoom
                            cropWidth={Dimensions.get('window').width}
                            cropHeight={Dimensions.get('window').height - 100}
                            imageWidth={Dimensions.get('window').width * 1.5}
                            imageHeight={Dimensions.get('window').height * 1.2}
                            minScale={1}
                            maxScale={3}
                            enableCenterFocus={false}
                        >
                            <Image
                                source={require('../assets/store-map.png')}
                                style={{
                                    width: Dimensions.get('window').width * 1.5,
                                    height: Dimensions.get('window').height * 1.2,
                                    resizeMode: 'contain',
                                    borderRadius: 8,
                                    backgroundColor: '#f5f5f5',
                                }}
                            />
                        </ImageZoom>

                        <View style={styles.zoomHint}>
                            <Text style={styles.zoomHintText}>Pinch or double-tap to zoom</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default PathScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    heading: {
        paddingTop: 50,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    instruction: {
        fontSize: 16,
        paddingVertical: 6,
        color: '#111827',
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
    mapContainer: {
        marginVertical: 16,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    storeMap: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    mapTouchable: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    zoomHint: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    zoomHintText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    modalScrollView: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
});