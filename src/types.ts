export interface Scene {
  id: string;
  title: string;
  description: string;
  details: string;
  imageUrl: string;
  audioUrl?: string;
  videoUrl?: string;
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

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  earned: boolean;
}

// Shared types (unified from App.tsx / SetupPage.tsx duplicates)
export interface ScenePresetItem {
  id: string;
  sceneId: string;
  musicId: string;
  label: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  audioUrl: string;
}

export interface PersistedState {
  selectedSceneId: string;
  selectedMusicId: string;
  musicVolume: number;
  bgVolume: number;
  timerDuration: number;
  tasks: Task[];
  pomodoroCount: number;
  customBgUrl: string;
  dailyGoal: DailyGoal;
  studyHistory: StudySession[];
  streak: number;
  scenePresets: ScenePresetItem[];
  earnedAchievements: string[];
  showOnboarding: boolean;
}
