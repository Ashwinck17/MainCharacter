import { describe, it, expect } from 'vitest';
import { calculateNewStatsAfterTask, getDifficultyForStats, getArcForDay, getJourneyDayFromStart } from '../utils/gameLogic';
import { INITIAL_STATS } from '../utils/constants';
import type { UserStats, Task } from '../types';

describe('Game Logic Extensive Test Suite', () => {

    const createBaseTask = (type: string, xpReward: number = 50): Task => ({
        id: 'test-task',
        type,
        description: 'Test',
        difficulty: 'Medium',
        xpReward,
        motivation: '',
        punishment: '',
        completed: false,
        timestamp: ''
    });

    // --- calculateNewStatsAfterTask Tests ---
    describe('calculateNewStatsAfterTask', () => {
        it('1. Increments DISC and FOCUS by 1 for any task', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS }, createBaseTask('physical'), false);
            expect(stats.DISC).toBe(INITIAL_STATS.DISC + 1);
            expect(stats.FOCUS).toBe(INITIAL_STATS.FOCUS + 1);
        });

        it('2. Completing a physical task increments STR by 1', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS }, createBaseTask('physical'), false);
            expect(stats.STR).toBe(INITIAL_STATS.STR + 1);
            expect(stats.INT).toBe(INITIAL_STATS.INT);
        });

        it('3. Completing a mental task increments INT by 1', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS }, createBaseTask('mental'), false);
            expect(stats.INT).toBe(INITIAL_STATS.INT + 1);
            expect(stats.STR).toBe(INITIAL_STATS.STR);
        });

        it('4. Completing a routine task does not increment STR or INT', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS }, createBaseTask('routine'), false);
            expect(stats.INT).toBe(INITIAL_STATS.INT);
            expect(stats.STR).toBe(INITIAL_STATS.STR);
        });

        it('5. Adds base xpReward to current XP', () => {
            const task = createBaseTask('mental', 40);
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS, xp: 10 }, task, false);
            expect(stats.xp).toBe(50);
        });

        it('6. Hardcore mode multiplies XP gain by 1.25', () => {
            const task = createBaseTask('mental', 40);
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS, xp: 0 }, task, true);
            expect(stats.xp).toBe(50); // 40 * 1.25 = 50
        });

        it('7. Levels up when xp matches xpRequired exactly', () => {
            const task = createBaseTask('mental', 100);
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS, xp: 0, xpRequired: 100, level: 1 }, task, false);
            expect(stats.level).toBe(2);
            expect(stats.xp).toBe(0);
        });

        it('8. Levels up when xp exceeds xpRequired and carries over excess', () => {
            const task = createBaseTask('mental', 150);
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS, xp: 0, xpRequired: 100, level: 1 }, task, false);
            expect(stats.level).toBe(2);
            expect(stats.xp).toBe(50);
        });

        it('9. xpRequired scales up correctly on level up (Next Level * 100)', () => {
            const task = createBaseTask('mental', 100);
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS, xp: 0, xpRequired: 100, level: 1 }, task, false);
            expect(stats.xpRequired).toBe(200); // Level 2 * 100
        });

        it('10. hp heals by 20 on level up but stays capped at maxHp', () => {
            const task = createBaseTask('mental', 100);
            const baseStats = { ...INITIAL_STATS, xp: 0, xpRequired: 100, hp: 50, maxHp: 100 };
            const stats1 = calculateNewStatsAfterTask(baseStats, task, false);
            expect(stats1.hp).toBe(70); // 50 + 20

            const baseStatsMaxHp = { ...INITIAL_STATS, xp: 0, xpRequired: 100, hp: 90, maxHp: 100 };
            const stats2 = calculateNewStatsAfterTask(baseStatsMaxHp, task, false);
            expect(stats2.hp).toBe(100); // 90 + 20 capped at 100
        });

        it('11. Increments completedCount by 1', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS, completedCount: 5 }, createBaseTask('physical'), false);
            expect(stats.completedCount).toBe(6);
        });
    });

    // --- getDifficultyForStats Tests ---
    describe('getDifficultyForStats', () => {
        it('12. Returns Easy for Level 0, normal DISC (e.g. 20)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 0, DISC: 20 });
            expect(diff).toBe('Easy'); // diffScore = 0
        });

        it('13. Returns Medium for Level 5, normal DISC (e.g. 20)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 5, DISC: 20 });
            expect(diff).toBe('Medium'); // diffScore = 5/5 = 1
        });

        it('14. Returns Hard for Level 10, normal DISC (e.g. 20)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 10, DISC: 20 });
            expect(diff).toBe('Hard'); // diffScore = 10/5 = 2
        });

        it('15. Returns Medium for Level 0, low DISC (< 15)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 0, DISC: 10 });
            expect(diff).toBe('Medium'); // diffScore = 0 + 1 = 1
        });

        it('16. Returns Hard for Level 5, low DISC (< 15)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 5, DISC: 10 });
            expect(diff).toBe('Hard'); // diffScore = 1 + 1 = 2
        });

        it('17. Returns Hard for Level 10, low DISC (< 15)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 10, DISC: 10 });
            expect(diff).toBe('Hard'); // diffScore = 2 + 1 = 3 -> capped to 2
        });

        it('18. Returns Medium for Level 0, high DISC (> 40)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 0, DISC: 50 });
            expect(diff).toBe('Medium'); // diffScore = 0 + 1 = 1
        });

        it('19. Returns Hard for Level 5, high DISC (> 40)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 5, DISC: 50 });
            expect(diff).toBe('Hard'); // diffScore = 1 + 1 = 2
        });

        it('20. Returns Hard for Level 15, any DISC', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 15, DISC: 20 });
            expect(diff).toBe('Hard'); // diffScore = 3 -> capped to 2
        });

        it('21. Math.floor is applied correctly to levels not divisible by 5 (e.g. Level 4)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 4, DISC: 20 });
            expect(diff).toBe('Easy'); // diffScore = 0
        });

        it('22. Math.floor is applied correctly to levels not divisible by 5 (e.g. Level 9)', () => {
            const diff = getDifficultyForStats({ ...INITIAL_STATS, level: 9, DISC: 20 });
            expect(diff).toBe('Medium'); // diffScore = 1
        });
    });

    // --- getArcForDay Tests ---
    describe('getArcForDay', () => {
        it('23. Day 1 is STABILIZATION', () => {
            expect(getArcForDay(1)).toBe('STABILIZATION');
        });

        it('24. Day 7 is STABILIZATION', () => {
            expect(getArcForDay(7)).toBe('STABILIZATION');
        });

        it('25. Day 8 is DISCIPLINE', () => {
            expect(getArcForDay(8)).toBe('DISCIPLINE');
        });

        it('26. Day 14 is DISCIPLINE', () => {
            expect(getArcForDay(14)).toBe('DISCIPLINE');
        });

        it('27. Day 15 is PRESSURE', () => {
            expect(getArcForDay(15)).toBe('PRESSURE');
        });

        it('28. Day 21 is PRESSURE', () => {
            expect(getArcForDay(21)).toBe('PRESSURE');
        });

        it('29. Day 22 is IDENTITY', () => {
            expect(getArcForDay(22)).toBe('IDENTITY');
        });

        it('30. Day 30 is IDENTITY', () => {
            expect(getArcForDay(30)).toBe('IDENTITY');
        });

        it('31. Day 100 (post-journey) remains IDENTITY', () => {
            expect(getArcForDay(100)).toBe('IDENTITY');
        });
    });

    // --- getJourneyDayFromStart Tests ---
    describe('getJourneyDayFromStart', () => {
        it('32. Returns 1 for current timestamp', () => {
            const nowIso = new Date().toISOString();
            expect(getJourneyDayFromStart(nowIso)).toBe(1);
        });

        it('33. Returns 11 for 10 days ago', () => {
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            expect(getJourneyDayFromStart(tenDaysAgo.toISOString())).toBe(11); // 10 days passed -> day 11
        });

        it('34. Returns 30 for 29 days ago', () => {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - 29);
            expect(getJourneyDayFromStart(daysAgo.toISOString())).toBe(30);
        });
    });

});
