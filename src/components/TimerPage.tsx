import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, X, Play, Pause, Maximize, RotateCcw, SkipForward, Music,
} from 'lucide-react';
import type { Task, StudySession, TimerMode, PomodoroPhase, TaskCategory } from '../types';
import { SCENES } from '../data';
import { audioManager, playClickSound, playSuccessSound, playMeditationChime } from '../audioManager';
import { CinematicBackground } from './CinematicBackground';
import { SceneClock } from './SceneClock';
import { AudioVisualizer } from './AudioVisualizer';
import { TaskPanel } from './TaskPanel';
import { AudioPanel } from './AudioPanel';
import { MeditationGuide } from './MeditationGuide';
import { useT } from '../i18n';
import { useStudyStore } from '../store';

interface TimerPageProps {
  onExit: () => void;
  onPomodoroComplete: () => void;
  onRecordSession: (s: StudySession) => void;
  onSceneChange: (sceneId: string) => void;
}

const MEDITATION_SECONDS = 30;

const SCENE_EMOJI: Record<string, string> = {
  morning_window: '🌅', rainy_cafe: '🌧️', night_library: '📚',
  seaside_study: '🌊', deep_night_desk: '💻', forest_cabin: '🌲', city_skyline: '🌆',
};

export function TimerPage({
  onExit, onPomodoroComplete, onRecordSession, onSceneChange,
}: TimerPageProps) {
  const { t } = useT();
  const store = useStudyStore();
  const scene = SCENES.find((s) => s.id === store.selectedSceneId) || SCENES[0];

  // ---- Timer state ----
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('meditation');
  const isBreak = ['shortBreak', 'longBreak'].includes(pomodoroPhase);
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [meditationTime, setMeditationTime] = useState(MEDITATION_SECONDS);
  const [timeLeft, setTimeLeft] = useState(store.timerDuration * 60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const sessionStartRef = useRef(Date.now());

  // ---- UI state ----
  const [isImmersive, setIsImmersive] = useState(false);
  const [showImmersiveUI, setShowImmersiveUI] = useState(true);
  const [showMinimalClock, setShowMinimalClock] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);

  // ---- Task state ----
  const [newTaskText, setNewTaskText] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('study');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // ---- Breathing ----
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breatheLabel, setBreatheLabel] = useState<'in' | 'hold' | 'out'>('in');
  const lastTickRef = useRef(Date.now());

  // ---- Audio sync ----
  useEffect(() => { audioManager.setMusicVolume(store.musicVolume / 100); }, [store.musicVolume]);
  useEffect(() => { audioManager.setBgVolume(store.bgVolume / 100); }, [store.bgVolume]);
  useEffect(() => {
    const url = store.selectedMusicId === 'custom' && store.customMusicUrl
      ? store.customMusicUrl
      : store.selectedMusicId;
    if (url) audioManager.setMusic(url);
  }, [store.selectedMusicId, store.customMusicUrl]);
  useEffect(() => {
    if (scene.audioUrl) { audioManager.setBg(scene.audioUrl); if (isRunning) audioManager.playBg(); }
  }, [scene.audioUrl]);
  useEffect(() => { isRunning ? audioManager.play() : audioManager.pause(); }, [isRunning]);

  // ---- Meditation breathing animation ----
  useEffect(() => {
    if (pomodoroPhase !== 'meditation' || meditationTime <= 0) return;
    const iv = setInterval(() => {
      const elapsed = MEDITATION_SECONDS - meditationTime + 1;
      const phaseTime = elapsed % 6;
      if (phaseTime < 2) setBreatheLabel('in');
      else if (phaseTime < 3) setBreatheLabel('hold');
      else setBreatheLabel('out');
    }, 100);
    return () => clearInterval(iv);
  }, [meditationTime, pomodoroPhase]);

  // ---- Glow animation ----
  useEffect(() => {
    if (!isRunning || showCompletion) return;
    const t = setInterval(() => setBreathingPhase((p) => (p + 1) % 100), 50);
    return () => clearInterval(t);
  }, [isRunning, showCompletion]);

  // ---- Notification ----
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted')
      new Notification(title, { body, icon: '/favicon.svg' });
  }, []);

  // ---- Timer logic ----
  const getBreakDuration = () => store.pomodoroCount > 0 && store.pomodoroCount % 4 === 0 ? 15 : 5;

  const recordAndFinish = useCallback(() => {
    const dur = (Date.now() - sessionStartRef.current) / 1000;
    const completed = store.tasks.filter((t) => t.completed).length;
    onRecordSession({
      id: Date.now().toString(), date: new Date().toISOString(), duration: dur,
      sceneId: store.selectedSceneId, tasksCompleted: completed, tasksTotal: store.tasks.length, timerMode,
    });
    setShowCompletion(true); setIsRunning(false);
    onPomodoroComplete(); playSuccessSound();
    sendNotification(t('studyComplete'),
      `${t('studyCompleteDesc').replace('/', '')} ${Math.round(dur / 60)} ${t('minutes')}${completed}/${store.tasks.length}`);
  }, [store.tasks, store.selectedSceneId, timerMode, onRecordSession, onPomodoroComplete, sendNotification, t]);

  const handleBreakFinish = useCallback(() => {
    setPomodoroPhase('study'); setTimerMode('countdown'); setTimeLeft(store.timerDuration * 60); setIsRunning(true);
    sessionStartRef.current = Date.now();
    sendNotification(t('breakEnd'), t('breakEndDesc'));
  }, [store.timerDuration, sendNotification, t]);

  // ---- Meditation countdown ----
  useEffect(() => {
    if (pomodoroPhase !== 'meditation') return;
    const iv = setInterval(() => {
      setMeditationTime((prev) => {
        if (prev <= 1) { setIsRunning(true); setPomodoroPhase('study'); sessionStartRef.current = Date.now(); playMeditationChime(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [pomodoroPhase]);

  // ---- Main timer ----
  useEffect(() => {
    if (!isRunning || showCompletion || pomodoroPhase === 'meditation') return;
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.max(1, Math.round((now - lastTickRef.current) / 1000));
      lastTickRef.current = now;
      if (timerMode === 'countdown') {
        setTimeLeft((prev) => {
          const next = prev - delta;
          if (next <= 0) { clearInterval(interval); (isBreak ? handleBreakFinish() : recordAndFinish()); return 0; }
          return next;
        });
      } else { setTimeElapsed((prev) => prev + delta); }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerMode, pomodoroPhase, handleBreakFinish, recordAndFinish, showCompletion, isBreak]);

  // ---- Immersive ----
  useEffect(() => {
    if (!isImmersive) { setShowImmersiveUI(true); return; }
    let timeout: ReturnType<typeof setTimeout>;
    const handle = () => { setShowImmersiveUI(true); clearTimeout(timeout); timeout = setTimeout(() => setShowImmersiveUI(false), 2500); };
    window.addEventListener('mousemove', handle);
    timeout = setTimeout(() => setShowImmersiveUI(false), 2500);
    return () => { window.removeEventListener('mousemove', handle); clearTimeout(timeout); };
  }, [isImmersive]);

  const toggleImmersive = async (enter: boolean) => {
    setIsImmersive(enter);
    try {
      if (enter && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else if (!enter && document.fullscreenElement) await document.exitFullscreen();
    } catch (e) { console.error('Fullscreen API failed:', e); }
  };

  // ---- Keyboard ----
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); setIsRunning((p) => !p); playClickSound(); }
      else if (e.code === 'Escape' && isImmersive) toggleImmersive(false);
      else if (e.code === 'KeyM') setShowMinimalClock((p) => !p);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isImmersive]);

  // ---- Tasks ----
  const addTask = () => {
    if (!newTaskText.trim()) return;
    store.setTasks([...store.tasks, { id: Date.now().toString(), text: newTaskText.trim(), completed: false, category: taskCategory }]);
    setNewTaskText('');
  };
  const toggleTask = (id: string) => store.setTasks(store.tasks.map((tk) => tk.id === id ? { ...tk, completed: !tk.completed } : tk));
  const removeTask = (id: string) => store.setTasks(store.tasks.filter((tk) => tk.id !== id));
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      const newTasks = [...store.tasks];
      const [moved] = newTasks.splice(dragIdx, 1);
      newTasks.splice(idx, 0, moved);
      store.setTasks(newTasks);
      setDragIdx(idx);
    }
  };

  // ---- Helpers ----
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };
  const currentTotal = isBreak ? getBreakDuration() * 60 : store.timerDuration * 60;
  const timePercent = pomodoroPhase === 'meditation'
    ? ((MEDITATION_SECONDS - meditationTime) / MEDITATION_SECONDS) * 100
    : Math.min(100, ((currentTotal - timeLeft) / currentTotal) * 100);

  const isEnding = pomodoroPhase === 'study' && timerMode === 'countdown' && timeLeft <= 10 && timeLeft > 0;
  const glowStyle = isRunning && !isBreak && !showCompletion
    ? { textShadow: `0 0 ${Math.sin(breathingPhase / 100 * Math.PI) * 15}px rgba(255,255,255,${0.1 + Math.sin(breathingPhase / 100 * Math.PI) * 0.15})` }
    : {};

  // ---- Minimal clock mode ----
  if (showMinimalClock) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer" onClick={() => setShowMinimalClock(false)}>
        <SceneClock />
        <span className="text-[10rem] font-thin text-white tabular-nums mt-8" style={glowStyle}>{fmt(timeLeft)}</span>
        <span className="text-sm text-white/20 mt-4">{t('backToHome')}</span>
        {isEnding && <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-transparent pointer-events-none" style={{ opacity: (10 - timeLeft) / 10 }} />}
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className={`relative min-h-screen w-full flex flex-col text-white font-sans overflow-hidden ${isImmersive && !showImmersiveUI ? 'cursor-none' : ''}`}>
      {/* Background layer */}
      <motion.div key={scene.id} className="absolute inset-0 z-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
        <CinematicBackground imageUrl={store.customBgUrl && store.selectedSceneId === 'custom' ? store.customBgUrl : scene.imageUrl} sceneId={scene.id} />
        <SceneClock />
        <div
          className={`absolute inset-0 transition-all duration-[10s] z-10 ${isImmersive ? 'bg-black/0' : isBreak ? 'bg-emerald-900/30' : isEnding ? 'bg-gradient-to-t from-white/[0.02] to-transparent' : 'bg-black/10'}`}
          style={isEnding ? { opacity: (10 - timeLeft) / 10 * 0.5 } : {}}
        />
        <AudioVisualizer />
      </motion.div>

      {/* Completion overlay */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center">
            <div className="text-center p-10 rounded-[3rem] bg-white/[0.03] border border-white/10">
              <span className="text-6xl mb-4 block">🍅</span>
              <h2 className="text-3xl font-medium mb-4">{t('completed')}</h2>
              <p className="text-white/60 mb-6">{store.pomodoroCount + 1} {t('pomodoroDone')}</p>
              <div className="flex space-x-4 justify-center">
                <button onClick={() => { const dur = getBreakDuration(); setPomodoroPhase('shortBreak'); setTimerMode('countdown'); setTimeLeft(dur * 60); setIsRunning(true); setShowCompletion(false); setMeditationTime(0); sessionStartRef.current = Date.now(); }} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20">{t('shortBreak')}</button>
                <button onClick={() => { setPomodoroPhase('longBreak'); setTimerMode('countdown'); setTimeLeft(15 * 60); setIsRunning(true); setShowCompletion(false); setMeditationTime(0); sessionStartRef.current = Date.now(); }} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20">{t('longBreak')}</button>
              </div>
              <button onClick={() => { setShowCompletion(false); onExit(); }} className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors">{t('backToHome')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meditation guide */}
      {pomodoroPhase === 'meditation' && (
        <MeditationGuide
          meditationTime={meditationTime}
          breatheLabel={breatheLabel}
          onSkip={() => { setPomodoroPhase('study'); setIsRunning(true); setMeditationTime(0); sessionStartRef.current = Date.now(); }}
        />
      )}

      {/* Header */}
      <AnimatePresence>
        {!isImmersive && (
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex items-center justify-between px-8 py-5">
            <div className="flex items-center space-x-4">
              <button onClick={onExit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20"><X className="w-4 h-4" /></button>
              <BookOpen className="w-5 h-5" /><span className="text-lg font-medium tracking-wide">{t('appName')}</span>
              <span className="text-sm text-white/40 hidden md:inline">{scene.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowAudioPanel((p) => !p)}
                className={`p-2 rounded-full border transition-colors text-sm ${showAudioPanel ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}
                title={t('bgAudio')}>
                <Music className="w-4 h-4" />
              </button>
              <button onClick={() => toggleImmersive(true)} className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors text-sm">
                <Maximize className="w-4 h-4" /><span>{t('immersive')}</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 w-full h-full px-8 pb-8 flex flex-col justify-end pointer-events-none">
        {/* Timer display */}
        <motion.div className="pointer-events-auto absolute right-8 bottom-32 md:right-24 md:bottom-40 p-6 rounded-[2rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl w-72">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono tracking-widest text-white/60 uppercase">
              {isBreak ? 'RELAX' : t('pomodoro')} #{store.pomodoroCount + 1}
            </span>
            <div className="flex items-center space-x-2 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-green-400/50'}`} />
              <span className="text-[10px] text-green-400/80 uppercase">{timerMode === 'stopwatch' ? '⏱️' : '⏳'}</span>
            </div>
          </div>
          <div className="text-6xl font-light tracking-tight mb-4 tabular-nums" style={glowStyle}>
            {timerMode === 'stopwatch' ? fmt(timeElapsed) : fmt(timeLeft)}
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className={`h-full rounded-full transition-all duration-1000 ${isBreak ? 'bg-emerald-500' : timeLeft <= 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${timePercent}%` }} />
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <button onClick={() => { setIsRunning(false); setTimeLeft(store.timerDuration * 60); }} className="p-2 rounded-full hover:bg-white/10 transition-colors" title={t('reset')} aria-label={t('reset')}>
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={() => { setIsRunning(!isRunning); playClickSound(); }} className="p-3 rounded-full bg-white hover:bg-white/90 transition-colors">
              {isRunning ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-0.5" />}
            </button>
            {isBreak && (
              <button onClick={handleBreakFinish} className="p-2 rounded-full hover:bg-white/10 transition-colors" title={t('skipBreak')} aria-label={t('skipBreak')}>
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Non-immersive overlays */}
        {!isImmersive && (
          <>
            <TaskPanel
              tasks={store.tasks}
              newTaskText={newTaskText}
              setNewTaskText={setNewTaskText}
              taskCategory={taskCategory}
              setTaskCategory={setTaskCategory}
              addTask={addTask}
              toggleTask={toggleTask}
              removeTask={removeTask}
              dragIdx={dragIdx}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={() => setDragIdx(null)}
            />

            {/* Scene switcher */}
            <div className="pointer-events-auto absolute left-8 bottom-6 md:left-24 md:bottom-10 p-2.5 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-1.5">
                {SCENES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { onSceneChange(s.id); playClickSound(); }}
                    className={`flex flex-col items-center p-1.5 rounded-xl transition-all min-w-[48px] ${store.selectedSceneId === s.id ? 'bg-white/15 border border-white/30' : 'bg-white/[0.02] border border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                    title={s.title}
                  >
                    <span className="text-base leading-none">{SCENE_EMOJI[s.id] || '🎬'}</span>
                    <span className={`text-[8px] mt-0.5 leading-tight ${store.selectedSceneId === s.id ? 'text-white/70' : 'text-white/25'}`}>{s.title.slice(0, 4)}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Audio panel */}
        <AnimatePresence>
          {showAudioPanel && (
            <AudioPanel
              musicId={store.selectedMusicId}
              onSelectMusic={(id) => store.setMusic(id)}
              musicVolume={store.musicVolume}
              onMusicVolumeChange={(v) => store.setMusicVolume(v)}
              bgVolume={store.bgVolume}
              onBgVolumeChange={(v) => store.setBgVolume(v)}
              onClose={() => setShowAudioPanel(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
