import React, { useMemo } from 'react';
import { ArrowLeft, BarChart3, Clock, Flame, CalendarDays, Award } from 'lucide-react';
import { StudySession, DailyGoal, Achievement } from '../types';
import { useT } from '../i18n';

interface Props {
  studyHistory: StudySession[];
  dailyGoal: DailyGoal;
  streak: number;
  pomodoroCount: number;
  achievements: Achievement[];
  onBack: () => void;
}

export function StatsPage({ studyHistory, streak, pomodoroCount, achievements, onBack }: Props) {
  const { t } = useT();

  const stats = useMemo(() => {
    const now = new Date();
    const totalHours = studyHistory.reduce((s, h) => s + h.duration, 0) / 3600;

    const thisWeek = studyHistory.filter(s => (now.getTime() - new Date(s.date).getTime()) < 7 * 86400000);
    const weekHours = thisWeek.reduce((s, h) => s + h.duration, 0) / 3600;

    const byDate = new Map<string, number>();
    studyHistory.forEach(s => {
      const ds = s.date.slice(0, 10);
      byDate.set(ds, (byDate.get(ds) || 0) + s.duration);
    });

    const daily: { label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      daily.push({ label: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()], minutes: (byDate.get(ds) || 0) / 60 });
    }

    const maxDaily = Math.max(1, ...daily.map(d => d.minutes));

    const heatmap: { date: string; minutes: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      heatmap.push({ date: ds, minutes: (byDate.get(ds) || 0) / 60 });
    }

    return { totalHours, weekHours, daily, maxDaily, heatmap };
  }, [studyHistory]);

  const heatmapColor = (m: number) =>
    m === 0 ? 'bg-white/5' : m < 15 ? 'bg-amber-900/40' : m < 30 ? 'bg-amber-700/60' : m < 60 ? 'bg-amber-500/70' : 'bg-amber-400';

  const formatHours = (h: number) => {
    const mins = Math.round(h * 60);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
  };

  const summaryCards = [
    { icon: <Clock className="w-4 h-4 text-[#C8A96E]" />, label: t('totalTime'), value: formatHours(stats.totalHours) },
    { icon: <span className="text-sm">🍅</span>, label: t('pomodoros'), value: String(pomodoroCount) },
    { icon: <Flame className="w-4 h-4 text-[#C8A96E]" />, label: t('streakDays'), value: `${streak} ${t('day')}` },
    { icon: <CalendarDays className="w-4 h-4 text-[#C8A96E]" />, label: t('weekStudy'), value: formatHours(stats.weekHours) },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-950 via-black to-gray-950" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mr-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <BarChart3 className="w-5 h-5 text-[#C8A96E] mr-2" />
          <h1 className="text-xl font-medium tracking-wide">{t('studyStats')}</h1>
        </header>

        {/* Summary Cards – 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {summaryCards.map((card, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <span className="text-xs text-white/50">{card.label}</span>
              </div>
              <div className="text-xl font-light text-white/90">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Weekly Bar Chart – horizontal bars */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-4">{t('weekStudy')}</h3>
          <div className="space-y-2">
            {stats.daily.map((day, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 text-xs text-white/50 text-right">{day.label}</span>
                <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(day.minutes / stats.maxDaily) * 100}%`,
                      background: 'linear-gradient(90deg, rgba(200,169,110,0.3), rgba(200,169,110,0.85))',
                    }}
                  />
                </div>
                <span className="w-11 text-right text-xs text-white/40 tabular-nums">{Math.round(day.minutes)}m</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap – 12 week grid */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-medium text-white/70 mb-4">{t('heatmap')}</h3>
          <div className="flex flex-wrap gap-1">
            {stats.heatmap.map(day => (
              <div
                key={day.date}
                title={`${day.date}: ${Math.round(day.minutes)} ${t('mins')}`}
                className={`w-3 h-3 rounded-sm ${heatmapColor(day.minutes)}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-white/30">
            <span>少</span>
            {['bg-white/5', 'bg-amber-900/40', 'bg-amber-700/60', 'bg-amber-500/70', 'bg-amber-400'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>多</span>
          </div>
        </div>

        {/* Achievements – compact icon grid */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C8A96E]" />
            {t('latestAchievements')}
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {achievements.map(a => (
              <div
                key={a.id}
                title={a.earned ? `${a.title}: ${a.desc}` : t('locked')}
                className={`p-3 rounded-xl text-center flex flex-col items-center ${
                  a.earned ? 'bg-white/[0.04] border border-white/10' : 'bg-white/[0.01] border border-white/5 opacity-30'
                }`}
              >
                <span className="text-xl mb-1">{a.earned ? a.icon : '🔒'}</span>
                <span className="text-[10px] text-white/40 leading-tight">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
