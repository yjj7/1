f = r'C:\Users\Administrator\Desktop\moss-new-site\src\components\SetupPage.tsx'
with open(f, 'r', encoding='utf-8') as fh:
    content = fh.read()

# Only add useT import if not present
if "import { useT }" not in content:
    content = content.replace(
        "import { DailyGoal } from '../types';",
        "import { DailyGoal } from '../types';\nimport { useT } from '../i18n';"
    )

# Add t() hook
if "const { t } = useT();" not in content:
    content = content.replace(
        "const activeScene = SCENES.find(s => s.id === selectedSceneId) || SCENES[0];\n",
        "const activeScene = SCENES.find(s => s.id === selectedSceneId) || SCENES[0];\n  const { t } = useT();\n"
    )

# Replace labels
content = content.replace('>首页<', '>{t("homePage")}<')
content = content.replace('>场景<', '>{t("scene")}<')
content = content.replace('>统计<', '>{t("stats")}<')
content = content.replace('>历史<', '>{t("history")}<')
content = content.replace(
    '<span className="text-white font-medium">场景</span>',
    '<span className="text-white font-medium">{t("scene")}</span>'
)
content = content.replace('"STEP 01"', '{t("step1")}')
content = content.replace('"STEP 02"', '{t("step2")}')
content = content.replace('"STEP 03"', '{t("step3")}')
content = content.replace('"STEP 04"', '{t("step4")}')
content = content.replace('"选择学习场景"', '{t("stepScene")}')
content = content.replace('"随机场景"', '{t("randomScene")}')
content = content.replace('"推荐当前时段场景"', '{t("recommendScene")}')
content = content.replace('"声音氛围"', '{t("stepSound")}')
content = content.replace('"每日目标"', '{t("stepGoal")}')
content = content.replace('"番茄钟"', '{t("stepTimer")}')
content = content.replace('"上传背景图"', '{t("uploadBg")}')
content = content.replace("'自定义背景 ✓'", "t('customBgReady')")
content = content.replace('"已保存的组合"', '{t("savedPresets")}')
content = content.replace('"保存当前组合"', '{t("savePreset")}')
content = content.replace('>保存<', '>{t("save")}<')
content = content.replace(
    '"组合名 (如: 晨间学习)"',
    '{t("comboPlaceholder")}'
)
content = content.replace('>上传本地音乐<', '>{t("uploadLocal")}<')
content = content.replace("'已选择文件'", "t('fileSelected')")
content = content.replace(">就绪<", ">{t('fileReady')}<")
content = content.replace('"背景音"', '{t("bgAudio")}')
content = content.replace('"根据场景自动匹配"', '{t("bgAuto")}')
content = content.replace('"自定义"', '{t("custom")}')
content = content.replace('"进入自习室"', '{t("enterRoom")}')
content = content.replace('>音乐<', '>{t("music")}<')

# Fix "N 分钟" pattern in duration buttons
content = content.replace(
    '}>{dur} 分钟</button>',
    '}>{dur} {t("minutes")}</button>'
)

# Fix "每日目标 N 分钟" 
content = content.replace(
    "每日目标 {dailyGoal.targetMinutes} 分钟",
    '{t("stepGoal")}: {dailyGoal.targetMinutes} {t("minutes")}'
)

# Fix custom bg/music ternaries
content = content.replace(
    "{customBgUrl ? '自定义背景 ✓' : '上传背景图'}",
    "{customBgUrl ? t('customBgReady') : t('uploadBg')}"
)
content = content.replace(
    "{customMusicUrl ? '已选择文件' : '上传本地音乐'}",
    "{customMusicUrl ? t('fileSelected') : t('uploadLocal')}"
)

with open(f, 'w', encoding='utf-8') as fh:
    fh.write(content)

print("SetupPage done")