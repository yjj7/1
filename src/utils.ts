// 自动签到 + 节日检测 + 场景推荐

export function detectHoliday(): { id: string; label: string; emoji: string } | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  // 春节 (大年初一，2027年1月28日，先硬编码最近几年)
  const springFestival: Record<string, string> = {
    '2026-2-17': '春节',
    '2027-1-28': '春节',
    '2028-2-16': '春节',
  };
  const sfKey = `${now.getFullYear()}-${m}-${d}`;
  if (springFestival[sfKey]) return { id: 'spring', label: '🧧 春节', emoji: '🧧' };

  // 固定节日
  if (m === 1 && d === 1) return { id: 'newyear', label: '🎆 元旦', emoji: '🎆' };
  if (m === 2 && d === 14) return { id: 'valentine', label: '💕 情人节', emoji: '💕' };
  if (m === 5 && d === 1) return { id: 'labour', label: '🛠️ 劳动节', emoji: '🛠️' };
  if (m === 6 && d === 1) return { id: 'children', label: '🎈 儿童节', emoji: '🎈' };
  if (m === 10 && d === 1) return { id: 'national', label: '🇨🇳 国庆', emoji: '🇨🇳' };
  if (m === 9 && d === 10) return { id: 'teacher', label: '📚 教师节', emoji: '📚' };
  if (m === 12 && d === 25) return { id: 'xmas', label: '🎄 圣诞', emoji: '🎄' };
  if (m === 12 && d === 31) return { id: 'nye', label: '🎉 跨年夜', emoji: '🎉' };

  // 中秋节（农历八月十五，简单映射近年）
  const midAutumn: Record<string, string> = {
    '2026-9-25': '中秋节',
    '2027-9-14': '中秋节',
    '2028-10-3': '中秋节',
  };
  if (midAutumn[sfKey]) return { id: 'moon', label: '🥮 中秋', emoji: '🥮' };

  return null;
}

/** 根据当前时间推荐场景 */
export function recommendScene(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'morning_window';
  if (hour >= 8 && hour < 12) return 'seaside_study';
  if (hour >= 12 && hour < 14) return 'rainy_cafe';
  if (hour >= 14 && hour < 18) return 'seaside_study';
  if (hour >= 18 && hour < 22) return 'night_library';
  return 'deep_night_desk';
}

/** 节日 CSS 主题色 */
export function holidayTheme(holidayId: string | null) {
  const themes: Record<string, { accent: string; bg: string }> = {
    spring: { accent: 'from-red-600 via-red-500 to-yellow-500', bg: 'bg-red-950/30' },
    xmas: { accent: 'from-green-600 via-red-500 to-green-600', bg: 'bg-green-950/20' },
    newyear: { accent: 'from-purple-500 via-pink-500 to-blue-500', bg: 'bg-purple-950/20' },
    valentine: { accent: 'from-pink-500 to-red-400', bg: 'bg-pink-950/20' },
    moon: { accent: 'from-yellow-600 to-orange-500', bg: 'bg-yellow-950/20' },
    national: { accent: 'from-red-500 to-yellow-400', bg: 'bg-red-950/20' },
    nye: { accent: 'from-yellow-400 via-pink-500 to-purple-500', bg: 'bg-purple-950/30' },
  };
  return themes[holidayId || ''] || { accent: 'from-white/10 to-white/5', bg: 'bg-transparent' };
}
