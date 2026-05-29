import React, { useState, useEffect } from 'react';
import { BookOpen, X, Play, Pause, SkipForward, RotateCcw, Target, Volume2, MoveDiagonal, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Scene, Task } from '../types';
import { SCENES, MUSIC_TRACKS } from '../data';
import { audioManager } from '../audioManager';

interface TimerPageProps {
  sceneId: string;
  musicId: string;
  onSelectMusic: (id: string) => void;
  durationMinutes: number;
  musicVolume: number;
  bgVolume: number;
  onExit: () => void;
  onMusicVolumeChange: (val: number) => void;
  onBgVolumeChange: (val: number) => void;
  tasks: Task[];
  onTasksChange: (val: Task[]) => void;
  pomodoroCount: number;
  onPomodoroComplete: () => void;
}

export function TimerPage({
  sceneId,
  musicId,
  onSelectMusic,
  durationMinutes,
  musicVolume,
  bgVolume,
  onExit,
  onMusicVolumeChange,
  onBgVolumeChange,
  tasks,
  onTasksChange,
  pomodoroCount,
  onPomodoroComplete
}: TimerPageProps) {
  const activeScene = SCENES.find(s => s.id === sceneId) || SCENES[0];
  
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [showImmersiveUI, setShowImmersiveUI] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    audioManager.setMusicVolume(musicVolume / 100);
  }, [musicVolume]);

  useEffect(() => {
    audioManager.setBgVolume(bgVolume / 100);
  }, [bgVolume]);

  useEffect(() => {
    const track = MUSIC_TRACKS.find(m => m.id === musicId);
    if (track) {
      audioManager.setMusic(track.audioUrl);
      if (isRunning) audioManager.play();
    }
  }, [musicId]);

  useEffect(() => {
    if (activeScene.audioUrl) {
      audioManager.setBg(activeScene.audioUrl);
      if (isRunning) audioManager.play();
    }
  }, [activeScene.audioUrl]);

  // Manage playback state
  useEffect(() => {
    if (isRunning) {
      audioManager.play();
    } else {
      audioManager.pause();
    }
  }, [isRunning]);

  const totalTime = durationMinutes * 60;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  const playDing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2);
    } catch (e) {
      console.warn('AudioContext not available');
    }
  };

  const handleFinish = () => {
    setTimeLeft(0);
    setIsRunning(false);
    onPomodoroComplete();
    playDing();
  };

  useEffect(() => {
    const mainTask = tasks.find(t => !t.completed)?.text || '专注中';
    document.title = `${formatTime(timeLeft)} - ${mainTask} | StudyWithMe AI`;
    return () => { document.title = 'StudyWithMe AI'; };
  }, [timeLeft, tasks]);

  useEffect(() => {
    if (!isImmersive) {
      setShowImmersiveUI(true);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setShowImmersiveUI(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowImmersiveUI(false), 2500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    timeout = setTimeout(() => setShowImmersiveUI(false), 2500);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isImmersive]);

  const toggleImmersive = async (enter: boolean) => {
    setIsImmersive(enter);
    try {
      if (enter && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (!enter && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen API failed", e);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleFinish]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleReset = () => setTimeLeft(durationMinutes * 60);
  
  return (
    <div className={`relative min-h-screen w-full flex flex-col text-white font-sans overflow-hidden ${isImmersive && !showImmersiveUI ? 'cursor-none' : ''}`}>
      {/* Background Image */}
      <motion.div 
        key={activeScene.id}
        className="absolute inset-0 z-0 bg-cover bg-center origin-center"
        style={{ backgroundImage: `url(${activeScene.imageUrl})` }}
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: [1.05, 1.1, 1.05], opacity: 1 }}
        transition={{ 
          opacity: { duration: 1.5 },
          scale: { duration: 40, repeat: Infinity, ease: "easeInOut" } 
        }}
      >
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isImmersive ? 'bg-black/0' : 'bg-black/10'}`}></div>
      </motion.div>

      <AnimatePresence>
        {!isImmersive && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex items-center justify-between px-8 py-6"
          >
            <div className="flex items-center space-x-4">
              <button onClick={onExit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5" />
                <span className="text-xl font-medium tracking-wide">StudyWithMe AI</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8 text-sm text-white/80">
              <span className="hover:text-white cursor-pointer transition-colors">场景</span>
              <span className="hover:text-white cursor-pointer transition-colors">音乐</span>
              <span className="hover:text-white cursor-pointer transition-colors">计划</span>
            </nav>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => toggleImmersive(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm hover:bg-white/20 transition-colors"
              >
                <MoveDiagonal className="w-4 h-4" />
                <span>沉浸模式</span>
              </button>
              <button 
                onClick={onExit}
                className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm hover:bg-white/20 transition-colors"
              >
                <span>← 返回首页</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
      
      {!isImmersive && (
        <div className="absolute top-24 right-8 z-10 text-right">
          <span className="text-sm font-medium text-white/70 tracking-widest">{activeScene.title}</span>
        </div>
      )}

      {/* Main Container for Widgets */}
      <main className="relative z-10 flex-1 w-full h-full p-8 flex flex-col justify-end pointer-events-none">
        
        {/* Timer Widget - Always visible, but moves slightly down left */}
        <motion.div 
          layout
          className="pointer-events-auto absolute left-8 bottom-32 md:left-24 md:bottom-40 p-6 rounded-[2rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl w-72"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono tracking-widest text-white/60 uppercase">POMODORO #{pomodoroCount + 1}</span>
            <div className="flex items-center space-x-2 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-green-400/50'}`}></div>
              <span className="text-xs text-green-300 font-medium tracking-wide">{timeLeft === 0 ? '已完成' : isRunning ? '学习中' : '已暂停'}</span>
            </div>
          </div>
          
          <div className="text-6xl font-light tracking-tight mb-8 tabular-nums">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-xs text-white/50">
              <span>本轮进度</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Control Bar */}
        <AnimatePresence>
          {!isImmersive && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="pointer-events-auto w-full max-w-4xl mx-auto flex flex-col space-y-4 mb-4"
            >
              {/* Tasks List */}
              <div className="flex flex-col space-y-2 w-2/3 mx-auto max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.map(t => (
                  <div key={t.id} className={`flex items-center justify-between px-6 py-3 rounded-2xl bg-white/[0.01] backdrop-blur-[2px] border ${t.completed ? 'border-white/5 opacity-50' : 'border-white/10'} shadow-xl`}>
                    <div className="flex items-center space-x-3 w-full">
                      <button 
                        onClick={() => onTasksChange(tasks.map(ct => ct.id === t.id ? { ...ct, completed: !ct.completed } : ct))}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${t.completed ? 'bg-green-500 border-green-500 text-black' : 'border-white/30 hover:border-white/60'}`}
                      >
                        {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                      <span className={`text-sm ${t.completed ? 'line-through text-white/50' : 'text-white/90'}`}>{t.text}</span>
                    </div>
                    <button onClick={() => onTasksChange(tasks.filter(ct => ct.id !== t.id))} className="text-white/20 hover:text-white/60">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-3 px-6 py-3 rounded-2xl bg-white/[0.01] backdrop-blur-[2px] border border-white/5 shadow-xl">
                  <Target className="w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTaskText.trim()) {
                        onTasksChange([...tasks, { id: Date.now().toString(), text: newTaskText.trim(), completed: false }]);
                        setNewTaskText('');
                      }
                    }}
                    placeholder="添加计划任务 (按回车保存)..." 
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between px-8 py-4 rounded-[3rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl gap-4">
                
                {/* Sliders and Selectors */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center space-x-3 w-40">
                    <select 
                      value={musicId}
                      onChange={(e) => onSelectMusic(e.target.value)}
                      className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white/80 outline-none w-20 truncate"
                      title="选择音乐"
                    >
                      {MUSIC_TRACKS.map(m => (
                        <option key={m.id} value={m.id} className="text-black">{m.title}</option>
                      ))}
                    </select>
                    <div className="flex-1 h-2 flex items-center relative group">
                      <div className="w-full h-1 bg-white/20 rounded-full relative pointer-events-none">
                        <div className="h-full bg-white/80 transition-all" style={{ width: `${musicVolume}%` }}></div>
                        <div className="w-2.5 h-2.5 bg-white rounded-full absolute -top-[3px] -ml-1 transition-all" style={{ left: `${musicVolume}%` }}></div>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={musicVolume}
                        onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
                        className="w-full absolute opacity-0 cursor-pointer h-full z-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 w-32">
                    <span className="text-xs text-white/60 w-10">背景音</span>
                    <div className="flex-1 h-2 flex items-center relative group">
                      <div className="w-full h-1 bg-white/20 rounded-full relative pointer-events-none">
                        <div className="h-full bg-white/80 transition-all" style={{ width: `${bgVolume}%` }}></div>
                        <div className="w-2.5 h-2.5 bg-white rounded-full absolute -top-[3px] -ml-1 transition-all" style={{ left: `${bgVolume}%` }}></div>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={bgVolume}
                        onChange={(e) => onBgVolumeChange(Number(e.target.value))}
                        className="w-full absolute opacity-0 cursor-pointer h-full z-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isRunning ? '暂停' : '继续'}</span>
                  </button>
                  <button 
                    onClick={handleFinish}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>跳过</span>
                  </button>
                  <button onClick={handleReset} className="flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm">
                    <RotateCcw className="w-4 h-4" />
                    <span>重置</span>
                  </button>
                  <button onClick={onExit} className="flex items-center space-x-2 px-6 py-2 rounded-full border border-white/40 hover:bg-white/20 transition-colors text-sm">
                    <X className="w-4 h-4" />
                    <span>结束学习</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      
      {/* Immersive Mode Escaper */}
      <AnimatePresence>
        {isImmersive && showImmersiveUI && (
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleImmersive(false)}
            className="absolute top-8 right-8 z-50 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors text-white/50 hover:text-white"
          >
            <Minimize className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Completion Overlay */}
      <AnimatePresence>
        {timeLeft === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="text-center p-10 rounded-[2rem] bg-white/[0.05] backdrop-blur-[4px] border border-white/10 shadow-2xl mx-4 max-w-md w-full">
              <h2 className="text-3xl font-medium mb-4 tracking-wide">专注完成！</h2>
              <p className="text-sm text-white/70 mb-8 leading-relaxed">
                你已经完成了一个番茄钟的任务，稍作休息准备下一个挑战。
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => { setTimeLeft(durationMinutes * 60); setIsRunning(true); }}
                  className="w-full py-4 rounded-full bg-white text-black hover:bg-white/90 transition-colors font-medium text-sm"
                >
                  开始下一个
                </button>
                <button 
                  onClick={onExit}
                  className="w-full py-4 rounded-full border border-white/20 bg-transparent hover:bg-white/10 transition-colors text-sm"
                >
                  返回首页
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side nav chevrons (visual only) */}
      {!isImmersive && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/30 hover:text-white/60 transition-colors cursor-pointer hidden md:block">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/30 hover:text-white/60 transition-colors cursor-pointer hidden md:block">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </>
      )}
    </div>
  );
}
