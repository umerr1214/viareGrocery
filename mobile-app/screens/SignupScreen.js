import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert, Image
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig'; // adjust if in a different path

const SignupScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSignup = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: name
            });

            // users/{uid} is the client-readable source of truth for the role.
            // Only 'customer' is ever written here: the `role` custom claim the
            // backend checks can only be set with the Admin SDK, and the Firestore
            // rules forbid changing the role field afterwards - so a client can
            // never promote itself to store_owner.
            //
            // Deliberately non-fatal. By this point the auth account already
            // exists, so surfacing a rules/permissions failure as "Signup Failed"
            // would leave the user stuck (retrying gives "email already in use").
            // A missing doc is handled downstream - AuthContext falls back to
            // 'customer' - so we log and carry on.
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    email,
                    name,
                    role: 'customer',
                    createdAt: Date.now(),
                });
            } catch (docError) {
                console.warn(`Could not create users/${user.uid} profile doc:`, docError.message);
            }

            // createUserWithEmailAndPassword already signs the user in, so
            // onAuthStateChanged fires and AppNavigator swaps to the customer
            // stack on its own - sending them to Login here would be a step back.
            Alert.alert('Success', 'Account created successfully!');
        } catch (error) {
            Alert.alert('Signup Failed', error.message);
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
            <Text style={styles.heading}>GET ON BOARD!</Text>
            <Text style={styles.subheading}>CREATE AN ACCOUNT</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What shall we call you?"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />
            </View>

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
