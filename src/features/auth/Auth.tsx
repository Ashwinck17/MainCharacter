import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useSystemStore } from '../../store/useSystemStore';
import { SystemCard } from '../../components/SystemCard';
import { motion } from 'framer-motion';
import { audio } from '../../utils/audioSystem';
import {
    auth,
    fetchStateFromCloud,
    deleteProfileFromCloud,
    fetchProfileList,
    saveProfileList,
} from '../../api/firebaseService';
import type { ProfileEntry } from '../../api/firebaseService';

export const AuthManager = () => {
    const { activeProfile, setActiveProfile, state, setState, createProfile, user } = useSystemStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileList, setProfileList] = useState<ProfileEntry[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // profile id pending delete
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

    // Fetch profile list from Firestore whenever the user logs in
    useEffect(() => {
        if (!user) { setProfileList([]); return; }
        const loadList = async () => {
            setListLoading(true);
            const cloudList = await fetchProfileList(user.uid);
            if (cloudList.length > 0) {
                // Cloud is the source of truth — update localStorage to match
                localStorage.setItem('ascension_profile_list', JSON.stringify(cloudList));
                setProfileList(cloudList);
            } else {
                // First login on this account: seed cloud from localStorage
                const localList: ProfileEntry[] = JSON.parse(
                    localStorage.getItem('ascension_profile_list') || '[]'
                );
                if (localList.length > 0) {
                    await saveProfileList(user.uid, localList);
                }
                setProfileList(localList);
            }
            setListLoading(false);
        };
        loadList();
    }, [user]);

    const handleAuth = async () => {
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (e: any) {
            setError(e.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        signOut(auth);
        setActiveProfile(null);
        setState(null);
    };

    const handleDelete = async (id: string) => {
        if (!user) return;

        setIsDeleting(id);
        const updated = profileList.filter(x => x.id !== id);

        try {
            // Sync deletions to Firestore first
            await Promise.all([
                deleteProfileFromCloud(user.uid, id),
                saveProfileList(user.uid, updated),
            ]);

            setIsDeleting(null);
            setDeleteSuccess(id);

            // Wait 1.5s to show success before removing from UI
            setTimeout(() => {
                setProfileList(updated);
                setConfirmDelete(null);
                setDeleteSuccess(null);
                localStorage.setItem('ascension_profile_list', JSON.stringify(updated));
                if (activeProfile === id) {
                    setActiveProfile(null);
                    setState(null);
                }
            }, 1500);

        } catch (err) {
            console.error(err);
            setIsDeleting(null);
            setConfirmDelete(null);
            alert("Delete failed. Please check your connection.");
        }
    };

    // ── Login screen ──────────────────────────────────────────────────────────
    if (!user) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="app-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 className="neon-text" style={{ textAlign: 'center' }}>SYSTEM IDENTITY</h1>
                <SystemCard title={isLogin ? "SIGN IN" : "CREATION"}>
                    <input
                        type="email"
                        placeholder="EMAIL@IDENTITY.COM"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ width: '100%', marginBottom: '15px', background: 'transparent', border: '1px solid #333', color: '#fff', padding: '10px' }}
                    />
                    <input
                        type="password"
                        placeholder="ACCESSKEY"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', marginBottom: '15px', background: 'transparent', border: '1px solid #333', color: '#fff', padding: '10px' }}
                    />
                    {error && <div className="neon-red" style={{ fontSize: '0.6rem', marginBottom: '15px' }}>{error}</div>}
                    <button onClick={handleAuth} disabled={loading} style={{ width: '100%' }}>
                        {loading ? "INITIALIZING..." : (isLogin ? "ENTER SYSTEM" : "ESTABLISH IDENTITY")}
                    </button>
                    <p onClick={() => setIsLogin(!isLogin)} style={{ textAlign: 'center', fontSize: '0.6rem', marginTop: '15px', cursor: 'pointer', opacity: 0.6 }}>
                        {isLogin ? "NO IDENTITY? [ ESTABLISH ]" : "ALREADY EXIST? [ LOG IN ]"}
                    </p>
                </SystemCard>
            </motion.div>
        );
    }

    // ── Profile picker ────────────────────────────────────────────────────────
    if (!activeProfile || !state) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="app-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 className="neon-text" style={{ margin: 0 }}>SYSTEM ACCESS</h1>
                    <span onClick={handleLogout} style={{ fontSize: '0.6rem', cursor: 'pointer', color: 'var(--accent-red)' }}>[ DE-SYNC ]</span>
                </div>

                <div style={{ padding: '15px', border: '1px solid var(--accent-gold)', marginBottom: '30px', background: 'rgba(255, 204, 0, 0.05)' }}>
                    <div className="neon-text" style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', marginBottom: '5px' }}>[ CLOUD STATUS: SYNCED ]</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Identity: <strong>{user.email}</strong>. Your stats are now mirrored across all systems.
                    </p>
                </div>

                <SystemCard title="ACTIVE LOADS">
                    {listLoading && (
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>SCANNING CLOUD FOR LOADS...</p>
                    )}
                    {!listLoading && profileList.length === 0 && (
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>NO PROFILES FOUND. INITIALIZE A NEW LOAD.</p>
                    )}

                    {!listLoading && profileList.map(p => (
                        <div key={p.id} style={{ marginBottom: '10px' }}>
                            {deleteSuccess === p.id ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', background: 'rgba(50, 205, 50, 0.1)', border: '1px solid limegreen' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'limegreen' }}>DELETE SUCCESS: "{p.name.toUpperCase()}" PURGED.</span>
                                </div>
                            ) : isDeleting === p.id ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', background: 'rgba(255,59,48,0.06)', border: '1px solid var(--accent-red)' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>PURGING "{p.name.toUpperCase()}"... [WAIT]</span>
                                </div>
                            ) : confirmDelete === p.id ? (
                                // Inline confirm — no window.confirm (blocked in PWA mode)
                                <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--accent-red)', padding: '10px', background: 'rgba(255,59,48,0.06)' }}>
                                    <span style={{ flex: 1, fontSize: '0.65rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center' }}>
                                        DELETE "{p.name.toUpperCase()}"? CANNOT BE UNDONE.
                                    </span>
                                    <button onClick={() => handleDelete(p.id)} style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(255,59,48,0.1)', padding: '4px 10px', fontSize: '0.6rem' }}>
                                        CONFIRM
                                    </button>
                                    <button onClick={() => setConfirmDelete(null)} disabled={isDeleting === p.id} style={{ padding: '4px 10px', fontSize: '0.6rem' }}>
                                        CANCEL
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={async () => {
                                        setLoading(true);
                                        const cloudData = await fetchStateFromCloud(user.uid, p.id);
                                        if (cloudData) {
                                            audio.playLevelUp();
                                            setState(cloudData);
                                            setActiveProfile(p.id);
                                        } else {
                                            audio.playError();
                                            alert("PROFILE DATA NOT FOUND IN CLOUD. Try creating a new profile.");
                                        }
                                        setLoading(false);
                                    }} style={{ flex: 1 }} disabled={loading}>
                                        {loading ? "FETCHING..." : `ACCESS: ${p.name.toUpperCase()}`}
                                    </button>
                                    <button onClick={() => setConfirmDelete(p.id)} style={{
                                        width: 'auto', padding: '0 12px',
                                        borderColor: 'var(--accent-red)', color: 'var(--accent-red)',
                                        background: 'rgba(255,59,48,0.05)', fontSize: '0.6rem', flexShrink: 0
                                    }}>
                                        [ DELETE ]
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={() => { const n = prompt("ENTER PROFILE IDENTITY:"); if (n) createProfile(n); }}
                        style={{ width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', marginTop: '10px' }}
                    >
                        + INITIALIZE NEW LOAD
                    </button>
                </SystemCard>
            </motion.div>
        );
    }

    return null;
};
