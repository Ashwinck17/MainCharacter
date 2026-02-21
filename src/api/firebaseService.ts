import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

export const saveStateToCloud = async (userId: string, profileId: string, state: any) => {
    try {
        await setDoc(doc(db, "users", userId, "profiles", profileId), state);
    } catch (error) {
        console.error("Cloud Save Error:", error);
    }
};

export const fetchStateFromCloud = async (userId: string, profileId: string) => {
    try {
        const docSnap = await getDoc(doc(db, "users", userId, "profiles", profileId));
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (error) {
        console.error("Cloud Fetch Error:", error);
    }
    return null;
};
