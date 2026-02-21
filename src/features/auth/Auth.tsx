import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useSystemStore } from '../../store/useSystemStore';
import { SystemCard } from '../../components/SystemCard';
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

    // Fetch profile list from Firestore whenever the user logs in
    useEffect(() => {
        if (!user) {
            setProfileList([]);
            return;
        }
        const loadList = async () => {
            setListLoading(true);
            // 1. Fetch cloud list (works on any device)
            const cloudList = await fetchProfileList(user.uid);
            // 2. Merge with any local-only entries (backwards compat)
            const localList: ProfileEntry[] = JSON.parse(
                localStorage.getItem('ascension_profile_list') || '[]'
            );
            const merged = [...cloudList];
            for (const local of localList) {
                if (!merged.some(c => c.id === local.id)) {
                    merged.push(local);
                }
            }
            // 3. Persist the merged result everywhere
            localStorage.setItem('ascension_profile_list', JSON.stringify(merged));
            if (merged.length !== cloudList.length) {
                await saveProfileList(user.uid, merged); // back-fill cloud if local had extras
            }
            setProfileList(merged);
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

    const handleDelete = async (p: ProfileEntry) => {
        const confirmed = window.confirm(`DELETE "${p.name.toUpperCase()}"? This cannot be undone.`);
        if (!confirmed || !user) return;
        const updated = profileList.filter(x => x.id !== p.id);
        // Sync everywhere
        setProfileList(updated);
        localStorage.setItem('ascension_profile_list', JSON.stringify(updated));
        await Promise.all([
            deleteProfileFromCloud(user.uid, p.id),
            saveProfileList(user.uid, updated),
        ]);
        if (activeProfile === p.id) {
            setActiveProfile(null);
            setState(null);
        }
    };

    // ── Login screen ──────────────────────────────────────────────────────────
    if (!user) {
        return (
            <div className="app-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
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
            </div>
        );
    }

    // ── Profile picker ────────────────────────────────────────────────────────
    if (!activeProfile || !state) {
        return (
            <div className="app-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 className="neon-text" style={{ margin: 0 }}>SYSTEM ACCESS</h1>
                    <span onClick={handleLogout} style={{ fontSize: '0.6rem', cursor: 'pointer', color: 'var(--accent-red)' }}>[ DE-SYNC ]</span>
                </div>

                <div style={{ padding: '15px', border: '1px solid var(--accent-gold)', marginBottom: '30px', background: 'rgba(255, 204, 0, 0.05)' }}>
                    <div className="neon-text" style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', marginBottom: '5px' }}>[ CLOUD STATUS: SYNCED ]</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Identity: <strong>{user.email}</strong>.
                        Your stats are now mirrored across all systems.
                    </p>
                </div>

                <SystemCard title="ACTIVE LOADS">
                    {listLoading && (
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>
                            SCANNING CLOUD FOR LOADS...
                        </p>
                    )}
                    {!listLoading && profileList.length === 0 && (
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>
                            NO PROFILES FOUND. INITIALIZE A NEW LOAD.
                        </p>
                    )}
                    {!listLoading && profileList.map(p => (
                        <div key={p.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <button onClick={async () => {
                                setLoading(true);
                                const cloudData = await fetchStateFromCloud(user.uid, p.id);
                                if (cloudData) {
                                    setState(cloudData);
                                    setActiveProfile(p.id);
                                } else if (state && activeProfile === p.id) {
                                    setActiveProfile(p.id);
                                } else {
                                    alert("PROFILE DATA NOT FOUND IN CLOUD. Try creating a new profile.");
                                }
                                setLoading(false);
                            }} style={{ flex: 1 }} disabled={loading}>
                                {loading ? "FETCHING..." : `ACCESS: ${p.name.toUpperCase()}`}
                            </button>
                            <button onClick={() => handleDelete(p)} disabled={loading} style={{
                                width: 'auto',
                                padding: '0 12px',
                                borderColor: 'var(--accent-red)',
                                color: 'var(--accent-red)',
                                background: 'rgba(255,59,48,0.05)',
                                fontSize: '0.6rem',
                                flexShrink: 0
                            }}>
                                [ DELETE ]
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => { const n = prompt("ENTER PROFILE IDENTITY:"); if (n) createProfile(n); }}
                        style={{ width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', marginTop: '10px' }}
                    >
                        + INITIALIZE NEW LOAD
                    </button>
                </SystemCard>
            </div>
        );
    }

    return null;
};
