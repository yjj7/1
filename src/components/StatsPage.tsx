import React, { useMemo } from 'react';
import { BookOpen, ArrowLeft, Flame, Target, TrendingUp, Calendar, Clock, Award } from 'lucide-react';
import { StudySession, DailyGoal } from '../types';

interface StatsPageProps {
  studyHistory: StudySession[];
  dailyGoal: DailyGoal;
  streak: number;
  pomodoroCount: number;
  onBack: () => void;
}

export function StatsPage({ studyHistory, dailyGoal, streak, pomodoroCount, onBack }: StatsPageProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const totalMinutes = studyHistory.reduce((s, h) => s + h.duration, 0) / 60;
    const totalTasks = studyHistory.reduce((s, h) => s + h.tasksCompleted, 0);
    const thisWeek = studyHistory.filter(s => {
      const d = new Date(s.date);
      return (now.getTime() - d.getTime()) < 7 * 86400000;
    });
    const weekMinutes = thisWeek.reduce((s, h) => s + h.duration, 0) / 60;

    // Heatmap data (last 12 weeks)
    const heatmap: { date: string; minutes: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const daySessions = studyHistory.filter(s => s.date.slice(0, 10) === dateStr);
      const minutes = daySessions.reduce((s, h) => s + h.duration, 0) / 60;
      heatmap.push({ date: dateStr, minutes });
    }

    // Daily breakdown (last 7 days)
    const daily: { label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const daySessions = studyHistory.filter(s => s.date.slice(0, 10) === dateStr);
      const minutes = daySessions.reduce((s, h) => s + h.duration, 0) / 60;
      const label = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      daily.push({ label, minutes });
    }
    const maxDaily = Math.max(...daily.map(d => d.minutes), 1);

    return { totalMinutes, totalTasks, weekMinutes, heatmap, daily, maxDaily };
  }, [studyHistory]);

  const todayMinutes = studyHistory
    .filter(s => s.date.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((s, h) => s + h.duration, 0) / 60;
  const goalProgress = Math.min(100, (todayMinutes / dailyGoal.targetMinutes) * 100);

  const heatColor = (m: number) => {
    if (m === 0) return 'bg-white/5';
    if (m < 15) return 'bg-green-900/60';
    if (m < 30) return 'bg-green-700/70';
    if (m < 60) return 'bg-green-500/80';
    return 'bg-green-400';
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      <header className="relative z-10 flex items-center px-6 md:px-10 py-4">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mr-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <BookOpen className="w-5 h-5 mr-3" />
        <span className="text-lg font-medium tracking-wide">学习统计</span>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-10 pb-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Clock className="w-5 h-5 text-blue-400" />, label: '总学习时长', value: `${Math.floor(stats.totalMinutes / 60)}h ${Math.round(stats.totalMinutes % 60)}m` },
            { icon: <Target className="w-5 h-5 text-green-400" />, label: '完成番茄', value: `${pomodoroCount}` },
            { icon: <Flame className="w-5 h-5 text-orange-400" />, label: '连续打卡', value: `${streak} 天` },
            { icon: <TrendingUp className="w-5 h-5 text-purple-400" />, label: '本周学习', value: `${Math.round(stats.weekMinutes)} min` },
          ].map((card, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-2 mb-2">{card.icon}<span className="text-xs text-white/50">{card.label}</span></div>
              <div className="text-2xl font-light">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Daily Goal Progress */}
        <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2"><Target className="w-5 h-5 text-green-400" /><span className="text-lg font-medium">今日目标</span></div>
            <span className="text-sm text-white/60">{Math.round(todayMinutes)} / {dailyGoal.targetMinutes} 分钟</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${goalProgress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>{Math.round(goalProgress)}% 完成</span>
            <span>{goalProgress >= 100 ? '🎉 目标达成！' : `还需 ${Math.round(dailyGoal.targetMinutes - todayMinutes)} 分钟`}</span>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 mb-8">
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2"><Calendar className="w-5 h-5 text-blue-400" /><span>本周学习</span></h3>
          <div className="flex items-end justify-between h-32 space-x-2">
            {stats.daily.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <span className="text-[10px] text-white/40 mb-1">{Math.round(day.minutes)}m</span>
                <div className="w-full bg-white/5 rounded-t-lg relative" style={{ height: '100%' }}>
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(day.minutes / stats.maxDaily) * 100}%` }} />
                </div>
                <span className="text-xs text-white/60 mt-2">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2"><Award className="w-5 h-5 text-yellow-400" /><span>学习热力图（近 12 周）</span></h3>
          <div className="flex flex-wrap gap-1">
            {stats.heatmap.map((day, i) => (
              <div key={i} title={`${day.date}: ${Math.round(day.minutes)} 分钟`}
                className={`w-3 h-3 rounded-sm ${heatColor(day.minutes)} transition-colors`} />
            ))}
          </div>
          <div className="flex items-center justify-end space-x-1 mt-3 text-[10px] text-white/40">
            <span>少</span>
            {['bg-white/5', 'bg-green-900/60', 'bg-green-700/70', 'bg-green-500/80', 'bg-green-400'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>多</span>
          </div>
        </div>
      </main>
    </div>
  );
}
