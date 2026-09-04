import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Safely parse the AI alternatives response. Gemini now returns a JSON string (JSON mode),
// but we still strip possible ```json fences and fall back to null on failure so the UI can
// gracefully render the raw text instead of crashing.
const parseAlternatives = (text) => {
    if (!text || typeof text !== 'string') return null;
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '');

    const tryParse = (str) => {
        try {
            const obj = JSON.parse(str);
            return obj && (Array.isArray(obj.alternatives) || obj.identifiedProduct || obj.bestAlternative) ? obj : null;
        } catch {
            return null;
        }
    };

    const direct = tryParse(cleaned);
    if (direct) return direct;

    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? tryParse(match[0]) : null;
};

const IdentifiedProduct = ({ name }) => (
    <View style={styles.identifiedBox}>
        <Text style={styles.identifiedLabel}>🔍  PRODUCT IDENTIFIED</Text>
        <Text style={styles.identifiedName}>{name}</Text>
    </View>
);

const BestAlternative = ({ pick }) => (
    <View style={styles.bestAlt}>
        <Text style={styles.bestAltLabel}>🏆  BEST ALTERNATIVE</Text>
        <Text style={styles.bestAltName}>{pick.name || 'Recommended'}</Text>
        {pick.reason ? <Text style={styles.bestAltReason}>{pick.reason}</Text> : null}
    </View>
);

const AlternativeCard = ({ alt, index }) => (
    <View style={styles.altCard}>
        <View style={styles.altHeader}>
            <View style={styles.altBadge}>
                <Text style={styles.altBadgeText}>{index + 1}</Text>
            </View>
            <View style={styles.altTitleWrap}>
                <Text style={styles.altName}>{alt.name || 'Alternative'}</Text>
                {alt.brand ? <Text style={styles.altBrand}>{alt.brand}</Text> : null}
            </View>
        </View>
        {alt.similarity ? (
            <View style={styles.altSection}>
                <Text style={styles.altSectionLabel}>Similarity</Text>
                <Text style={styles.altSimilarity}>{alt.similarity}</Text>
            </View>
        ) : null}
        {Array.isArray(alt.benefits) && alt.benefits.length > 0 ? (
            <View style={styles.altSection}>
                <Text style={styles.altSectionLabel}>Key Benefits</Text>
                {alt.benefits.map((b, i) => (
                    <Text key={i} style={styles.altBenefit}>✓  {b}</Text>
                ))}
            </View>
        ) : null}
    </View>
);

const AlternativeScreen = ({ navigation }) => {
    const [image, setImage] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [productName, setProductName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [parsed, setParsed] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useState(new Animated.Value(-200))[0];

    useEffect(() => {
        fetchCategoriesFromFirestore();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchBrandsFromFirestore(selectedCategory);
        }
    }, [selectedCategory]);

    const fetchCategoriesFromFirestore = async () => {
        try {
            const categoryBrandsRef = collection(db, 'categoryBrands');
            const snapshot = await getDocs(categoryBrandsRef);
            
            const categoryList = [];
            snapshot.forEach((doc) => {
                categoryList.push(doc.id);
            });
            
            setCategories(categoryList);
        } catch (err) {
            console.error('Failed to fetch categories from Firestore:', err);
            setCategories([
                'Dairy & Eggs',
                'Bread & Bakery',
                'Fruits & Vegetables',
                'Meat & Seafood',
                'Pantry & Staples',
                'Snacks & Beverages',
                'Frozen Foods',
                'Household & Cleaning',
                'Personal Care',
                'Baby & Kids'
            ]);
        }
    };

    const fetchBrandsFromFirestore = async (category) => {
        try {
            const categoryDoc = doc(db, 'categoryBrands', category);
            const categorySnapshot = await getDoc(categoryDoc);
            
            if (categorySnapshot.exists()) {
                const categoryData = categorySnapshot.data();
                
                let brandList = [];
                
                if (categoryData.brands && Array.isArray(categoryData.brands)) {
                    brandList = categoryData.brands;
                } else if (Array.isArray(categoryData)) {
                    brandList = categoryData;
                } else if (typeof categoryData === 'object') {
                    brandList = Object.keys(categoryData);
                } else if (typeof categoryData === 'string') {
                    try {
                        const parsed = JSON.parse(categoryData);
                        brandList = Array.isArray(parsed) ? parsed : Object.keys(parsed);
                    } catch (e) {
                        brandList = [categoryData];
                    }
                }
                
                setBrands(brandList);
            } else {
                try {
                    const brandsRef = collection(db, 'categoryBrands', category, 'brands');
                    const brandsSnapshot = await getDocs(brandsRef);
                    const brandList = [];
                    brandsSnapshot.forEach((doc) => {
                        brandList.push(doc.id);
                    });
                    setBrands(brandList);
                } catch (subErr) {
                    setBrands([]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch brands from Firestore:', err);
            setBrands([]);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: false,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setImageBase64(result.assets[0].base64);
        }
    };

    const getAlternatives = async () => {
        if (!image && (!productName || !selectedCategory || !selectedBrand)) {
            Alert.alert('Input Required', 'Upload a product image or fill in product name, category, and brand.');
            return;
        }

        setLoading(true);
        setAiResponse('');
        setParsed(null);

        try {
            let imageDataUri = null;

            if (image && imageBase64) {
                imageDataUri = `data:image/jpeg;base64,${imageBase64}`;
            }

            const requestBody = {
                image: imageDataUri,
                productName: productName,
                category: selectedCategory,
                brand: selectedBrand,
            };

            const response = await fetch('http://192.168.18.140:3000/api/alternatives', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.alternative) {
                setAiResponse(data.alternative);
                setParsed(parseAlternatives(data.alternative));
            } else {
                throw new Error(data.error || 'No response from AI');
            }
        } catch (error) {
            console.error('Error getting alternatives:', error);
            Alert.alert('Error', 'Failed to get alternatives. Please try again.');
            setAiResponse('Error getting alternatives. Please try again.');
        } finally {
            setLoading(false);
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

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Recommend')} style={styles.menuItem}>
                    <Text style={styles.menuText}>Home</Text>
                </TouchableOpacity>
            </Animated.View>

            <Text style={styles.heading}>Get Product Alternatives</Text>

            <Text style={styles.subheading}>Upload a product image (Optional)</Text>
            <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Text style={styles.attachText}>Select Image</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

            <Text style={styles.subheading}>Enter product details</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter product name (e.g., 'Milk', 'Bread')"
                value={productName}
                onChangeText={setProductName}
            />

            <Text style={styles.subheading}>Select Category</Text>
            <View style={styles.pickerContainer}>
            <Picker
                selectedValue={selectedCategory}
                    onValueChange={(itemValue) => {
                        setSelectedCategory(itemValue);
                        setSelectedBrand('');
                    }}
                style={styles.picker}
                    mode="dropdown"
            >
                <Picker.Item label="Select category" value="" />
                {categories.map((cat, i) => (
                    <Picker.Item label={cat} value={cat} key={i} />
                ))}
            </Picker>
            </View>

            {selectedCategory && (
                <>
                    <Text style={styles.subheading}>Select Brand</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedBrand}
                            onValueChange={(itemValue) => {
                                setSelectedBrand(itemValue);
                            }}
                            style={styles.picker}
                            mode="dropdown"
                        >
                            <Picker.Item label="Select brand" value="" />
                            {brands.map((brand, i) => (
                                <Picker.Item label={brand} value={brand} key={i} />
                            ))}
                        </Picker>
                    </View>
                </>
            )}

            <TouchableOpacity style={styles.recommendBtn} onPress={getAlternatives}>
                <Text style={styles.recommendText}>Find Best Alternative</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 20 }} />}

            {aiResponse !== '' && (
                <View style={styles.resultContainer}>
                    {parsed ? (
                        <>
                            {parsed.identifiedProduct ? (
                                <IdentifiedProduct name={parsed.identifiedProduct} />
                            ) : null}
                            {parsed.bestAlternative && (parsed.bestAlternative.name || parsed.bestAlternative.reason) ? (
                                <BestAlternative pick={parsed.bestAlternative} />
                            ) : null}
                            {Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0 ? (
                                <>
                                    <Text style={styles.sectionLabel}>Alternatives to consider</Text>
                                    {parsed.alternatives.map((alt, i) => (
                                        <AlternativeCard key={i} alt={alt} index={i} />
                                    ))}
                                </>
                            ) : null}
                        </>
                    ) : (
                        <View style={styles.resultBox}>
                            <Text style={styles.responseText}>{aiResponse}</Text>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

export default AlternativeScreen;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f9fafb',
        padding: 24,
    },
    heading: {
        paddingTop:50,
        fontSize: 22,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    subheading: {
        paddingTop:20,
        fontSize: 16,
        textAlign: 'center',
        color: '#374151',
        marginBottom: 8,
    },
    attachBtn: {
        backgroundColor: '#e0f7f5',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    attachText: {
        color: '#0d9488',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
        height: 50,
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        borderRadius: 6,
        marginBottom: 20,
        height: 50,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 20,
        backgroundColor: '#fff',
        height: 50,
    },
    recommendBtn: {
        backgroundColor: '#0d9488',
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
        marginBottom: 20,
    },
    recommendText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    resultBox: {
        backgroundColor: '#e0f2f1',
        padding: 16,
        borderRadius: 8,
    },
    responseText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    // ---- Structured alternatives UI ----
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
    identifiedBox: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        padding: 14,
        width: '100%',
    },
    identifiedLabel: {
        color: '#0f766e',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    identifiedName: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '700',
    },
    bestAlt: {
        backgroundColor: '#0d9488',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        width: '100%',
        shadowColor: '#0d9488',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    bestAltLabel: {
        color: '#ccfbf1',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6,
    },
    bestAltName: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
    },
    bestAltReason: {
        color: '#e6fffb',
        fontSize: 14,
        marginTop: 4,
        lineHeight: 20,
    },
    altCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        marginBottom: 12,
        width: '100%',
    },
    altHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    altBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0d9488',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    altBadgeText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 14,
    },
    altTitleWrap: {
        flex: 1,
    },
    altName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    altBrand: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    altSection: {
        marginBottom: 8,
    },
    altSectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0f766e',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    altSimilarity: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
    },
    altBenefit: {
        fontSize: 13,
        color: '#15803d',
        lineHeight: 20,
    },
    imagePreview: {
        width: 120,
        height: 120,
        borderRadius: 8,
        marginBottom: 16,
        alignSelf: 'center',
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
});