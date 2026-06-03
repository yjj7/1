export interface Scene {
  id: string;
  title: string;
  description: string;
  details: string;
  imageUrl: string;
  audioUrl?: string;
  videoId?: string;
}

export type TaskCategory = 'study' | 'work' | 'exercise' | 'other';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: TaskCategory;
}

export type AppState = 'landing' | 'setup' | 'loading' | 'timer' | 'stats' | 'history';

export type TimerMode = 'countdown' | 'stopwatch';
export type PomodoroPhase = 'study' | 'shortBreak' | 'longBreak' | 'meditation';

export interface StudySession {
  id: string;
  date: string;
  duration: number;
  sceneId: string;
  tasksCompleted: number;
  tasksTotal: number;
  timerMode: TimerMode;
}

export interface DailyGoal {
  targetMinutes: number;
}

export interface NoiseLayer {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  volume: number;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface Achievement { id: string; title: string; desc: string; icon: string; earned: boolean; }
