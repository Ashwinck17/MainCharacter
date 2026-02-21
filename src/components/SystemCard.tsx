import React from 'react';
import { motion } from 'framer-motion';

interface SystemCardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export const SystemCard = ({ children, title, className = "" }: SystemCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`system-window ${className}`}
            style={{ padding: '20px', marginBottom: '20px' }}
        >
            {title && (
                <h3 className="neon-text" style={{ fontSize: '0.9rem', marginBottom: '15px', marginTop: 0 }}>
                    [ {title} ]
                </h3>
            )}
            {children}
        </motion.div>
    );
};
