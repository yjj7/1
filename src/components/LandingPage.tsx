import React from "react";
import { Aperture, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import landingBg from "../assets/images/premium_landing_bg_1780054955872.png";
import { CinematicBackground } from "./CinematicBackground";
import { InfoDocId } from "../types";

interface LandingPageProps {
  onStart: () => void;
  onNavigate: (docId: InfoDocId) => void;
}

export function LandingPage({ onStart, onNavigate }: LandingPageProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col text-white overflow-hidden font-sans">
      {/* Background Image */}
      <motion.div
        className="absolute inset-0 z-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <CinematicBackground imageUrl={landingBg} sceneId="landing" />
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply z-10"></div>
      </motion.div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl w-full p-12 md:p-16 rounded-[3rem] bg-white/[0.01] backdrop-blur-[2px] border border-white/10 shadow-2xl items-center text-center flex flex-col"
        >
          <div className="text-sm font-medium tracking-[0.2em] text-white/70 mb-4 uppercase">
            Focus · Learn · Grow
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
            开启你的沉浸自习室
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl font-light leading-relaxed">
            选择场景、音乐与节奏，把一天最清醒的时间留给真正重要的学习。
          </p>

          <button
            onClick={onStart}
            className="flex items-center justify-center space-x-2 px-10 py-5 rounded-full border border-white/20 bg-white/[0.05] hover:bg-white/10 transition-all group w-fit shadow-lg shadow-white/5"
          >
            <span className="text-lg">开始学习</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-10 md:px-16 flex flex-col md:flex-row justify-between items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center space-x-3 mb-4 md:mb-0 opacity-80 hover:opacity-100 transition-opacity">
          <Aperture className="w-5 h-5 text-white" strokeWidth={1.5} />
          <span className="text-lg text-white font-medium tracking-widest">
            深境
          </span>
        </div>

        <div className="flex space-x-8 text-xs font-light tracking-widest uppercase text-white/50">
          <button
            onClick={() => onNavigate("scenes")}
            className="hover:text-white transition-colors"
          >
            体验空间
          </button>
          <button
            onClick={() => onNavigate("method")}
            className="hover:text-white transition-colors"
          >
            心流指引
          </button>
          <button
            onClick={() => onNavigate("about")}
            className="hover:text-white transition-colors"
          >
            关于深境
          </button>
        </div>
      </footer>
    </div>
  );
}
