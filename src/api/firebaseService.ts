import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import type { SystemState } from "../types";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyA7g9AdI-Ob4eIGxb_1jjXSd8_bWiZAyGg",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "ascension-system-7aa31.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "ascension-system-7aa31",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "ascension-system-7aa31.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "606861832676",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:606861832676:web:2b4533c22bfdd9e949d7f1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/** 
 * Real-time Cloud Synchronization
 * Enterprise standard: Single Source of Truth in Firestore
 */

export type ProfileEntry = { id: string; name: string };

/** Save the full profile directory for this user to Firestore */
export const saveProfileList = async (userId: string, profiles: ProfileEntry[]): Promise<void> => {
    if (!userId) return;
    try {
        await setDoc(doc(db, "users", userId, "_index", "profiles"), { list: profiles }, { merge: false });
    } catch (error) {
        console.error("Profile List Save Error:", error);
        throw error;
    }
};

/** Fetch the profile directory from Firestore — works on any device */
export const fetchProfileList = async (userId: string): Promise<ProfileEntry[]> => {
    if (!userId) return [];
    try {
        const snap = await getDoc(doc(db, "users", userId, "_index", "profiles"));
        if (snap.exists()) return snap.data().list as ProfileEntry[];
        return [];
    } catch (error) {
        console.error("Profile List Fetch Error:", error);
        return [];
    }
};

export const subscribeToProfileList = (
    userId: string,
    onUpdate: (profiles: ProfileEntry[]) => void
) => {
    if (!userId) return () => { };
    return onSnapshot(doc(db, "users", userId, "_index", "profiles"), (docSnap) => {
        if (docSnap.exists()) {
            onUpdate((docSnap.data().list || []) as ProfileEntry[]);
        } else {
            onUpdate([]);
        }
    });
};

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

export const fetchStateFromCloud = async (userId: string, profileId: string): Promise<SystemState | null> => {
    if (!userId || !profileId) return null;
    try {
        const docSnap = await getDoc(doc(db, "users", userId, "profiles", profileId));
        if (docSnap.exists()) {
            return docSnap.data() as SystemState;
        }
        return null;
    } catch (error) {
        console.error("Cloud Fetch Error:", error);
        return null;
    }
};

export const deleteProfileFromCloud = async (userId: string, profileId: string): Promise<void> => {
    if (!userId || !profileId) return;
    try {
        await deleteDoc(doc(db, "users", userId, "profiles", profileId));
    } catch (error) {
        console.error("Cloud Delete Error:", error);
        throw error;
    }
};

