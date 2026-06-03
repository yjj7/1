import { motion } from 'motion/react';
import { X, Music } from 'lucide-react';
import { MUSIC_TRACKS } from '../data';
import { useT } from '../i18n';

interface AudioPanelProps {
  musicId: string;
  onSelectMusic: (id: string) => void;
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  bgVolume: number;
  onBgVolumeChange: (v: number) => void;
  onClose: () => void;
}

export function AudioPanel({
  musicId, onSelectMusic,
  musicVolume, onMusicVolumeChange,
  bgVolume, onBgVolumeChange,
  onClose,
}: AudioPanelProps) {
  const { t } = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="pointer-events-auto absolute right-8 top-32 md:right-24 md:top-40 w-64 p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/15"
    >
      <div className="flex items-center justify-between mb-3">
        <Music className="w-4 h-4 text-white/60" />
        <span className="text-xs font-medium text-white/60">{t('bgAudio')}</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wide">{t('musicSelect')}</div>
        <div className="max-h-32 overflow-y-auto space-y-0.5">
          {MUSIC_TRACKS.slice(0, -2).map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMusic(m.id)}
              className={`w-full text-left text-[11px] px-2 py-1 rounded transition-colors ${musicId === m.id ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'}`}
            >
              {m.title}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-white/40 mb-1">
          <span>🎵 {t('musicVol')}</span>
          <span className="tabular-nums">{musicVolume}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={musicVolume}
          onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
          className="w-full h-1 accent-white/60 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-1">
        <div className="flex justify-between text-[10px] text-white/40 mb-1">
          <span>🌿 {t('bgSound')}</span>
          <span className="tabular-nums">{bgVolume}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={bgVolume}
          onChange={(e) => onBgVolumeChange(Number(e.target.value))}
          className="w-full h-1 accent-white/60 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
      </div>
    </motion.div>
  );
}
