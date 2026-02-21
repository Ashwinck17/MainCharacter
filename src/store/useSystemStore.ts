import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from 'firebase/auth';
import type { SystemState, Task } from '../types';
import { INITIAL_STATS, TASK_POOL, STABILIZATION_TASKS } from '../utils/constants';
import { calculateNewStatsAfterTask, getDifficultyForStats, getJourneyDayFromStart, getArcForDay, calculatePenaltyForMissedTask, calculateStreakBonus } from '../utils/gameLogic';
import { saveProfileData, saveProfileList } from '../api/firebaseService';

interface SystemStore {
    user: User | null;
    activeProfile: string | null;
    state: SystemState | null;

    // Actions
    setUser: (user: User | null) => void;
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
            user: null,
            activeProfile: null,
            state: null,

            setUser: (user) => set({ user }),

            setActiveProfile: (id) => set({ activeProfile: id }),

            setState: (state) => {
                set({ state });
                // Auto-save to cloud if possible
                const { user, activeProfile } = get();
                if (user && activeProfile && state) {
                    saveProfileData(user.uid, activeProfile, state);
                }
            },

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

                // Push newly created profile + updated index to cloud
                const { user } = get();
                if (user) {
                    saveProfileData(user.uid, id, newState);
                    saveProfileList(user.uid, list);
                }
            },

            completeTask: (taskId) => {
                const { state, user, activeProfile } = get();
                if (!state) return;

                const task = state.dailyTasks.find(t => t.id === taskId);
                if (!task || task.completed) return;

                const newStats = calculateNewStatsAfterTask(state.stats, task, state.hardcoreMode);
                const newState = {
                    ...state,
                    stats: newStats,
                    dailyTasks: state.dailyTasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                    weeklyBoss: {
                        ...state.weeklyBoss,
                        currentQuests: state.weeklyBoss.currentQuests + 1
                    }
                };

                set({ state: newState });

                // Cloud sync
                if (user && activeProfile) {
                    saveProfileData(user.uid, activeProfile, newState);
                }
            },

            checkDailyUpdate: () => {
                const { state, activeProfile, user } = get();
                if (!state || !activeProfile) return;

                const today = new Date().toDateString();
                const lastUpdate = new Date(state.stats.lastUpdate || 0).toDateString();

                if (today !== lastUpdate || state.dailyTasks.length === 0) {
                    const hasUnfinished = state.dailyTasks.length > 0 && state.dailyTasks.some(t => !t.completed);
                    let newStats = { ...state.stats };

                    const day = getJourneyDayFromStart(state.startDate);
                    const arc = getArcForDay(day);

                    if (hasUnfinished) {
                        newStats = calculatePenaltyForMissedTask(newStats, arc);
                    } else if (state.dailyTasks.length > 0) {
                        newStats = calculateStreakBonus(newStats, arc);
                    }

                    let diff = getDifficultyForStats(newStats);

                    if (day <= 7) {
                        diff = 'Easy';
                    }

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

                    const newState = {
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
                    };

                    set({ state: newState });

                    // Cloud sync on day change
                    if (user && activeProfile) {
                        saveProfileData(user.uid, activeProfile, newState);
                    }
                }
            },

            syncWithCloud: async () => {
                // This is now handled by onSnapshot in App.tsx
            }
        }),
        {
            name: 'ascension-system-storage',
            partialize: (state) => ({ activeProfile: state.activeProfile, state: state.state }),
        }
    )
);
