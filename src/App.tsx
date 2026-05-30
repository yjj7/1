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
  const [customMusicUrl, setCustomMusicUrl] = useState<string>('');

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

  // 获取实际音乐 URL（自定义上传的用 blob URL，否则用 data.ts 里的）
  const getMusicUrl = (musicId: string) => {
    if (musicId === 'custom' && customMusicUrl) return customMusicUrl;
    const track = MUSIC_TRACKS.find(m => m.id === musicId);
    return track?.audioUrl || '';
  };

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
          customMusicUrl={customMusicUrl}
          onCustomMusicChange={setCustomMusicUrl}
          onBack={() => setAppState('landing')}
          onEnter={() => {
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
          musicUrl={getMusicUrl(loadingMusicId)}
          musicVolume={loadingMusicVolume}
          bgVolume={loadingBgVolume}
          onReady={() => {
            setAppState('timer');
          }}
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
          onExit={() => {
            audioManager.stop();
            setAppState('landing');
          }}
          key={`${selectedSceneId}-${selectedMusicId}`}
          tasks={tasks}
          onTasksChange={setTasks}
          pomodoroCount={pomodoroCount}
          onPomodoroComplete={() => setPomodoroCount(prev => prev + 1)}
          customMusicUrl={customMusicUrl}
          onCustomMusicChange={setCustomMusicUrl}
        />
      )}
    </div>
  );
}
