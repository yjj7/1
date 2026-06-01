import React from 'react';
import { BookOpen, ArrowLeft, Clock, Trash2, Calendar, Target } from 'lucide-react';
import { StudySession } from '../types';
import { SCENES } from '../data';
import { useT } from '../i18n';

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

  const formatDate = (d: string) => {
    const date = new Date(d);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (d === today) return t('today');
    if (d === yesterday) return t('yesterday');
    return `${date.getMonth() + 1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]}`;
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mr-4">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <BookOpen className="w-5 h-5 mr-3" />
          <span className="text-lg font-medium tracking-wide">{t('historyTitle')}</span>
        </div>
        {studyHistory.length > 0 && (
          <button onClick={() => { if (confirm(t('clearConfirm'))) onClearHistory(); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /><span>{t('clear')}</span>
          </button>
        )}
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 md:px-10 pb-12">
        {studyHistory.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">{t('noRecords')}</p>
            <p className="text-sm text-white/25 mt-1">{t('autoRecord')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => {
              const sessions = grouped[date];
              const totalMin = Math.round(sessions.reduce((s, h) => s + h.duration, 0) / 60);
              const totalTasks = sessions.reduce((s, h) => s + h.tasksCompleted, 0);
              return (
                <div key={date} className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02]">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span className="text-sm font-medium">{formatDate(date)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-white/50">
                      <span>{totalMin} {t('mins')}</span>
                      <span className="flex items-center space-x-1"><Target className="w-3 h-3" /><span>{totalTasks} {t('tasksDone')}</span></span>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {sessions.map(s => {
                      const scene = SCENES.find(sc => sc.id === s.sceneId);
                      return (
                        <div key={s.id} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                              {scene && <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <span className="text-sm">{scene?.title || t('unknownScene')}</span>
                              <div className="text-[11px] text-white/40">
                                {new Date(s.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                {s.timerMode === 'stopwatch' ? ` · ${t('stopwatchMode')}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm">{Math.round(s.duration / 60)} {t('mins')}</span>
                            <div className="text-[11px] text-white/40">{s.tasksCompleted}/{s.tasksTotal} {t('tasksDone')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}