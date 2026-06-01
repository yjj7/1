f = r'C:\Users\Administrator\Desktop\moss-new-site\src\components\StatsPage.tsx'
with open(f, 'r', encoding='utf-8') as fh:
    content = fh.read()

# Only add useT import if not present
if "import { useT }" not in content:
    content = content.replace(
        "import { analyzeTimeSlots } from '../extras';",
        "import { analyzeTimeSlots } from '../extras';\nimport { useT } from '../i18n';"
    )

# Only add t() hook if not present  
if "const { t } = useT();" not in content:
    content = content.replace(
        "  const cardRef = useRef<HTMLDivElement>(null);",
        "  const { t } = useT();\n  const cardRef = useRef<HTMLDivElement>(null);"
    )

# Simple label replacements (in JSX context with {})
content = content.replace('>学习统计<', '>{t("studyStats")}<')
content = content.replace('>导出报告<', '>{t("exportReport")}<')
content = content.replace('>成就<', '>{t("achievement")}<')
content = content.replace('今日目标', '{t("dailyGoalTitle")}')
content = content.replace('专注时段分析', '{t("focusAnalysis")}')
content = content.replace('本周学习', '{t("weekStudy")}')
content = content.replace('学习热力图（近 12 周）', '{t("heatmap")}')
content = content.replace("完成学习后会自动显示你最高效的时间段", "{t('autoStatsDesc')}")

# Achievements title with count
content = content.replace(
    '>成就 ({earnedCount}/{achievements.length})<',
    '>{t("achievementsTitle").replace("N", `${earnedCount}/${achievements.length}`)}<'
)

# Fix '尚未解锁' in title attribute (jsx expression)
content = content.replace(
    ": '尚未解锁'}",
    ": t('locked')}"
)

# Canvas export labels (inside arrays with single quotes)  
content = content.replace("'总学习时长'", "t('totalTime')")
content = content.replace("'完成番茄'", "t('pomodoros')")
content = content.replace("'连续打卡'", "t('streakDays')")
content = content.replace("'本周学习'", "t('weekStudy')")
content = content.replace("'今日进度'", "t('todayGoal')")

# Fix "分钟" patterns
content = content.replace(
    "dailyGoal.targetMinutes} 分钟",
    'dailyGoal.targetMinutes} {t("mins")}'
)
content = content.replace(
    'day.minutes)} 分钟',
    'day.minutes)} {t("mins")}'
)
content = content.replace(
    'slot.hours * 60)} 分钟',
    'slot.hours * 60)} {t("mins")}'
)

# Fix template literal: "🎉 达成！" and "还需 N 分钟"
content = content.replace("'🎉 达成！'", "t('achieved')")
content = content.replace(
    "`还需 ${Math.round(dailyGoal.targetMinutes - todayMinutes)} 分钟`",
    "`${t('needMore')} ${Math.round(dailyGoal.targetMinutes - todayMinutes)} ${t('mins')}`"
)

with open(f, 'w', encoding='utf-8') as fh:
    fh.write(content)

print("Done")