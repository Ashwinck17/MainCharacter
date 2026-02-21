import { Skull } from 'lucide-react';
import { StatBar } from '../../components/StatBar';
import { SystemCard } from '../../components/SystemCard';
import { useSystemStore } from '../../store/useSystemStore';

export const Quests = () => {
    const { state, completeTask } = useSystemStore();

    if (!state) return null;

    const start = new Date(state.startDate).getTime();
    const now = new Date().getTime();
    const day = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    const arc = (day <= 7) ? "STABILIZATION" : (day <= 14) ? "DISCIPLINE" : (day <= 21) ? "PRESSURE" : "IDENTITY";

    return (
        <div className="quests-page">
            <SystemCard title="DIRECTIVES">
                {state.dailyTasks.map(t => (
                    <div key={t.id} className="system-window" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', marginBottom: '15px', border: '1px solid #222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '10px' }}>
                            <span className="neon-text">{t.type.toUpperCase()}</span>
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
                                <div style={{ color: 'var(--accent-gold)' }}>STAT: +1 {t.type === 'physical' ? 'STRENGTH' : 'INTELLIGENCE'}</div>
                                <div style={{ color: 'var(--accent-blue)', opacity: 0.8 }}>BONUS: +1 DISC/FOCUS</div>
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
    );
};

export const BossTrial = () => {
    const { state } = useSystemStore();

    if (!state) return null;

    const start = new Date(state.startDate).getTime();
    const now = new Date().getTime();
    const day = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

    return (
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
                        <Skull size={30} color="var(--accent-gold)" />
                        <p style={{ fontSize: '0.8rem' }}>MISSION: NO SKIPS FOR 3 DAYS</p>
                        <div className="neon-red" style={{ fontSize: '0.7rem' }}>[ STATUS: ACTIVE ]</div>
                    </div>
                </SystemCard>
            )}
        </div>
    );
};
