import type { UserStats, Task } from '../types';

export const calculateNewStatsAfterTask = (
    currentStats: UserStats,
    task: Task,
    hardcoreMode: boolean
): UserStats => {
    const newStats = { ...currentStats };
    newStats.completedCount += 1;

    // Point distribution based on difficulty
    const diffMult = task.difficulty === 'Hard' ? 3 : task.difficulty === 'Medium' ? 2 : 1;
    newStats.DISC += diffMult;
    newStats.FOCUS += diffMult;

    let xpGained = task.xpReward;
    if (hardcoreMode) xpGained *= 1.25;
    newStats.xp += xpGained;

    // Stat gain based on difficulty
    const statGain = task.difficulty === 'Hard' ? 4 : task.difficulty === 'Medium' ? 2 : 1;
    if (task.type === 'physical') newStats.STR += statGain;
    if (task.type === 'mental') newStats.INT += statGain;

    // Organic stat growth for completing tasks consistently
    if (newStats.completedCount % 5 === 0) newStats.WILL += 1;
    if (newStats.completedCount % 10 === 0) newStats.CHA += 1;

    if (newStats.xp >= newStats.xpRequired) {
        newStats.level += 1;
        newStats.xp -= newStats.xpRequired;
        newStats.xpRequired = newStats.level * 100;
        newStats.hp = Math.min(newStats.hp + 20, newStats.maxHp);
    }

    return newStats;
};

export const getDifficultyForStats = (stats: UserStats): 'Easy' | 'Medium' | 'Hard' => {
    let diffScore = Math.floor(stats.level / 5);
    // Thresholds calibrated for point system
    if (stats.DISC < 15) diffScore += 1;
    if (stats.DISC > 40) diffScore += 1;

    const tiers: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];
    return tiers[Math.min(diffScore, 2)];
};

export const getJourneyDayFromStart = (startDate: string): number => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
};

export const getArcForDay = (day: number): string => {
    if (day <= 7) return "STABILIZATION";
    if (day <= 14) return "DISCIPLINE";
    if (day <= 21) return "PRESSURE";
    return "IDENTITY";
};

export const calculatePenaltyForMissedTask = (stats: UserStats, arc: string): UserStats => {
    const newStats = { ...stats };
    const penaltyXP = arc === "STABILIZATION" ? 10 : arc === "DISCIPLINE" ? 15 : arc === "PRESSURE" ? 20 : 30;
    newStats.xp = Math.max(newStats.xp - penaltyXP, 0);
    newStats.hp = Math.max(newStats.hp - 20, 10);
    newStats.streak = 0;
    if (arc === "DISCIPLINE") newStats.FOCUS = Math.max(newStats.FOCUS - 5, 0);
    if (arc === "PRESSURE") newStats.DISC = Math.max(newStats.DISC - 5, 0);
    return newStats;
};

export const calculateStreakBonus = (stats: UserStats, arc: string): UserStats => {
    const newStats = { ...stats };
    newStats.streak += 1;
    if (newStats.streak % 7 === 0) {
        newStats.xp += arc === "DISCIPLINE" ? 75 : 50;
        newStats.WILL += 2;
        // Level up check for streak bonus
        if (newStats.xp >= newStats.xpRequired) {
            newStats.level += 1;
            newStats.xp -= newStats.xpRequired;
            newStats.xpRequired = newStats.level * 100;
            newStats.hp = Math.min(newStats.hp + 20, newStats.maxHp);
        }
    }
    return newStats;
};
