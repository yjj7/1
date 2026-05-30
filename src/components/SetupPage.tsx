import React, { useRef } from 'react';
import { BookOpen, Headphones, Volume2, ArrowRight, Upload, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { SCENES, DURATIONS, MUSIC_TRACKS } from '../data';

interface SetupPageProps {
  selectedSceneId: string;
  onSelectScene: (id: string) => void;
  selectedMusicId: string;
  onSelectMusic: (id: string) => void;
  musicVolume: number;
  onMusicVolumeChange: (val: number) => void;
  bgVolume: number;
  onBgVolumeChange: (val: number) => void;
  timerDuration: number;
  onTimerDurationChange: (val: number) => void;
  customMusicUrl: string;
  onCustomMusicChange: (url: string) => void;
  onBack: () => void;
  onEnter: () => void;
}

export function SetupPage({
  selectedSceneId,
  onSelectScene,
  selectedMusicId,
  onSelectMusic,
  musicVolume,
  onMusicVolumeChange,
  bgVolume,
  onBgVolumeChange,
  timerDuration,
  onTimerDurationChange,
  customMusicUrl,
  onCustomMusicChange,
  onBack,
  onEnter,
}: SetupPageProps) {
  const activeScene = SCENES.find(s => s.id === selectedSceneId) || SCENES[0];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 释放旧的 blob URL
      if (customMusicUrl && customMusicUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customMusicUrl);
      }
      const url = URL.createObjectURL(file);
      onCustomMusicChange(url);
      onSelectMusic('custom');
    }
  };

  const customFileName = customMusicUrl ? '已选择音乐文件' : '';

  return (
    <div className="relative min-h-screen w-full flex flex-col text-white font-sans">
      {/* Dynamic Blurred Background */}
      <div 
        key={activeScene.id}
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${activeScene.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <BookOpen className="w-6 h-6" />
          <span className="text-xl font-medium tracking-wide">StudyWithMe AI</span>
        </div>
        
        <nav className="flex-1 flex justify-start ml-16 space-x-6 text-sm text-white/70">
          <button onClick={onBack} className="hover:text-white transition-colors">首页</button>
          <span className="text-white font-medium cursor-default">场景</span>
          <span className="text-white/70 cursor-default">音乐</span>
          <span className="text-white/70 cursor-default">计划</span>
        </nav>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row gap-8 px-8 md:px-24 py-8 overflow-hidden max-w-[1600px] mx-auto w-full">
        
        {/* Left Column: Scenes */}
        <div className="flex-[2] flex flex-col">
          <div className="mb-6">
            <div className="text-xs font-mono tracking-widest text-white/50 mb-2">STEP 01</div>
            <h2 className="text-3xl font-medium tracking-wide">选择你的学习场景</h2>
          </div>

          <div className="flex-1 p-8 rounded-[2rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {SCENES.map((scene) => {
                const isActive = scene.id === selectedSceneId;
                return (
                  <button
                    key={scene.id}
                    onClick={() => onSelectScene(scene.id)}
                    className={`relative text-left flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 ${isActive ? 'border-white/60 bg-white/10 ring-4 ring-white/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                  >
                    <div className="h-40 w-full overflow-hidden">
                      <img 
                        src={scene.imageUrl} 
                        alt={scene.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-105' : 'scale-100 opacity-70'}`}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-medium">{scene.title}</h3>
                        <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">SCENE</span>
                      </div>
                      <p className="text-sm text-white/60 mb-1">{scene.description}</p>
                      <p className="text-sm text-white/40">{scene.details}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Audio & Timer */}
        <div className="flex-1 flex flex-col space-y-8">
          
          {/* Audio Setup */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="text-xs font-mono tracking-widest text-white/50 mb-2">STEP 02</div>
              <h2 className="text-3xl font-medium tracking-wide">设置声音氛围</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="p-6 rounded-[1.5rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Headphones className="w-4 h-4 text-white/70" />
                  <span className="text-base font-medium">音乐</span>
                </div>
                <div className="mb-3">
                  <select 
                    value={selectedMusicId}
                    onChange={(e) => onSelectMusic(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white/80 outline-none cursor-pointer"
                  >
                    {MUSIC_TRACKS.map(m => (
                      <option key={m.id} value={m.id} className="text-black bg-white/90">{m.title}</option>
                    ))}
                  </select>
                </div>

                {/* 自定义音乐上传 */}
                {selectedMusicId === 'custom' && (
                  <div className="mb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-dashed border-white/30 hover:border-white/60 hover:bg-white/5 transition-all text-sm text-white/70 hover:text-white"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{customFileName || '选择本地音乐文件 (MP3/WAV/OGG)'}</span>
                    </button>
                    {customMusicUrl && (
                      <div className="flex items-center space-x-2 mt-2 text-xs text-green-400">
                        <Music className="w-3 h-3" />
                        <span>音乐已就绪</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 h-3 flex items-center relative group">
                  <div className="w-full h-1.5 bg-white/10 rounded-full relative pointer-events-none">
                    <div className="h-full bg-white/80 transition-all" style={{ width: `${musicVolume}%` }}></div>
                    <div className="w-3 h-3 bg-white rounded-full absolute -top-[3px] -ml-1.5 shadow transition-all" style={{ left: `${musicVolume}%` }}></div>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={musicVolume}
                    onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
                    className="w-full absolute opacity-0 cursor-pointer h-full z-10 top-0 left-0"
                  />
                </div>
              </div>

              <div className="p-6 rounded-[1.5rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Volume2 className="w-4 h-4 text-white/70" />
                  <span className="text-base font-medium">背景音</span>
                </div>
                <p className="text-xs text-white/50 mb-4">根据当前场景自动匹配环境声</p>
                <div className="flex-1 h-3 flex items-center relative group">
                  <div className="w-full h-1.5 bg-white/10 rounded-full relative pointer-events-none">
                    <div className="h-full bg-white/80 transition-all" style={{ width: `${bgVolume}%` }}></div>
                    <div className="w-3 h-3 bg-white rounded-full absolute -top-[3px] -ml-1.5 shadow transition-all" style={{ left: `${bgVolume}%` }}></div>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={bgVolume}
                    onChange={(e) => onBgVolumeChange(Number(e.target.value))}
                    className="w-full absolute opacity-0 cursor-pointer h-full z-10 top-0 left-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timer Setup */}
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <div className="text-xs font-mono tracking-widest text-white/50 mb-2">STEP 03</div>
              <h2 className="text-3xl font-medium tracking-wide">设置番茄钟</h2>
            </div>
            
            <div className="p-8 rounded-[2rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl flex flex-col justify-between flex-1">
              <div className="grid grid-cols-2 gap-4 mb-8">
                {DURATIONS.map(dur => (
                  <button
                    key={dur}
                    onClick={() => {
                        onTimerDurationChange(dur);
                        const input = document.getElementById('custom-time') as HTMLInputElement;
                        if(input) input.value = '';
                    }}
                    className={`py-4 rounded-xl border transition-all ${timerDuration === dur ? 'border-white bg-white/20' : 'border-white/20 bg-transparent hover:bg-white/10'}`}
                  >
                    <span>{dur} 分钟</span>
                  </button>
                ))}
                <div className={`relative flex items-center rounded-xl border transition-all overflow-hidden ${!DURATIONS.includes(timerDuration) ? 'bg-white/20 border-white' : 'border-white/20 hover:bg-white/10'}`}>
                  <input 
                    id="custom-time"
                    type="number" 
                    placeholder="自定义" 
                    className="w-full bg-transparent text-center outline-none p-4 placeholder:text-white/30 text-white"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) onTimerDurationChange(val);
                    }}
                  />
                  <span className="absolute right-4 text-white/50 pointer-events-none">分钟</span>
                </div>
              </div>
              
              <button 
                onClick={onEnter}
                className="w-full py-4 rounded-full border border-white/40 bg-white text-black font-medium text-lg hover:bg-white/90 transition-colors flex items-center justify-center space-x-2 group"
              >
                <span>进入自习室</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
