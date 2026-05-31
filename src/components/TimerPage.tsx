import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Play, Pause, Maximize, Clock, Waves, ChevronDown, GripVertical, Filter, Wind } from 'lucide-react';
import { Task, StudySession, Note, TimerMode, PomodoroPhase, TaskCategory } from '../types';
import { SCENES, MUSIC_TRACKS, NOISE_PRESETS } from '../data';
import { audioManager, playClickSound, playSuccessSound } from '../audioManager';
import { CinematicBackground } from './CinematicBackground';
import { SceneClock } from './SceneClock';
import { AudioVisualizer } from './AudioVisualizer';
import { useT } from '../i18n';

interface TimerPageProps {
  sceneId: string; musicId: string; onSelectMusic: (id: string) => void;
  musicUrl: string; durationMinutes: number;
  musicVolume: number; onMusicVolumeChange: (v: number) => void;
  bgVolume: number; onBgVolumeChange: (v: number) => void;
  onExit: () => void;
  tasks: Task[]; onTasksChange: (v: Task[]) => void;
  pomodoroCount: number; onPomodoroComplete: () => void;
  customMusicUrl: string; onCustomMusicChange: (url: string) => void;
  sceneImageUrl: string; onRecordSession: (s: StudySession) => void;
  notes: Note[]; onNotesChange: (v: Note[]) => void;
  holiday: { id: string; label: string; emoji: string } | null;
}

const MEDITATION_SECONDS = 30;

export function TimerPage({
  sceneId, musicId, onSelectMusic, musicUrl, durationMinutes,
  musicVolume, onMusicVolumeChange, bgVolume, onBgVolumeChange, onExit,
  tasks, onTasksChange, pomodoroCount, onPomodoroComplete,
  customMusicUrl, onCustomMusicChange, sceneImageUrl, onRecordSession, notes, onNotesChange, holiday,
}: TimerPageProps) {
  const { t } = useT();
  const scene = SCENES.find(s => s.id === sceneId) || SCENES[0];

  // States
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('meditation');
  const isBreak = ['shortBreak', 'longBreak'].includes(pomodoroPhase);
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [meditationTime, setMeditationTime] = useState(MEDITATION_SECONDS);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [showImmersiveUI, setShowImmersiveUI] = useState(true);
  const [showMinimalClock, setShowMinimalClock] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('study');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const sessionStartRef = useRef(Date.now());
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breatheLabel, setBreatheLabel] = useState<'in' | 'hold' | 'out'>('in');
  const lastTickRef = useRef(Date.now());

  // Panels
  const [showNoiseMixer, setShowNoiseMixer] = useState(false);
  const [noiseVolumes, setNoiseVolumes] = useState<Record<string, number>>({});

  // Breathing animation for meditation
  useEffect(() => {
    if (pomodoroPhase !== 'meditation' || meditationTime <= 0) return;
    const total = MEDITATION_SECONDS;
    const cycle = 6; // 6s per cycle
    const iv = setInterval(() => {
      const elapsed = total - meditationTime + 1;
      const phaseTime = elapsed % cycle;
      if (phaseTime < 2) setBreatheLabel('in');
      else if (phaseTime < 3) setBreatheLabel('hold');
      else setBreatheLabel('out');
    }, 100);
    return () => clearInterval(iv);
  }, [meditationTime, pomodoroPhase]);

  // Breathing glow
  useEffect(() => {
    if (!isRunning || showCompletion) return;
    const t = setInterval(() => setBreathingPhase(prev => (prev + 1) % 100), 50);
    return () => clearInterval(t);
  }, [isRunning, showCompletion]);

  // Notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.svg' });
  }, []);

  useEffect(() => { audioManager.setMusicVolume(musicVolume / 100); }, [musicVolume]);
  useEffect(() => { audioManager.setBgVolume(bgVolume / 100); }, [bgVolume]);
  useEffect(() => { if (musicUrl) { audioManager.setMusic(musicUrl); if (isRunning) audioManager.play(); } }, [musicUrl]);
  useEffect(() => { if (scene.audioUrl) { audioManager.setBg(scene.audioUrl); if (isRunning) audioManager.play(); } }, [scene.audioUrl]);
  useEffect(() => { isRunning ? audioManager.play() : audioManager.pause(); }, [isRunning]);

  const getBreakDuration = () => pomodoroCount > 0 && (pomodoroCount + 1) % 4 === 0 ? 15 : 5;

  const playDing = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 2);
    } catch { }
  }, []);

  const recordAndFinish = () => {
    const dur = ((Date.now() - sessionStartRef.current) / 1000);
    const completed = tasks.filter(t => t.completed).length;
    onRecordSession({ id: Date.now().toString(), date: new Date().toISOString(), duration: dur, sceneId, tasksCompleted: completed, tasksTotal: tasks.length, timerMode });
    setShowCompletion(true); setIsRunning(false);
    onPomodoroComplete(); playSuccessSound();
    sendNotification('🍅 学习完成！', `完成 ${Math.round(dur / 60)} 分钟学习，${completed}/${tasks.length} 任务`);
  };

  const handleBreakFinish = useCallback(() => {
    setPomodoroPhase('study'); setTimerMode('countdown'); setTimeLeft(durationMinutes * 60); setIsRunning(true);
    sessionStartRef.current = Date.now();
    sendNotification('☕ 休息结束', '开始新的番茄钟吧');
  }, [durationMinutes, sendNotification]);

  // Timer with background correction
  useEffect(() => {
    if (!isRunning || showCompletion) return;
    if (pomodoroPhase === 'meditation') {
      const iv = setInterval(() => {
        setMeditationTime(prev => {
          if (prev <= 1) { clearInterval(iv); setPomodoroPhase('study'); setIsRunning(true); sessionStartRef.current = Date.now(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.max(1, Math.round((now - lastTickRef.current) / 1000));
      lastTickRef.current = now;
      if (timerMode === 'countdown') {
        setTimeLeft(prev => {
          const next = prev - delta;
          if (next <= 0) { clearInterval(interval); (isBreak ? handleBreakFinish() : recordAndFinish()); return 0; }
          return next;
        });
      } else { setTimeElapsed(prev => prev + delta); }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerMode, pomodoroPhase, handleBreakFinish, showCompletion, isBreak]);

  // Immersive
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
    } catch { }
  };

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); setIsRunning(prev => !prev); playClickSound(); }
      else if (e.code === 'Escape' && isImmersive) toggleImmersive(false);
      else if (e.code === 'KeyM') setShowMinimalClock(prev => !prev);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isImmersive]);

  // Tasks
  const addTask = () => { if (!newTaskText.trim()) return; onTasksChange([...tasks, { id: Date.now().toString(), text: newTaskText.trim(), completed: false, category: taskCategory }]); setNewTaskText(''); };
  const toggleTask = (id: string) => onTasksChange(tasks.map(tk => tk.id === id ? { ...tk, completed: !tk.completed } : tk));
  const removeTask = (id: string) => onTasksChange(tasks.filter(tk => tk.id !== id));

  // Drag and drop
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { const newTasks = [...tasks]; const [moved] = newTasks.splice(dragIdx, 1); newTasks.splice(idx, 0, moved); onTasksChange(newTasks); setDragIdx(idx); } };
  const handleDragEnd = () => setDragIdx(null);

  const currentTime = timeLeft;
  const totalTime = isBreak ? getBreakDuration() * 60 : durationMinutes * 60;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;
  const fmt = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`; };
  const timePercent = pomodoroPhase === 'meditation' ? (MEDITATION_SECONDS - meditationTime) / MEDITATION_SECONDS * 100 : Math.min(100, ((totalTime - timeLeft) / totalTime) * 100);

  const isEnding = pomodoroPhase === 'study' && timerMode === 'countdown' && timeLeft <= 10 && timeLeft > 0;
  const glowStyle = isRunning && !isBreak && !showCompletion
    ? { textShadow: `0 0 ${Math.sin(breathingPhase / 100 * Math.PI) * 15}px rgba(255,255,255,${0.1 + Math.sin(breathingPhase / 100 * Math.PI) * 0.15})` }
    : {};

  const catColors: Record<TaskCategory, string> = { study: 'text-blue-400', work: 'text-amber-400', exercise: 'text-green-400', other: 'text-purple-400' };
  const catLabels: Record<TaskCategory, string> = { study: t('study'), work: t('work'), exercise: t('exercise'), other: t('other') };

  // Minimal clock mode
  if (showMinimalClock) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer" onClick={() => setShowMinimalClock(false)}>
        <SceneClock />
        <span className="text-[10rem] font-thin text-white tabular-nums mt-8" style={glowStyle}>{fmt(currentTime)}</span>
        <span className="text-sm text-white/20 mt-4">{t('backToHome')}</span>
        {/* Countdown gradient overlay */}
        {isEnding && <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-transparent pointer-events-none" style={{ opacity: (10 - timeLeft) / 10 }} />}
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full flex flex-col text-white font-sans overflow-hidden ${isImmersive && !showImmersiveUI ? 'cursor-none' : ''}`}>
      <motion.div key={scene.id} className="absolute inset-0 z-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
        <CinematicBackground imageUrl={sceneImageUrl} sceneId={scene.id} />
        <SceneClock />
        <div className={`absolute inset-0 transition-all duration-[10s] z-10 ${isImmersive ? 'bg-black/0' : isBreak ? 'bg-emerald-900/30' : isEnding ? `bg-gradient-to-t from-white/[0.02] to-transparent` : 'bg-black/10'}`}
          style={isEnding ? { opacity: (10 - timeLeft) / 10 * 0.5 } : {}} />
        <AudioVisualizer />
      </motion.div>

      {/* Completion overlay */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center">
            <div className="text-center p-10 rounded-[3rem] bg-white/[0.03] border border-white/10">
              <span className="text-6xl mb-4 block">🍅</span>
              <h2 className="text-3xl font-medium mb-4">完成了！</h2>
              <p className="text-white/60 mb-6">{pomodoroCount + 1} 个番茄完成</p>
              <div className="flex space-x-4 justify-center">
                <button onClick={() => { const dur = getBreakDuration(); setPomodoroPhase('shortBreak'); setTimerMode('countdown'); setTimeLeft(dur * 60); setIsRunning(true); setShowCompletion(false); setMeditationTime(0); sessionStartRef.current = Date.now(); }} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20">☕ 短休息 5 分钟</button>
                <button onClick={() => { setPomodoroPhase('longBreak'); setTimerMode('countdown'); setTimeLeft(15 * 60); setIsRunning(true); setShowCompletion(false); setMeditationTime(0); sessionStartRef.current = Date.now(); }} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20">🛏️ 长休息 15 分钟</button>
              </div>
              <button onClick={() => { setShowCompletion(false); onExit(); }} className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors">{t('backToHome')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal clock button */}
      {!isImmersive && (
        <div className="absolute top-6 right-6 z-30">
          <button onClick={() => setShowMinimalClock(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/40 hover:text-white/60" title={t('miniClock')}>
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Meditation guide */}
      {pomodoroPhase === 'meditation' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60">
          <span className="text-[8rem] font-thin text-white/90 tabular-nums" style={{ textShadow: '0 0 60px rgba(255,255,255,0.2)' }}>{meditationTime}</span>
          <div className="mt-8 w-40 h-40 rounded-full border-2 border-white/25 flex items-center justify-center relative">
            <div className={`absolute inset-2 rounded-full transition-all duration-[600ms] ${breatheLabel === 'in' ? 'scale-125 border-white/40' : 'scale-100 border-white/10'}`} />
            <span className={`text-xl transition-all duration-[600ms] ${breatheLabel === 'in' ? 'scale-110' : 'scale-100'}`}
              style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
              {breatheLabel === 'in' ? t('breatheIn') : breatheLabel === 'hold' ? t('hold') : t('breatheOut')}
            </span>
          </div>
          <button onClick={() => { setPomodoroPhase('study'); setIsRunning(true); setMeditationTime(0); sessionStartRef.current = Date.now(); }} className="mt-10 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-sm">{t('startFocus')}</button>
        </div>
      )}

      {/* Top bar */}
      <AnimatePresence>
        {!isImmersive && (
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex items-center justify-between px-8 py-5">
            <div className="flex items-center space-x-4">
              <button onClick={onExit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20"><X className="w-4 h-4" /></button>
              <BookOpen className="w-5 h-5" /><span className="text-lg font-medium tracking-wide">{t('appName')}</span>
              <span className="text-sm text-white/40 hidden md:inline">{scene.title}</span>
            </div>
            <button onClick={() => toggleImmersive(true)} className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors text-sm">
              <Maximize className="w-4 h-4" /><span>{t('immersive')}</span>
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 w-full h-full px-8 pb-8 flex flex-col justify-end pointer-events-none">
        {/* Timer */}
        <motion.div className="pointer-events-auto absolute right-8 bottom-32 md:right-24 md:bottom-40 p-6 rounded-[2rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl w-72">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono tracking-widest text-white/60 uppercase">
              {isBreak ? 'RELAX' : t('pomodoro')} #{pomodoroCount + 1}
            </span>
            <div className="flex items-center space-x-2 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-green-400/50'}`} />
              <span className="text-[10px] text-green-400/80 uppercase">{timerMode === 'stopwatch' ? '⏱️' : '⏳'}</span>
            </div>
          </div>
          <div className="text-6xl font-light tracking-tight mb-4 tabular-nums" style={glowStyle}>{fmt(currentTime)}</div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full transition-all duration-1000 ${isBreak ? 'bg-emerald-500' : timeLeft <= 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${timePercent}%` }} /></div>
          <div className="flex justify-center space-x-4 mt-4">
            <button onClick={() => { setIsRunning(false); setTimeLeft(durationMinutes * 60); setTimerMode('countdown'); }} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Pause className="w-5 h-5" /></button>
            <button onClick={() => { setIsRunning(!isRunning); playClickSound(); }} className="p-3 rounded-full bg-white hover:bg-white/90 transition-colors">
              {isRunning ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-0.5" />}
            </button>
            {isBreak && <button onClick={handleBreakFinish} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Pause className="w-5 h-5" /></button>}
          </div>
        </motion.div>

        {/* Side: Tasks */}
        {!isImmersive && (
          <div className="pointer-events-auto absolute left-8 top-32 md:left-24 md:top-40 w-64 max-h-[50vh] overflow-y-auto p-4 rounded-2xl bg-white/[0.01] backdrop-blur-sm border border-white/10">
            <h3 className="text-xs font-medium text-white/50 mb-3">{t('tasks')} ({tasks.filter(t => t.completed).length}/{tasks.length})</h3>
            <div className="flex space-x-1 mb-3">
              {(['study', 'work', 'exercise', 'other'] as TaskCategory[]).map(c => (
                <button key={c} onClick={() => setTaskCategory(c)} className={`flex-1 py-1 rounded text-[10px] transition-colors ${taskCategory === c ? 'bg-white/15 text-white' : 'bg-white/[0.03] text-white/40 hover:text-white/60'}`}>{catLabels[c]}</button>
              ))}
            </div>
            <div className="flex space-x-2 mb-4">
              <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTask(); }} placeholder={t('addTask')}
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none placeholder:text-white/20" />
              <button onClick={addTask} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs">+</button>
            </div>
            <ul className="space-y-1.5">
              {tasks.map((tk, idx) => (
                <li key={tk.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                  className={`flex items-center space-x-2 p-1.5 rounded-lg transition-colors ${dragIdx === idx ? 'bg-white/10' : 'hover:bg-white/[0.02]'} cursor-grab active:cursor-grabbing`}>
                  <GripVertical className="w-3 h-3 text-white/15 flex-shrink-0" />
                  <span className={`text-[9px] w-8 ${catColors[tk.category]}`}>{catLabels[tk.category]}</span>
                  <button onClick={() => toggleTask(tk.id)} className={`w-4 h-4 rounded border flex-shrink-0 ${tk.completed ? 'bg-green-500 border-green-500 flex items-center justify-center' : 'border-white/20 hover:border-white/40'}`}>
                    {tk.completed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                  </button>
                  <span className={`text-xs flex-1 truncate ${tk.completed ? 'line-through text-white/25' : 'text-white/70'}`}>{tk.text}</span>
                  <button onClick={() => removeTask(tk.id)} className="text-white/15 hover:text-red-400 transition-colors flex-shrink-0"><X className="w-3 h-3" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Noise Mixer */}
        <AnimatePresence>
          {showNoiseMixer && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="pointer-events-auto absolute right-8 top-32 md:right-24 md:top-40 w-64 p-4 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10">
              <div className="flex items-center justify-between mb-3"><Waves className="w-4 h-4 text-white/60" /><span className="text-xs font-medium text-white/60">{t('bgAudio')}</span><button onClick={() => setShowNoiseMixer(false)} className="text-white/30 hover:text-white/60"><X className="w-3 h-3" /></button></div>
              {NOISE_PRESETS.map(n => (
                <div key={n.id} className="flex items-center space-x-2 py-1.5">
                  <span className="text-xs w-3">{n.icon}</span>
                  <span className="text-[11px] text-white/60 flex-1">{n.label}</span>
                  <button onClick={() => { const nv = noiseVolumes[n.id] ?? 0.3; if (nv > 0) { audioManager.stopNoise(n.id); setNoiseVolumes(prev => ({ ...prev, [n.id]: 0 })); } else { audioManager.startNoise(n.id); setNoiseVolumes(prev => ({ ...prev, [n.id]: 0.3 })); } }}
                    className={`w-8 h-5 rounded-full relative transition-colors ${(noiseVolumes[n.id] ?? 0) > 0 ? 'bg-white/30' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${(noiseVolumes[n.id] ?? 0) > 0 ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}