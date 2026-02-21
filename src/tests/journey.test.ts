import { describe, it, expect } from 'vitest';
import { calculateNewStatsAfterTask, getDifficultyForStats, getArcForDay, getJourneyDayFromStart, calculatePenaltyForMissedTask, calculateStreakBonus } from '../utils/gameLogic';
import { INITIAL_STATS } from '../utils/constants';
import type { UserStats, Task } from '../types';

describe('Game Logic Extensive Test Suite', () => {

    const createBaseTask = (type: 'physical' | 'mental' | 'routine', xpReward: number = 50): Task => ({
        id: 'test-task',
        type: type as "physical" | "mental",
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
        it('1. Increments DISC and FOCUS dynamically based on difficulty (+2 for Medium)', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS }, createBaseTask('physical'), false);
            expect(stats.DISC).toBe(INITIAL_STATS.DISC + 2);
            expect(stats.FOCUS).toBe(INITIAL_STATS.FOCUS + 2);
        });

        it('2. Completing a physical Medium task increments STR by 2', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS }, createBaseTask('physical'), false);
            expect(stats.STR).toBe(INITIAL_STATS.STR + 2);
            expect(stats.INT).toBe(INITIAL_STATS.INT);
        });

        it('3. Completing a mental Medium task increments INT by 2', () => {
            const stats = calculateNewStatsAfterTask({ ...INITIAL_STATS }, createBaseTask('mental'), false);
            expect(stats.INT).toBe(INITIAL_STATS.INT + 2);
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

    // --- calculatePenaltyForMissedTask Tests ---
    describe('calculatePenaltyForMissedTask (Missed Tasks)', () => {
        it('35. STABILIZATION Arc penalty (-10 XP, HP drop)', () => {
            const stats = calculatePenaltyForMissedTask({ ...INITIAL_STATS, xp: 50, hp: 100, streak: 5 }, 'STABILIZATION');
            expect(stats.xp).toBe(40);
            expect(stats.hp).toBe(80);
            expect(stats.streak).toBe(0);
        });

        it('36. DISCIPLINE Arc penalty (-15 XP, HP drop, -5 FOCUS)', () => {
            const stats = calculatePenaltyForMissedTask({ ...INITIAL_STATS, xp: 50, hp: 100, FOCUS: 20 }, 'DISCIPLINE');
            expect(stats.xp).toBe(35);
            expect(stats.hp).toBe(80);
            expect(stats.FOCUS).toBe(15);
        });

        it('37. PRESSURE Arc penalty (-20 XP, HP drop, -5 DISC)', () => {
            const stats = calculatePenaltyForMissedTask({ ...INITIAL_STATS, xp: 50, hp: 100, DISC: 30 }, 'PRESSURE');
            expect(stats.xp).toBe(30);
            expect(stats.hp).toBe(80);
            expect(stats.DISC).toBe(25);
        });

        it('38. IDENTITY Arc penalty (-30 XP, HP drop)', () => {
            const stats = calculatePenaltyForMissedTask({ ...INITIAL_STATS, xp: 100, hp: 100 }, 'IDENTITY');
            expect(stats.xp).toBe(70);
            expect(stats.hp).toBe(80);
        });

        it('39. XP and HP drop do not go below minimum floors', () => {
            const stats = calculatePenaltyForMissedTask({ ...INITIAL_STATS, xp: 5, hp: 20 }, 'STABILIZATION');
            expect(stats.xp).toBe(0); // Max 0
            expect(stats.hp).toBe(10); // Min 10
        });
    });

    // --- calculateStreakBonus Tests ---
    describe('calculateStreakBonus', () => {
        it('40. Increments streak by 1 on normal days', () => {
            const stats = calculateStreakBonus({ ...INITIAL_STATS, streak: 5 }, 'STABILIZATION');
            expect(stats.streak).toBe(6);
            expect(stats.WILL).toBe(INITIAL_STATS.WILL);
        });

        it('41. Awards massive XP and +WILL every 7 streak days', () => {
            const stats = calculateStreakBonus({ ...INITIAL_STATS, streak: 6, WILL: 10 }, 'STABILIZATION');
            expect(stats.streak).toBe(7);
            expect(stats.WILL).toBe(12);
            expect(stats.xp).toBe(50);
        });

        it('42. Awards 75 XP in DISCIPLINE arc for 7 streak days', () => {
            const stats = calculateStreakBonus({ ...INITIAL_STATS, streak: 13, WILL: 10 }, 'DISCIPLINE');
            expect(stats.streak).toBe(14);
            expect(stats.xp).toBe(75);
            expect(stats.WILL).toBe(12);
        });

        it('43. Triggers Level Up if streak bonus XP crosses xpRequired', () => {
            const stats = calculateStreakBonus({ ...INITIAL_STATS, streak: 6, xp: 60, xpRequired: 100, level: 1 }, 'STABILIZATION');
            expect(stats.level).toBe(2);
            expect(stats.xp).toBe(10); // 60 + 50 = 110, 110 - 100 = 10 carried over
        });
    });

    // --- 30-Day Simulated Journey Tests ---
    describe('Full 30-Day Game Journey Simulation', () => {
        it('44. Simulates a flawless 30-day run with organic difficulty scaling and level ups', () => {
            let stats: UserStats = { ...INITIAL_STATS };

            for (let day = 1; day <= 30; day++) {
                const arc = getArcForDay(day);
                const diff = getDifficultyForStats(stats);

                // Diff starts Easy, should evolve to Medium, then Hard dynamically
                const xpGain = diff === 'Easy' ? 40 : diff === 'Medium' ? 50 : 70;

                // Simulate daily logic: user completes both tasks successfully
                const pTask = createBaseTask('physical', xpGain);
                const mTask = createBaseTask('mental', xpGain);
                pTask.difficulty = diff; mTask.difficulty = diff;

                stats = calculateNewStatsAfterTask(stats, pTask, false);
                stats = calculateNewStatsAfterTask(stats, mTask, false);
                stats = calculateStreakBonus(stats, arc);
            }

            // Assertions after 30 days of grinding
            expect(stats.completedCount).toBe(60); // 2 tasks * 30 days
            expect(stats.level).toBeGreaterThanOrEqual(8);
            expect(stats.DISC).toBeGreaterThan(INITIAL_STATS.DISC + 60);
            expect(stats.STR).toBeGreaterThan(INITIAL_STATS.STR + 30);
            expect(stats.INT).toBeGreaterThan(INITIAL_STATS.INT + 30);
            expect(stats.streak).toBe(30);
            expect(stats.WILL).toBe(INITIAL_STATS.WILL + 12 + (Math.floor(30 / 7) * 2)); // 12 organic proc + 4 streak proc
        });

        it('45. Simulates a rocky 30-day run with misses triggering stat decay and hp drops', () => {
            let stats: UserStats = { ...INITIAL_STATS };
            let totalPenalties = 0;

            for (let day = 1; day <= 30; day++) {
                const arc = getArcForDay(day);
                const diff = getDifficultyForStats(stats);
                const xpGain = diff === 'Easy' ? 40 : diff === 'Medium' ? 50 : 70;

                // User fails every 3rd day
                if (day % 3 === 0) {
                    stats = calculatePenaltyForMissedTask(stats, arc);
                    totalPenalties++;
                } else {
                    const pTask = createBaseTask('physical', xpGain);
                    const mTask = createBaseTask('mental', xpGain);
                    stats = calculateNewStatsAfterTask(stats, pTask, false);
                    stats = calculateNewStatsAfterTask(stats, mTask, false);
                    stats = calculateStreakBonus(stats, arc);
                }
            }

            // After 30 days with 10 misses and 20 success days
            expect(totalPenalties).toBe(10);
            expect(stats.streak).toBeLessThan(3); // constantly broken
            expect(stats.completedCount).toBe(40); // 2 tasks * 20 days
            expect(stats.level).toBeLessThan(8); // Progress stunted by penalties
            // After 30 days with 10 misses and 20 success days
            expect(totalPenalties).toBe(10);
            expect(stats.streak).toBeLessThan(3); // constantly broken
            expect(stats.completedCount).toBe(40); // 2 tasks * 20 days
            expect(stats.level).toBeLessThan(8); // Progress stunted by penalties
            console.log('T45 - Rocky 30 days stats:', stats.DISC, stats.FOCUS);
        });
    });

    // --- Profile Management Tests ---
    describe('Profile Management Setup (Mocked)', () => {
        let mockedProfiles: { id: string, name: string }[] = [];

        const createMockProfile = (name: string) => {
            const id = name.toLowerCase().replace(/\s+/g, '_');
            mockedProfiles.push({ id, name });
            return id;
        };

        const deleteMockProfile = (id: string) => {
            mockedProfiles = mockedProfiles.filter(p => p.id !== id);
        };

        it('46. Can successfully create, load, and delete a profile logic flow', () => {
            // Add Profile
            const profileId = createMockProfile("Ashwin");
            expect(profileId).toBe("ashwin");
            expect(mockedProfiles.length).toBe(1);
            expect(mockedProfiles[0].name).toBe("Ashwin");

            // Add Profile with Spaces
            const secondId = createMockProfile("Dark Lord");
            expect(secondId).toBe("dark_lord");
            expect(mockedProfiles.length).toBe(2);

            // Verify "Loading" simulates cleanly finding the profile
            const target = mockedProfiles.find(p => p.id === "dark_lord");
            expect(target).toBeDefined();

            // Delete Profile
            deleteMockProfile("ashwin");
            expect(mockedProfiles.length).toBe(1);
            expect(mockedProfiles[0].id).toBe("dark_lord");
        });
    });
});
