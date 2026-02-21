import type { UserStats } from '../types';

export const INITIAL_STATS: UserStats = {
    level: 1,
    xp: 0,
    xpRequired: 100,
    hp: 100,
    maxHp: 100,
    STR: 10,
    INT: 10,
    DISC: 10,
    WILL: 10,
    FOCUS: 10,
    CHA: 10,
    streak: 0,
    lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    assignedCount: 0,
    completedCount: 0
};

export const STABILIZATION_TASKS = {
    physical: [
        "20 min walk",
        "30 squats + 20 wall push-ups",
        "25 min walk",
        "Stretching 15 min",
        "40 squats + plank 30s x2",
        "30 min walk",
        "Light mobility + breathing"
    ],
    mental: "30 min focused learning + 5 min journal (Actions & Resistance)"
};

export const TASK_POOL = {
    physical: {
        Easy: ["20 min walk", "30 squats + 20 wall push-ups", "15 min stretching", "Light mobility"],
        Medium: ["5km brisk walk", "Bodyweight circuit (3 sets)", "30 min intense cardio", "45 min Gym session"],
        Hard: ["Hard intensity Cardio (45m)", "Strength sets (logging reps)", "Weighted movements", "Explosive HIIT training"]
    },
    mental: {
        Easy: ["15 min learning", "5 min journaling", "Meditation", "Review archive"],
        Medium: ["45 min deep work + summary", "Learn new technical concept", "Solve 3 complex problems", "Draft production plan"],
        Hard: ["90-120 min deep work + output", "Architecture review", "Code refactoring session", "Deep research & implementation"]
    }
};
