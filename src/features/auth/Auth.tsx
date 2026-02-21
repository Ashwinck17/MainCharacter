import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useSystemStore } from '../../store/useSystemStore';
import { SystemCard } from '../../components/SystemCard';
import { auth, fetchStateFromCloud } from '../../api/firebaseService';

export const AuthManager = () => {
    const { activeProfile, setActiveProfile, state, setState, createProfile, user, setUser } = useSystemStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    if (!activeProfile || !state) {
        const list = JSON.parse(localStorage.getItem('ascension_profile_list') || '[]');
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
                    {list.length === 0 && <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>NO PROFILES FOUND ON THIS DEVICE.</p>}
                    {list.map((p: any) => (
                        <button key={p.id} onClick={async () => {
                            setLoading(true);
                            const cloudData = await fetchStateFromCloud(user.uid, p.id);
                            if (cloudData) {
                                setState(cloudData);
                                setActiveProfile(p.id);
                            } else {
                                alert("PROFILE DATA NOT FOUND IN CLOUD.");
                            }
                            setLoading(false);
                        }} style={{ width: '100%', marginBottom: '10px' }} disabled={loading}>
                            {loading ? "FETCHING..." : `ACCESS: ${p.name.toUpperCase()}`}
                        </button>
                    ))}
                    <button onClick={() => { const n = prompt("ENTER PROFILE IDENTITY:"); if (n) createProfile(n); }} style={{ width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', marginTop: '10px' }}>
                        + INITIALIZE NEW LOAD
                    </button>
                </SystemCard>
            </div>
        );
    }

    return null;
};
