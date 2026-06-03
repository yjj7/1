import React, { useState } from 'react';
import { BookOpen, ArrowRight, BarChart3, Clock, Flame, Target, Trophy, Globe, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import landingBg from '../assets/images/premium_landing_bg_1780054955872.png';
import { CinematicBackground } from './CinematicBackground';
import { getDailyQuote } from '../extras';
import { Achievement } from '../types';
import { useT } from '../i18n';

interface Props {
  onStart: () => void;
  onStats: () => void;
  onHistory: () => void;
  streak: number;
  pomodoroCount: number;
  holiday: { id: string; label: string; emoji: string } | null;
  achievements: Achievement[];
  onOpenGuide: () => void;
}

export function LandingPage({ onStart, onStats, onHistory, streak, pomodoroCount, holiday, achievements, onOpenGuide }: Props) {
  const { t, lang, setLang } = useT();
  const quote = getDailyQuote();
  const earnedCount = achievements.filter(a => a.earned).length;
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex flex-col text-white overflow-hidden font-sans">
      <motion.div className="absolute inset-0 z-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
        <CinematicBackground imageUrl={landingBg} sceneId="landing" />
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply z-10" />
      </motion.div>

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-3"><BookOpen className="w-6 h-6" /><span className="text-xl font-medium tracking-wide">StudyWithMe AI</span></div>
        <nav className="flex items-center space-x-6 text-sm text-white/70">
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="hover:text-white transition-colors flex items-center space-x-1.5"><Globe className="w-4 h-4" /><span>{lang === 'zh' ? 'EN' : '中'}</span></button>
          <button onClick={onOpenGuide} className="hover:text-white transition-colors" title={t('helpGuide')}><HelpCircle className="w-4 h-4" /></button>
          <button onClick={onStats} className="hover:text-white transition-colors flex items-center space-x-1.5"><BarChart3 className="w-4 h-4" /><span>{t('stats')}</span></button>
          <button onClick={onHistory} className="hover:text-white transition-colors flex items-center space-x-1.5"><Clock className="w-4 h-4" /><span>{t('history')}</span></button>
          {earnedCount > 0 && <div className="flex items-center space-x-1.5 text-amber-300"><Trophy className="w-4 h-4" /><span>{earnedCount}/{achievements.length}</span></div>}
        </nav>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="max-w-3xl w-full p-12 md:p-16 rounded-[3rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl text-center flex flex-col items-center">

          <div className="text-sm font-medium tracking-[0.2em] text-white/70 mb-4 uppercase">{t('tagline')}</div>
          {holiday && <div className="mb-4 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-sm">{holiday.label}</div>}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">{t('hero')}</h1>
          <p className="text-lg md:text-xl text-white/80 mb-6 max-w-xl font-light leading-relaxed">{t('heroSub')}</p>

          {/* Daily Quote */}
          <div className="mb-8 py-4 px-6 rounded-2xl bg-white/[0.02] border border-white/5 max-w-md">
            <p className="text-base font-light italic text-white/60 mb-2" style={{ fontFamily: '"STKaiti", "KaiTi", "Noto Serif SC", serif' }}>{quote.text}</p>
            <span className="text-xs text-white/30">— {quote.author}</span>
          </div>

          {(streak > 0 || pomodoroCount > 0) && (
            <div className="flex items-center space-x-6 mb-8">
              {streak > 0 && <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30"><Flame className="w-4 h-4 text-orange-400" /><span className="text-sm text-orange-300">{t('streakNDays').replace('N', `${streak}`)}</span></div>}
              {pomodoroCount > 0 && <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30"><Target className="w-4 h-4 text-green-400" /><span className="text-sm text-green-300">{t('pomodoroCountN').replace('N', `${pomodoroCount}`)}</span></div>}
            </div>
          )}

          {/* Achievement badges */}
          {earnedCount > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-sm">
              {achievements.filter(a => a.earned).slice(-6).map(a => (
                <span key={a.id} title={`${a.title}: ${a.desc}`} className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-lg hover:bg-white/10 transition-colors cursor-default">{a.icon}</span>
              ))}
            </div>
          )}

          <button onClick={onStart} className="flex items-center justify-center space-x-2 px-10 py-5 rounded-full border border-white/20 bg-white/[0.05] hover:bg-white/10 transition-all group w-fit shadow-lg shadow-white/5">
            <span className="text-lg">{t('startBtn')}</span><ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </main>

      <footer className="relative z-10 py-6 px-8 md:px-24 border-t border-white/10 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <span>{t('copyright')}</span>
          <div className="flex items-center space-x-6">
            <a href="mailto:feedback@nuomiyu.qzz.io" className="hover:text-white/70 transition-colors">{t('feedback')}</a>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-white/70 transition-colors">{t('privacy')}</button>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              className="max-w-md w-full mx-4 p-8 rounded-3xl bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">{t('privacyTitle')}</h2>
              <p className="text-white/70 leading-relaxed mb-6">{t('privacyText')}</p>
              <button
                onClick={() => setShowPrivacy(false)}
                className="px-6 py-2.5 rounded-full bg-white/[0.1] border border-white/10 hover:bg-white/20 transition-all text-sm"
              >
                {t('privacyClose')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
