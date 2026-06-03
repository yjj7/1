import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, StudySession, DailyGoal, ScenePresetItem } from './types';

export interface StudyStore {
  // Scene & Music
  selectedSceneId: string;
  selectedMusicId: string;
  musicVolume: number;
  bgVolume: number;
  customMusicUrl: string;
  customBgUrl: string;

  // Timer
  timerDuration: number;
  pomodoroCount: number;

  // Tasks
  tasks: Task[];

  // Goals & History
  dailyGoal: DailyGoal;
  studyHistory: StudySession[];
  streak: number;

  // Presets & Achievements
  scenePresets: ScenePresetItem[];
  earnedAchievements: string[];

  // Onboarding
  showOnboarding: boolean;

  // Actions
  setScene: (id: string) => void;
  setMusic: (id: string) => void;
  setMusicVolume: (v: number) => void;
  setBgVolume: (v: number) => void;
  setCustomMusicUrl: (url: string) => void;
  setCustomBgUrl: (url: string) => void;
  setTimerDuration: (d: number) => void;
  incrementPomodoro: () => void;
  setTasks: (tasks: Task[]) => void;
  setDailyGoal: (g: DailyGoal) => void;
  recordSession: (session: StudySession) => void;
  updateStreak: (s: number) => void;
  savePreset: (preset: ScenePresetItem) => void;
  deletePreset: (id: string) => void;
  earnAchievement: (id: string) => void;
  dismissOnboarding: () => void;
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set) => ({
      // Defaults
      selectedSceneId: 'morning_window',
      selectedMusicId: 'gymnopedie',
      musicVolume: 50,
      bgVolume: 30,
      customMusicUrl: '',
      customBgUrl: '',
      timerDuration: 25,
      pomodoroCount: 0,
      tasks: [],
      dailyGoal: { targetMinutes: 120 },
      studyHistory: [],
      streak: 0,
      scenePresets: [],
      earnedAchievements: [],
      showOnboarding: true,

      // Simple setters
      setScene: (id) => set({ selectedSceneId: id }),
      setMusic: (id) => set({ selectedMusicId: id }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setBgVolume: (v) => set({ bgVolume: v }),
      setCustomMusicUrl: (url) => set({ customMusicUrl: url }),
      setCustomBgUrl: (url) => set({ customBgUrl: url }),
      setTimerDuration: (d) => set({ timerDuration: d }),
      incrementPomodoro: () => set((s) => ({ pomodoroCount: s.pomodoroCount + 1 })),
      setTasks: (tasks) => set({ tasks }),
      setDailyGoal: (g) => set({ dailyGoal: g }),

      recordSession: (session) =>
        set((s) => ({
          studyHistory: [session, ...s.studyHistory],
        })),

      updateStreak: (streak) => set({ streak }),

      savePreset: (preset) =>
        set((s) => ({
          scenePresets: [...s.scenePresets.filter((p) => p.id !== preset.id), preset],
        })),

      deletePreset: (id) =>
        set((s) => ({
          scenePresets: s.scenePresets.filter((p) => p.id !== id),
        })),

      earnAchievement: (id) =>
        set((s) => ({
          earnedAchievements: s.earnedAchievements.includes(id)
            ? s.earnedAchievements
            : [...s.earnedAchievements, id],
        })),

      dismissOnboarding: () => set({ showOnboarding: false }),
    }),
    {
      name: 'swm-store',
      partialize: (state) => ({
        selectedSceneId: state.selectedSceneId,
        selectedMusicId: state.selectedMusicId,
        musicVolume: state.musicVolume,
        bgVolume: state.bgVolume,
        timerDuration: state.timerDuration,
        tasks: state.tasks,
        pomodoroCount: state.pomodoroCount,
        customBgUrl: state.customBgUrl,
        dailyGoal: state.dailyGoal,
        studyHistory: state.studyHistory,
        streak: state.streak,
        scenePresets: state.scenePresets,
        earnedAchievements: state.earnedAchievements,
      }),
    }
  )
);
