import { useState, useEffect } from 'react';
import { Activity, Sword, Skull } from 'lucide-react';
import { useSystemStore } from './store/useSystemStore';
import { AuthManager } from './features/auth/Auth';
import { Dashboard } from './features/dashboard/Dashboard';
import { Quests, BossTrial } from './features/quests/Quests';
import { SystemCard } from './components/SystemCard';
import { subscribeToAuth, subscribeToProfile } from './api/firebaseService';

function App() {
  const {
    activeProfile,
    setActiveProfile,
    state,
    setState,
    checkDailyUpdate,
    user,
    setUser
  } = useSystemStore();

  const [activeTab, setActiveTab] = useState<'status' | 'quests' | 'boss'>('status');
  const [showSync, setShowSync] = useState(false);

  // 1. Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  // 2. Initialize Real-time Database Listener
  useEffect(() => {
    if (user && activeProfile) {
      const unsubscribe = subscribeToProfile(user.uid, activeProfile, (cloudState) => {
        // Only update local state if cloud data exists and is different (enterprise check)
        if (cloudState && JSON.stringify(cloudState) !== JSON.stringify(state)) {
          setState(cloudState);
        }
      });
      return () => unsubscribe();
    }
  }, [user, activeProfile, setState, state]);

  // 3. Daily Logic Check
  useEffect(() => {
    if (activeProfile && state) {
      checkDailyUpdate();
    }
  }, [activeProfile, state, checkDailyUpdate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify({ ...state, profileName: activeProfile }));
    alert("CODE COPIED TO CLIPBOARD");
  };

  if (!user || !activeProfile || !state) {
    return <AuthManager />;
  }

  const start = new Date(state.startDate).getTime();
  const now = new Date().getTime();
  const day = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  const arc = (day <= 7) ? "STABILIZATION" : (day <= 14) ? "DISCIPLINE" : (day <= 21) ? "PRESSURE" : "IDENTITY";

  return (
    <div className="app-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', paddingBottom: '100px' }}>
      {showSync && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SystemCard title="IDENTIFICATION CODE" style={{ width: '100%' }}>
            <p style={{ fontSize: '0.7rem', marginBottom: '10px' }}>USE THIS CODE TO RESTORE DATA ON ANY DEVICE:</p>
            <textarea
              readOnly
              value={JSON.stringify({ ...state, profileName: activeProfile })}
              style={{ width: '100%', height: '220px', background: '#000', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '10px', fontSize: '0.5rem', fontFamily: 'monospace', marginBottom: '15px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={handleCopy}>COPY CODE</button>
              <button onClick={() => setShowSync(false)} style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}>CLOSE</button>
            </div>
          </SystemCard>
        </div>
      )}

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', marginBottom: '15px' }}>
          <span onClick={() => { setActiveProfile(null); setState(null); }} style={{ cursor: 'pointer', color: 'var(--accent-gold)' }}>[ SELECT PROFILE ]</span>
          <span onClick={() => setShowSync(true)} style={{ cursor: 'pointer', color: 'var(--accent-blue)' }}>[ GEN SYNC CODE ]</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '3px' }}>DAY {day} / 30 - {arc} ARC</div>
        <h1 className="neon-text" style={{ fontSize: '1.8rem', margin: '5px 0' }}>Ascension System</h1>
      </header>

      {activeTab === 'status' && <Dashboard />}
      {activeTab === 'quests' && <Quests />}
      {activeTab === 'boss' && <BossTrial />}

      <nav style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)', maxWidth: '560px', display: 'flex', justifyContent: 'space-around',
        padding: '10px', background: 'rgba(5, 5, 6, 0.95)', border: '1px solid var(--border-color)', borderRadius: '10px',
        zIndex: 100
      }}>
        <NavButton active={activeTab === 'status'} onClick={() => setActiveTab('status')} icon={<Activity size={20} />} label="Stats" />
        <NavButton active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} icon={<Sword size={20} />} label="Quests" />
        <NavButton active={activeTab === 'boss'} onClick={() => setActiveTab('boss')} icon={<Skull size={20} />} label="Boss" />
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button onClick={onClick} style={{ border: 'none', background: 'none', color: active ? 'var(--accent-blue)' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}>
    {icon}
    <span style={{ fontSize: '0.6rem' }}>{label}</span>
  </button>
);

export default App;
