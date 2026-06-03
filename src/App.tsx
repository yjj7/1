import { useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type { Achievement } from './types';
import { useStudyStore } from './store';
import { MainPage } from './components/MainPage';
import { StatsPage } from './components/StatsPage';
import { HistoryPage } from './components/HistoryPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingGuide } from './components/OnboardingGuide';
import { LangProvider } from './i18n';
import { checkAchievements, ACHIEVEMENTS, AchievementCtx } from './extras';

function AppShell() {
  const navigate = useNavigate();
  const store = useStudyStore();
  const earnedRef = useRef(store.earnedAchievements);
  earnedRef.current = store.earnedAchievements;

  // Achievement checking
  useEffect(() => {
    const totalMinutes = store.studyHistory.reduce((s, h) => s + h.duration, 0) / 60;
    const ctx: AchievementCtx = {
      totalMinutes, pomodoroCount: store.pomodoroCount, streak: store.streak,
      sessions: store.studyHistory, sessionCount: store.studyHistory.length,
    };
    const earned = checkAchievements(ctx).map(a => a.id);
    earned.filter(id => !earnedRef.current.includes(id)).forEach(id => store.earnAchievement(id));
  }, [store.studyHistory, store.pomodoroCount, store.streak]);

  // Streak calculation
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySessions = store.studyHistory.filter(s => s.date.slice(0, 10) === today);
    const totalMinutes = todaySessions.reduce((s, h) => s + h.duration, 0) / 60;
    if (todaySessions.length === 0 || totalMinutes < store.dailyGoal.targetMinutes) return;
    const lastDur = (todaySessions[todaySessions.length - 1]?.duration || 0) / 60;
    if (totalMinutes - lastDur >= store.dailyGoal.targetMinutes) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const yMin = store.studyHistory.filter(s => s.date.slice(0, 10) === yesterday).reduce((s, h) => s + h.duration, 0) / 60;
    store.updateStreak(yMin >= store.dailyGoal.targetMinutes ? store.streak + 1 : 1);
  }, [store.studyHistory, store.dailyGoal]);

  // Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js').catch(e => console.error('SW registration failed:', e));
  }, []);

  const achievements: Achievement[] = useMemo(
    () => ACHIEVEMENTS.map(a => ({
      id: a.id, title: a.title, desc: a.desc, icon: a.icon,
      earned: store.earnedAchievements.includes(a.id),
    })),
    [store.earnedAchievements]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white selection:bg-white/30">
        <OnboardingGuide isOpen={store.showOnboarding} onClose={() => store.dismissOnboarding()} />
        <Routes>
          <Route path="/" element={
            <MainPage
              onStats={() => navigate('/stats')}
              onHistory={() => navigate('/history')}
              streak={store.streak}
              pomodoroCount={store.pomodoroCount}
              achievements={achievements}
              onOpenGuide={() => useStudyStore.setState({ showOnboarding: true })}
            />
          } />
          <Route path="/stats" element={
            <StatsPage
              studyHistory={store.studyHistory} dailyGoal={store.dailyGoal}
              streak={store.streak} pomodoroCount={store.pomodoroCount}
              achievements={achievements} onBack={() => navigate('/')}
            />
          } />
          <Route path="/history" element={
            <HistoryPage
              studyHistory={store.studyHistory} onBack={() => navigate('/')}
              onClearHistory={() => useStudyStore.setState({ studyHistory: [], streak: 0, pomodoroCount: 0 })}
            />
          } />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </LangProvider>
  );
}
