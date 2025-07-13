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
import * as FileSystem from 'expo-file-system';

const AlternativeScreen = ({ navigation }) => {
    const [image, setImage] = useState(null);
    const [productName, setProductName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
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
            mediaTypes: ImagePicker.MediaType.Images,
            allowsMultipleSelection: false,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const getAlternatives = async () => {
        if (!image && (!productName || !selectedCategory || !selectedBrand)) {
            Alert.alert('Input Required', 'Upload a product image or fill in product name, category, and brand.');
            return;
        }

        setLoading(true);
        setAiResponse('');

        try {
            let imageBase64 = null;
            
            if (image) {
                const base64 = await FileSystem.readAsStringAsync(image, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                imageBase64 = `data:image/jpeg;base64,${base64}`;
            }

            const requestBody = {
                image: imageBase64,
                productName: productName,
                category: selectedCategory,
                brand: selectedBrand,
            };

            const response = await fetch('http://192.168.18.95:3001/api/alternatives', {
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
                <View style={styles.resultBox}>
                    <Text style={styles.responseText}>{aiResponse}</Text>
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
