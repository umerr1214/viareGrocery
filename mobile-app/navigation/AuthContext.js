import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

// Drives which navigator stack renders, so login/logout and role changes are
// reflected automatically instead of via hard-coded navigation.navigate() calls
// in the screens.
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (!u) {
                setRole(null);
                setLoading(false);
                return;
            }

            // 1. Custom claim first. It is already inside the ID token, so this
            //    needs no Firestore read. Set server-side only, by
            //    bakend-api/scripts/makeStoreOwner.js.
            //    Wrapped because a token refresh can fail offline, and that must
            //    not stop us falling through to the doc lookup below.
            try {
                const tokenResult = await u.getIdTokenResult();
                if (tokenResult.claims && tokenResult.claims.role) {
                    setRole(tokenResult.claims.role);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn('Could not read token claims:', err.message);
            }

            // 2. Fall back to the users/{uid} doc, then to 'customer'.
            //    This read is wrapped deliberately: the live Firestore rules
            //    currently DENY client reads of `users`, so getDoc rejects with
            //    PERMISSION_DENIED rather than returning a missing snapshot. An
            //    unhandled rejection here would skip setLoading(false) and hang
            //    the app on the loading spinner forever for every non-owner.
            try {
                const snap = await getDoc(doc(db, 'users', u.uid));
                setRole(snap.exists() ? (snap.data().role || 'customer') : 'customer');
            } catch (err) {
                console.warn(`Could not read users/${u.uid}, defaulting to customer:`, err.message);
                setRole('customer');
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            // No need to clear user/role here - onAuthStateChanged fires and does it.
        } catch (err) {
            console.warn('Sign out failed:', err.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
