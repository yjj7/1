import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, X, Play, Pause, SkipForward, RotateCcw, Target, Volume2, MoveDiagonal, Maximize, Minimize, Bell, Keyboard, StickyNote, Share2, Clock, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, StudySession, Note, TimerMode, PomodoroPhase } from '../types';
import { SCENES, MUSIC_TRACKS, NOISE_PRESETS } from '../data';
import { audioManager } from '../audioManager';
import { CinematicBackground } from './CinematicBackground';
import { SceneClock } from './SceneClock';

interface TimerPageProps {
  sceneId: string;
  musicId: string;
  onSelectMusic: (id: string) => void;
  musicUrl: string;
  durationMinutes: number;
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  bgVolume: number;
  onBgVolumeChange: (v: number) => void;
  onExit: () => void;
  tasks: Task[];
  onTasksChange: (v: Task[]) => void;
  pomodoroCount: number;
  onPomodoroComplete: () => void;
  customMusicUrl: string;
  onCustomMusicChange: (url: string) => void;
  sceneImageUrl: string;
  onRecordSession: (s: StudySession) => void;
  notes: Note[];
  onNotesChange: (v: Note[]) => void;
}

export function TimerPage({
  sceneId, musicId, onSelectMusic, musicUrl, durationMinutes,
  musicVolume, onMusicVolumeChange, bgVolume, onBgVolumeChange, onExit,
  tasks, onTasksChange, pomodoroCount, onPomodoroComplete,
  customMusicUrl, onCustomMusicChange, sceneImageUrl, onRecordSession, notes, onNotesChange,
}: TimerPageProps) {
  const scene = SCENES.find(s => s.id === sceneId) || SCENES[0];

  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('study');
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [showImmersiveUI, setShowImmersiveUI] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const sessionStartRef = useRef(Date.now());

  // Side panels
  const [showNoiseMixer, setShowNoiseMixer] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [noiseVolumes, setNoiseVolumes] = useState<Record<string, number>>({});

  // Note text
  const [noteText, setNoteText] = useState('');

  // Notification setup
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  }, []);

  // Audio volume
  useEffect(() => { audioManager.setMusicVolume(musicVolume / 100); }, [musicVolume]);
  useEffect(() => { audioManager.setBgVolume(bgVolume / 100); }, [bgVolume]);
  useEffect(() => {
    if (musicUrl) { audioManager.setMusic(musicUrl); if (isRunning) audioManager.play(); }
  }, [musicUrl]);
  useEffect(() => {
    if (scene.audioUrl) { audioManager.setBg(scene.audioUrl); if (isRunning) audioManager.play(); }
  }, [scene.audioUrl]);
  useEffect(() => { isRunning ? audioManager.play() : audioManager.pause(); }, [isRunning]);

  // Break durations
  const getBreakDuration = () => pomodoroCount > 0 && (pomodoroCount + 1) % 4 === 0 ? 15 : 5;

  const playDing = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 2);
    } catch {}
  }, []);

  const recordAndFinish = useCallback((completed: boolean) => {
    const elapsed = timerMode === 'countdown' ? durationMinutes * 60 - timeLeft : timeElapsed;
    if (elapsed < 10) return; // Don't record < 10 seconds
    const completedTasks = tasks.filter(t => t.completed).length;
    onRecordSession({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: elapsed,
      sceneId,
      tasksCompleted: completedTasks,
      tasksTotal: tasks.length,
      timerMode,
    });
    if (completed) {
      onPomodoroComplete();
      setShowCompletion(true);
      playDing();
      sendNotification('🍅 番茄钟完成！', `学习了 ${Math.round(elapsed / 60)} 分钟，完成了 ${completedTasks} 个任务`);
    }
  }, [timerMode, timeLeft, timeElapsed, durationMinutes, tasks, sceneId, onPomodoroComplete, onRecordSession, playDing, sendNotification]);

  // Handle completion
  const handleFinish = useCallback(() => {
    setTimeLeft(0);
    setTimeElapsed(0);
    setIsRunning(false);
    recordAndFinish(true);
  }, [recordAndFinish]);

  // Handle break completion
  const handleBreakFinish = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    setPomodoroPhase('study');
    playDing();
    sendNotification('🔔 休息时间结束！', '准备开始下一个番茄钟');
  }, [durationMinutes, playDing, sendNotification]);

  // Document title
  useEffect(() => {
    const prefix = pomodoroPhase === 'study' ? '📖' : pomodoroPhase === 'shortBreak' ? '☕' : '🛏️';
    const mainTask = tasks.find(t => !t.completed)?.text || '专注中';
    const time = timerMode === 'countdown' ? formatTime(timeLeft) : formatTime(timeElapsed);
    document.title = `${prefix} ${time} - ${mainTask} | StudyWithMe AI`;
    return () => { document.title = 'StudyWithMe AI'; };
  }, [timeLeft, timeElapsed, tasks, timerMode, pomodoroPhase]);

  // Immersive mode
  useEffect(() => {
    if (!isImmersive) { setShowImmersiveUI(true); return; }
    let timeout: ReturnType<typeof setTimeout>;
    const handler = () => { setShowImmersiveUI(true); clearTimeout(timeout); timeout = setTimeout(() => setShowImmersiveUI(false), 2500); };
    window.addEventListener('mousemove', handler);
    timeout = setTimeout(() => setShowImmersiveUI(false), 2500);
    return () => { window.removeEventListener('mousemove', handler); clearTimeout(timeout); };
  }, [isImmersive]);

  const toggleImmersive = async (enter: boolean) => {
    setIsImmersive(enter);
    try {
      if (enter && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else if (!enter && document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (showShare) return;
      if (e.code === 'Space') { e.preventDefault(); if (showCompletion) return; setIsRunning(prev => !prev); }
      else if (e.code === 'Escape' && isImmersive) toggleImmersive(false);
      else if (e.key === '?' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowShortcuts(prev => !prev); }
      else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowNotes(prev => !prev); }
      else if (e.key === 'm' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowNoiseMixer(prev => !prev); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isImmersive, showCompletion, showShare]);

  // Timer
  useEffect(() => {
    if (!isRunning || showCompletion) return;
    const interval = setInterval(() => {
      if (timerMode === 'countdown') {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (pomodoroPhase === 'study') {
              handleFinish();
            } else {
              handleBreakFinish();
            }
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerMode, pomodoroPhase, handleFinish, handleBreakFinish, showCompletion]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleReset = () => {
    setTimeLeft(durationMinutes * 60);
    setTimeElapsed(0);
    setIsRunning(true);
    sessionStartRef.current = Date.now();
  };

  const startBreak = (phase: 'shortBreak' | 'longBreak') => {
    recordAndFinish(false);
    setPomodoroPhase(phase);
    setTimerMode('countdown');
    setTimeLeft(getBreakDuration() * 60);
    setIsRunning(true);
    sessionStartRef.current = Date.now();
    audioManager.stop();
    if (phase === 'longBreak') sendNotification('🍅 4个番茄完成！', '休息 15 分钟吧，你太棒了');
  };

  const currentTime = timerMode === 'countdown' ? timeLeft : timeElapsed;
  const totalTime = timerMode === 'countdown' ? (pomodoroPhase === 'study' ? durationMinutes * 60 : getBreakDuration() * 60) : 99999;
  const progressPercent = timerMode === 'countdown' ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // Break screen
  const isBreak = pomodoroPhase !== 'study';
  const breakLabel = pomodoroPhase === 'shortBreak' ? '☕ 短休息' : '🛏️ 长休息';
  const breakTip = pomodoroPhase === 'shortBreak'
    ? '起来走动一下，看看远处，喝口水'
    : '闭眼休息一下，让大脑放松';

  return (
    <div className={`relative min-h-screen w-full flex flex-col text-white font-sans overflow-hidden ${isImmersive && !showImmersiveUI ? 'cursor-none' : ''}`}>
      {/* Background */}
      <motion.div key={sceneId} className="absolute inset-0 z-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
        <CinematicBackground imageUrl={sceneImageUrl} sceneId={sceneId} />
        <SceneClock />
        <div className={`absolute inset-0 transition-opacity duration-1000 z-10 ${isImmersive ? 'bg-black/0' : isBreak ? 'bg-emerald-900/30' : 'bg-black/10'}`} />
      </motion.div>

      {/* Header */}
      <AnimatePresence>
        {!isImmersive && (
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex items-center justify-between px-8 py-6">
            <div className="flex items-center space-x-4">
              <button onClick={onExit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20"><X className="w-5 h-5" /></button>
              <BookOpen className="w-5 h-5" />
              <span className="text-xl font-medium tracking-wide">StudyWithMe AI</span>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowNotes(prev => !prev)}
                className={`p-2 rounded-full transition-colors border ${showNotes ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                <StickyNote className="w-4 h-4" />
              </button>
              <button onClick={() => setShowNoiseMixer(prev => !prev)}
                className={`p-2 rounded-full transition-colors border ${showNoiseMixer ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                <Waves className="w-4 h-4" />
              </button>
              <button onClick={() => setShowShortcuts(prev => !prev)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
                <Keyboard className="w-4 h-4" />
              </button>
              <button onClick={() => toggleImmersive(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm hover:bg-white/20 transition-colors">
                <MoveDiagonal className="w-4 h-4" /><span>沉浸</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="relative z-10 flex-1 w-full h-full p-8 flex flex-col justify-end pointer-events-none">
        {/* Timer Widget */}
        <motion.div className="pointer-events-auto absolute left-8 bottom-32 md:left-24 md:bottom-40 p-6 rounded-[2rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl w-72">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {isBreak && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">{breakLabel}</span>}
              <span className="text-[10px] font-mono tracking-widest text-white/60 uppercase">
                {isBreak ? 'BREAK' : timerMode === 'stopwatch' ? 'FREEFLOW' : `POMODORO #${pomodoroCount + 1}`}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-green-400/50'}`} />
              <span className="text-xs text-green-300 font-medium tracking-wide">{currentTime === 0 && timerMode === 'countdown' ? '已完成' : isRunning ? (isBreak ? '休息中' : '学习中') : '已暂停'}</span>
            </div>
          </div>

          <div className="text-6xl font-light tracking-tight mb-4 tabular-nums">{formatTime(currentTime)}</div>

          {/* Timer mode toggle */}
          {!isBreak && (
            <div className="flex items-center space-x-2 mb-4">
              <button onClick={() => { setTimerMode('countdown'); setTimeLeft(durationMinutes * 60); setIsRunning(true); }}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${timerMode === 'countdown' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}>
                倒计时
              </button>
              <button onClick={() => { setTimerMode('stopwatch'); setTimeElapsed(0); setIsRunning(true); }}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${timerMode === 'stopwatch' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}>
                正计时
              </button>
            </div>
          )}

          {timerMode === 'countdown' && (
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between text-xs text-white/50"><span>进度</span><span>{Math.round(progressPercent)}%</span></div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ease-linear ${isBreak ? 'bg-emerald-400' : 'bg-white'}`}
                  style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Control Bar */}
        <AnimatePresence>
          {!isImmersive && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="pointer-events-auto w-full max-w-4xl mx-auto flex flex-col space-y-4 mb-4">
              {/* Tasks */}
              <div className="flex flex-col space-y-2 w-2/3 mx-auto max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.map(t => (
                  <div key={t.id} className={`flex items-center justify-between px-6 py-3 rounded-2xl bg-white/[0.01] backdrop-blur-[2px] border ${t.completed ? 'border-white/5 opacity-50' : 'border-white/10'} shadow-xl`}>
                    <div className="flex items-center space-x-3 w-full">
                      <button onClick={() => onTasksChange(tasks.map(ct => ct.id === t.id ? { ...ct, completed: !ct.completed } : ct))}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${t.completed ? 'bg-green-500 border-green-500 text-black' : 'border-white/30 hover:border-white/60'}`}>
                        {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                      <span className={`text-sm ${t.completed ? 'line-through text-white/50' : 'text-white/90'}`}>{t.text}</span>
                    </div>
                    <button onClick={() => onTasksChange(tasks.filter(ct => ct.id !== t.id))} className="text-white/20 hover:text-white/60"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="flex items-center space-x-3 px-6 py-3 rounded-2xl bg-white/[0.01] backdrop-blur-[2px] border border-white/5 shadow-xl">
                  <Target className="w-4 h-4 text-white/40" />
                  <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newTaskText.trim()) { onTasksChange([...tasks, { id: Date.now().toString(), text: newTaskText.trim(), completed: false }]); setNewTaskText(''); } }}
                    placeholder="添加任务 (Enter)" className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30" />
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between px-8 py-4 rounded-[3rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center space-x-3 w-40">
                    <select value={musicId} onChange={(e) => onSelectMusic(e.target.value)}
                      className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white/80 outline-none w-20 truncate">
                      {MUSIC_TRACKS.map(m => <option key={m.id} value={m.id} className="text-black">{m.title}</option>)}
                    </select>
                    {musicId === 'custom' && !customMusicUrl && (
                      <label className="cursor-pointer text-xs text-white/50 hover:text-white/80 transition-colors">
                        上传<input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (customMusicUrl?.startsWith('blob:')) URL.revokeObjectURL(customMusicUrl); onCustomMusicChange(URL.createObjectURL(f)); } }} />
                      </label>
                    )}
                    <div className="flex-1 h-2 flex items-center relative group">
                      <div className="w-full h-1 bg-white/20 rounded-full relative pointer-events-none">
                        <div className="h-full bg-white/80 transition-all" style={{ width: `${musicVolume}%` }} />
                        <div className="w-2.5 h-2.5 bg-white rounded-full absolute -top-[3px] -ml-1 transition-all" style={{ left: `${musicVolume}%` }} />
                      </div>
                      <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
                        className="w-full absolute opacity-0 cursor-pointer h-full z-10" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 w-32">
                    <span className="text-xs text-white/60 w-10">背景音</span>
                    <div className="flex-1 h-2 flex items-center relative group">
                      <div className="w-full h-1 bg-white/20 rounded-full relative pointer-events-none">
                        <div className="h-full bg-white/80 transition-all" style={{ width: `${bgVolume}%` }} />
                        <div className="w-2.5 h-2.5 bg-white rounded-full absolute -top-[3px] -ml-1 transition-all" style={{ left: `${bgVolume}%` }} />
                      </div>
                      <input type="range" min="0" max="100" value={bgVolume} onChange={(e) => onBgVolumeChange(Number(e.target.value))}
                        className="w-full absolute opacity-0 cursor-pointer h-full z-10" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button onClick={() => setIsRunning(!isRunning)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm">
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isRunning ? '暂停' : '继续'}</span>
                  </button>
                  {!isBreak && (
                    <button onClick={handleFinish}
                      className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm">
                      <SkipForward className="w-4 h-4" /><span>跳过</span>
                    </button>
                  )}
                  <button onClick={handleReset}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm">
                    <RotateCcw className="w-4 h-4" /><span>重置</span>
                  </button>
                  <button onClick={onExit}
                    className="flex items-center space-x-2 px-6 py-2 rounded-full border border-white/40 hover:bg-white/20 transition-colors text-sm">
                    <X className="w-4 h-4" /><span>结束</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Immersive exit button */}
      <AnimatePresence>
        {isImmersive && showImmersiveUI && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => toggleImmersive(false)}
            className="absolute top-8 right-8 z-50 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors text-white/50 hover:text-white">
            <Minimize className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Completion Overlay */}
      <AnimatePresence>
        {showCompletion && pomodoroPhase === 'study' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center p-10 rounded-[2rem] bg-white/[0.05] backdrop-blur-[4px] border border-white/10 shadow-2xl mx-4 max-w-md w-full">
              <h2 className="text-3xl font-medium mb-4 tracking-wide">专注完成!</h2>
              <p className="text-sm text-white/70 mb-2">完成了 {durationMinutes} 分钟的专注学习</p>
              <p className="text-xs text-white/50 mb-8">{tasks.filter(t => t.completed).length}/{tasks.length} 个任务已完成</p>
              <div className="flex flex-col space-y-3">
                <button onClick={() => { setShowCompletion(false); handleReset(); }}
                  className="w-full py-4 rounded-full bg-white text-black hover:bg-white/90 transition-colors font-medium text-sm">开始下一个</button>
                <button onClick={() => startBreak('shortBreak')}
                  className="w-full py-4 rounded-full border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors text-sm">☕ 休息 5 分钟</button>
                <button onClick={() => startBreak('longBreak')}
                  className="w-full py-4 rounded-full border border-blue-400/40 text-blue-300 hover:bg-blue-500/10 transition-colors text-sm">🛏️ 长休息 15 分钟</button>
                <button onClick={() => { setShowShare(true); setShowCompletion(false); }}
                  className="w-full py-3 rounded-full border border-white/10 text-white/60 hover:bg-white/10 transition-colors text-sm flex items-center justify-center space-x-2">
                  <Share2 className="w-4 h-4" /><span>分享学习卡片</span>
                </button>
                <button onClick={onExit}
                  className="w-full py-4 rounded-full border border-white/20 bg-transparent hover:bg-white/10 transition-colors text-sm">返回首页</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Break Overlay */}
      <AnimatePresence>
        {isBreak && currentTime === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center p-10 rounded-[2rem] bg-white/[0.05] backdrop-blur-[4px] border border-white/10 shadow-2xl mx-4 max-w-md w-full">
              <h2 className="text-2xl font-medium mb-4">休息时间结束！</h2>
              <p className="text-sm text-white/50 mb-8">准备好继续学习了吗？</p>
              <button onClick={() => { setPomodoroPhase('study'); setTimeLeft(durationMinutes * 60); setIsRunning(true); }}
                className="w-full py-4 rounded-full bg-white text-black hover:bg-white/90 transition-colors font-medium text-sm">
                开始学习
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Noise Mixer Panel */}
      <AnimatePresence>
        {showNoiseMixer && (
          <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 z-40 w-72 bg-black/80 backdrop-blur-md border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium flex items-center space-x-2"><Waves className="w-5 h-5" /><span>白噪音混合器</span></h3>
              <button onClick={() => setShowNoiseMixer(false)} className="p-1 rounded-full hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {NOISE_PRESETS.map(noise => {
                const vol = noiseVolumes[noise.id] ?? 0;
                return (
                  <div key={noise.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{noise.icon} {noise.label}</span>
                      <button onClick={() => {
                        if (vol > 0) { audioManager.stopNoise(noise.id); setNoiseVolumes(prev => ({ ...prev, [noise.id]: 0 })); }
                        else { audioManager.startNoise(noise.id, 30); setNoiseVolumes(prev => ({ ...prev, [noise.id]: 30 })); }
                      }}
                        className={`w-8 h-4 rounded-full transition-colors relative ${vol > 0 ? 'bg-white/40' : 'bg-white/10'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${vol > 0 ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {vol > 0 && (
                      <div className="relative h-4 flex items-center">
                        <div className="w-full h-1 bg-white/10 rounded-full relative">
                          <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${vol}%` }} />
                        </div>
                        <input type="range" min="0" max="100" value={vol}
                          onChange={(e) => { const v = Number(e.target.value); setNoiseVolumes(prev => ({ ...prev, [noise.id]: v })); audioManager.setNoiseVolume(noise.id, v); }}
                          className="w-full absolute opacity-0 cursor-pointer h-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Panel */}
      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 z-40 w-80 bg-black/80 backdrop-blur-md border-l border-white/10 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center space-x-2"><StickyNote className="w-5 h-5" /><span>速记</span></h3>
              <button onClick={() => setShowNotes(false)} className="p-1 rounded-full hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 flex flex-col">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder="记录想法、灵感..."
                className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white/80 outline-none resize-none placeholder:text-white/20 mb-3"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey && noteText.trim()) { onNotesChange([...notes, { id: Date.now().toString(), text: noteText.trim(), createdAt: new Date().toISOString() }]); setNoteText(''); } }} />
              <button onClick={() => { if (noteText.trim()) { onNotesChange([...notes, { id: Date.now().toString(), text: noteText.trim(), createdAt: new Date().toISOString() }]); setNoteText(''); } }}
                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm">保存笔记 (Ctrl+Enter)</button>
            </div>
            {notes.length > 0 && (
              <div className="mt-4 flex-1 overflow-y-auto space-y-2">
                {notes.slice(-10).reverse().map(n => (
                  <div key={n.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <p className="text-xs text-white/70">{n.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/30">{new Date(n.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                      <button onClick={() => onNotesChange(notes.filter(nn => nn.id !== n.id))} className="text-white/20 hover:text-red-400"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Panel */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setShowShortcuts(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div onClick={(e) => e.stopPropagation()}
              className="p-8 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-2xl max-w-sm w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium flex items-center space-x-2"><Keyboard className="w-5 h-5" /><span>快捷键</span></h3>
                <button onClick={() => setShowShortcuts(false)} className="p-1 rounded-full hover:bg-white/10"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {[
                  ['空格 Space', '暂停 / 继续'],
                  ['Esc', '退出沉浸模式'],
                  ['?', '显示此面板'],
                  ['N', '打开速记面板'],
                  ['M', '打开白噪音混合器'],
                  ['Ctrl + Enter', '保存笔记（速记面板中）'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex justify-between items-center">
                    <kbd className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-mono">{key}</kbd>
                    <span className="text-sm text-white/60">{desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Card */}
      <AnimatePresence>
        {showShare && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="p-8 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-2xl max-w-xs w-full mx-4 text-center">
              <h3 className="text-xl font-medium mb-6">分享学习成果</h3>
              <div id="share-card" className="p-6 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 mb-6">
                <div className="text-6xl mb-3">🍅</div>
                <div className="text-2xl font-bold mb-2">{pomodoroCount + 1} 个番茄</div>
                <div className="text-sm text-white/60 mb-1">{durationMinutes} 分钟专注</div>
                <div className="text-sm text-white/60">{tasks.filter(t => t.completed).length} 个任务完成</div>
                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
                  StudyWithMe AI · nuomiyu.qzz.io
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => { setShowShare(false); handleReset(); }}
                  className="flex-1 py-3 rounded-full bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium">继续学习</button>
                <button onClick={onExit}
                  className="flex-1 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm">返回首页</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}