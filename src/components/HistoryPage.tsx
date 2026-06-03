import React from 'react';
import { ArrowLeft, Clock, Trash2 } from 'lucide-react';
import { StudySession } from '../types';
import { useT } from '../i18n';

const SCENE_EMOJI: Record<string, string> = {
  morning_window: '🌅', rainy_cafe: '🌧️', night_library: '📚',
  seaside_study: '🌊', deep_night_desk: '💻', forest_cabin: '🌲', city_skyline: '🌆',
};

interface HistoryPageProps {
  studyHistory: StudySession[];
  onBack: () => void;
  onClearHistory: () => void;
}

export function HistoryPage({ studyHistory, onBack, onClearHistory }: HistoryPageProps) {
  const { t } = useT();

  const grouped = studyHistory.reduce<Record<string, StudySession[]>>((acc, s) => {
    const date = s.date.slice(0, 10);
    (acc[date] ??= []).push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalSessions = studyHistory.length;
  const totalHours = totalSessions > 0
    ? Math.round(studyHistory.reduce((s, h) => s + h.duration, 0) / 360) / 10
    : 0;

  const formatDate = (d: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (d === today) return t('today');
    if (d === yesterday) return t('yesterday');
    const date = new Date(d);
    return `${date.getMonth() + 1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]}`;
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-950 via-black to-gray-950" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mr-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Clock className="w-5 h-5 text-[#C8A96E] mr-2" />
          <h1 className="text-xl font-medium tracking-wide">{t('studyHistory')}</h1>
        </header>

        {studyHistory.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
              <Clock className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 text-base mb-1">{t('noRecords')}</p>
            <p className="text-sm text-white/25">{t('autoRecord')}</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
              <div className="flex-1 text-center">
                <div className="text-2xl font-light text-[#C8A96E]">{totalSessions}</div>
                <div className="text-xs text-white/40 mt-1">{t('totalSessions')}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex-1 text-center">
                <div className="text-2xl font-light text-[#C8A96E]">{totalHours}h</div>
                <div className="text-xs text-white/40 mt-1">{t('totalTime')}</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              {sortedDates.map(date => {
                const sessions = grouped[date];
                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96E]" />
                      <span className="text-sm font-medium text-white/60">{formatDate(date)}</span>
                      <span className="text-xs text-white/30">{sessions.length} 次</span>
                    </div>
                    {sessions.map(s => {
                      const emoji = SCENE_EMOJI[s.sceneId] || '📖';
                      return (
                        <div key={s.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{emoji}</span>
                            <div>
                              <div className="text-sm text-white/80">
                                {Math.round(s.duration / 60)} {t('mins')}
                                <span className="text-white/30 mx-1">·</span>
                                {s.tasksCompleted}/{s.tasksTotal} {t('tasksDone')}
                              </div>
                              <div className="text-[11px] text-white/30 mt-0.5">
                                {new Date(s.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                {s.timerMode === 'stopwatch' ? ` · ${t('stopwatchMode')}` : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Clear button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => { if (confirm(t('clearConfirm'))) onClearHistory(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('clearHistory')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
