import { PomodoroPhase, Task, StudySession, TimerMode } from './types';
import { SCENES } from './data';

// ============ 成就系统 ============
export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  check: (ctx: AchievementCtx) => boolean;
}

export interface AchievementCtx {
  totalMinutes: number;
  pomodoroCount: number;
  streak: number;
  sessions: StudySession[];
  sessionCount: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_pomodoro', title: '初次专注', desc: '完成第一个番茄钟', icon: '🍅', check: (c) => c.pomodoroCount >= 1 },
  { id: 'ten_pomodoros', title: '专注学徒', desc: '完成 10 个番茄钟', icon: '⭐', check: (c) => c.pomodoroCount >= 10 },
  { id: 'fifty_pomodoros', title: '专注达人', desc: '完成 50 个番茄钟', icon: '🌟', check: (c) => c.pomodoroCount >= 50 },
  { id: 'hundred_pomodoros', title: '专注大师', desc: '完成 100 个番茄钟', icon: '💎', check: (c) => c.pomodoroCount >= 100 },
  { id: 'bronze', title: '青铜学者', desc: '累计学习 10 小时', icon: '🥉', check: (c) => c.totalMinutes >= 600 },
  { id: 'silver', title: '白银学者', desc: '累计学习 50 小时', icon: '🥈', check: (c) => c.totalMinutes >= 3000 },
  { id: 'gold', title: '黄金学者', desc: '累计学习 100 小时', icon: '🥇', check: (c) => c.totalMinutes >= 6000 },
  { id: 'diamond', title: '钻石学者', desc: '累计学习 500 小时', icon: '💠', check: (c) => c.totalMinutes >= 30000 },
  { id: 'streak3', title: '连续三天', desc: '连续 3 天达标', icon: '🔥', check: (c) => c.streak >= 3 },
  { id: 'streak7', title: '一周坚持', desc: '连续 7 天达标', icon: '🔥🔥', check: (c) => c.streak >= 7 },
  { id: 'streak30', title: '月度冠军', desc: '连续 30 天达标', icon: '🔥🔥🔥', check: (c) => c.streak >= 30 },
  { id: 'all_scenes', title: '场景探险家', desc: '用过所有场景', icon: '🗺️', check: (c) => SCENES.every(s => c.sessions.some(ss => ss.sceneId === s.id)) },
  { id: 'early_bird', title: '早起鸟儿', desc: '早上 6 点前完成学习', icon: '🐦', check: (c) => c.sessions.some(s => new Date(s.date).getHours() < 6) },
  { id: 'night_owl', title: '夜猫子', desc: '凌晨 12 点后还在学习', icon: '🦉', check: (c) => c.sessions.some(s => new Date(s.date).getHours() >= 0 && new Date(s.date).getHours() < 2) },
];

export function checkAchievements(ctx: AchievementCtx): AchievementDef[] {
  return ACHIEVEMENTS.filter(a => a.check(ctx));
}

// ============ 名言系统 ============
export const QUOTES = [
  { text: '千里之行，始于足下。', author: '老子' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: '业精于勤，荒于嬉。', author: '韩愈' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: '书中自有黄金屋，书中自有颜如玉。', author: '赵恒' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: '读书破万卷，下笔如有神。', author: '杜甫' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: '学无止境。', author: '荀子' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
  { text: '天行健，君子以自强不息。', author: '周易' },
  { text: 'Every moment is a fresh beginning.', author: 'T.S. Eliot' },
  { text: '少壮不努力，老大徒伤悲。', author: '汉乐府' },
  { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
  { text: '不经一番寒彻骨，怎得梅花扑鼻香。', author: '黄檗禅师' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
];

export function getDailyQuote() {
  const today = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed = ((seed << 5) - seed) + today.charCodeAt(i);
  return QUOTES[Math.abs(seed) % QUOTES.length];
}

// ============ 计划表 ============
export interface WeekPlanSlot {
  dayIndex: number; // 0=Sun, 1=Mon, ...
  hour: number;     // 0-23
  minute: number;   // 0-59
  label: string;
  enabled: boolean;
}

// ============ 中期分析 ============
export interface TimeSlotAnalysis {
  label: string;
  hours: number;
  sessions: number;
  avgMinutes: number;
}

export function analyzeTimeSlots(sessions: StudySession[]): TimeSlotAnalysis[] {
  const slots: { label: string; range: [number, number] }[] = [
    { label: '凌晨 0-6', range: [0, 6] },
    { label: '早晨 6-9', range: [6, 9] },
    { label: '上午 9-12', range: [9, 12] },
    { label: '下午 12-18', range: [12, 18] },
    { label: '晚上 18-22', range: [18, 22] },
    { label: '深夜 22-24', range: [22, 24] },
  ];
  return slots.map(slot => {
    const slotSessions = sessions.filter(s => {
      const h = new Date(s.date).getHours();
      return h >= slot.range[0] && h < slot.range[1];
    });
    return {
      label: slot.label,
      hours: slotSessions.reduce((sum, s) => sum + s.duration, 0) / 3600,
      sessions: slotSessions.length,
      avgMinutes: slotSessions.length ? (slotSessions.reduce((sum, s) => sum + s.duration, 0) / slotSessions.length) / 60 : 0,
    };
  });
}