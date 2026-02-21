import { motion } from 'framer-motion';

interface StatBarProps {
    label: string;
    current: number;
    max: number;
    color?: string;
    isRed?: boolean;
}

export const StatBar = ({ label, current, max, color, isRed }: StatBarProps) => {
    const percentage = Math.min((current / max) * 100, 100);

    return (
        <div className="stat-item" style={{ marginBottom: '12px' }}>
            <div className="stat-label">
                <span>{label}</span>
                <span>{current} / {max}</span>
            </div>
            <div className="progress-container">
                <motion.div
                    className={`progress-fill ${isRed ? 'red-fill' : ''}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={color ? { background: color, boxShadow: `0 0 10px ${color}` } : {}}
                />
            </div>
        </div>
    );
};
