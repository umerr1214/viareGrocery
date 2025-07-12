import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { auth } from '../firebaseConfig';

const WelcomeScreen = ({ navigation }) => {
    const [listText, setListText] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const emailName = currentUser.email.split('@')[0];
            setUsername(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
    }, []);

    const pasteFromClipboard = async () => {
        const clipboardText = await Clipboard.getStringAsync();
        if (clipboardText) {
            setListText(clipboardText);
        } else {
            Alert.alert("Clipboard is empty!");
        }
    };

    const handleNext = () => {
        if (!listText.trim()) {
            Alert.alert("Please enter your grocery list.");
            return;
        }

        // Optionally split list into array and pass it to next screen
        const listArray = listText
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);

        const payload = {
            products: listArray,
        };

        //data cleaning here

        navigation.navigate('PathScreen', { products: listArray });
    };

    return (
        <KeyboardAvoidingView behavior="height" style={styles.container}>
        <Text style={styles.logo}>TeamRouter</Text>
            <Text style={styles.heading}>Welcome, {username} 👋</Text>
            <Text style={styles.subheading}>
                Enter your shopping list below to begin your smart grocery journey!
            </Text>

            <TextInput
                style={styles.textArea}
                placeholder="Paste or type your list here...\ne.g. Milk\nBread\nEggs"
                multiline
                value={listText}
                onChangeText={setListText}
            />

            <TouchableOpacity style={styles.pasteBtn} onPress={pasteFromClipboard}>
                <Text style={styles.pasteText}>📋 Paste from Clipboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextText}>Next ➡️</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 24,
        justifyContent: 'center',
    },
    logo: {
        fontSize: 24,
        fontWeight: '300',
        letterSpacing: 1,
        color: '#14b8a6',
        textAlign: 'center',
        marginBottom: 12,
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#111827',
        marginBottom: 8,
    },
    subheading: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 20,
    },
    textArea: {
        height: 180,
        borderColor: '#14b8a6',
        borderWidth: 2,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
    },
    pasteBtn: {
        marginTop: 15,
        paddingVertical: 12,
        backgroundColor: '#e0f7f5',
        borderRadius: 8,
        alignItems: 'center',
    },
    pasteText: {
        color: '#0d9488',
        fontWeight: '600',
    },
    nextBtn: {
        marginTop: 20,
        backgroundColor: '#0d9488',
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
    },
    nextText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
