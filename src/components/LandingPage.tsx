import React, { useState } from 'react';
import { BookOpen, ArrowRight, BarChart3, Clock, Flame, Target, Trophy, Globe, HelpCircle, Sparkles, Headphones, Timer, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import landingBg from '../assets/images/premium_landing_bg_1780054955872.png';
import { CinematicBackground } from './CinematicBackground';
import { getDailyQuote } from '../extras';
import { Achievement } from '../types';
import { useT } from '../i18n';
import { detectHoliday } from '../utils';

interface Props {
  onStart: () => void;
  onStats: () => void;
  onHistory: () => void;
  streak: number;
  pomodoroCount: number;
  achievements: Achievement[];
  onOpenGuide: () => void;
}

const glassCard = 'bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-sm';
const container = 'relative z-10 max-w-6xl mx-auto px-6';

const FEATURES = [
  { icon: Sparkles, title: '沉浸场景', desc: '7种精选学习场景，从清晨窗边到深夜书房，选一个让你心静的空间' },
  { icon: Headphones, title: '专注音乐', desc: '古典钢琴、Lo-fi、白噪音… 10+音轨搭配独立音量控制' },
  { icon: Timer, title: '番茄钟', desc: '25/45/50/90分钟灵活选择，冥想引导帮你进入状态' },
  { icon: BarChart3, title: '学习统计', desc: '每日目标追踪、学习热力图、连续打卡激励体系' },
] as const;

const STEPS = [
  { icon: Sparkles, title: '选择场景与音乐', desc: '设置番茄钟时长' },
  { icon: Play, title: '进入沉浸自习室', desc: '开始专注' },
  { icon: BarChart3, title: '记录学习数据', desc: '追踪成长' },
] as const;

export function LandingPage({ onStart, onStats, onHistory, streak, pomodoroCount, achievements, onOpenGuide }: Props) {
  const { t, lang, setLang } = useT();
  const quote = getDailyQuote();
  const earnedCount = achievements.filter((a) => a.earned).length;
  const [showPrivacy, setShowPrivacy] = useState(false);
  const holiday = detectHoliday();

  return (
    <div className="relative min-h-screen w-full flex flex-col text-white overflow-x-hidden font-sans">
      {/* Background */}
      <motion.div
        className="absolute inset-0 z-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <CinematicBackground imageUrl={landingBg} sceneId="landing" />
        <div className="absolute inset-0 bg-black/20" />
      </motion.div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-8 py-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6" />
          <span className="text-xl font-medium tracking-wide">StudyWithMe AI</span>
        </div>
        <nav className="flex items-center space-x-5 text-sm text-white/70">
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === 'zh' ? 'EN' : '中'}</span>
          </button>
          <button
            onClick={onOpenGuide}
            className="hover:text-white transition-colors"
            title={t('helpGuide')}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onStats}
            className="hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('stats')}</span>
          </button>
          <button
            onClick={onHistory}
            className="hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{t('history')}</span>
          </button>
          {earnedCount > 0 && (
            <div className="flex items-center space-x-1.5 text-amber-300">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">
                {earnedCount}/{achievements.length}
              </span>
            </div>
          )}
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        {/* ─── Hero Section ─── */}
        <section className="pt-16 md:pt-28 pb-16 md:pb-24 text-center">
          <div className={container}>
            {holiday && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-sm"
              >
                {holiday.label}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-5 tracking-tight leading-tight"
            >
              让每一次学习都沉浸其中
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 mb-10 max-w-xl mx-auto"
            >
              精选场景 × 专注音乐 × 智能番茄钟
            </motion.p>

            {/* Stats badges */}
            {(streak > 0 || pomodoroCount > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center justify-center space-x-4 mb-10"
              >
                {streak > 0 && (
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-300">
                      {t('streakNDays').replace('N', `${streak}`)}
                    </span>
                  </div>
                )}
                {pomodoroCount > 0 && (
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300">
                      {t('pomodoroCountN').replace('N', `${pomodoroCount}`)}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={onStart}
              className="inline-flex items-center justify-center space-x-3 px-10 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all group shadow-lg shadow-white/10"
            >
              <span className="text-lg">开始专注</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </section>

        {/* ─── Feature Cards ─── */}
        <section className="py-16 md:py-20">
          <div className={container}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10 md:mb-14"
            >
              <span className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
                核心功能
              </span>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`${glassCard} p-6 md:p-7 hover:bg-white/[0.06] transition-colors group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-white/60" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section className="py-16 md:py-20">
          <div className={container}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10 md:mb-14"
            >
              <span className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
                三步开始
              </span>
            </motion.div>
            <div className="max-w-2xl mx-auto space-y-5">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="flex items-center gap-4 md:gap-5 group"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/30 text-xs font-bold">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <Icon className="w-4 h-4 text-white/40" />
                    <div>
                      <h4 className="font-medium text-sm">{title}</h4>
                      <p className="text-xs text-white/40">{desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Achievements (compact) ─── */}
        {earnedCount > 0 && (
          <section className="py-12">
            <div className={container}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className={`${glassCard} p-5 max-w-sm mx-auto text-center`}
              >
                <div className="flex items-center justify-center gap-1.5 text-white/40 text-xs font-medium tracking-wider mb-3">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    已解锁成就 {earnedCount}/{achievements.length}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {achievements
                    .filter((a) => a.earned)
                    .slice(-8)
                    .map((a) => (
                      <span
                        key={a.id}
                        title={`${a.title}: ${a.desc}`}
                        className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-base hover:bg-white/10 transition-colors cursor-default"
                      >
                        {a.icon}
                      </span>
                    ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ─── Quote card ─── */}
        <section className="pb-20 pt-12">
          <div className={container}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className={`${glassCard} p-5 max-w-md mx-auto text-center`}
            >
              <p
                className="text-sm font-light italic text-white/45 mb-2 leading-relaxed"
                style={{ fontFamily: '"STKaiti", "KaiTi", "Noto Serif SC", serif' }}
              >
                "{quote.text}"
              </p>
              <span className="text-xs text-white/25">— {quote.author}</span>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30">
          <span>StudyWithMe AI — 用专注创造价值</span>
          <div className="flex items-center space-x-6">
            <a
              href="mailto:feedback@nuomiyu.qzz.io"
              className="hover:text-white/50 transition-colors"
            >
              {t('feedback')}
            </a>
            <button
              onClick={() => setShowPrivacy(true)}
              className="hover:text-white/50 transition-colors"
            >
              {t('privacy')}
            </button>
          </div>
        </div>
      </footer>

      {/* ─── Privacy Modal ─── */}
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
