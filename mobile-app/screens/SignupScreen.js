navigation.navigate('Signup');
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // adjust if in a different path

const SignupScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert('Success', 'Account created successfully!');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert('Signup Failed', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.logo}>Viare Grocery</Text>
            <Text style={styles.heading}>GET ON BOARD!</Text>
            <Text style={styles.subheading}>CREATE AN ACCOUNT</Text>

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

            <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
                <Text style={styles.linkText}>
                    Already a user?{' '}
                    <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
                        Sign in here
                    </Text>
                </Text>
            </View>
        </View>
    );
};

export default SignupScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 20,
        justifyContent: 'center',
    },
    logo: {
        fontSize: 28,
        fontWeight: '300',
        color: '#14b8a6',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 20,
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
