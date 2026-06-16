import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Aperture } from "lucide-react";
import { InfoDocId } from "../types";

interface InfoPageProps {
  docId: InfoDocId;
  onClose: () => void;
}

const DOCS: Record<
  InfoDocId,
  { title: string; subtitle: string; content: React.ReactNode }
> = {
  scenes: {
    title: "环境与空间",
    subtitle: "为你构建绝对专注的数字结界",
    content: (
      <div className="space-y-10">
        <p className="text-white/80 leading-relaxed font-light text-lg tracking-wide">
          深境
          提供多种高品质沉浸场景，以极简视觉和动态白噪音，切断现实世界对精神的干扰。
        </p>
        <ul className="space-y-8">
          <li className="flex gap-6 items-start">
            <span className="text-2xl mt-1 opacity-80">☀️</span>
            <div>
              <h3 className="font-medium mb-2 text-white/90 tracking-widest uppercase text-sm">
                Morning Window / 清晨窗前
              </h3>
              <p className="text-white/50 text-sm leading-loose font-light">
                明亮清晨的初光，配上轻松灵动的白噪音，适合一天的破冰工作或开启深度阅读。光影细腻，清空大脑中的杂念碎片。
              </p>
            </div>
          </li>
          <li className="flex gap-6 items-start">
            <span className="text-2xl mt-1 opacity-80">🌧️</span>
            <div>
              <h3 className="font-medium mb-2 text-white/90 tracking-widest uppercase text-sm">
                Rainy Cafe / 雨天咖啡馆
              </h3>
              <p className="text-white/50 text-sm leading-loose font-light">
                微风与雨滴敲打玻璃，中和了绝对安静带来的紧张感。这是一种天然的听觉保护罩，极适合长文本写作与深度逻辑推演。
              </p>
            </div>
          </li>
          <li className="flex gap-6 items-start">
            <span className="text-2xl mt-1 opacity-80">🌙</span>
            <div>
              <h3 className="font-medium mb-2 text-white/90 tracking-widest uppercase text-sm">
                Night Library / 午夜图书馆
              </h3>
              <p className="text-white/50 text-sm leading-loose font-light">
                剥离所有的光污染。这里只有微弱的环境光和沙沙的书页翻动声。在这个深夜结界里，再也没有任何事能打扰你。
              </p>
            </div>
          </li>
        </ul>
      </div>
    ),
  },
  pomodoro: {
    title: "专注系统",
    subtitle: "经典的时间切片法则",
    content: (
      <div className="space-y-8 text-white/80 leading-relaxed font-light text-sm tracking-wide">
        <p className="text-lg">
          我们使用经典的番茄工作法（Pomodoro
          Technique），用时间切片来对抗本能的惰性。
        </p>
        <div className="mt-10">
          <h3 className="font-medium mb-6 text-white/90 tracking-widest uppercase text-xs">
            执行体系：
          </h3>
          <ul className="space-y-6 text-white/50">
            <li className="flex flex-col">
              <strong className="text-white/80 font-medium mb-1">
                01 / 限定周期
              </strong>
              <span>
                进入自习室前可自定义你专注的时间。在设定的倒计时内，除了当前任务，其他任何事物都不重要。
              </span>
            </li>
            <li className="flex flex-col">
              <strong className="text-white/80 font-medium mb-1">
                02 / 意图锚定
              </strong>
              <span>
                开始前，在列表内写下接下来要完成的唯一一件事。这能给大脑一个明确的靶点。
              </span>
            </li>
            <li className="flex flex-col">
              <strong className="text-white/80 font-medium mb-1">
                03 / 阻断式沉浸
              </strong>
              <span>
                如果你觉得时钟也刺眼，点击左下角的「沉浸模式」。所有的 UI
                元素将会隐去，只留下你的工作。
              </span>
            </li>
            <li className="flex flex-col">
              <strong className="text-white/80 font-medium mb-1">
                04 / 强制停机
              </strong>
              <span>
                时间到达后，系统会提醒你完成了一次循环。哪怕状态再好，也要起身给自己
                5 分钟的放空时间。
              </span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  guide: {
    title: "使用指引",
    subtitle: "如何将深境作为你的数字环境",
    content: (
      <div className="space-y-8 text-white/80 font-light leading-relaxed tracking-wide">
        <p className="text-lg">
          你可以将 深境
          置于你屏幕的中心或余光外围。无论是用主屏幕全屏开启作为数字环境，还是用备用设备在旁边作为环境音箱，它都在默默运行。
        </p>
        <div className="grid gap-6 mt-10">
          <div className="p-8 border border-white/10 rounded-2xl bg-white/[0.02]">
            <h4 className="font-medium mb-3 text-white/90 tracking-widest text-sm uppercase">
              全屏沉浸（推荐）
            </h4>
            <p className="text-sm text-white/50 leading-loose">
              点击进入自习室后，点击左下角「沉浸模式」。随着光标移开，一切控制面板将隐入黑暗，屏幕只会留下时间的流逝感与空间场景。
            </p>
          </div>
          <div className="p-8 border border-white/10 rounded-2xl bg-white/[0.02]">
            <h4 className="font-medium mb-3 text-white/90 tracking-widest text-sm uppercase">
              环境混音
            </h4>
            <p className="text-sm text-white/50 leading-loose">
              在设置或专注面板中，你不仅能听专注音乐，还能随意调节音乐流淌声与场景底层白噪音（如雨声、风声）的音量比例，定制属于自己的声场。
            </p>
          </div>
        </div>
      </div>
    ),
  },
  method: {
    title: "心流法则",
    subtitle: "进入极致专注的训练方式",
    content: (
      <div className="space-y-8 text-white/80 font-light leading-relaxed tracking-wide">
        <blockquote className="border-l border-white/30 pl-6 text-white/50 italic my-10 py-2">
          "The state of flow is the state where you are so involved in an
          activity that nothing else seems to matter."
        </blockquote>
        <p className="text-sm text-white/60 leading-loose">
          进入心流其实是一种可以刻意练习的习惯，在 深境
          中，你可以用三个步骤做到：
        </p>
        <ul className="list-none space-y-8 text-white/50 mt-8 text-sm">
          <li>
            <strong className="block text-white/80 mb-2 font-medium">
              视觉与听觉的仪式感
            </strong>
            <span>
              选定一个场景与白噪音，只在你需要做深度工作时开启。不出一个月，只要你听到这个声音，大脑就会条件反射地安静下来。
            </span>
          </li>
          <li>
            <strong className="block text-white/80 mb-2 font-medium">
              捍卫单一目标
            </strong>
            <span>
              不要一次性写十个任务。一次只在清单里留一项未完成的事，完成它才加下一项。我们的大脑痛恨并在并行任务中迅速耗竭。
            </span>
          </li>
          <li>
            <strong className="block text-white/80 mb-2 font-medium">
              抵抗熵增
            </strong>
            <span>
              当你想滑开手机查看信息的念头升起时，看一眼界面的倒计时——既然已经撑过了十几分钟，何不再坚持一小会儿？
            </span>
          </li>
        </ul>
      </div>
    ),
  },
  about: {
    title: "关于深境",
    subtitle: "Crafted for Deep Thinkers",
    content: (
      <div className="flex flex-col items-center justify-center space-y-8 text-white/80 font-light leading-relaxed text-center py-16">
        <div className="p-6 bg-white/[0.02] rounded-full border border-white/10 shadow-2xl mb-4">
          <Aperture className="w-12 h-12" strokeWidth={1} />
        </div>
        <h3 className="text-2xl tracking-widest font-medium">深境</h3>
        <p className="text-sm text-white/50 max-w-md mx-auto leading-loose">
          在信息过载、算法不断算计你去点击的时代，我们想要留一块干净、没有信息流、没有弹跳通知、只有一张桌子的赛博空间。
        </p>
        <div className="mt-16 text-[10px] text-white/30 tracking-widest uppercase">
          Version 1.0.0
        </div>
      </div>
    ),
  },
  privacy: {
    title: "隐私承诺",
    subtitle: "绝对数据的掌控权",
    content: (
      <div className="space-y-8 text-white/80 font-light leading-relaxed text-sm tracking-wide">
        <p className="text-lg">你的时间、注意力和工作内容，只属于你自己。</p>
        <ul className="space-y-6 mt-10">
          <li className="bg-white/[0.02] p-8 border border-white/5 rounded-2xl">
            <strong className="block text-white/90 mb-3 font-medium tracking-widest uppercase text-xs">
              01 / 本地物理隔离 (Local-First)
            </strong>
            <span className="text-white/50 leading-loose">
              深境
              将所有的任务清单、场景偏好、专注记录储存在你当前设备的浏览器存储中。这意味着我们没有任何中心服务器会保存、读取你的任何操作数据。
            </span>
          </li>
          <li className="bg-white/[0.02] p-8 border border-white/5 rounded-2xl">
            <strong className="block text-white/90 mb-3 font-medium tracking-widest uppercase text-xs">
              02 / 零追踪架构
            </strong>
            <span className="text-white/50 leading-loose">
              应用内没有任何隐蔽的遥测代码、不使用第三方数据分析 SDK (Google
              Analytics 等)、不收集用户特征画像、绝不转售任何信息。
            </span>
          </li>
          <li className="bg-white/[0.02] p-8 border border-white/5 rounded-2xl">
            <strong className="block text-white/90 mb-3 font-medium tracking-widest uppercase text-xs">
              03 / 物理清除重置
            </strong>
            <span className="text-white/50 leading-loose">
              只要你清除当前浏览器的缓存数，一切痕迹就会回到最初的状态，干干净净，没有遗留。
            </span>
          </li>
        </ul>
      </div>
    ),
  },
};

export function InfoPage({ docId, onClose }: InfoPageProps) {
  const doc = DOCS[docId];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 font-sans tracking-wide">
        {/* Transparent backdrop - deep glass */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "anticipate" }}
          onClick={onClose}
        />

        {/* Content Container - Glass modal */}
        <motion.div
          className="relative w-full max-w-3xl bg-white/[0.03] backdrop-blur-[12px] border border-white/10 shadow-2xl rounded-[2rem] flex flex-col pointer-events-auto h-auto max-h-[85vh]"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="pt-10 pb-6 px-10 flex justify-between items-start sticky top-0 bg-gradient-to-b from-black/20 to-transparent z-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-light tracking-widest text-white/90">
                {doc.title}
              </h2>
              <span className="text-xs tracking-widest text-white/40 uppercase font-medium mt-1">
                {doc.subtitle}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/[0.05] hover:bg-white/10 rounded-full transition-all group flex items-center justify-center border border-white/5"
            >
              <X
                className="w-5 h-5 text-white/60 group-hover:text-white transition-all duration-300"
                strokeWidth={1.5}
              />
            </button>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

          {/* Scrollable Content */}
          <div className="px-10 pb-12 overflow-y-auto w-full custom-scrollbar">
            {doc.content}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
