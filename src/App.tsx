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
  const [state, setState] = useState<SystemState>(() => {
    const saved = localStorage.getItem('ascension_system_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure new tracking fields exist
      if (parsed.stats.assignedCount === undefined) parsed.stats.assignedCount = 0;
      if (parsed.stats.completedCount === undefined) parsed.stats.completedCount = 0;
      return parsed;
    }

    return {
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
  });

  const [activeTab, setActiveTab] = useState<'status' | 'quests' | 'boss'>('status');

  useEffect(() => {
    localStorage.setItem('ascension_system_v2', JSON.stringify(state));
  }, [state]);

  // INTELLIGENCE: Adaptive Difficulty Scaling
  const getAdaptiveDifficulty = (_type: 'physical' | 'mental'): 'Easy' | 'Medium' | 'Hard' => {
    let diffScore = 0; // 0: Easy, 1: Medium, 2: Hard

    // Level scaling (every 5 levels increases base difficulty)
    diffScore = Math.floor(state.stats.level / 5);

    // DISC scaling (Punishment loop / Challenge loop)
    if (state.stats.DISC < 60) diffScore += 1; // Penalty: Weakness makes tasks feel harder
    if (state.stats.DISC > 90) diffScore += 1; // Reward: High focus unlocks higher tiers

    // Cap at Hard
    const tiers: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];
    return tiers[Math.min(diffScore, 2)];
  };

  // Logic to determine current day of the journey
  const getJourneyDay = () => {
    const start = new Date(state.startDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const day = getJourneyDay();
  const getArc = (d: number) => {
    if (d <= 7) return "STABILIZATION";
    if (d <= 14) return "DISCIPLINE";
    if (d <= 21) return "PRESSURE";
    return "IDENTITY";
  };

  const arc = getArc(day);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastUpdate = new Date(state.stats.lastUpdate || 0).toDateString();

    if (today !== lastUpdate || state.dailyTasks.length === 0) {
      const hasUnfinished = state.dailyTasks.length > 0 && state.dailyTasks.some(t => !t.completed);

      let newStats = { ...state.stats };

      // Penalty for missed tasks
      if (hasUnfinished) {
        const penaltyXP = arc === "STABILIZATION" ? 10 : arc === "DISCIPLINE" ? 15 : arc === "PRESSURE" ? 20 : 30;
        newStats.xp = Math.max(newStats.xp - penaltyXP, 0);
        newStats.hp = Math.max(newStats.hp - 20, 10);
        newStats.streak = 0;

        if (arc === "DISCIPLINE") newStats.FOCUS = Math.max(newStats.FOCUS - 10, 0);
        if (arc === "PRESSURE") newStats.DISC = Math.max(newStats.DISC - 5, 0);
      } else if (state.dailyTasks.length > 0) {
        newStats.streak += 1;
        // Streak bonuses
        if (newStats.streak % 7 === 0) {
          newStats.xp += arc === "DISCIPLINE" ? 75 : 50;
          newStats.WILL += 2;
        }
      }

      // INTELLIGENCE: Adaptive Task Selection
      const pDiff = getAdaptiveDifficulty('physical');
      const mDiff = getAdaptiveDifficulty('mental');

      const pTasks = TASK_POOL.physical[pDiff];
      const mTasks = TASK_POOL.mental[mDiff];

      // Stabilization Arc overrides for Day 1-7 consistency
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

      setState(prev => ({
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
      }));
    }
  }, [day, state.stats.level, state.stats.DISC]);

  const completeTask = (taskId: string) => {
    setState(prev => {
      const task = prev.dailyTasks.find(t => t.id === taskId);
      if (!task || task.completed) return prev;

      let newStats = { ...prev.stats };
      newStats.completedCount += 1;

      // Update DISC formula: Completed / Assigned * 100
      // Guard against division by zero
      newStats.DISC = newStats.assignedCount > 0
        ? Math.round((newStats.completedCount / newStats.assignedCount) * 100)
        : 0;

      // XP and Stat Rewards
      let xpGained = task.xpReward;
      if (prev.hardcoreMode) xpGained *= 1.25; // Hardcore XP bonus
      if (newStats.hp < 40) xpGained *= 0.75; // Low HP penalty

      newStats.xp += xpGained;
      if (task.type === 'physical') newStats.STR += 1;
      if (task.type === 'mental') newStats.INT += 1;

      // Both check for DISC
      const otherTask = prev.dailyTasks.find(t => t.id !== taskId);
      if (otherTask?.completed) newStats.DISC += 1;

      // Level up
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

  const isDebuffed = state.stats.hp < 40;

  return (
    <div className="app-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', paddingBottom: '100px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '3px' }}>
          DAY {day} / 30 - {arc} ARC
        </div>
        <h1 className="neon-text" style={{ fontSize: '1.8rem', margin: '5px 0' }}>Ascension System</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
            [ {isDebuffed ? "DRAINED" : "OPTIMAL"} ]
          </span>
          {state.hardcoreMode && (
            <span className="neon-red" style={{ fontSize: '0.7rem' }}>[ HARDCORE MODE ACTIVE ]</span>
          )}
        </div>
      </header>

      {activeTab === 'status' && (
        <div className="status-page">
          <SystemCard title="Core Stats">
            <StatBar label="LEVEL" current={state.stats.level} max={100} />
            <StatBar label="VITALITY (HP)" current={state.stats.hp} max={state.stats.maxHp} isRed />
            <StatBar label="EXPERIENCE (XP)" current={Math.floor(state.stats.xp)} max={state.stats.xpRequired} />
          </SystemCard>

          <SystemCard title="Attributes">
            <div className={`stats-grid ${isDebuffed ? 'grayscale' : ''}`}>
              <Attribute label="STR" value={state.stats.STR} icon={<Sword size={12} />} />
              <Attribute label="INT" value={state.stats.INT} icon={<Brain size={12} />} />
              <Attribute label="DISC" value={state.stats.DISC} icon={<Shield size={12} />} isPercent />
              <Attribute label="WILL" value={state.stats.WILL} icon={<Zap size={12} />} />
              <Attribute label="FOCUS" value={state.stats.FOCUS} icon={<Target size={12} />} isPercent />
              <Attribute label="CHA" value={state.stats.CHA} icon={<Users size={12} />} />
            </div>
            {isDebuffed && (
              <div className="neon-red" style={{ fontSize: '0.6rem', marginTop: '10px', textAlign: 'center' }}>
                WARNING: LOW VITALITY REDUCES XP GAIN BY 25%
              </div>
            )}
          </SystemCard>

          {state.stats.level >= 10 && (
            <button
              onClick={() => setState(p => ({ ...p, hardcoreMode: !p.hardcoreMode }))}
              style={{ width: '100%', marginBottom: '20px', borderColor: state.hardcoreMode ? 'var(--accent-red)' : 'var(--accent-blue)' }}
              className={state.hardcoreMode ? 'neon-red' : ''}
            >
              {state.hardcoreMode ? "EXIT HARDCORE" : "ENABLE HARDCORE"}
            </button>
          )}

          <SystemCard title="System Log">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              STREAK: {state.stats.streak} DAYS<br />
              TASKS CLEARED: {state.stats.completedCount} / {state.stats.assignedCount}<br />
              CURRENT ARC: {arc}<br />
              <div style={{ marginTop: '5px', color: 'var(--accent-blue)' }}>
                "You level up by finishing. Not by feeling good."
              </div>
            </div>
          </SystemCard>
        </div>
      )}

      {activeTab === 'quests' && (
        <div className="quests-page">
          <SystemCard title="Active Directives">
            {state.dailyTasks.map(task => (
              <div key={task.id} className="system-window" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', marginBottom: '15px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '8px' }}>
                  <span className="neon-text">{task.type}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>[{task.difficulty}]</span>
                </div>
                <div style={{ fontSize: '1.1rem', marginBottom: '12px' }}>{task.description}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', fontSize: '0.7rem' }}>
                  <div>
                    <div className="neon-text" style={{ opacity: 0.7 }}>[ REWARD ]</div>
                    <div>+{task.xpReward} XP</div>
                    <div>+1 {task.type === 'physical' ? 'STR' : 'INT'}</div>
                  </div>
                  <div>
                    <div className="neon-red" style={{ opacity: 0.7 }}>[ PENALTY ]</div>
                    <div>{task.punishment}</div>
                  </div>
                </div>

                <button
                  onClick={() => completeTask(task.id)}
                  disabled={task.completed}
                  style={{ width: '100%' }}
                >
                  {task.completed ? "QUEST CLEARED" : "CLAIM REWARD"}
                </button>
              </div>
            ))}
            {arc === "DISCIPLINE" && (
              <div className="neon-red" style={{ fontSize: '0.6rem', textAlign: 'center', marginTop: '10px' }}>
                CONSTRAINT: NO PHONE DURING TASK WINDOW
              </div>
            )}
          </SystemCard>
        </div>
      )}

      {activeTab === 'boss' && (
        <div className="boss-page">
          <SystemCard title="Weekly Trial">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Skull size={60} color={state.weeklyBoss.currentQuests >= 5 ? 'var(--accent-blue)' : 'var(--accent-red)'} />
              <h2 className={state.weeklyBoss.currentQuests >= 5 ? 'neon-text' : 'neon-red'}>{state.weeklyBoss.name}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                PROGRESS: {state.weeklyBoss.currentQuests} / 5 TASKS
              </p>
              <StatBar label="TRIAL PROGRESS" current={state.weeklyBoss.currentQuests} max={5} />
              <div style={{ fontSize: '0.6rem', marginTop: '20px', color: 'var(--text-secondary)' }}>
                "You had time. You just spent it elsewhere."
              </div>
            </div>
          </SystemCard>

          {day >= 15 && (
            <SystemCard title="Mid-Boss: THE COMFORT KING">
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
        padding: '10px', background: 'rgba(5, 5, 6, 0.9)', backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-color)', zIndex: 100, clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)'
      }}>
        <NavButton active={activeTab === 'status'} onClick={() => setActiveTab('status')} icon={<Activity size={20} />} label="Stats" />
        <NavButton active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} icon={<Sword size={20} />} label="Quests" />
        <NavButton active={activeTab === 'boss'} onClick={() => setActiveTab('boss')} icon={<Skull size={20} />} label="Boss" />
      </nav>
    </div>
  );
}

const Attribute = ({ label, value, icon, isPercent }: { label: string, value: number, icon: any, isPercent?: boolean }) => (
  <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon} {label}
      </span>
      <span className="neon-text" style={{ fontSize: '0.8rem' }}>{value}{isPercent ? '%' : ''}</span>
    </div>
  </div>
);

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button onClick={onClick} style={{
    border: 'none', background: 'transparent', color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '5px'
  }}>
    {icon}
    <span style={{ fontSize: '0.6rem' }}>{label}</span>
  </button>
);

export default App;
