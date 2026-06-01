import React, { useMemo, useRef } from 'react';
import { BookOpen, ArrowLeft, Flame, Target, TrendingUp, Calendar, Clock, Award, Download, Trophy } from 'lucide-react';
import { StudySession, DailyGoal, Achievement } from '../types';
import { analyzeTimeSlots } from '../extras';
import { useT } from '../i18n';

interface Props {
  studyHistory: StudySession[];
  dailyGoal: DailyGoal;
  streak: number;
  pomodoroCount: number;
  achievements: Achievement[];
  onBack: () => void;
}

export function StatsPage({ studyHistory, dailyGoal, streak, pomodoroCount, achievements, onBack }: Props) {
  const { t } = useT();
  const cardRef = useRef<HTMLDivElement>(null);
  const earnedCount = achievements.filter(a => a.earned).length;

  const stats = useMemo(() => {
    const now = new Date();
    const totalMinutes = studyHistory.reduce((s, h) => s + h.duration, 0) / 60;
    const totalTasks = studyHistory.reduce((s, h) => s + h.tasksCompleted, 0);
    const thisWeek = studyHistory.filter(s => (now.getTime() - new Date(s.date).getTime()) < 7 * 86400000);
    const weekMinutes = thisWeek.reduce((s, h) => s + h.duration, 0) / 60;
    const timeSlots = analyzeTimeSlots(studyHistory);

    // Heatmap
    const heatmap: { date: string; minutes: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      heatmap.push({ date: ds, minutes: studyHistory.filter(s => s.date.slice(0, 10) === ds).reduce((sm, h) => sm + h.duration, 0) / 60 });
    }

    // Daily breakdown
    const daily: { label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      daily.push({ label: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()], minutes: studyHistory.filter(s => s.date.slice(0, 10) === ds).reduce((sm, h) => sm + h.duration, 0) / 60 });
    }

    return { totalMinutes, totalTasks, weekMinutes, timeSlots, heatmap, daily, maxDaily: Math.max(1, ...daily.map(d => d.minutes)) };
  }, [studyHistory]);

  const todayMinutes = studyHistory.filter(s => s.date.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((sm, h) => sm + h.duration, 0) / 60;
  const goalProgress = Math.min(100, (todayMinutes / dailyGoal.targetMinutes) * 100);
  const hc = (m: number) => m === 0 ? 'bg-white/5' : m < 15 ? 'bg-green-900/60' : m < 30 ? 'bg-green-700/70' : m < 60 ? 'bg-green-500/80' : 'bg-green-400';

  const exportPNG = async () => {
    if (!cardRef.current) return;
    try {
      // Use native canvas to draw report card
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.roundRect(20, 20, 760, 560, 24); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('StudyWithMe AI 学习报告', 60, 80);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '16px sans-serif'; ctx.fillText(new Date().toISOString().slice(0, 10), 60, 110);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(60, 140, 680, 1);
      const rows: [string, string, string][] = [
        ['总学习时长', `${Math.floor(stats.totalMinutes / 60)}h ${Math.round(stats.totalMinutes % 60)}m`, '#60a5fa'],
        ['完成番茄', `${pomodoroCount}`, '#4ade80'], ['连续打卡', `${streak} 天`, '#fb923c'],
        ['本周学习', `${Math.round(stats.weekMinutes)} 分钟`, '#a78bfa'], ['今日进度', `${Math.round(goalProgress)}%`, '#f472b6'],
      ];
      rows.forEach(([l, v, c], i) => {
        const y = 190 + i * 60;
        ctx.fillStyle = c!; ctx.font = '14px sans-serif'; ctx.fillText(l!, 80, y);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.fillText(v!, 80, y + 28);
      });
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '12px sans-serif'; ctx.fillText('nuomiyu.qzz.io • StudyWithMe AI', 60, 550);
      const link = document.createElement('a');
      link.download = `studywithme-report-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { alert('导出失败，请稍后再试'); }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-y-auto" ref={cardRef}>
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mr-4"><ArrowLeft className="w-5 h-5" /></button>
          <BookOpen className="w-5 h-5 mr-3" /><span className="text-lg font-medium tracking-wide">{t('studyStats')}</span>
        </div>
        <button onClick={exportPNG} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"><Download className="w-3.5 h-3.5" /><span>{t('exportReport')}</span></button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-10 pb-12">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ i: <Clock className="w-5 h-5 text-blue-400" />, l: t('totalTime'), v: `${Math.floor(stats.totalMinutes / 60)}h ${Math.round(stats.totalMinutes % 60)}m` }, { i: <Target className="w-5 h-5 text-green-400" />, l: t('pomodoros'), v: `${pomodoroCount}` }, { i: <Flame className="w-5 h-5 text-orange-400" />, l: t('streakDays'), v: `${streak} 天` }, { i: <TrendingUp className="w-5 h-5 text-purple-400" />, l: t('weekStudy'), v: `${Math.round(stats.weekMinutes)} min` }].map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/10"><div className="flex items-center space-x-2 mb-2">{c.i}<span className="text-xs text-white/50">{c.l}</span></div><div className="text-2xl font-light">{c.v}</div></div>
          ))}
        </div>

        {/* Achievements */}
        {earnedCount > 0 && (
          <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 mb-8">
            <h3 className="text-lg font-medium mb-4 flex items-center space-x-2"><Trophy className="w-5 h-5 text-amber-400" /><span>成就 ({earnedCount}/{achievements.length})</span></h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {achievements.map(a => (
                <div key={a.id} title={a.earned ? `${a.title}: ${a.desc}` : '尚未解锁'} className={`p-3 rounded-xl text-center transition-all flex flex-col items-center ${a.earned ? 'bg-white/[0.03] border border-white/15' : 'bg-white/[0.01] border border-white/5 opacity-30'}`}>
                  <span className="text-2xl mb-1">{a.earned ? a.icon : '🔒'}</span>
                  <span className="text-[10px] text-white/60">{a.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Goal */}
        <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-2"><Target className="w-5 h-5 text-green-400" /><span className="text-lg font-medium">今日目标</span></div><span className="text-sm text-white/60">{Math.round(todayMinutes)} / {dailyGoal.targetMinutes} 分钟</span></div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2"><div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${goalProgress}%` }} /></div>
          <div className="flex justify-between text-xs text-white/40"><span>{Math.round(goalProgress)}%</span><span>{goalProgress >= 100 ? '🎉 达成！' : `还需 ${Math.round(dailyGoal.targetMinutes - todayMinutes)} 分钟`}</span></div>
        </div>

        {/* Focus Time Analysis */}
        <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 mb-8">
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2"><Clock className="w-5 h-5 text-purple-400" /><span>专注时段分析</span></h3>
          <div className="space-y-3">
            {stats.timeSlots.map(slot => (
              <div key={slot.label} className="flex items-center space-x-3">
                <span className="text-sm text-white/60 w-20 flex-shrink-0">{slot.label}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all" style={{ width: `${Math.min(100, slot.hours * 10)}%` }} />
                </div>
                <span className="text-xs text-white/40 w-20 text-right">{Math.round(slot.hours * 60)} 分钟</span>
              </div>
            ))}
          </div>
          {stats.timeSlots.every(s => s.hours === 0) && <p className="text-xs text-white/30 mt-4">完成学习后会自动显示你最高效的时间段</p>}
        </div>

        {/* Weekly */}
        <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 mb-8">
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2"><Calendar className="w-5 h-5 text-blue-400" /><span>本周学习</span></h3>
          <div className="flex items-end justify-between h-32 space-x-2">
            {stats.daily.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center"><span className="text-[10px] text-white/40 mb-1">{Math.round(day.minutes)}m</span><div className="w-full bg-white/5 rounded-t-lg relative" style={{ height: '100%' }}><div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all duration-500" style={{ height: `${(day.minutes / stats.maxDaily) * 100}%` }} /></div><span className="text-xs text-white/60 mt-2">{day.label}</span></div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2"><Award className="w-5 h-5 text-yellow-400" /><span>学习热力图（近 12 周）</span></h3>
          <div className="flex flex-wrap gap-1">{stats.heatmap.map((day, i) => <div key={i} title={`${day.date}: ${Math.round(day.minutes)} 分钟`} className={`w-3 h-3 rounded-sm ${hc(day.minutes)} transition-colors`} />)}</div>
          <div className="flex items-center justify-end space-x-1 mt-3 text-[10px] text-white/40"><span>少</span>{['bg-white/5', 'bg-green-900/60', 'bg-green-700/70', 'bg-green-500/80', 'bg-green-400'].map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}<span>多</span></div>
        </div>
      </main>
    </div>
  );
}
