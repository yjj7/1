export interface Scene {
  id: string;
  title: string;
  description: string;
  details: string;
  imageUrl: string;
  audioUrl?: string;
  videoId?: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export type AppState = 'landing' | 'setup' | 'loading' | 'timer' | 'stats' | 'history';

export type TimerMode = 'countdown' | 'stopwatch';
export type PomodoroPhase = 'study' | 'shortBreak' | 'longBreak';

export interface StudySession {
  id: string;
  date: string;           // ISO date string
  duration: number;        // seconds
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
  volume: number;          // 0-100
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}
