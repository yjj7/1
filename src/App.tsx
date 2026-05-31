import { useState, useEffect, useCallback } from 'react';
import { AppState, Task, StudySession, DailyGoal, Note, Achievement, WeekPlanSlot } from './types';
import { LandingPage } from './components/LandingPage';
import { SetupPage } from './components/SetupPage';
import { TimerPage } from './components/TimerPage';
import { LoadingScreen } from './components/LoadingScreen';
import { StatsPage } from './components/StatsPage';
import { HistoryPage } from './components/HistoryPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SCENES, DURATIONS, MUSIC_TRACKS } from './data';
import { audioManager } from './audioManager';
import { recommendScene, detectHoliday, holidayTheme } from './utils';
import { checkAchievements, ACHIEVEMENTS, AchievementCtx } from './extras';

function loadState<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; } catch { return fallback; }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [loadingSceneId, setLoadingSceneId] = useState('');
  const [loadingMusicId, setLoadingMusicId] = useState('');
  const [loadingMusicVolume, setLoadingMusicVolume] = useState(50);
  const [loadingBgVolume, setLoadingBgVolume] = useState(30);

  const holiday = detectHoliday();
  const theme = holidayTheme(holiday?.id || null);
  const autoScene = recommendScene();

  // Persisted preferences
  const [selectedSceneId, setSelectedSceneId] = useState(() => loadState('swm_scene', autoScene));
  const [selectedMusicId, setSelectedMusicId] = useState(() => loadState('swm_music', MUSIC_TRACKS[0].id));
  const [musicVolume, setMusicVolume] = useState(() => loadState('swm_musicVol', 50));
  const [bgVolume, setBgVolume] = useState(() => loadState('swm_bgVol', 30));
  const [timerDuration, setTimerDuration] = useState(() => loadState('swm_duration', DURATIONS[1]));
  const [tasks, setTasks] = useState<Task[]>(() => loadState('swm_tasks', []));
  const [pomodoroCount, setPomodoroCount] = useState(() => loadState('swm_pomodoros', 0));
  const [customMusicUrl, setCustomMusicUrl] = useState('');
  const [customBgUrl, setCustomBgUrl] = useState(() => loadState('swm_customBg', ''));
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(() => loadState('swm_dailyGoal', { targetMinutes: 120 }));
  const [studyHistory, setStudyHistory] = useState<StudySession[]>(() => loadState('swm_history', []));
  const [notes, setNotes] = useState<Note[]>(() => loadState('swm_notes', []));
  const [streak, setStreak] = useState(() => loadState('swm_streak', 0));
  const [scenePresets, setScenePresets] = useState<{ id: string; sceneId: string; musicId: string; label: string }[]>(() => loadState('swm_presets', []));
  const [weekPlan, setWeekPlan] = useState<WeekPlanSlot[]>(() => loadState('swm_weekplan', []));
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>(() => loadState('swm_achievements', []));

  // Check for new achievements
  useEffect(() => {
    const totalMinutes = studyHistory.reduce((s, h) => s + h.duration, 0) / 60;
    const ctx: AchievementCtx = { totalMinutes, pomodoroCount, streak, sessions: studyHistory, sessionCount: studyHistory.length };
    const earned = checkAchievements(ctx).map(a => a.id);
    const newAchievements = earned.filter(id => !earnedAchievements.includes(id));
    if (newAchievements.length > 0) setEarnedAchievements(prev => [...prev, ...newAchievements]);
  }, [studyHistory, pomodoroCount, streak]);

  // Persist
  useEffect(() => {
    const data: Record<string, any> = {
      swm_scene: selectedSceneId, swm_music: selectedMusicId,
      swm_musicVol: musicVolume, swm_bgVol: bgVolume,
      swm_duration: timerDuration, swm_tasks: tasks, swm_pomodoros: pomodoroCount,
      swm_dailyGoal: dailyGoal, swm_history: studyHistory, swm_notes: notes,
      swm_streak: streak, swm_presets: scenePresets,
      swm_weekplan: weekPlan, swm_achievements: earnedAchievements,
    };
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  }, [selectedSceneId, selectedMusicId, musicVolume, bgVolume, timerDuration, tasks, pomodoroCount, dailyGoal, studyHistory, notes, streak, scenePresets, weekPlan, earnedAchievements]);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // Update streak
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const totalMinutes = studyHistory.filter(s => s.date.slice(0, 10) === today).reduce((s, h) => s + h.duration, 0) / 60;
    if (totalMinutes >= dailyGoal.targetMinutes) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const yMin = studyHistory.filter(s => s.date.slice(0, 10) === yesterday).reduce((s, h) => s + h.duration, 0) / 60;
      if (yMin >= dailyGoal.targetMinutes || streak === 0) setStreak(prev => Math.max(prev, 1));
    }
  }, [studyHistory, dailyGoal, streak]);

  const getMusicUrl = (mId: string) => mId === 'custom' && customMusicUrl ? customMusicUrl : (MUSIC_TRACKS.find(m => m.id === mId)?.audioUrl || '');
  const getSceneImageUrl = (sId: string) => sId === 'custom' && customBgUrl ? customBgUrl : (SCENES.find(s => s.id === sId)?.imageUrl || SCENES[0].imageUrl);
  const recordSession = useCallback((s: StudySession) => setStudyHistory(prev => [...prev, s]), []);

  const achievements = ACHIEVEMENTS.map(a => ({ ...a, earned: earnedAchievements.includes(a.id) }));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white selection:bg-white/30">
        {appState === 'landing' && <LandingPage onStart={() => setAppState('setup')} onStats={() => setAppState('stats')} onHistory={() => setAppState('history')} streak={streak} pomodoroCount={pomodoroCount} holiday={holiday} achievements={achievements} />}
        {appState === 'setup' && <SetupPage selectedSceneId={selectedSceneId} onSelectScene={setSelectedSceneId} selectedMusicId={selectedMusicId} onSelectMusic={setSelectedMusicId} musicVolume={musicVolume} onMusicVolumeChange={setMusicVolume} bgVolume={bgVolume} onBgVolumeChange={setBgVolume} timerDuration={timerDuration} onTimerDurationChange={setTimerDuration} customMusicUrl={customMusicUrl} onCustomMusicChange={setCustomMusicUrl} customBgUrl={customBgUrl} onCustomBgChange={(url) => { setCustomBgUrl(url); setSelectedSceneId('custom'); }} dailyGoal={dailyGoal} onDailyGoalChange={setDailyGoal} scenePresets={scenePresets} onSavePreset={(sId, mId, label) => setScenePresets(prev => [...prev, { id: Date.now().toString(), sceneId: sId, musicId: mId, label }])} onLoadPreset={(p) => { setSelectedSceneId(p.sceneId); setSelectedMusicId(p.musicId); }} onDeletePreset={(id) => setScenePresets(prev => prev.filter(p => p.id !== id))} recommendedScene={autoScene} onBack={() => setAppState('landing')} onStats={() => setAppState('stats')} onHistory={() => setAppState('history')} onEnter={() => { try { const s = new Audio(); s.play().then(() => s.pause()).catch(() => {}); } catch {} audioManager.init(); setLoadingSceneId(selectedSceneId); setLoadingMusicId(selectedMusicId); setLoadingMusicVolume(musicVolume); setLoadingBgVolume(bgVolume); setAppState('loading'); }} />}
        {appState === 'loading' && <LoadingScreen sceneId={loadingSceneId} musicId={loadingMusicId} musicUrl={getMusicUrl(loadingMusicId)} musicVolume={loadingMusicVolume} bgVolume={loadingBgVolume} onReady={() => setAppState('timer')} />}
        {appState === 'timer' && <TimerPage sceneId={selectedSceneId} musicId={selectedMusicId} onSelectMusic={setSelectedMusicId} musicUrl={getMusicUrl(selectedMusicId)} durationMinutes={timerDuration} musicVolume={musicVolume} onMusicVolumeChange={setMusicVolume} bgVolume={bgVolume} onBgVolumeChange={setBgVolume} onExit={() => { audioManager.stop(); setAppState('landing'); }} key={`${selectedSceneId}-${selectedMusicId}`} tasks={tasks} onTasksChange={setTasks} pomodoroCount={pomodoroCount} onPomodoroComplete={() => setPomodoroCount(prev => prev + 1)} customMusicUrl={customMusicUrl} onCustomMusicChange={setCustomMusicUrl} sceneImageUrl={getSceneImageUrl(selectedSceneId)} onRecordSession={recordSession} notes={notes} onNotesChange={setNotes} holiday={holiday} />}
        {appState === 'stats' && <StatsPage studyHistory={studyHistory} dailyGoal={dailyGoal} streak={streak} pomodoroCount={pomodoroCount} achievements={achievements} onBack={() => setAppState('landing')} />}
        {appState === 'history' && <HistoryPage studyHistory={studyHistory} onBack={() => setAppState('landing')} onClearHistory={() => { setStudyHistory([]); setStreak(0); setPomodoroCount(0); }} />}
      </div>
    </ErrorBoundary>
  );
}
