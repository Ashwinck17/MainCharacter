import { useState, useEffect } from 'react';
import { StatBar } from './components/StatBar';
import { SystemCard } from './components/SystemCard';
import type { SystemState, Task, UserStats } from './types';
import { Sword, Brain, Activity, Shield, Zap, Target, Users, Skull, Lock } from 'lucide-react';

const INITIAL_STATS: UserStats = {
  level: 1,
  xp: 0,
  xpRequired: 100,
  hp: 100,
  maxHp: 100,
  STR: 10,
  INT: 10,
  DISC: 0,
  WILL: 10,
  FOCUS: 100,
  CHA: 10,
  streak: 0,
  lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  assignedCount: 0,
  completedCount: 0
};

const STABILIZATION_TASKS = {
  physical: [
    "20 min walk",
    "30 squats + 20 wall push-ups",
    "25 min walk",
    "Stretching 15 min",
    "40 squats + plank 30s x2",
    "30 min walk",
    "Light mobility + breathing"
  ],
  mental: "30 min focused learning + 5 min journal (Actions & Resistance)"
};

const TASK_POOL = {
  physical: {
    Easy: ["20 min walk", "30 squats + 20 wall push-ups", "15 min stretching", "Light mobility"],
    Medium: ["5km brisk walk", "Bodyweight circuit (3 sets)", "30 min intense cardio", "45 min Gym session"],
    Hard: ["Hard intensity Cardio (45m)", "Strength sets (logging reps)", "Weighted movements", "Explosive HIIT training"]
  },
  mental: {
    Easy: ["15 min learning", "5 min journaling", "Meditation", "Review archive"],
    Medium: ["45 min deep work + summary", "Learn new technical concept", "Solve 3 complex problems", "Draft production plan"],
    Hard: ["90-120 min deep work + output", "Architecture review", "Code refactoring session", "Deep research & implementation"]
  }
};

function App() {
  const [activeProfile, setActiveProfile] = useState<string | null>(() => localStorage.getItem('ascension_active_profile'));
  const [state, setState] = useState<SystemState | null>(() => {
    const active = localStorage.getItem('ascension_active_profile');
    if (!active) return null;
    const saved = localStorage.getItem(`ascension_profile_${active}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.stats.assignedCount === undefined) parsed.stats.assignedCount = 0;
      if (parsed.stats.completedCount === undefined) parsed.stats.completedCount = 0;
      return parsed;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'status' | 'quests' | 'boss'>('status');
  const [exportInput, setExportInput] = useState('');
  const [showSync, setShowSync] = useState(false);

  useEffect(() => {
    if (activeProfile && state) {
      localStorage.setItem(`ascension_profile_${activeProfile}`, JSON.stringify(state));
      localStorage.setItem('ascension_active_profile', activeProfile);
    }
  }, [state, activeProfile]);

  const getAdaptiveDifficulty = (_type: 'physical' | 'mental'): 'Easy' | 'Medium' | 'Hard' => {
    if (!state) return 'Easy';
    let diffScore = Math.floor(state.stats.level / 5);
    if (state.stats.DISC < 60) diffScore += 1;
    if (state.stats.DISC > 90) diffScore += 1;
    const tiers: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];
    return tiers[Math.min(diffScore, 2)];
  };

  const getJourneyDay = () => {
    if (!state) return 1;
    const start = new Date(state.startDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const day = getJourneyDay();
  const arc = (day <= 7) ? "STABILIZATION" : (day <= 14) ? "DISCIPLINE" : (day <= 21) ? "PRESSURE" : "IDENTITY";

  useEffect(() => {
    if (!state || !activeProfile) return;
    const today = new Date().toDateString();
    const lastUpdate = new Date(state.stats.lastUpdate || 0).toDateString();

    if (today !== lastUpdate || state.dailyTasks.length === 0) {
      const hasUnfinished = state.dailyTasks.length > 0 && state.dailyTasks.some(t => !t.completed);
      let newStats = { ...state.stats };

      if (hasUnfinished) {
        const penaltyXP = arc === "STABILIZATION" ? 10 : arc === "DISCIPLINE" ? 15 : arc === "PRESSURE" ? 20 : 30;
        newStats.xp = Math.max(newStats.xp - penaltyXP, 0);
        newStats.hp = Math.max(newStats.hp - 20, 10);
        newStats.streak = 0;
        if (arc === "DISCIPLINE") newStats.FOCUS = Math.max(newStats.FOCUS - 10, 0);
        if (arc === "PRESSURE") newStats.DISC = Math.max(newStats.DISC - 5, 0);
      } else if (state.dailyTasks.length > 0) {
        newStats.streak += 1;
        if (newStats.streak % 7 === 0) {
          newStats.xp += arc === "DISCIPLINE" ? 75 : 50;
          newStats.WILL += 2;
        }
      }

      const pDiff = getAdaptiveDifficulty('physical');
      const mDiff = getAdaptiveDifficulty('mental');
      const pTasks = TASK_POOL.physical[pDiff];
      const mTasks = TASK_POOL.mental[mDiff];

      let pDesc = pTasks[Math.floor(Math.random() * pTasks.length)];
      let mDesc = mTasks[Math.floor(Math.random() * mTasks.length)];

      if (day <= 7) {
        pDesc = STABILIZATION_TASKS.physical[(day - 1) % 7];
        mDesc = STABILIZATION_TASKS.mental;
      }

      const newTasks: Task[] = [
        {
          id: `p-${day}-${Date.now()}`,
          type: 'physical',
          description: pDesc,
          difficulty: pDiff,
          xpReward: pDiff === 'Easy' ? 40 : pDiff === 'Medium' ? 50 : 70,
          motivation: "ADAPT OR FAIL.",
          punishment: `-${pDiff === 'Easy' ? 10 : 25} XP | STAT DECAY`,
          completed: false,
          timestamp: new Date().toISOString()
        },
        {
          id: `m-${day}-${Date.now()}`,
          type: 'mental',
          description: mDesc,
          difficulty: mDiff,
          xpReward: mDiff === 'Easy' ? 40 : mDiff === 'Medium' ? 50 : 70,
          motivation: "THE SYSTEM SCALES WITH YOU.",
          punishment: `-${mDiff === 'Easy' ? 10 : 25} XP | FOCUS LOSS`,
          completed: false,
          timestamp: new Date().toISOString()
        }
      ];

      newStats.assignedCount += 2;

      setState(prev => prev ? ({
        ...prev,
        stats: { ...newStats, lastUpdate: new Date().toISOString() },
        dailyTasks: newTasks,
        weeklyBoss: {
          ...prev.weeklyBoss,
          ...(new Date() > new Date(prev.weeklyBoss.deadline) ? {
            completed: false,
            currentQuests: 0,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          } : {})
        }
      }) : null);
    }
  }, [day, activeProfile]);

  const completeTask = (taskId: string) => {
    setState(prev => {
      if (!prev) return null;
      const task = prev.dailyTasks.find(t => t.id === taskId);
      if (!task || task.completed) return prev;

      let newStats = { ...prev.stats };
      newStats.completedCount += 1;
      newStats.DISC = newStats.assignedCount > 0
        ? Math.min(Math.round((newStats.completedCount / newStats.assignedCount) * 100), 100)
        : 0;

      let xpGained = task.xpReward;
      if (prev.hardcoreMode) xpGained *= 1.25;
      newStats.xp += xpGained;
      if (task.type === 'physical') newStats.STR += 1;
      if (task.type === 'mental') newStats.INT += 1;

      if (newStats.xp >= newStats.xpRequired) {
        newStats.level += 1;
        newStats.xp -= newStats.xpRequired;
        newStats.xpRequired = newStats.level * 100;
        newStats.hp = Math.min(newStats.hp + 20, newStats.maxHp);
      }

      return {
        ...prev,
        stats: newStats,
        dailyTasks: prev.dailyTasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
        weeklyBoss: {
          ...prev.weeklyBoss,
          currentQuests: prev.weeklyBoss.currentQuests + 1
        }
      };
    });
  };

  const createNewProfile = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '_');
    const newState: SystemState = {
      version: '2.0',
      startDate: new Date().toISOString(),
      stats: INITIAL_STATS,
      dailyTasks: [],
      buffs: [],
      history: [],
      hardcoreMode: false,
      weeklyBoss: {
        name: "THE DRIFT",
        completed: false,
        requiredQuests: 5,
        currentQuests: 0,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
    localStorage.setItem(`ascension_profile_${id}`, JSON.stringify(newState));
    const list = JSON.parse(localStorage.getItem('ascension_profile_list') || '[]');
    if (!list.some((p: any) => p.id === id)) {
      list.push({ id, name });
      localStorage.setItem('ascension_profile_list', JSON.stringify(list));
    }
    setActiveProfile(id);
    setState(newState);
  };

  const importProfile = (json: string) => {
    try {
      const imported = JSON.parse(json);
      if (!imported.stats || !imported.startDate) throw new Error();

      const id = `sync_${Date.now()}`;
      const name = imported.profileName || `Sync_${new Date().toLocaleDateString()}`;

      localStorage.setItem(`ascension_profile_${id}`, JSON.stringify(imported));
      const list = JSON.parse(localStorage.getItem('ascension_profile_list') || '[]');
      list.push({ id, name });
      localStorage.setItem('ascension_profile_list', JSON.stringify(list));

      setActiveProfile(id);
      setState(imported);
      setExportInput('');
    } catch (e) { alert("ERROR: INVALID SYNC CODE. USE [GEN SYNC CODE] ON DEVICE A."); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify({ ...state, profileName: activeProfile }));
    alert("CODE COPIED TO CLIPBOARD");
  };

  if (!activeProfile || !state) {
    const list = JSON.parse(localStorage.getItem('ascension_profile_list') || '[]');
    return (
      <div className="app-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 className="neon-text" style={{ textAlign: 'center' }}>SYSTEM ACCESS</h1>

        <div style={{ padding: '15px', border: '1px solid var(--accent-gold)', marginBottom: '30px', background: 'rgba(255, 204, 0, 0.05)' }}>
          <div className="neon-text" style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', marginBottom: '5px' }}>[ SYNC ADVISORY ]</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
            This system runs on <strong>Local-First Encryption</strong>. Profiles do not auto-cloud sync.
            To move progress to another device, you MUST copy your <strong>Sync Code</strong> from Device A and paste it here.
          </p>
        </div>

        <SystemCard title="LOAD PROFILES">
          {list.length === 0 && <p style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center' }}>NO LOCAL PROFILES DETECTED.</p>}
          {list.map((p: any) => (
            <button key={p.id} onClick={() => { setActiveProfile(p.id); setState(JSON.parse(localStorage.getItem(`ascension_profile_${p.id}`)!)); }} style={{ width: '100%', marginBottom: '10px' }}>
              ACCESS LOAD: {p.name}
            </button>
          ))}
          <button onClick={() => { const n = prompt("ENTER PROFILE IDENTITY:"); if (n) createNewProfile(n); }} style={{ width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', marginTop: '10px' }}>
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

  const isDebuffed = state.stats.hp < 40;

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
          <span onClick={() => setActiveProfile(null)} style={{ cursor: 'pointer', color: 'var(--accent-gold)' }}>[ LOG OUT ]</span>
          <span onClick={() => setShowSync(true)} style={{ cursor: 'pointer', color: 'var(--accent-blue)' }}>[ GEN SYNC CODE ]</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '3px' }}>DAY {day} / 30 - {arc} ARC</div>
        <h1 className="neon-text" style={{ fontSize: '1.8rem', margin: '5px 0' }}>Ascension System</h1>
      </header>

      {activeTab === 'status' && (
        <div className="status-page">
          <SystemCard title="CORE STATS">
            <StatBar label="LEVEL" current={state.stats.level} max={100} />
            <StatBar label="VITALITY" current={state.stats.hp} max={state.stats.maxHp} isRed />
            <StatBar label="EXPERIENCE" current={Math.floor(state.stats.xp)} max={state.stats.xpRequired} />
          </SystemCard>
          <SystemCard title="ATTRIBUTES">
            <div className={`stats-grid ${isDebuffed ? 'grayscale' : ''}`}>
              <Attribute label="STR" value={state.stats.STR} icon={<Sword size={12} />} />
              <Attribute label="INT" value={state.stats.INT} icon={<Brain size={12} />} />
              <Attribute label="DISC" value={state.stats.DISC} icon={<Shield size={12} />} isPercent />
              <Attribute label="WILL" value={state.stats.WILL} icon={<Zap size={12} />} />
              <Attribute label="FOCUS" value={state.stats.FOCUS} icon={<Target size={12} />} isPercent />
              <Attribute label="CHA" value={state.stats.CHA} icon={<Users size={12} />} />
            </div>
          </SystemCard>
          <SystemCard title="SYSTEM LOG">
            <div style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.6' }}>
              STREAK: {state.stats.streak} DAYS<br />
              QUESTS CLEARED: {state.stats.completedCount} / {state.stats.assignedCount}<br />
              CURRENT ARC: {arc}<br />
              PROFILE: {activeProfile.toUpperCase().replace('_', ' ')}
            </div>
          </SystemCard>
        </div>
      )}

      {activeTab === 'quests' && (
        <div className="quests-page">
          <SystemCard title="DIRECTIVES">
            {state.dailyTasks.map(t => (
              <div key={t.id} className="system-window" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', marginBottom: '15px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '10px' }}>
                  <span className="neon-text">{t.type}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>[{t.difficulty}]</span>
                </div>

                <div style={{ fontSize: '1.15rem', marginBottom: '15px' }}>{t.description}</div>

                <div style={{ marginBottom: '15px' }}>
                  <div className="neon-text" style={{ fontSize: '0.6rem', opacity: 0.7 }}>[ MOTIVATION ]</div>
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--accent-blue)' }}>"{t.motivation}"</div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div className="neon-red" style={{ fontSize: '0.6rem', opacity: 0.7 }}>[ PENALTY FOR FAILURE ]</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }}>{t.punishment}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #222', paddingTop: '15px' }}>
                  <div style={{ fontSize: '0.7rem' }}>
                    <div style={{ color: 'var(--accent-blue)' }}>XP: +{t.xpReward}</div>
                    <div style={{ color: 'var(--accent-gold)' }}>STAT: +1 {t.type === 'physical' ? 'STR' : 'INT'}</div>
                  </div>
                  <button onClick={() => completeTask(t.id)} disabled={t.completed} style={{ minWidth: '130px' }}>
                    {t.completed ? "QUEST CLEARED" : "CLAIM REWARD"}
                  </button>
                </div>
              </div>
            ))}
            {arc === "DISCIPLINE" && (
              <div className="neon-red" style={{ fontSize: '0.6rem', textAlign: 'center', marginTop: '10px' }}>
                [ CONSTRAINT: NO PHONE DURING TASK WINDOW ]
              </div>
            )}
          </SystemCard>
        </div>
      )}

      {activeTab === 'boss' && (
        <div className="boss-page">
          <SystemCard title="WEEKLY TRIAL">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Skull size={40} color={state.weeklyBoss.currentQuests >= 5 ? "var(--accent-blue)" : "var(--accent-red)"} style={{ marginBottom: '10px' }} />
              <h2 className={state.weeklyBoss.currentQuests >= 5 ? "neon-text" : "neon-red"}>{state.weeklyBoss.name}</h2>
              <div style={{ fontSize: '0.8rem', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                STABILITY PROGRESS: {state.weeklyBoss.currentQuests} / 5
              </div>
              <StatBar label="COLLECTIVE DATA" current={state.weeklyBoss.currentQuests} max={5} />
              <p style={{ fontSize: '0.6rem', marginTop: '20px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "You had time. You just spent it elsewhere."
              </p>
            </div>
          </SystemCard>

          {day >= 15 && (
            <SystemCard title="MID-BOSS: THE COMFORT KING">
              <div style={{ textAlign: 'center' }}>
                <Lock size={30} color="var(--accent-gold)" />
                <p style={{ fontSize: '0.8rem' }}>MISSION: NO SKIPS FOR 3 DAYS</p>
                <div className="neon-red" style={{ fontSize: '0.7rem' }}>[ STATUS: ACTIVE ]</div>
              </div>
            </SystemCard>
          )}
        </div>
      )}

      <nav style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)', maxWidth: '560px', display: 'flex', justifyContent: 'space-around',
        padding: '10px', background: 'rgba(5, 5, 6, 0.95)', border: '1px solid var(--border-color)', borderRadius: '10px'
      }}>
        <NavButton active={activeTab === 'status'} onClick={() => setActiveTab('status')} icon={<Activity size={20} />} label="Stats" />
        <NavButton active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} icon={<Sword size={20} />} label="Quests" />
        <NavButton active={activeTab === 'boss'} onClick={() => setActiveTab('boss')} icon={<Skull size={20} />} label="Boss" />
      </nav>
    </div>
  );
}

const Attribute = ({ label, value, icon, isPercent }: { label: string, value: number, icon: any, isPercent?: boolean }) => (
  <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '5px' }}>{icon} {label}</span>
    <span className="neon-text" style={{ fontSize: '0.8rem' }}>{value}{isPercent ? '%' : ''}</span>
  </div>
);

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button onClick={onClick} style={{ border: 'none', background: 'none', color: active ? 'var(--accent-blue)' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}>
    {icon}
    <span style={{ fontSize: '0.6rem' }}>{label}</span>
  </button>
);

export default App;
