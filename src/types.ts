export type StatType = 'STR' | 'INT' | 'DISC' | 'WILL' | 'FOCUS' | 'CHA';

export interface Task {
  id: string;
  type: 'physical' | 'mental';
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  motivation: string;
  punishment: string;
  completed: boolean;
  timestamp: string;
}

export interface UserStats {
  level: number;
  xp: number;
  xpRequired: number;
  hp: number;
  maxHp: number;
  STR: number;
  INT: number;
  DISC: number;
  WILL: number;
  FOCUS: number;
  CHA: number;
  streak: number;
  lastUpdate: string;
  assignedCount: number;
  completedCount: number;
}

export interface SystemState {
  version: string;
  startDate: string;
  stats: UserStats;
  dailyTasks: Task[];
  buffs: string[];
  history: { date: string; tasksCompleted: number; xpGained: number }[];
  hardcoreMode: boolean;
  weeklyBoss: {
    name: string;
    completed: boolean;
    requiredQuests: number;
    currentQuests: number;
    deadline: string;
  };
}
