import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, Task, StudySession, DailyGoal, Note, Achievement } from './types';
import { LandingPage } from './components/LandingPage';
import { SetupPage } from './components/SetupPage';
import { TimerPage } from './components/TimerPage';
import { LoadingScreen } from './components/LoadingScreen';
import { StatsPage } from './components/StatsPage';
import { HistoryPage } from './components/HistoryPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingGuide } from './components/OnboardingGuide';
import { SCENES, DURATIONS, MUSIC_TRACKS } from './data';
import { audioManager } from './audioManager';
import { recommendScene, detectHoliday } from './utils';
import { checkAchievements, ACHIEVEMENTS, AchievementCtx } from './extras';
import { LangProvider } from './i18n';

interface ScenePresetItem { id: string; sceneId: string; musicId: string; label: string; }

interface PersistedState {
  swm_scene: string;
  swm_music: string;
  swm_musicVol: number;
  swm_bgVol: number;
  swm_duration: number;
  swm_tasks: Task[];
  swm_pomodoros: number;
  swm_dailyGoal: DailyGoal;
  swm_history: StudySession[];
  swm_notes: Note[];
  swm_streak: number;
  swm_presets: ScenePresetItem[];
  swm_achievements: string[];
}

function loadState<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; } catch { return fallback; }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [loadingSceneId, setLoadingSceneId] = useState('');
  const [loadingMusicId, setLoadingMusicId] = useState('');
  const [loadingMusicVolume, setLoadingMusicVolume] = useState(50);
  const [loadingBgVolume, setLoadingBgVolume] = useState(30);

  const holiday = useMemo(() => detectHoliday(), []);

  const [selectedSceneId, setSelectedSceneId] = useState(() => loadState('swm_scene', recommendScene()));
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
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>(() => loadState('swm_achievements', []));
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const done = localStorage.getItem('swm_onboarding_done');
    return done !== 'true';
  });

  const earnedAchievementsRef = useRef(earnedAchievements);
  earnedAchievementsRef.current = earnedAchievements;

  useEffect(() => {
    const totalMinutes = studyHistory.reduce((s, h) => s + h.duration, 0) / 60;
    const ctx: AchievementCtx = { totalMinutes, pomodoroCount, streak, sessions: studyHistory, sessionCount: studyHistory.length };
    const earned = checkAchievements(ctx).map(a => a.id);
    const newAchievements = earned.filter(id => !earnedAchievementsRef.current.includes(id));
    if (newAchievements.length > 0) setEarnedAchievements(prev => [...prev, ...newAchievements]);
  }, [studyHistory, pomodoroCount, streak]);

  useEffect(() => {
    const data: PersistedState = { swm_scene: selectedSceneId, swm_music: selectedMusicId, swm_musicVol: musicVolume, swm_bgVol: bgVolume, swm_duration: timerDuration, swm_tasks: tasks, swm_pomodoros: pomodoroCount, swm_dailyGoal: dailyGoal, swm_history: studyHistory, swm_notes: notes, swm_streak: streak, swm_presets: scenePresets, swm_achievements: earnedAchievements };
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  }, [selectedSceneId, selectedMusicId, musicVolume, bgVolume, timerDuration, tasks, pomodoroCount, dailyGoal, studyHistory, notes, streak, scenePresets, earnedAchievements]);

  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(e => console.error('SW registration failed:', e)); }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySessions = studyHistory.filter(s => s.date.slice(0, 10) === today);
    const totalMinutes = todaySessions.reduce((s, h) => s + h.duration, 0) / 60;

    // Only update streak when we just crossed today's goal threshold
    if (todaySessions.length > 0 && totalMinutes >= dailyGoal.targetMinutes) {
      const lastDur = (todaySessions[todaySessions.length - 1]?.duration || 0) / 60;
      const beforeLast = totalMinutes - lastDur;
      if (beforeLast >= dailyGoal.targetMinutes) return; // already counted today

      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const yMin = studyHistory.filter(s => s.date.slice(0, 10) === yesterday).reduce((s, h) => s + h.duration, 0) / 60;
      if (yMin >= dailyGoal.targetMinutes) {
        setStreak(prev => prev + 1);
      } else {
        setStreak(1);
      }
    }
  }, [studyHistory, dailyGoal]);

  const getMusicUrl = (mId: string) => mId === 'custom' && customMusicUrl ? customMusicUrl : (MUSIC_TRACKS.find(m => m.id === mId)?.audioUrl || '');
  const getSceneImageUrl = (sId: string) => sId === 'custom' && customBgUrl ? customBgUrl : (SCENES.find(s => s.id === sId)?.imageUrl || SCENES[0].imageUrl);
  const recordSession = useCallback((s: StudySession) => setStudyHistory(prev => [...prev, s]), []);
  const handleSceneChange = useCallback((sceneId: string) => { setSelectedSceneId(sceneId); }, []);
  const achievements: Achievement[] = ACHIEVEMENTS.map(a => ({ id: a.id, title: a.title, desc: a.desc, icon: a.icon, earned: earnedAchievements.includes(a.id) }));

  return (
    <LangProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-black text-white selection:bg-white/30">
          {appState === 'landing' && <LandingPage onStart={() => setAppState('setup')} onStats={() => setAppState('stats')} onHistory={() => setAppState('history')} streak={streak} pomodoroCount={pomodoroCount} holiday={holiday} achievements={achievements} onOpenGuide={() => setShowOnboarding(true)} />}
          <OnboardingGuide isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
          {appState === 'setup' && <SetupPage selectedSceneId={selectedSceneId} onSelectScene={setSelectedSceneId} selectedMusicId={selectedMusicId} onSelectMusic={setSelectedMusicId} musicVolume={musicVolume} onMusicVolumeChange={setMusicVolume} bgVolume={bgVolume} onBgVolumeChange={setBgVolume} timerDuration={timerDuration} onTimerDurationChange={setTimerDuration} customMusicUrl={customMusicUrl} onCustomMusicChange={setCustomMusicUrl} customBgUrl={customBgUrl} onCustomBgChange={(url) => { setCustomBgUrl(url); setSelectedSceneId('custom'); }} dailyGoal={dailyGoal} onDailyGoalChange={setDailyGoal} scenePresets={scenePresets} onSavePreset={(sId, mId, label) => setScenePresets(prev => [...prev, { id: Date.now().toString(), sceneId: sId, musicId: mId, label }])} onLoadPreset={(p) => { setSelectedSceneId(p.sceneId); setSelectedMusicId(p.musicId); }} onDeletePreset={(id) => setScenePresets(prev => prev.filter(p => p.id !== id))} recommendedScene={recommendScene()} onBack={() => setAppState('landing')} onStats={() => setAppState('stats')} onHistory={() => setAppState('history')} onEnter={() => { try { const s = new Audio(); s.play().then(() => s.pause()).catch(() => {}); } catch {} audioManager.init(); setLoadingSceneId(selectedSceneId); setLoadingMusicId(selectedMusicId); setLoadingMusicVolume(musicVolume); setLoadingBgVolume(bgVolume); setAppState('loading'); }} />}
          {appState === 'loading' && <LoadingScreen sceneId={loadingSceneId} musicId={loadingMusicId} musicUrl={getMusicUrl(loadingMusicId)} musicVolume={loadingMusicVolume} bgVolume={loadingBgVolume} onReady={() => setAppState('timer')} />}
          {appState === 'timer' && <TimerPage sceneId={selectedSceneId} musicId={selectedMusicId} onSelectMusic={setSelectedMusicId} musicUrl={getMusicUrl(selectedMusicId)} durationMinutes={timerDuration} musicVolume={musicVolume} onMusicVolumeChange={setMusicVolume} bgVolume={bgVolume} onBgVolumeChange={setBgVolume} onExit={() => { audioManager.stop(); setAppState('landing'); }} key={`${selectedSceneId}-${selectedMusicId}`} tasks={tasks} onTasksChange={setTasks} pomodoroCount={pomodoroCount} onPomodoroComplete={() => setPomodoroCount(prev => prev + 1)} customMusicUrl={customMusicUrl} onCustomMusicChange={setCustomMusicUrl} sceneImageUrl={getSceneImageUrl(selectedSceneId)} onRecordSession={recordSession} notes={notes} onNotesChange={setNotes} holiday={holiday} onSceneChange={handleSceneChange} />}
          {appState === 'stats' && <StatsPage studyHistory={studyHistory} dailyGoal={dailyGoal} streak={streak} pomodoroCount={pomodoroCount} achievements={achievements} onBack={() => setAppState('landing')} />}
          {appState === 'history' && <HistoryPage studyHistory={studyHistory} onBack={() => setAppState('landing')} onClearHistory={() => { setStudyHistory([]); setStreak(0); setPomodoroCount(0); }} />}
        </div>
      </ErrorBoundary>
    </LangProvider>
  );
}