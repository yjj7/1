import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Play, Pause, RotateCcw, SkipForward, Music, Maximize,
  BarChart3, Clock, Sparkles, Headphones, Timer, ChevronUp, ChevronDown,
  Target, Flame, X,
} from 'lucide-react';
import type { Task, StudySession, TimerMode, PomodoroPhase, TaskCategory, Achievement } from '../types';
import { SCENES, MUSIC_TRACKS } from '../data';
import { audioManager, playClickSound, playSuccessSound, playMeditationChime } from '../audioManager';
import { CinematicBackground } from './CinematicBackground';
import { SceneClock } from './SceneClock';
import { AudioVisualizer } from './AudioVisualizer';
import { TaskPanel } from './TaskPanel';
import { AudioPanel } from './AudioPanel';
import { MeditationGuide } from './MeditationGuide';
import { getDailyQuote } from '../extras';
import { useT } from '../i18n';
import { useStudyStore } from '../store';
import { detectHoliday, recommendScene } from '../utils';
import { ACHIEVEMENTS } from '../extras';
import landingBg from '../assets/images/premium_landing_bg_1780054955872.png';

const MEDITATION_SECONDS = 30;

const SCENE_EMOJI: Record<string, string> = {
  morning_window: '🌅', rainy_cafe: '🌧️', night_library: '📚',
  seaside_study: '🌊', deep_night_desk: '💻', forest_cabin: '🌲', city_skyline: '🌆',
};

const FEATURES = [
  { icon: Sparkles, title: '沉浸场景', desc: '7种精选学习场景，从清晨窗边到深夜书房' },
  { icon: Headphones, title: '专注音乐', desc: '古典钢琴、Lo-fi、白噪音，独立音量控制' },
  { icon: Timer, title: '番茄钟', desc: '灵活时长 + 冥想引导，帮你进入状态' },
  { icon: BarChart3, title: '学习统计', desc: '每日追踪、热力图、连续打卡激励' },
] as const;

const STEPS = [
  { title: '点击开始专注', desc: '一键启动，直接进入计时' },
  { title: '进入沉浸状态', desc: '番茄钟计时 + 背景音乐' },
  { title: '追踪长期成长', desc: '自动记录学习数据，见证进步' },
] as const;

export function MainPage({
  onStats, onHistory, streak, pomodoroCount, achievements, onOpenGuide,
}: {
  onStats: () => void; onHistory: () => void; streak: number;
  pomodoroCount: number; achievements: Achievement[]; onOpenGuide: () => void;
}) {
  const { t, lang, setLang } = useT();
  const store = useStudyStore();
  const scene = SCENES.find(s => s.id === store.selectedSceneId) || SCENES[0];
  const quote = useMemo(() => getDailyQuote(), []);
  const earnedCount = achievements.filter(a => a.earned).length;
  const holiday = useMemo(() => detectHoliday(), []);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // ---- Timer active state ----
  const [timerActive, setTimerActive] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('study');
  const isBreak = ['shortBreak', 'longBreak'].includes(pomodoroPhase);
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [meditationTime, setMeditationTime] = useState(MEDITATION_SECONDS);
  const [timeLeft, setTimeLeft] = useState(store.timerDuration * 60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const sessionStartRef = useRef(Date.now());

  // ---- UI panels ----
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showSceneBar, setShowSceneBar] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [showImmersiveUI, setShowImmersiveUI] = useState(true);
  const [showMinimalClock, setShowMinimalClock] = useState(false);
  const [showSceneImage, setShowSceneImage] = useState(true);

  // ---- Task state ----
  const [newTaskText, setNewTaskText] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('study');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // ---- Breathing ----
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breatheLabel, setBreatheLabel] = useState<'in' | 'hold' | 'out'>('in');
  const lastTickRef = useRef(Date.now());

  // ---- Backdrop ----
  const bgImage = store.customBgUrl && store.selectedSceneId === 'custom'
    ? store.customBgUrl
    : timerActive ? scene.imageUrl : landingBg;
  const bgVideo = timerActive ? scene.videoUrl : '/videos/landing.mp4';

  // ---- Audio sync ----
  useEffect(() => { audioManager.setMusicVolume(store.musicVolume / 100); }, [store.musicVolume]);
  useEffect(() => { audioManager.setBgVolume(store.bgVolume / 100); }, [store.bgVolume]);
  useEffect(() => {
    const url = store.selectedMusicId === 'custom' && store.customMusicUrl
      ? store.customMusicUrl : store.selectedMusicId;
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
    const t = setInterval(() => setBreathingPhase(p => (p + 1) % 100), 50);
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
    const completed = store.tasks.filter(t => t.completed).length;
    const session: StudySession = {
      id: Date.now().toString(), date: new Date().toISOString(), duration: dur,
      sceneId: store.selectedSceneId, tasksCompleted: completed, tasksTotal: store.tasks.length, timerMode,
    };
    store.recordSession(session);
    setShowCompletion(true); setIsRunning(false);
    store.incrementPomodoro(); playSuccessSound();
    sendNotification(t('studyComplete'),
      `${t('studyCompleteDesc').replace('/', '')} ${Math.round(dur / 60)} ${t('minutes')}${completed}/${store.tasks.length}`);
  }, [store, timerMode, sendNotification, t]);

  const handleBreakFinish = useCallback(() => {
    setPomodoroPhase('study'); setTimerMode('countdown'); setTimeLeft(store.timerDuration * 60); setIsRunning(true);
    sessionStartRef.current = Date.now();
    sendNotification(t('breakEnd'), t('breakEndDesc'));
  }, [store.timerDuration, sendNotification, t]);

  // ---- Meditation countdown ----
  useEffect(() => {
    if (pomodoroPhase !== 'meditation') return;
    const iv = setInterval(() => {
      setMeditationTime(prev => {
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
        setTimeLeft(prev => {
          const next = prev - delta;
          if (next <= 0) { clearInterval(interval); (isBreak ? handleBreakFinish() : recordAndFinish()); return 0; }
          return next;
        });
      } else setTimeElapsed(prev => prev + delta);
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
    } catch (e) { console.error('Fullscreen failed:', e); }
  };

  // ---- Keyboard ----
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); setIsRunning(p => !p); playClickSound(); }
      else if (e.code === 'Escape' && isImmersive) toggleImmersive(false);
      else if (e.code === 'KeyM') setShowMinimalClock(p => !p);
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
  const toggleTask = (id: string) => store.setTasks(store.tasks.map(tk => tk.id === id ? { ...tk, completed: !tk.completed } : tk));
  const removeTask = (id: string) => store.setTasks(store.tasks.filter(tk => tk.id !== id));
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      const newTasks = [...store.tasks]; const [moved] = newTasks.splice(dragIdx, 1);
      newTasks.splice(idx, 0, moved); store.setTasks(newTasks); setDragIdx(idx);
    }
  };

  // ---- Helpers ----
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const currentTotal = isBreak ? getBreakDuration() * 60 : store.timerDuration * 60;
  const timePercent = pomodoroPhase === 'meditation'
    ? ((MEDITATION_SECONDS - meditationTime) / MEDITATION_SECONDS) * 100
    : Math.min(100, ((currentTotal - timeLeft) / currentTotal) * 100);
  const isEnding = pomodoroPhase === 'study' && timerMode === 'countdown' && timeLeft <= 10 && timeLeft > 0;
  const glowStyle = isRunning && !isBreak && !showCompletion
    ? { textShadow: `0 0 ${Math.sin(breathingPhase / 100 * Math.PI) * 15}px rgba(255,255,255,${0.1 + Math.sin(breathingPhase / 100 * Math.PI) * 0.15})` }
    : {};

  // ---- Start focus ----
  const handleStart = () => {
    try { const s = new Audio(); s.play().then(() => s.pause()).catch(() => {}); } catch {}
    audioManager.init();
    store.setScene(recommendScene());
    setTimerActive(true);
    // Skip meditation, go directly to study phase
    setPomodoroPhase('study');
    setIsRunning(true);
    setMeditationTime(0);
    sessionStartRef.current = Date.now();
  };

  // ---- Minimal clock mode ----
  if (showMinimalClock && timerActive) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer" onClick={() => setShowMinimalClock(false)}>
        <SceneClock />
        <span className="text-[10rem] font-thin text-white tabular-nums mt-8" style={glowStyle}>{fmt(timeLeft)}</span>
        <span className="text-sm text-white/20 mt-4">点击返回</span>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full flex flex-col text-white overflow-x-hidden font-sans ${isImmersive && !showImmersiveUI ? 'cursor-none' : ''}`}>
      {/* Background - fixed behind everything */}
      <div className="fixed inset-0 -z-10 bg-black">
        {showSceneImage ? (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <CinematicBackground imageUrl={bgImage} sceneId={timerActive ? scene.id : 'landing'} videoUrl={bgVideo} />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        ) : null}
        {timerActive && <SceneClock />}
        {timerActive && <AudioVisualizer />}
        {timerActive && (
          <div
            className={`absolute inset-0 transition-all duration-[10s] z-10 ${isImmersive ? 'bg-black/0' : isBreak ? 'bg-emerald-900/30' : isEnding ? 'bg-gradient-to-t from-white/[0.02] to-transparent' : 'bg-black/10'}`}
            style={isEnding ? { opacity: (10 - timeLeft) / 10 * 0.5 } : {}}
          />
        )}
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-8 py-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6" />
          <span className="text-xl font-medium tracking-wide">StudyWithMe AI</span>
          {timerActive && <span className="text-sm text-white/40 hidden md:inline">{scene.title}</span>}
        </div>
        <nav className="flex items-center space-x-4 text-sm text-white/70">
          {timerActive && (
            <button onClick={() => setShowAudioPanel(p => !p)}
              className={`p-2 rounded-full border transition-colors ${showAudioPanel ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 hover:text-white'}`}
              title={t('bgAudio')}>
              <Music className="w-4 h-4" />
            </button>
          )}
          {timerActive && (
            <button onClick={() => toggleImmersive(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors text-xs">
              <Maximize className="w-3.5 h-3.5" /><span>{t('immersive')}</span>
            </button>
          )}
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="hover:text-white transition-colors text-xs">
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <button onClick={onStats} className="hover:text-white transition-colors flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">{t('stats')}</span>
          </button>
          <button onClick={onHistory} className="hover:text-white transition-colors flex items-center space-x-1">
            <Clock className="w-4 h-4" /><span className="hidden sm:inline">{t('history')}</span>
          </button>
        </nav>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!timerActive ? (
            /* ── Landing content ── */
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <section className="pt-12 md:pt-24 pb-12 text-center px-6">
                {holiday && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-sm">
                    {holiday.label}
                  </motion.div>
                )}
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-bold mb-5 tracking-tight">
                  让每一次学习都沉浸其中
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-lg md:text-xl text-white/60 mb-8 max-w-xl mx-auto">
                  精选场景 × 专注音乐 × 智能番茄钟
                </motion.p>

                {(streak > 0 || pomodoroCount > 0) && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="flex items-center justify-center space-x-4 mb-8">
                    {streak > 0 && (
                      <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-orange-300">{t('streakNDays').replace('N', `${streak}`)}</span>
                      </div>
                    )}
                    {pomodoroCount > 0 && (
                      <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300">{t('pomodoroCountN').replace('N', `${pomodoroCount}`)}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  onClick={handleStart}
                  className="inline-flex items-center justify-center space-x-3 px-10 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all group shadow-lg shadow-white/10"
                >
                  <span className="text-lg">开始专注</span>
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </motion.button>
              </section>

              {/* Feature cards */}
              <section className="py-12 max-w-4xl mx-auto px-6">
                <div className="text-center mb-8">
                  <span className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">核心功能</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4 text-white/50" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">{title}</h3>
                      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* How it works */}
              <section className="py-8 max-w-md mx-auto px-6">
                <div className="text-center mb-6">
                  <span className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">三步开始</span>
                </div>
                <div className="space-y-4">
                  {STEPS.map(({ title, desc }, i) => (
                    <div key={title} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/30 text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{title}</h4>
                        <p className="text-xs text-white/40">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quote */}
              <section className="pb-20 pt-6 max-w-sm mx-auto px-6">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-sm font-light italic text-white/45 mb-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                    "{quote.text}"
                  </p>
                  <span className="text-xs text-white/25">— {quote.author}</span>
                </div>
              </section>
            </motion.div>
          ) : (
            /* ── Timer active ── */
            <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 w-full flex flex-col items-center justify-center relative">

              {/* Meditation guide */}
              {pomodoroPhase === 'meditation' && (
                <MeditationGuide
                  meditationTime={meditationTime}
                  breatheLabel={breatheLabel}
                  onSkip={() => { setPomodoroPhase('study'); setIsRunning(true); setMeditationTime(0); sessionStartRef.current = Date.now(); }}
                />
              )}

              {/* Completion overlay */}
              <AnimatePresence>
                {showCompletion && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center">
                    <div className="text-center p-10 rounded-[3rem] bg-white/[0.03] border border-white/10">
                      <span className="text-6xl mb-4 block">🍅</span>
                      <h2 className="text-3xl font-medium mb-4">{t('completed')}</h2>
                      <p className="text-white/60 mb-6">{store.pomodoroCount} {t('pomodoroDone')}</p>
                      <div className="flex space-x-4 justify-center">
                        <button onClick={() => { const dur = getBreakDuration(); setPomodoroPhase('shortBreak'); setTimerMode('countdown'); setTimeLeft(dur * 60); setIsRunning(true); setShowCompletion(false); setMeditationTime(0); sessionStartRef.current = Date.now(); }}
                          className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20">
                          {t('shortBreak')}
                        </button>
                        <button onClick={() => { setPomodoroPhase('longBreak'); setTimerMode('countdown'); setTimeLeft(15 * 60); setIsRunning(true); setShowCompletion(false); setMeditationTime(0); sessionStartRef.current = Date.now(); }}
                          className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20">
                          {t('longBreak')}
                        </button>
                      </div>
                      <button onClick={() => { setShowCompletion(false); setTimerActive(false); audioManager.stop(); }}
                        className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors">
                        {t('backToHome')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Center Timer */}
              <motion.div
                className="text-center select-none"
                animate={timerActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              >
                <div className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase mb-2">
                  {pomodoroPhase === 'meditation' ? 'MEDITATION' : isBreak ? 'BREAK' : 'FOCUS'}
                </div>

                {/* Ring progress */}
                <div className="relative inline-flex items-center justify-center mb-4">
                  <svg className="w-64 h-64 md:w-80 md:h-80 -rotate-90" viewBox="0 0 256 256">
                    <circle cx="128" cy="128" r="114" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="3" />
                    <circle cx="128" cy="128" r="114" fill="none"
                      stroke={isBreak ? '#34d399' : timeLeft <= 30 && timerMode === 'countdown' ? '#ef4444' : '#22c55e'}
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 114}`}
                      strokeDashoffset={`${2 * Math.PI * 114 * (1 - timePercent / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-7xl font-thin tabular-nums tracking-tight" style={glowStyle}>
                      {timerMode === 'stopwatch' ? fmt(timeElapsed) : fmt(timeLeft)}
                    </span>
                    <span className="text-xs text-white/30 mt-2">#{store.pomodoroCount + 1}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-6">
                  <button onClick={() => { setIsRunning(false); setTimeLeft(store.timerDuration * 60); }}
                    className="p-3 rounded-full hover:bg-white/10 transition-colors" title={t('reset')} aria-label={t('reset')}>
                    <RotateCcw className="w-5 h-5 text-white/40" />
                  </button>
                  <button onClick={() => { setIsRunning(!isRunning); playClickSound(); }}
                    className="p-5 rounded-full bg-white hover:bg-white/90 transition-all shadow-lg shadow-white/10">
                    {isRunning ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black ml-0.5" />}
                  </button>
                  {isBreak && (
                    <button onClick={handleBreakFinish} className="p-3 rounded-full hover:bg-white/10 transition-colors" title={t('skipBreak')} aria-label={t('skipBreak')}>
                      <SkipForward className="w-5 h-5 text-white/40" />
                    </button>
                  )}
                </div>

                {/* Duration selector below timer */}
                {!isRunning && pomodoroPhase !== 'meditation' && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    {[25, 45, 50, 90].map(d => (
                      <button key={d}
                        onClick={() => { store.setTimerDuration(d); setTimeLeft(d * 60); }}
                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${store.timerDuration === d ? 'bg-white/15 text-white border border-white/20' : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/5'}`}
                      >{d}min</button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Task panel toggle */}
              <AnimatePresence>
                {showTaskPanel && !isImmersive && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="absolute left-6 top-20 z-20">
                    <TaskPanel
                      tasks={store.tasks} newTaskText={newTaskText} setNewTaskText={setNewTaskText}
                      taskCategory={taskCategory} setTaskCategory={setTaskCategory} addTask={addTask}
                      toggleTask={toggleTask} removeTask={removeTask} dragIdx={dragIdx}
                      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={() => setDragIdx(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Audio panel */}
              <AnimatePresence>
                {showAudioPanel && !isImmersive && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="absolute right-6 top-20 z-20">
                    <AudioPanel
                      musicId={store.selectedMusicId} onSelectMusic={id => store.setMusic(id)}
                      musicVolume={store.musicVolume} onMusicVolumeChange={v => store.setMusicVolume(v)}
                      bgVolume={store.bgVolume} onBgVolumeChange={v => store.setBgVolume(v)}
                      onClose={() => setShowAudioPanel(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls (only when timer active and not in meditation) */}
        {timerActive && !isImmersive && pomodoroPhase !== 'meditation' && (
          <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-6">
            <div className="flex items-center justify-between bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl px-4 py-3">
              {/* Left: task toggle + scene quick info */}
              <div className="flex items-center space-x-3">
                <button onClick={() => setShowTaskPanel(p => !p)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${showTaskPanel ? 'bg-white/15 text-white' : 'bg-white/[0.03] text-white/50 hover:text-white/80'}`}>
                  <span>📋</span>
                  <span>{store.tasks.filter(t => !t.completed).length}</span>
                </button>
                <button onClick={() => setShowSceneBar(p => !p)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${showSceneBar ? 'bg-white/15 text-white' : 'bg-white/[0.03] text-white/50 hover:text-white/80'}`}>
                  🎬 {scene.title.slice(0, 4)}
                </button>
                <button onClick={() => setShowSceneImage(p => !p)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${showSceneImage ? 'bg-white/15 text-white' : 'bg-white/[0.03] text-white/50 hover:text-white/80'}`}
                  title={showSceneImage ? '隐藏场景背景' : '显示场景背景'}>
                  🖼️ 场景
                </button>
                <button onClick={onHistory} className="px-3 py-1.5 rounded-full text-xs text-white/50 hover:text-white/80 transition-colors bg-white/[0.03]">
                  <Clock className="w-3 h-3 inline mr-1" />{t('history')}
                </button>
              </div>

              {/* Right: exit */}
              <button onClick={() => { setTimerActive(false); audioManager.stop(); setIsRunning(false); }}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/40 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mini music widget (bottom-right, above scene switcher) */}
      {timerActive && !isImmersive && pomodoroPhase !== 'meditation' && (() => {
        const currentMusic = MUSIC_TRACKS.find(m => m.id === store.selectedMusicId);
        return (
          <button
            onClick={() => setShowAudioPanel(p => !p)}
            className="fixed right-4 bottom-16 z-20 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs flex items-center space-x-2 text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
            title={currentMusic?.title}
          >
            <Music className="w-3 h-3" />
            <span className="max-w-[5em] truncate">{currentMusic ? currentMusic.title.slice(0, 8) : '无'}</span>
            <span className="tabular-nums">{store.musicVolume}%</span>
          </button>
        );
      })()}

      {/* Scene switcher bar (bottom-right, collapsible, hidden during meditation) */}
      <AnimatePresence>
        {timerActive && showSceneBar && !isImmersive && pomodoroPhase !== 'meditation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed right-4 bottom-20 md:right-8 md:bottom-24 z-20"
          >
            <div className="p-2 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10">
              <div className="flex items-center space-x-1">
                {SCENES.map(s => (
                  <button key={s.id}
                    onClick={() => { store.setScene(s.id); playClickSound(); }}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[44px] ${store.selectedSceneId === s.id ? 'bg-white/15 border border-white/30' : 'bg-white/[0.02] border border-white/5 hover:bg-white/10'}`}
                    title={s.title}>
                    <span className="text-base leading-none">{SCENE_EMOJI[s.id] || '🎬'}</span>
                    <span className={`text-[8px] mt-0.5 ${store.selectedSceneId === s.id ? 'text-white/70' : 'text-white/25'}`}>{s.title.slice(0, 4)}</span>
                  </button>
                ))}
                <button onClick={() => setShowSceneBar(false)}
                  className="p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show scene bar toggle (when hidden, hidden during meditation) */}
      {timerActive && !showSceneBar && !isImmersive && pomodoroPhase !== 'meditation' && (
        <button onClick={() => setShowSceneBar(true)}
          className="fixed right-4 bottom-20 z-20 p-2 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-white/40 hover:text-white/60 transition-colors">
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Minimal clock toggle (hidden during meditation) */}
      {timerActive && !isImmersive && pomodoroPhase !== 'meditation' && (
        <button onClick={() => setShowMinimalClock(true)}
          className="fixed top-6 right-6 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/40 hover:text-white/60">
          <Maximize className="w-4 h-4" />
        </button>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/30">
          <span>StudyWithMe AI — 用专注创造价值</span>
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-white/50 transition-colors">{t('privacy')}</button>
          </div>
        </div>
      </footer>

      {/* Privacy modal */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPrivacy(false)}>
            <motion.div className="max-w-md w-full mx-4 p-8 rounded-3xl bg-white/[0.06] border border-white/10 backdrop-blur-xl"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">{t('privacyTitle')}</h2>
              <p className="text-white/70 leading-relaxed mb-6">{t('privacyText')}</p>
              <button onClick={() => setShowPrivacy(false)}
                className="px-6 py-2.5 rounded-full bg-white/[0.1] border border-white/10 hover:bg-white/20 transition-all text-sm">
                {t('privacyClose')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
