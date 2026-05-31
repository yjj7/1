import { useState, useEffect, useCallback } from 'react';
import { AppState, Task, StudySession, DailyGoal, Note } from './types';
import { LandingPage } from './components/LandingPage';
import { SetupPage } from './components/SetupPage';
import { TimerPage } from './components/TimerPage';
import { LoadingScreen } from './components/LoadingScreen';
import { StatsPage } from './components/StatsPage';
import { HistoryPage } from './components/HistoryPage';
import { SCENES, DURATIONS, MUSIC_TRACKS } from './data';
import { audioManager } from './audioManager';

function loadState<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; } catch { return fallback; }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [loadingSceneId, setLoadingSceneId] = useState('');
  const [loadingMusicId, setLoadingMusicId] = useState('');
  const [loadingMusicVolume, setLoadingMusicVolume] = useState(50);
  const [loadingBgVolume, setLoadingBgVolume] = useState(30);

  // Persisted preferences
  const [selectedSceneId, setSelectedSceneId] = useState(() => loadState('swm_scene', SCENES[0].id));
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

  // Persist on change
  useEffect(() => {
    const data = {
      swm_scene: selectedSceneId, swm_music: selectedMusicId,
      swm_musicVol: musicVolume, swm_bgVol: bgVolume,
      swm_duration: timerDuration, swm_tasks: tasks, swm_pomodoros: pomodoroCount,
      swm_dailyGoal: dailyGoal, swm_history: studyHistory, swm_notes: notes, swm_streak: streak,
    };
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  }, [selectedSceneId, selectedMusicId, musicVolume, bgVolume, timerDuration, tasks, pomodoroCount, dailyGoal, studyHistory, notes, streak]);

  // Update streak
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySessions = studyHistory.filter(s => s.date.slice(0, 10) === today);
    const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    if (totalMinutes >= dailyGoal.targetMinutes) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const yesterdaySessions = studyHistory.filter(s => s.date.slice(0, 10) === yesterday);
      const yesterdayMinutes = yesterdaySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
      if (yesterdayMinutes >= dailyGoal.targetMinutes || streak === 0) {
        setStreak(prev => Math.max(prev, 1));
      }
    }
  }, [studyHistory, dailyGoal, streak]);

  const getMusicUrl = (musicId: string) => {
    if (musicId === 'custom' && customMusicUrl) return customMusicUrl;
    return MUSIC_TRACKS.find(m => m.id === musicId)?.audioUrl || '';
  };

  const getSceneImageUrl = (sceneId: string) => {
    if (sceneId === 'custom' && customBgUrl) return customBgUrl;
    return SCENES.find(s => s.id === sceneId)?.imageUrl || SCENES[0].imageUrl;
  };

  const recordSession = useCallback((session: StudySession) => {
    setStudyHistory(prev => [...prev, session]);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30">
      {appState === 'landing' && (
        <LandingPage
          onStart={() => setAppState('setup')}
          onStats={() => setAppState('stats')}
          onHistory={() => setAppState('history')}
          streak={streak}
          pomodoroCount={pomodoroCount}
        />
      )}
      {appState === 'setup' && (
        <SetupPage
          selectedSceneId={selectedSceneId}
          onSelectScene={setSelectedSceneId}
          selectedMusicId={selectedMusicId}
          onSelectMusic={setSelectedMusicId}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          bgVolume={bgVolume}
          onBgVolumeChange={setBgVolume}
          timerDuration={timerDuration}
          onTimerDurationChange={setTimerDuration}
          customMusicUrl={customMusicUrl}
          onCustomMusicChange={setCustomMusicUrl}
          customBgUrl={customBgUrl}
          onCustomBgChange={(url) => { setCustomBgUrl(url); setSelectedSceneId('custom'); }}
          dailyGoal={dailyGoal}
          onDailyGoalChange={setDailyGoal}
          onBack={() => setAppState('landing')}
          onStats={() => setAppState('stats')}
          onHistory={() => setAppState('history')}
          onEnter={() => {
            try { const s = new Audio(); s.play().then(() => s.pause()).catch(() => {}); } catch {}
            audioManager.init();
            setLoadingSceneId(selectedSceneId);
            setLoadingMusicId(selectedMusicId);
            setLoadingMusicVolume(musicVolume);
            setLoadingBgVolume(bgVolume);
            setAppState('loading');
          }}
        />
      )}
      {appState === 'loading' && (
        <LoadingScreen
          sceneId={loadingSceneId}
          musicId={loadingMusicId}
          musicUrl={getMusicUrl(loadingMusicId)}
          musicVolume={loadingMusicVolume}
          bgVolume={loadingBgVolume}
          onReady={() => setAppState('timer')}
        />
      )}
      {appState === 'timer' && (
        <TimerPage
          sceneId={selectedSceneId}
          musicId={selectedMusicId}
          onSelectMusic={setSelectedMusicId}
          musicUrl={getMusicUrl(selectedMusicId)}
          durationMinutes={timerDuration}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          bgVolume={bgVolume}
          onBgVolumeChange={setBgVolume}
          onExit={() => { audioManager.stop(); setAppState('landing'); }}
          key={`${selectedSceneId}-${selectedMusicId}`}
          tasks={tasks}
          onTasksChange={setTasks}
          pomodoroCount={pomodoroCount}
          onPomodoroComplete={() => setPomodoroCount(prev => prev + 1)}
          customMusicUrl={customMusicUrl}
          onCustomMusicChange={setCustomMusicUrl}
          sceneImageUrl={getSceneImageUrl(selectedSceneId)}
          onRecordSession={recordSession}
          notes={notes}
          onNotesChange={setNotes}
        />
      )}
      {appState === 'stats' && (
        <StatsPage
          studyHistory={studyHistory}
          dailyGoal={dailyGoal}
          streak={streak}
          pomodoroCount={pomodoroCount}
          onBack={() => setAppState('landing')}
        />
      )}
      {appState === 'history' && (
        <HistoryPage
          studyHistory={studyHistory}
          onBack={() => setAppState('landing')}
          onClearHistory={() => { setStudyHistory([]); setStreak(0); setPomodoroCount(0); }}
        />
      )}
    </div>
  );
}
