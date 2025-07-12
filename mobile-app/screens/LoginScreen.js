import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            Alert.alert('Login Successful!', 'Welcome back!');
            navigation.navigate('Recommend'); // Navigate to Welcome screen
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoRow}>
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.logoText}>Viare Grocery</Text>
            </View>
            <Text style={styles.heading}>WELCOME BACK!</Text>
            <Text style={styles.subheading}>SIGN IN TO CONTINUE</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
                <Text style={styles.linkText}>
                    New user?{' '}
                    <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
                        Sign up here
                    </Text>
                </Text>
            </View>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 20,
        justifyContent: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    logoImage: {
        width: 48,
        height: 48,
        marginRight: 8,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '300',
        letterSpacing: 1,
        color: '#14b8a6',
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    subheading: {
        fontSize: 18,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 30,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#0d9488',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderColor: '#14b8a6',
        borderRadius: 6,
        padding: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#0d9488',
        paddingVertical: 12,
        borderRadius: 999,
        marginTop: 20,
        width: '60%',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
        textAlign: 'center',
    },
    divider: {
        marginTop: 30,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        color: '#6b7280',
    },
    link: {
        color: '#0d9488',
        textDecorationLine: 'underline',
    },
});
