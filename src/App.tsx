import React, { useState, useEffect } from 'react';
import { AppState, Task } from './types';
import { LandingPage } from './components/LandingPage';
import { SetupPage } from './components/SetupPage';
import { TimerPage } from './components/TimerPage';
import { LoadingScreen } from './components/LoadingScreen';
import { SCENES, DURATIONS, MUSIC_TRACKS } from './data';
import { audioManager } from './audioManager';


export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [loadingSceneId, setLoadingSceneId] = useState<string>('');
  const [loadingMusicId, setLoadingMusicId] = useState<string>('');
  const [loadingMusicVolume, setLoadingMusicVolume] = useState<number>(50);
  const [loadingBgVolume, setLoadingBgVolume] = useState<number>(30);
  
  const savedState = (() => {
    try {
      return JSON.parse(localStorage.getItem('studyWithMeState') || '{}');
    } catch { return {}; }
  })();

  const [selectedSceneId, setSelectedSceneId] = useState<string>(savedState.selectedSceneId || SCENES[0].id);
  const [selectedMusicId, setSelectedMusicId] = useState<string>(savedState.selectedMusicId || MUSIC_TRACKS[0].id);
  const [musicVolume, setMusicVolume] = useState<number>(savedState.musicVolume ?? 50);
  const [bgVolume, setBgVolume] = useState<number>(savedState.bgVolume ?? 30);
  const [timerDuration, setTimerDuration] = useState<number>(savedState.timerDuration ?? DURATIONS[1]);
  const [tasks, setTasks] = useState<Task[]>(savedState.tasks ?? []);
  const [pomodoroCount, setPomodoroCount] = useState<number>(savedState.pomodoroCount ?? 0);

  useEffect(() => {
    localStorage.setItem('studyWithMeState', JSON.stringify({
      selectedSceneId,
      selectedMusicId,
      musicVolume,
      bgVolume,
      timerDuration,
      tasks,
      pomodoroCount
    }));
  }, [selectedSceneId, selectedMusicId, musicVolume, bgVolume, timerDuration, tasks, pomodoroCount]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30">
      {appState === 'landing' && (
        <LandingPage 
          onStart={() => {
            setAppState('setup');
          }} 
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
          onBack={() => setAppState('landing')}
          onEnter={() => {
            // 关键：在用户点击时机解锁浏览器音频（必须用户手势）
            try {
              const silent = new Audio();
              silent.play().then(() => silent.pause()).catch(() => {});
            } catch {}
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
          musicVolume={loadingMusicVolume}
          bgVolume={loadingBgVolume}
          onReady={() => {
            // Audio is already init-ed inside LoadingScreen
            setAppState('timer');
          }}
        />
      )}

      {appState === 'timer' && (
        <TimerPage
          sceneId={selectedSceneId}
          musicId={selectedMusicId}
          onSelectMusic={setSelectedMusicId}
          durationMinutes={timerDuration}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          bgVolume={bgVolume}
          onBgVolumeChange={setBgVolume}
          onExit={() => {
            audioManager.stop();
            setAppState('landing');
          }}
          key={`${selectedSceneId}-${selectedMusicId}`}
          tasks={tasks}
          onTasksChange={setTasks}
          pomodoroCount={pomodoroCount}
          onPomodoroComplete={() => setPomodoroCount(prev => prev + 1)}
        />
      )}
    </div>
  );
}
