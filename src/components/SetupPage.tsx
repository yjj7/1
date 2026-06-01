import React, { useRef } from 'react';
import { ArrowRight, Clock, Brain, Eye, Bell, Volume2, Zap, Moon, Sun } from 'lucide-react';
import { SCENES, DURATIONS, MUSIC_TRACKS } from '../data';
import { DailyGoal, UserSettings, ScenePreset } from '../types';
import { useT } from '../i18n';

const BREAK_DURATIONS = [3, 5, 10, 15];
const LONG_BREAK_DURATIONS = [10, 15, 20, 30];

interface ScenePreset {
  id: string; sceneId: string; musicId: string; label: string;
}

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
  dailyGoal: DailyGoal;
  onDailyGoalChange: (minutes: number) => void;
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
  customBgUrl: string;
  onCustomBgChange: (url: string) => void;
  customMusicUrl: string;
  onCustomMusicChange: (url: string) => void;
  presets: ScenePreset[];
  onSavePreset: (sceneId: string, musicId: string, label: string) => void;
  onLoadPreset: (preset: ScenePreset) => void;
  onDeletePreset: (id: string) => void;
  onEnter: () => void;
  onStats: () => void;
  onHistory: () => void;
  onBack: () => void;
  streak: number;
  pomodoroCount: number;
}

export default function SetupPage(props: SetupPageProps) {
  const {
    selectedSceneId, onSelectScene, selectedMusicId, onSelectMusic,
    musicVolume, onMusicVolumeChange, bgVolume, onBgVolumeChange,
    timerDuration, onTimerDurationChange, dailyGoal, onDailyGoalChange,
    settings, onSettingsChange,
    customBgUrl, onCustomBgChange, customMusicUrl, onCustomMusicChange,
    presets, onSavePreset, onLoadPreset, onDeletePreset,
    onEnter, onStats, onHistory, onBack,
    streak, pomodoroCount,
  } = props;
  
  const { t } = useT();
  const activeScene = SCENES.find(s => s.id === selectedSceneId) || SCENES[0];
  const currentMusicTrack = MUSIC_TRACKS.find(m => m.id === selectedMusicId);
  const bgImage = customBgUrl || activeScene.imageUrl;
  
  const [showSettings, setShowSettings] = React.useState(false);
  const [presetLabel, setPresetLabel] = React.useState('');

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4">
        <button onClick={onBack} className="text-white/60 hover:text-white transition-colors text-sm">
          {t('homePage')}
        </button>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-10 pb-24">
        {/* Scene Selection */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">{t('step1')}</h2>
          <h3 className="text-2xl font-medium mb-4">{t('stepScene')}</h3>
          <div className="flex space-x-2 mb-4">
            <button onClick={() => { const ids = SCENES.map(s => s.id); onSelectScene(ids[Math.floor(Math.random() * ids.length)]); }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs">
              <span>🎲</span><span>{t('randomScene')}</span>
            </button>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
              onClick={() => { const h = new Date().getHours(); const ids = h < 8 ? ['morning'] : h < 18 ? ['seaside', 'cafe'] : ['night', 'night_desk']; onSelectScene(ids[0]); }}>
              <Zap className="w-3 h-3" /><span>{t('recommendScene')}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SCENES.map(s => (
              <button key={s.id} onClick={() => onSelectScene(s.id)}
                className={`relative overflow-hidden rounded-xl aspect-[4/3] border-2 transition-all ${selectedSceneId === s.id ? 'border-white scale-[1.02]' : 'border-white/10 hover:border-white/30'}`}>
                <img src={s.imageUrl} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-2 left-2 text-xs font-medium">{s.title}</span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { if (f.size > 5 * 1024 * 1024) { alert('Image too large (max 5MB)'); return; } onCustomBgChange(URL.createObjectURL(f)); } }} className="hidden" />
              <span className="text-xs text-white/50">{customBgUrl ? t('customBgReady') : t('uploadBg')}</span>
            </label>
          </div>
        </section>

        {/* Music Selection */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">{t('step2')}</h2>
          <h3 className="text-2xl font-medium mb-4">{t('stepSound')}</h3>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-sm font-medium">{t('music')}</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
            {MUSIC_TRACKS.map(m => (
              <button key={m.id} onClick={() => onSelectMusic(m.id)}
                className={`p-3 rounded-lg text-center transition-all border ${selectedMusicId === m.id ? 'border-white bg-white/20' : 'border-white/10 hover:bg-white/10'}`}>
                <div className="text-lg mb-1">{m.icon}</div>
                <div className="text-[11px]">{m.title}</div>
              </button>
            ))}
          </div>
          <label className="flex items-center space-x-2 text-xs text-white/50 cursor-pointer">
            <input type="file" accept="audio/*" onChange={e => { const f = e.target.files?.[0]; if (f) { if (f.size > 15 * 1024 * 1024) { alert('Audio too large (max 15MB)'); return; } onCustomMusicChange(URL.createObjectURL(f)); } }} className="hidden" />
            <span>{customMusicUrl ? t('fileSelected') : t('uploadLocal')}</span>
          </label>
          {customMusicUrl && <span className="text-xs text-green-400 ml-2">{t('fileReady')}</span>}

          <div className="mt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-white/60" />
              <span className="text-sm">{t('music')}</span>
              <input type="range" min="0" max="100" value={musicVolume} onChange={e => onMusicVolumeChange(Number(e.target.value))}
                className="flex-1 h-1 accent-white" />
              <span className="text-xs text-white/40 w-8">{musicVolume}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-white/60" />
              <span className="text-sm">{t('bgAudio')}</span>
              <input type="range" min="0" max="100" value={bgVolume} onChange={e => onBgVolumeChange(Number(e.target.value))}
                className="flex-1 h-1 accent-white" />
              <span className="text-xs text-white/40 w-8">{bgVolume}%</span>
            </div>
          </div>
        </section>

        {/* Settings Panel */}
        {showSettings && (
          <section className="mb-8 p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
            <h2 className="text-lg font-medium mb-4 flex items-center space-x-2"><Zap className="w-5 h-5" /><span>{t('settings')}</span></h2>
            
            {/* Meditation toggle */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center space-x-2"><Brain className="w-4 h-4 text-purple-400" /><span className="text-sm">{t('meditationToggle')}</span></div>
              <button onClick={() => onSettingsChange({ ...settings, meditationEnabled: !settings.meditationEnabled })}
                className={`w-10 h-5 rounded-full transition-colors ${settings.meditationEnabled ? 'bg-purple-500' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.meditationEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Clock visibility */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center space-x-2"><Clock className="w-4 h-4 text-blue-400" /><span className="text-sm">{t('clockToggle')}</span></div>
              <button onClick={() => onSettingsChange({ ...settings, clockVisible: !settings.clockVisible })}
                className={`w-10 h-5 rounded-full transition-colors ${settings.clockVisible ? 'bg-blue-500' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.clockVisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* End chime */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center space-x-2"><Bell className="w-4 h-4 text-yellow-400" /><span className="text-sm">{t('endChimeToggle')}</span></div>
              <button onClick={() => onSettingsChange({ ...settings, endChimeEnabled: !settings.endChimeEnabled })}
                className={`w-10 h-5 rounded-full transition-colors ${settings.endChimeEnabled ? 'bg-yellow-500' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.endChimeEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Auto-start break */}
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center space-x-2"><Eye className="w-4 h-4 text-green-400" /><span className="text-sm">{t('autoBreakToggle')}</span></div>
              <button onClick={() => onSettingsChange({ ...settings, autoStartBreak: !settings.autoStartBreak })}
                className={`w-10 h-5 rounded-full transition-colors ${settings.autoStartBreak ? 'bg-green-500' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.autoStartBreak ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Break duration */}
            <div className="py-3 border-b border-white/5">
              <span className="text-sm">{t('breakDurationLabel')}</span>
              <div className="flex space-x-2 mt-2">
                {BREAK_DURATIONS.map(d => (
                  <button key={d} onClick={() => onSettingsChange({ ...settings, breakDuration: d })}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${settings.breakDuration === d ? 'bg-white/20 border-white' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    {d} {t('mins')}
                  </button>
                ))}
              </div>
            </div>

            {/* Long break duration */}
            <div className="py-3">
              <span className="text-sm">{t('longBreakDurationLabel')}</span>
              <div className="flex space-x-2 mt-2">
                {LONG_BREAK_DURATIONS.map(d => (
                  <button key={d} onClick={() => onSettingsChange({ ...settings, longBreakDuration: d })}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${settings.longBreakDuration === d ? 'bg-white/20 border-white' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    {d} {t('mins')}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Goal + Timer */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">{t('step3')}</h2>
          <h3 className="text-2xl font-medium mb-4">{t('stepGoal')}</h3>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-sm">{t('stepGoal')}: {dailyGoal.targetMinutes} {t('minutes')}</span>
          </div>
          <input type="range" min="30" max="480" step="30" value={dailyGoal.targetMinutes}
            onChange={e => onDailyGoalChange(Number(e.target.value))}
            className="w-full h-1 accent-white" />
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>30m</span><span>120m</span><span>240m</span><span>360m</span><span>480m</span>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">{t('step4')}</h2>
          <h3 className="text-2xl font-medium mb-4">{t('stepTimer')}</h3>
          <div className="grid grid-cols-4 gap-3">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => onTimerDurationChange(d)}
                className={`py-3 rounded-lg border text-sm transition-all ${timerDuration === d ? 'border-white bg-white/20 font-medium' : 'border-white/15 hover:bg-white/10'}`}>
                {d} {t('minutes')}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <input id="custom-time" type="number" placeholder={t('custom')}
              className="w-full bg-transparent text-center outline-none py-3 text-sm border border-white/10 rounded-lg placeholder:text-white/30"
              onChange={e => { const v = Number(e.target.value); if (v > 0 && v <= 480) onTimerDurationChange(v); }} />
          </div>
        </section>

        {/* Enter button */}
        <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
          <button onClick={onEnter}
            className="w-full py-4 rounded-full bg-white text-black font-semibold text-base hover:bg-white/90 transition-all active:scale-[0.98]">
            {t('enterRoom')}
          </button>
        </div>

        {/* Privacy notice */}
        <div className="text-center pb-4">
          <p className="text-[11px] text-white/20">{t('privacy')}</p>
        </div>
      </main>
    </div>
  );
}