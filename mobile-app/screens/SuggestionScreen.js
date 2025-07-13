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

const SuggestScreen = ({ navigation }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState('');
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
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled && result.assets) {
            const selected = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...selected]);
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
                endpoint: 'http://192.168.18.95:3001/api/suggest-direct'
            });

            const response = await fetch('http://192.168.18.95:3001/api/suggest-direct', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
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
            setRecommendation(data?.recommendation || "No response from AI.");
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
                <View style={styles.resultBox}>
                    <Text style={styles.resultText}>{recommendation}</Text>
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
});
