import { describe, it, expect } from 'vitest';
import { calculateNewStatsAfterTask, getDifficultyForStats, getArcForDay } from '../utils/gameLogic';
import { INITIAL_STATS } from '../utils/constants';
import type { UserStats, Task } from '../types';

describe('30-Day Success Journey Simulation', () => {
    it('should reach Day 30 with correct scaling and Identify Arc', () => {
        let stats: UserStats = { ...INITIAL_STATS };
        const hardcoreMode = false;

        // Simulation loop for 30 days
        for (let day = 1; day <= 30; day++) {
            const arc = getArcForDay(day);
            const difficulty = getDifficultyForStats(stats);

            // Simulate 2 tasks per day (Physical and Mental)
            const physicalTask: Task = {
                id: `p-${day}`,
                type: 'physical',
                description: 'Exercise',
                difficulty: difficulty,
                xpReward: difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 50 : 70,
                motivation: '',
                punishment: '',
                completed: false,
                timestamp: ''
            };

            const mentalTask: Task = {
                id: `m-${day}`,
                type: 'mental',
                description: 'Learning',
                difficulty: difficulty,
                xpReward: difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 50 : 70,
                motivation: '',
                punishment: '',
                completed: false,
                timestamp: ''
            };

            // Complete tasks
            stats = calculateNewStatsAfterTask(stats, physicalTask, hardcoreMode);
            stats = calculateNewStatsAfterTask(stats, mentalTask, hardcoreMode);

            // Assigned count increment (normally handled in store, here for consistency)
            stats.assignedCount += 2;

            if (day === 7) expect(arc).toBe('STABILIZATION');
            if (day === 14) expect(arc).toBe('DISCIPLINE');
            if (day === 21) expect(arc).toBe('PRESSURE');
            if (day === 30) expect(arc).toBe('IDENTITY');
        }

        // Final Verification
        expect(stats.level).toBeGreaterThanOrEqual(8); // Expect non-linear progression
        expect(stats.DISC).toBe(30 * 2 + 10); // 10 base + 2 per day
        expect(stats.completedCount).toBe(60); // 2 tasks * 30 days
        console.log('--- 30 DAY JOURNEY SUCCESS ---');
        console.log('Final Level:', stats.level);
        console.log('Final Discipline:', stats.DISC);
        console.log('Final Strength:', stats.STR);
        console.log('Final Intelligence:', stats.INT);
    });
});
