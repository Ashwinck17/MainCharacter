import { Sword, Brain, Shield, Zap, Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatBar } from '../../components/StatBar';
import { SystemCard } from '../../components/SystemCard';
import { useSystemStore } from '../../store/useSystemStore';

export const Dashboard = () => {
    const { state, activeProfile } = useSystemStore();

    if (!state || !activeProfile) return null;

    const isDebuffed = state.stats.hp < 40;

    const start = new Date(state.startDate).getTime();
    const now = new Date().getTime();
    const day = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    const arc = (day <= 7) ? "STABILIZATION" : (day <= 14) ? "DISCIPLINE" : (day <= 21) ? "PRESSURE" : "IDENTITY";

    return (
        <motion.div
            className="status-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, staggerChildren: 0.1 }}
        >
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SystemCard title="CORE STATS">
                    <StatBar label="LEVEL" current={state.stats.level} max={100} />
                    <StatBar label="VITALITY" current={state.stats.hp} max={state.stats.maxHp} isRed />
                    <StatBar label="EXPERIENCE" current={Math.floor(state.stats.xp)} max={state.stats.xpRequired} />
                </SystemCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <SystemCard title="ATTRIBUTES">
                    <div className={`stats-grid ${isDebuffed ? 'grayscale' : ''}`}>
                        <Attribute label="STRENGTH" value={state.stats.STR} icon={<Sword size={12} />} />
                        <Attribute label="INTELLIGENCE" value={state.stats.INT} icon={<Brain size={12} />} />
                        <Attribute label="DISCIPLINE" value={state.stats.DISC} icon={<Shield size={12} />} />
                        <Attribute label="WILLPOWER" value={state.stats.WILL} icon={<Zap size={12} />} />
                        <Attribute label="FOCUS" value={state.stats.FOCUS} icon={<Target size={12} />} />
                        <Attribute label="CHARISMA" value={state.stats.CHA} icon={<Users size={12} />} />
                    </div>
                </SystemCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <SystemCard title="SYSTEM LOG">
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.6' }}>
                        STREAK: {state.stats.streak} DAYS<br />
                        QUESTS CLEARED: {state.stats.completedCount} / {state.stats.assignedCount}<br />
                        CURRENT ARC: {arc}<br />
                        PROFILE: {activeProfile.toUpperCase().replace('_', ' ')}
                    </div>
                </SystemCard>
            </motion.div>
        </motion.div>
    );
};
const Attribute = ({ label, value, icon }: { label: string, value: number, icon: any }) => (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '5px' }}>{icon} {label}</span>
        <span className="neon-text" style={{ fontSize: '0.8rem' }}>{value}</span>
    </div>
);
