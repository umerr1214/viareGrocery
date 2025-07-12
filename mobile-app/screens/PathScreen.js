import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';

const PathScreen = ({ route, navigation }) => {
    const { shoppingData } = route.params; // this contains { products: [...] }
    const [instructions, setInstructions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPath = async () => {
            try {
                const response = await fetch('http://192.168.0.80:3001/api/path', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shoppingData)
                });

                const data = await response.json();
                setInstructions(data.instructions); // array of strings
            } catch (err) {
                console.error(err);
                Alert.alert("Error", "Failed to fetch path. Check server or IP.");
            } finally {
                setLoading(false);
            }
        };

        fetchPath();
    }, []);

    const handleExit = () => navigation.navigate('Welcome');
    const handleRecommendations = () => navigation.navigate('Recommendations');

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <TouchableOpacity onPress={handleExit}>
                    <Text style={styles.navText}>← Exit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRecommendations}>
                    <Text style={styles.navText}>💡 AI Recommendations</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.heading}>🛒 Your Shopping Path</Text>

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
        padding: 20,
        paddingTop: 50
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    navText: {
        fontSize: 14,
        color: '#0d9488',
        fontWeight: 'bold'
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16
    },
    instruction: {
        fontSize: 16,
        paddingVertical: 6,
        color: '#111827'
    }
});
