import React, { useRef } from 'react';
import { BookOpen, Headphones, Volume2, ArrowRight, Upload, Music, Image, BarChart3, Clock, Target, Flame, Save, Star, Zap, Trash2 } from 'lucide-react';
import { SCENES, DURATIONS, MUSIC_TRACKS } from '../data';
import { DailyGoal } from '../types';

interface ScenePreset { id: string; sceneId: string; musicId: string; label: string; }

interface SetupPageProps {
  selectedSceneId: string;
  onSelectScene: (id: string) => void;
  selectedMusicId: string;
  onSelectMusic: (id: string) => void;
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  bgVolume: number;
  onBgVolumeChange: (v: number) => void;
  timerDuration: number;
  onTimerDurationChange: (v: number) => void;
  customMusicUrl: string;
  onCustomMusicChange: (url: string) => void;
  customBgUrl: string;
  onCustomBgChange: (url: string) => void;
  dailyGoal: DailyGoal;
  onDailyGoalChange: (g: DailyGoal) => void;
  scenePresets: ScenePreset[];
  onSavePreset: (sceneId: string, musicId: string, label: string) => void;
  onLoadPreset: (preset: ScenePreset) => void;
  onDeletePreset: (id: string) => void;
  recommendedScene: string;
  onBack: () => void;
  onStats: () => void;
  onHistory: () => void;
  onEnter: () => void;
}

export function SetupPage(props: SetupPageProps) {
  const {
    selectedSceneId, onSelectScene, selectedMusicId, onSelectMusic,
    musicVolume, onMusicVolumeChange, bgVolume, onBgVolumeChange,
    timerDuration, onTimerDurationChange,
    customMusicUrl, onCustomMusicChange, customBgUrl, onCustomBgChange,
    dailyGoal, onDailyGoalChange, scenePresets, onSavePreset, onLoadPreset, onDeletePreset,
    recommendedScene,
    onBack, onStats, onHistory, onEnter,
  } = props;

  const activeScene = SCENES.find(s => s.id === selectedSceneId) || SCENES[0];
  const bgImage = selectedSceneId === 'custom' && customBgUrl ? customBgUrl : activeScene.imageUrl;
  const musicFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [presetLabel, setPresetLabel] = React.useState('');

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { if (customMusicUrl?.startsWith('blob:')) URL.revokeObjectURL(customMusicUrl); onCustomMusicChange(URL.createObjectURL(file)); onSelectMusic('custom'); }
  };
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { if (customBgUrl?.startsWith('blob:')) URL.revokeObjectURL(customBgUrl); onCustomBgChange(URL.createObjectURL(file)); }
  };

  const currentScene = SCENES.find(s => s.id === selectedSceneId);
  const currentMusic = MUSIC_TRACKS.find(m => m.id === selectedMusicId);

  return (
    <div className="relative min-h-screen w-full flex flex-col text-white font-sans overflow-y-auto">
      <div key={selectedSceneId} className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <header className="relative z-10 flex items-center px-6 md:px-10 py-4 shrink-0">
        <div className="flex items-center space-x-3"><BookOpen className="w-5 h-5" /><span className="text-lg font-medium tracking-wide">StudyWithMe AI</span></div>
        <nav className="ml-10 flex space-x-5 text-sm text-white/60">
          <button onClick={onBack} className="hover:text-white transition-colors">首页</button>
          <span className="text-white font-medium">场景</span>
          <button onClick={onStats} className="hover:text-white transition-colors flex items-center space-x-1"><BarChart3 className="w-3.5 h-3.5" /><span>统计</span></button>
          <button onClick={onHistory} className="hover:text-white transition-colors flex items-center space-x-1"><Clock className="w-3.5 h-3.5" /><span>历史</span></button>
        </nav>
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 px-4 md:px-10 pb-8 w-full max-w-[1400px] mx-auto">
        {/* Left: Scenes */}
        <section className="flex-[3] flex flex-col min-w-0">
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono tracking-widest text-white/40">STEP 01</span>
              {recommendedScene && (
                <button onClick={() => onSelectScene(recommendedScene)}
                  className="flex items-center space-x-1 text-[10px] text-amber-400/80 hover:text-amber-300 transition-colors">
                  <Zap className="w-3 h-3" /><span>推荐当前时段场景</span>
                </button>
              )}
            </div>
            <h2 className="text-2xl font-medium mt-1">选择学习场景</h2>
          </div>
          <div className="flex-1 p-4 md:p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {SCENES.map((scene) => {
                const isActive = scene.id === selectedSceneId;
                const isRecommended = scene.id === recommendedScene;
                return (
                  <button key={scene.id} onClick={() => onSelectScene(scene.id)}
                    className={`group relative text-left flex flex-col rounded-xl overflow-hidden border transition-all duration-300 ${isActive ? 'border-white/50 bg-white/10 ring-2 ring-white/20 shadow-lg shadow-white/5' : 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-white/20'}`}>
                    <div className="aspect-[16/10] w-full overflow-hidden relative">
                      <img src={scene.imageUrl} alt={scene.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'scale-105 brightness-100' : 'scale-100 brightness-75 group-hover:brightness-90'}`} />
                      {isActive && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>}
                      {isRecommended && !isActive && <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/80 text-black font-medium">荐</span>}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium mb-0.5 truncate">{scene.title}</h3>
                      <p className="text-[11px] text-white/50 truncate">{scene.description}</p>
                    </div>
                  </button>
                );
              })}
              <div className={`group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-300 ${selectedSceneId === 'custom' ? 'border-white/50 bg-white/10 ring-2 ring-white/20' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}>
                <input ref={bgFileRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                <button onClick={() => bgFileRef.current?.click()} className="flex-1 flex flex-col items-center justify-center p-6 aspect-[16/10]">
                  <Image className="w-8 h-8 text-white/40 mb-2" />
                  <span className="text-xs text-white/50">{customBgUrl ? '自定义背景 ✓' : '上传背景图'}</span>
                </button>
              </div>
            </div>

            {/* Saved Presets */}
            {scenePresets.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-white/50 mb-3 flex items-center space-x-2"><Star className="w-3.5 h-3.5" /><span>已保存的组合</span></h3>
                <div className="flex flex-wrap gap-2">
                  {scenePresets.map(p => {
                    const ps = SCENES.find(s => s.id === p.sceneId);
                    const pm = MUSIC_TRACKS.find(m => m.id === p.musicId);
                    return (
                      <div key={p.id} className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs">
                        <button onClick={() => onLoadPreset(p)} className="hover:text-white transition-colors">{p.label || `${ps?.title || '?'} + ${pm?.title || '?'}`}</button>
                        <button onClick={() => onDeletePreset(p.id)} className="text-white/20 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column */}
        <aside className="flex-[1] flex flex-col gap-5 lg:min-w-[280px] lg:max-w-[320px]">
          {/* Current combo + save */}
          <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium flex items-center space-x-2"><Save className="w-4 h-4 text-white/60" /><span>保存当前组合</span></span>
            </div>
            <div className="flex space-x-2">
              <input value={presetLabel} onChange={(e) => setPresetLabel(e.target.value)} placeholder="组合名 (如: 晨间学习)" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none placeholder:text-white/20" />
              <button onClick={() => { if (currentScene && currentMusic) { onSavePreset(selectedSceneId, selectedMusicId, presetLabel || `${currentScene.title}+${currentMusic.title}`); setPresetLabel(''); } }}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs">保存</button>
            </div>
          </div>

          {/* Audio */}
          <div>
            <span className="text-[10px] font-mono tracking-widest text-white/40">STEP 02</span>
            <h2 className="text-xl font-medium mt-1 mb-3">声音氛围</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
                <div className="flex items-center space-x-2 mb-3"><Headphones className="w-4 h-4 text-white/60" /><span className="text-sm font-medium">音乐</span></div>
                <select value={selectedMusicId} onChange={(e) => onSelectMusic(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none cursor-pointer">
                  {MUSIC_TRACKS.map(m => <option key={m.id} value={m.id} className="text-black">{m.title}</option>)}
                </select>
                {selectedMusicId === 'custom' && (
                  <div className="mt-3">
                    <input ref={musicFileRef} type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
                    <button onClick={() => musicFileRef.current?.click()} className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg border border-dashed border-white/25 hover:border-white/50 hover:bg-white/5 transition-all text-xs text-white/60 hover:text-white"><Upload className="w-3.5 h-3.5" /><span>{customMusicUrl ? '已选择文件' : '上传本地音乐'}</span></button>
                    {customMusicUrl && <div className="flex items-center space-x-1.5 mt-2 text-[11px] text-green-400"><Music className="w-3 h-3" /><span>就绪</span></div>}
                  </div>
                )}
                <div className="mt-3 relative h-6 flex items-center">
                  <div className="w-full h-1 bg-white/15 rounded-full relative"><div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${musicVolume}%` }} /><div className="w-3 h-3 bg-white rounded-full absolute -top-1 shadow transition-all" style={{ left: `${musicVolume}%`, marginLeft: '-6px' }} /></div>
                  <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => onMusicVolumeChange(Number(e.target.value))} className="w-full absolute opacity-0 cursor-pointer h-full" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
                <div className="flex items-center space-x-2 mb-1"><Volume2 className="w-4 h-4 text-white/60" /><span className="text-sm font-medium">背景音</span></div>
                <p className="text-[11px] text-white/40 mb-3">根据场景自动匹配</p>
                <div className="relative h-6 flex items-center">
                  <div className="w-full h-1 bg-white/15 rounded-full relative"><div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${bgVolume}%` }} /><div className="w-3 h-3 bg-white rounded-full absolute -top-1 shadow transition-all" style={{ left: `${bgVolume}%`, marginLeft: '-6px' }} /></div>
                  <input type="range" min="0" max="100" value={bgVolume} onChange={(e) => onBgVolumeChange(Number(e.target.value))} className="w-full absolute opacity-0 cursor-pointer h-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <span className="text-[10px] font-mono tracking-widest text-white/40">STEP 03</span>
            <h2 className="text-xl font-medium mt-1 mb-3 flex items-center space-x-2"><Target className="w-5 h-5" /><span>每日目标</span></h2>
            <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-2 mb-3"><Flame className="w-4 h-4 text-orange-400" /><span className="text-sm">每日目标 {dailyGoal.targetMinutes} 分钟</span></div>
              <div className="grid grid-cols-3 gap-2">
                {[60, 120, 180].map(min => (
                  <button key={min} onClick={() => onDailyGoalChange({ targetMinutes: min })} className={`py-2 rounded-lg border text-xs transition-all ${dailyGoal.targetMinutes === min ? 'border-white bg-white/20 font-medium' : 'border-white/15 hover:bg-white/10'}`}>{min >= 60 ? `${min / 60}h` : `${min}m`}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-mono tracking-widest text-white/40">STEP 04</span>
            <h2 className="text-xl font-medium mt-1 mb-3">番茄钟</h2>
            <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {DURATIONS.map(dur => (
                  <button key={dur} onClick={() => { onTimerDurationChange(dur); (document.getElementById('custom-time') as HTMLInputElement) && ((document.getElementById('custom-time') as HTMLInputElement).value = ''); }} className={`py-3 rounded-lg border text-sm transition-all ${timerDuration === dur ? 'border-white bg-white/20 font-medium' : 'border-white/15 hover:bg-white/10'}`}>{dur} 分钟</button>
                ))}
                <div className={`relative flex items-center rounded-lg border overflow-hidden ${![...DURATIONS].includes(timerDuration) ? 'bg-white/15 border-white' : 'border-white/15'}`}>
                  <input id="custom-time" type="number" placeholder="自定义" className="w-full bg-transparent text-center outline-none py-3 text-sm placeholder:text-white/30" onChange={(e) => { const v = Number(e.target.value); if (v > 0) onTimerDurationChange(v); }} />
                  <span className="absolute right-3 text-xs text-white/40 pointer-events-none">min</span>
                </div>
              </div>
              <div className="mt-auto">
                <button onClick={onEnter} className="w-full py-3.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors flex items-center justify-center space-x-2 group"><span>进入自习室</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
