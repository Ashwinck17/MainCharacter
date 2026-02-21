import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// TODO: User must provide these credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/** 
 * Real-time Cloud Synchronization
 * Enterprise standard: Single Source of Truth in Firestore
 */

export const saveProfileData = async (userId: string, profileId: string, state: any) => {
    if (!userId || !profileId) return;
    try {
        await setDoc(doc(db, "users", userId, "profiles", profileId), state, { merge: true });
    } catch (error) {
        console.error("Cloud Save Error:", error);
    }
};

export const subscribeToProfile = (
    userId: string,
    profileId: string,
    onUpdate: (data: any) => void
) => {
    if (!userId || !profileId) return () => { };
    // Real-time listener: Listen for changes from other devices
    return onSnapshot(doc(db, "users", userId, "profiles", profileId), (docSnap) => {
        if (docSnap.exists()) {
            onUpdate(docSnap.data());
        }
    });
};

export const subscribeToAuth = (onUpdate: (user: User | null) => void) => {
    return onAuthStateChanged(auth, onUpdate);
};
