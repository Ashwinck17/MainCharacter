import { useState } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { SystemCard } from '../../components/SystemCard';

export const AuthManager = () => {
    const { activeProfile, setActiveProfile, state, setState, createProfile } = useSystemStore();
    const [exportInput, setExportInput] = useState('');

    const importProfile = (json: string) => {
        try {
            const imported = JSON.parse(json);
            if (!imported.stats || !imported.startDate) throw new Error();

            const id = `sync_${Date.now()}`;
            const name = imported.profileName || `Sync_${new Date().toLocaleDateString()}`;

            // Temporary local storage handling for multi-profile list
            const list = JSON.parse(localStorage.getItem('ascension_profile_list') || '[]');
            list.push({ id, name });
            localStorage.setItem('ascension_profile_list', JSON.stringify(list));
            localStorage.setItem(`ascension_profile_data_${id}`, JSON.stringify(imported));

            setActiveProfile(id);
            setState(imported);
            setExportInput('');
        } catch (e) { alert("ERROR: INVALID SYNC CODE. USE [GEN SYNC CODE] ON DEVICE A."); }
    };

    if (!activeProfile || !state) {
        const list = JSON.parse(localStorage.getItem('ascension_profile_list') || '[]');
        return (
            <div className="app-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 className="neon-text" style={{ textAlign: 'center' }}>SYSTEM ACCESS</h1>

                <div style={{ padding: '15px', border: '1px solid var(--accent-gold)', marginBottom: '30px', background: 'rgba(255, 204, 0, 0.05)' }}>
                    <div className="neon-text" style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', marginBottom: '5px' }}>[ SYNC ADVISORY ]</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Enterprise Architecture: <strong>Cloud Sync Pending</strong>.
                        To move progress, use your <strong>Identification Code</strong>.
                    </p>
                </div>

                <SystemCard title="LOAD PROFILES">
                    {list.length === 0 && <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>NO LOCAL PROFILES DETECTED.</p>}
                    {list.map((p: any) => (
                        <button key={p.id} onClick={() => {
                            setActiveProfile(p.id);
                            const savedData = localStorage.getItem(`ascension_profile_data_${p.id}`);
                            if (savedData) setState(JSON.parse(savedData));
                        }} style={{ width: '100%', marginBottom: '10px' }}>
                            ACCESS LOAD: {p.name}
                        </button>
                    ))}
                    <button onClick={() => { const n = prompt("ENTER PROFILE IDENTITY:"); if (n) createProfile(n); }} style={{ width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', marginTop: '10px' }}>
                        + INITIALIZE NEW LOAD
                    </button>
                </SystemCard>

                <SystemCard title="IMPORT PROGRESS">
                    <p style={{ fontSize: '0.65rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>PASTE DATA CODE FROM ANOTHER SYSTEM:</p>
                    <textarea
                        value={exportInput}
                        onChange={e => setExportInput(e.target.value)}
                        placeholder="Paste Sync Code..."
                        style={{ width: '100%', height: '80px', background: '#000', color: 'var(--accent-blue)', border: '1px solid #333', padding: '10px', fontSize: '0.5rem', fontFamily: 'monospace' }}
                    />
                    <button onClick={() => importProfile(exportInput)} style={{ width: '100%', marginTop: '10px' }}>
                        LINK EXTERNAL PROGRESS
                    </button>
                </SystemCard>
            </div>
        );
    }

    return null;
};
