import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
    Easing
} from 'react-native';

const PathScreen = ({ route, navigation }) => {
    const { shoppingData } = route.params;
    const [instructions, setInstructions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useState(new Animated.Value(-200))[0];

    useEffect(() => {
        const fetchPath = async () => {
            try {
                const response = await fetch('http://192.168.0.80:3001/api/path', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shoppingData)
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
            easing: Easing.out(Easing.ease)
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
        </View>
    );
};

export default PathScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: 50,
        paddingHorizontal: 20
    },
    heading: {
        paddingTop: 50,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16
    },
    instruction: {
        fontSize: 16,
        paddingVertical: 6,
        color: '#111827'
    },
    menuButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10
    },
    menuIcon: {
        fontSize: 26,
        color: '#0d9488'
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
        zIndex: 9
    },
    menuItem: {
        marginVertical: 12
    },
    menuText: {
        fontSize: 16,
        color: '#0d9488',
        fontWeight: '600'
    }
});
