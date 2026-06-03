import { useT } from '../i18n';

interface MeditationGuideProps {
  meditationTime: number;
  breatheLabel: 'in' | 'hold' | 'out';
  onSkip: () => void;
}

export function MeditationGuide({ meditationTime, breatheLabel, onSkip }: MeditationGuideProps) {
  const { t } = useT();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${0.03 + Math.sin(meditationTime * 0.5) * 0.02}) 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex items-center justify-center mb-10">
        {/* Outer glow ring */}
        <div
          className={`absolute rounded-full border border-white/10 transition-all duration-[1000ms] ease-in-out ${
            breatheLabel === 'in' ? 'w-80 h-80 opacity-30' :
            breatheLabel === 'hold' ? 'w-88 h-88 opacity-25' :
            'w-80 h-80 opacity-15'
          }`}
          style={{
            boxShadow: breatheLabel === 'in'
              ? '0 0 120px rgba(255,255,255,0.08), inset 0 0 120px rgba(255,255,255,0.03)'
              : breatheLabel === 'hold'
              ? '0 0 160px rgba(255,255,255,0.12), inset 0 0 160px rgba(255,255,255,0.05)'
              : '0 0 80px rgba(255,255,255,0.04), inset 0 0 80px rgba(255,255,255,0.01)',
          }}
        />
        {/* Middle ring */}
        <div
          className={`absolute rounded-full border transition-all duration-[600ms] ${
            breatheLabel === 'in' ? 'w-60 h-60 border-white/15 scale-125' :
            breatheLabel === 'hold' ? 'w-64 h-64 border-white/20 scale-130' :
            'w-60 h-60 border-white/8 scale-100'
          }`}
        />
        {/* Inner circle */}
        <div
          className={`relative w-40 h-40 rounded-full border-2 flex items-center justify-center transition-all duration-[600ms] ${
            breatheLabel === 'in' ? 'border-white/30 bg-white/5 shadow-[0_0_60px_rgba(255,255,255,0.1)]' :
            breatheLabel === 'hold' ? 'border-white/40 bg-white/8 shadow-[0_0_80px_rgba(255,255,255,0.15)]' :
            breatheLabel === 'out' ? 'border-white/20 bg-white/3 shadow-[0_0_30px_rgba(255,255,255,0.05)]' :
            'border-white/25 bg-white/3'
          }`}
        >
          <span
            className={`text-2xl font-light transition-all duration-[600ms] tracking-widest ${
              breatheLabel === 'in' ? 'scale-110 text-white/90' :
              breatheLabel === 'out' ? 'scale-95 text-white/50' :
              'scale-105 text-white/70'
            }`}
            style={{ fontFamily: '"STKaiti", "KaiTi", "Microsoft YaHei", serif' }}
          >
            {breatheLabel === 'in' ? t('breatheIn') : breatheLabel === 'hold' ? t('hold') : t('breatheOut')}
          </span>
        </div>
      </div>

      <span
        className="text-[5rem] font-thin text-white/80 tabular-nums mb-8"
        style={{ textShadow: '0 0 80px rgba(255,255,255,0.15)' }}
      >
        {meditationTime}
      </span>

      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={onSkip}
          className="px-8 py-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 transition-all text-sm tracking-wide"
        >
          {t('startFocus')}
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          {t('startStudying')}
        </button>
      </div>
    </div>
  );
}
