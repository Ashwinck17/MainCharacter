import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SystemState, Task, UserStats } from '../types';
import { INITIAL_STATS, TASK_POOL, STABILIZATION_TASKS } from '../utils/constants';
import { calculateNewStatsAfterTask, getDifficultyForStats, getJourneyDayFromStart, getArcForDay } from '../utils/gameLogic';

interface SystemStore {
    activeProfile: string | null;
    state: SystemState | null;

    // Actions
    setActiveProfile: (id: string | null) => void;
    setState: (state: SystemState | null) => void;
    createProfile: (name: string) => void;
    completeTask: (taskId: string) => void;
    checkDailyUpdate: () => void;
    syncWithCloud: () => Promise<void>;
}

export const useSystemStore = create<SystemStore>()(
    persist(
        (set, get) => ({
            activeProfile: null,
            state: null,

            setActiveProfile: (id) => set({ activeProfile: id }),

            setState: (state) => set({ state }),

            createProfile: (name) => {
                const id = name.toLowerCase().replace(/\s+/g, '_');
                const newState: SystemState = {
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

                const list = JSON.parse(localStorage.getItem('ascension_profile_list') || '[]');
                if (!list.some((p: any) => p.id === id)) {
                    list.push({ id, name });
                    localStorage.setItem('ascension_profile_list', JSON.stringify(list));
                }

                set({ activeProfile: id, state: newState });
            },

            completeTask: (taskId) => {
                const { state } = get();
                if (!state) return;

                const task = state.dailyTasks.find(t => t.id === taskId);
                if (!task || task.completed) return;

                const newStats = calculateNewStatsAfterTask(state.stats, task, state.hardcoreMode);

                set({
                    state: {
                        ...state,
                        stats: newStats,
                        dailyTasks: state.dailyTasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                        weeklyBoss: {
                            ...state.weeklyBoss,
                            currentQuests: state.weeklyBoss.currentQuests + 1
                        }
                    }
                });
            },

            checkDailyUpdate: () => {
                const { state, activeProfile } = get();
                if (!state || !activeProfile) return;

                const today = new Date().toDateString();
                const lastUpdate = new Date(state.stats.lastUpdate || 0).toDateString();

                if (today !== lastUpdate || state.dailyTasks.length === 0) {
                    const hasUnfinished = state.dailyTasks.length > 0 && state.dailyTasks.some(t => !t.completed);
                    let newStats = { ...state.stats };

                    const day = getJourneyDayFromStart(state.startDate);
                    const arc = getArcForDay(day);

                    if (hasUnfinished) {
                        const penaltyXP = arc === "STABILIZATION" ? 10 : arc === "DISCIPLINE" ? 15 : arc === "PRESSURE" ? 20 : 30;
                        newStats.xp = Math.max(newStats.xp - penaltyXP, 0);
                        newStats.hp = Math.max(newStats.hp - 20, 10);
                        newStats.streak = 0;
                        if (arc === "DISCIPLINE") newStats.FOCUS = Math.max(newStats.FOCUS - 5, 0);
                        if (arc === "PRESSURE") newStats.DISC = Math.max(newStats.DISC - 5, 0);
                    } else if (state.dailyTasks.length > 0) {
                        newStats.streak += 1;
                        if (newStats.streak % 7 === 0) {
                            newStats.xp += arc === "DISCIPLINE" ? 75 : 50;
                            newStats.WILL += 2;
                        }
                    }

                    const diff = getDifficultyForStats(newStats);
                    const pTasks = TASK_POOL.physical[diff];
                    const mTasks = TASK_POOL.mental[diff];

                    let pDesc = pTasks[Math.floor(Math.random() * pTasks.length)];
                    let mDesc = mTasks[Math.floor(Math.random() * mTasks.length)];

                    if (day <= 7) {
                        pDesc = STABILIZATION_TASKS.physical[(day - 1) % 7];
                        mDesc = STABILIZATION_TASKS.mental as string;
                    }

                    const newTasks: Task[] = [
                        {
                            id: `p-${day}-${Date.now()}`,
                            type: 'physical',
                            description: pDesc,
                            difficulty: diff,
                            xpReward: diff === 'Easy' ? 40 : diff === 'Medium' ? 50 : 70,
                            motivation: "ADAPT OR FAIL.",
                            punishment: `-${diff === 'Easy' ? 10 : 25} XP | STAT DECAY`,
                            completed: false,
                            timestamp: new Date().toISOString()
                        },
                        {
                            id: `m-${day}-${Date.now()}`,
                            type: 'mental',
                            description: mDesc,
                            difficulty: diff,
                            xpReward: diff === 'Easy' ? 40 : diff === 'Medium' ? 50 : 70,
                            motivation: "THE SYSTEM SCALES WITH YOU.",
                            punishment: `-${diff === 'Easy' ? 10 : 25} XP | FOCUS LOSS`,
                            completed: false,
                            timestamp: new Date().toISOString()
                        }
                    ];

                    newStats.assignedCount += 2;
                    newStats.lastUpdate = new Date().toISOString();

                    set({
                        state: {
                            ...state,
                            stats: newStats,
                            dailyTasks: newTasks,
                            weeklyBoss: {
                                ...state.weeklyBoss,
                                ...(new Date() > new Date(state.weeklyBoss.deadline) ? {
                                    completed: false,
                                    currentQuests: 0,
                                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                                } : {})
                            }
                        }
                    });
                }
            },

            syncWithCloud: async () => {
                // Placeholder for Firebase Sync
                console.log("Syncing with Firebase...");
            }
        }),
        {
            name: 'ascension-system-storage',
            partialize: (state) => ({ activeProfile: state.activeProfile, state: state.state }),
        }
    )
);
