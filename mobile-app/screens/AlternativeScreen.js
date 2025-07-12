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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { getDatabase, ref, get } from 'firebase/database'; // For Firebase Realtime DB

const AlternativeScreen = ({ navigation }) => {
    const [image, setImage] = useState(null);
    const [productName, setProductName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useState(new Animated.Value(-200))[0];

    useEffect(() => {
        fetchCategoriesFromFirebase();
    }, []);

    const fetchCategoriesFromFirebase = async () => {
        try {
            const db = getDatabase();
            const snapshot = await get(ref(db, '/products'));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const uniqueCategories = [
                    ...new Set(Object.values(data).map((item) => item.category)),
                ];
                setCategories(uniqueCategories);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: false,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const getAlternatives = async () => {
        if (!image && (!productName || !selectedCategory)) {
            alert('Upload a product image or fill in product name and category.');
            return;
        }

        setLoading(true);
        setAiResponse('');

        try {
            // Fake delay and dummy AI logic (replace with real backend call)
            setTimeout(() => {
                setAiResponse(
                    `✅ Based on the available brands in the "${selectedCategory}" category, the best alternative to "${productName}" is "Dairy Pure Milk" — offering better price, freshness, and nutrition.`
                );
                setLoading(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            setAiResponse('Error getting alternatives. Try again.');
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

            <Text style={styles.subheading}>Upload a product image</Text>
            <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Text style={styles.attachText}>Select Image</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

            <Text style={styles.subheading}>Or type product name & select category</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={productName}
                onChangeText={setProductName}
            />

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
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        borderRadius: 6,
        marginBottom: 20,
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
