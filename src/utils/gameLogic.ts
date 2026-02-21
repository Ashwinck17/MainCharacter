import { UserStats, Task } from '../types';

export const calculateNewStatsAfterTask = (
    currentStats: UserStats,
    task: Task,
    hardcoreMode: boolean
): UserStats => {
    const newStats = { ...currentStats };
    newStats.completedCount += 1;

    // Point-based stat increments
    newStats.DISC += 1;
    newStats.FOCUS += 1;

    let xpGained = task.xpReward;
    if (hardcoreMode) xpGained *= 1.25;
    newStats.xp += xpGained;

    if (task.type === 'physical') newStats.STR += 1;
    if (task.type === 'mental') newStats.INT += 1;

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
