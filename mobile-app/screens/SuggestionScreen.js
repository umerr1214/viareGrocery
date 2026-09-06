import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getAuthHeaders } from '../services/apiService';
import { useAuth } from '../navigation/AuthContext';

// Safely parse the AI recommendation. Gemini now returns a JSON string (JSON mode),
// but we still strip possible ```json fences and fall back to null on failure so the
// UI can gracefully render the raw text instead of crashing.
const parseRecommendation = (text) => {
    if (!text || typeof text !== 'string') return null;
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '');

    const tryParse = (str) => {
        try {
            const obj = JSON.parse(str);
            return obj && (Array.isArray(obj.products) || obj.bestPick) ? obj : null;
        } catch {
            return null;
        }
    };

    const direct = tryParse(cleaned);
    if (direct) return direct;

    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? tryParse(match[0]) : null;
};

const StarRating = ({ value = 0 }) => {
    const num = Number(value) || 0;
    const rounded = Math.max(0, Math.min(5, Math.round(num)));
    const stars = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
    return (
        <View style={styles.starRow}>
            <Text style={styles.stars}>{stars}</Text>
            <Text style={styles.ratingNum}>{num.toFixed(1)}</Text>
        </View>
    );
};

const ComparisonTable = ({ products }) => (
    <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cellProduct, styles.headerText]}>Product</Text>
            <Text style={[styles.cellRating, styles.headerText]}>Rating</Text>
            <Text style={[styles.cellPrice, styles.headerText]}>Price</Text>
        </View>
        {products.map((p, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <View style={styles.cellProduct}>
                    <Text style={styles.cellProductText} numberOfLines={2}>{p.name || '—'}</Text>
                    {p.brand ? <Text style={styles.cellBrandText}>{p.brand}</Text> : null}
                </View>
                <View style={styles.cellRating}>
                    <StarRating value={p.rating} />
                </View>
                <Text style={styles.cellPriceText} numberOfLines={2}>{p.price || '—'}</Text>
            </View>
        ))}
    </View>
);

const ProductDetails = ({ product }) => (
    <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>{product.name || 'Product'}</Text>
        {Array.isArray(product.pros) && product.pros.length > 0 && (
            <View style={styles.detailSection}>
                {product.pros.map((x, i) => (
                    <Text key={`pro-${i}`} style={styles.proItem}>✓  {x}</Text>
                ))}
            </View>
        )}
        {Array.isArray(product.cons) && product.cons.length > 0 && (
            <View style={styles.detailSection}>
                {product.cons.map((x, i) => (
                    <Text key={`con-${i}`} style={styles.conItem}>⚠  {x}</Text>
                ))}
            </View>
        )}
        {product.storage ? <Text style={styles.storageItem}>ℹ  {product.storage}</Text> : null}
    </View>
);

const BestPick = ({ pick }) => (
    <View style={styles.bestPick}>
        <Text style={styles.bestPickLabel}>🏆  BEST PICK</Text>
        <Text style={styles.bestPickName}>{pick.name || 'Recommended'}</Text>
        {pick.reason ? <Text style={styles.bestPickReason}>{pick.reason}</Text> : null}
    </View>
);

const SuggestScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState('');
    const [parsed, setParsed] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-200)).current;
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategoriesFromFirebase();
        getPermission();
    }, []);

    const fetchCategoriesFromFirebase = async () => {
        try {
            const docRef = doc(db, 'storeMaps', 'categoryList');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Assuming categories are stored as an array or object
                let categoryArray = [];
                
                if (Array.isArray(data)) {
                    // Handle nested array case
                    if (data.length > 0 && Array.isArray(data[0])) {
                        categoryArray = data[0].filter(Boolean);
                    } else {
                        categoryArray = data.filter(Boolean);
                    }
                } else if (typeof data === 'object') {
                    categoryArray = Object.values(data).filter(Boolean);
                }
                
                // Additional flattening in case the data structure is more complex
                if (categoryArray.length === 1 && Array.isArray(categoryArray[0])) {
                    categoryArray = categoryArray[0].filter(Boolean);
                }
                
                setCategories(categoryArray);
            } else {
                console.warn('No categories found in Firestore.');
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const getPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission required to access media library.');
        }
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        Animated.timing(slideAnim, {
            toValue: menuOpen ? -200 : 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    };

    const pickImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                alert('Media library permission is required to upload images. Please grant it in your device settings.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                allowsMultipleSelection: true,
                mediaTypes: ['images'],
                quality: 1,
            });

            if (!result.canceled && result.assets) {
                const selected = result.assets.map(asset => asset.uri);
                setImages(prev => [...prev, ...selected]);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            alert('Could not open the image picker: ' + (error?.message || 'unknown error'));
        }
    };

    const removeImage = (uriToRemove) => {
        setImages(images.filter(uri => uri !== uriToRemove));
    };

    const getRecommendations = async () => {
        if (images.length === 0) {
            alert("Please attach at least one product image.");
            return;
        }

        try {
            setLoading(true);
            setRecommendation('');
            setParsed(null);

            const formData = new FormData();
            images.forEach((uri, index) => {
                formData.append('files', {
                    uri,
                    name: `image${index}.jpg`,
                    type: 'image/jpeg',
                });
            });

            formData.append('category', selectedCategory);

            console.log('Sending request with:', {
                imagesCount: images.length,
                category: selectedCategory,
                endpoint: 'http://192.168.18.140:3000/api/suggest-direct'
            });

            const response = await fetch('http://192.168.18.140:3000/api/suggest-direct', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    // /api/suggest-direct now requires a valid Firebase ID token
                    ...(await getAuthHeaders()),
                },
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                setRecommendation(`Error: ${response.status} - ${errorText}`);
                return;
            }

            const data = await response.json();
            console.log('Response data:', data);
            const raw = data?.recommendation || "No response from AI.";
            setRecommendation(raw);
            setParsed(parseRecommendation(raw));
        } catch (error) {
            console.error('Request error:', error);
            setRecommendation("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Recommend')} style={styles.menuItem}>
                    <Text style={styles.menuText}>Home</Text>
                </TouchableOpacity>

                {/* Bottom-anchored via signOutItem's marginTop:'auto' on the full-height drawer */}
                <TouchableOpacity onPress={logout} style={styles.signOutItem}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </Animated.View>

            <Text style={styles.heading}>Get Recommendations</Text>
            <Text style={styles.subheading}>
                Upload product images and let Viare AI recommend the best one for you.
            </Text>

            <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Text style={styles.attachText}>Upload Images</Text>
            </TouchableOpacity>

            <ScrollView horizontal style={styles.imagePreview}>
                {images.map((img, i) => (
                    <View key={i} style={styles.imageWrapper}>
                        <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(img)}>
                            <Text style={styles.removeText}>×</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.subheading}>Select Category</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select category" value="" />
                    {categories.map((cat, i) => (
                        <Picker.Item label={cat} value={cat} key={i} />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity style={styles.recommendBtn} onPress={getRecommendations}>
                <Text style={styles.recommendText}>Get Recommendations</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 20 }} />}

            {recommendation !== '' && (
                <View style={styles.resultContainer}>
                    {parsed ? (
                        <>
                            {parsed.bestPick && (parsed.bestPick.name || parsed.bestPick.reason) ? (
                                <BestPick pick={parsed.bestPick} />
                            ) : null}

                            {Array.isArray(parsed.products) && parsed.products.length > 0 ? (
                                <>
                                    <Text style={styles.sectionLabel}>Product Comparison</Text>
                                    <ComparisonTable products={parsed.products} />
                                    {parsed.products.map((p, i) => (
                                        <ProductDetails key={i} product={p} />
                                    ))}
                                </>
                            ) : null}
                        </>
                    ) : (
                        <View style={styles.resultBox}>
                            <Text style={styles.resultText}>{recommendation}</Text>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

export default SuggestScreen;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
    },
    heading: {
        paddingTop: 60,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    subheading: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 12,
    },
    attachBtn: {
        backgroundColor: '#e0f7f5',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 10,
    },
    attachText: {
        color: '#0d9488',
        fontWeight: '600',
    },
    imagePreview: {
        flexDirection: 'row',
        marginBottom: 10,
        marginTop: 10,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 10,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    removeBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#f87171',
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    removeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        backgroundColor: '#fff',
        marginBottom:10,
        width: '100%',
    },
    picker: {
        width: '100%',
        height: 50,
    },
    recommendBtn: {
        backgroundColor: '#0d9488',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 999,
        marginBottom: 20,
        marginTop: 10,
    },
    recommendText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    resultBox: {
        marginTop: 10,
        backgroundColor: '#e0f2f1',
        padding: 16,
        borderRadius: 8,
        width: '100%',
    },
    resultText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
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

    // ---- Structured recommendation UI ----
    resultContainer: {
        marginTop: 10,
        width: '100%',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f766e',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 18,
        marginBottom: 8,
    },
    bestPick: {
        backgroundColor: '#0d9488',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        shadowColor: '#0d9488',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    bestPickLabel: {
        color: '#ccfbf1',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6,
    },
    bestPickName: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
    },
    bestPickReason: {
        color: '#e6fffb',
        fontSize: 14,
        marginTop: 4,
        lineHeight: 20,
    },
    table: {
        width: '100%',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tableRowAlt: {
        backgroundColor: '#f1f5f9',
    },
    tableHeader: {
        backgroundColor: '#0f766e',
    },
    headerText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cellProduct: {
        flex: 3,
        paddingRight: 6,
    },
    cellProductText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    cellBrandText: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2,
    },
    cellRating: {
        flex: 2,
        alignItems: 'center',
        textAlign: 'center',
    },
    cellPrice: {
        flex: 2,
        textAlign: 'right',
    },
    cellPriceText: {
        flex: 2,
        textAlign: 'right',
        fontSize: 12,
        color: '#111827',
        fontWeight: '600',
    },
    starRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stars: {
        color: '#f59e0b',
        fontSize: 13,
        letterSpacing: 1,
    },
    ratingNum: {
        color: '#374151',
        fontSize: 11,
        marginLeft: 4,
        fontWeight: '600',
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        marginTop: 10,
        width: '100%',
    },
    detailTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    detailSection: {
        marginBottom: 6,
    },
    proItem: {
        fontSize: 13,
        color: '#15803d',
        lineHeight: 20,
    },
    conItem: {
        fontSize: 13,
        color: '#b45309',
        lineHeight: 20,
    },
    storageItem: {
        fontSize: 13,
        color: '#0f766e',
        lineHeight: 20,
        marginTop: 4,
    },
});
