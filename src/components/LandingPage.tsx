import React from 'react';
import { BookOpen, Globe, ArrowRight, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import landingBg from '../assets/images/premium_landing_bg_1780054955872.png';
import { CinematicBackground } from './CinematicBackground';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6" />
          <span className="text-xl font-medium tracking-wide">StudyWithMe AI</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm text-white/80">
          <button onClick={onStart} className="hover:text-white transition-colors">场景</button>
          <button onClick={onStart} className="hover:text-white transition-colors">音乐</button>
          <button onClick={onStart} className="hover:text-white transition-colors">计划</button>
        </nav>

        <div className="flex items-center space-x-4">
        </div>
      </header>

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
      <footer className="relative z-10 py-8 px-8 md:px-24 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-t from-black/60 to-transparent">
        <div className="mb-6 md:mb-0">
          <div className="flex items-center space-x-3 mb-3">
            <BookOpen className="w-5 h-5 text-white/80" />
            <span className="text-lg text-white/80 font-medium">StudyWithMe AI</span>
          </div>
          <p className="text-sm text-white/50 max-w-md">
            结合沉浸式场景、专注音乐与智能计划。让每一次学习都更专心。
          </p>
        </div>
        
        <div className="flex gap-16 text-sm">
          <div className="flex flex-col space-y-3 text-white/60">
            <span className="text-white font-medium mb-1">产品</span>
            <a href="#" className="hover:text-white transition-colors">场景</a>
            <a href="#" className="hover:text-white transition-colors">音乐</a>
          </div>
          <div className="flex flex-col space-y-3 text-white/60">
            <span className="text-white font-medium mb-1">资源</span>
            <a href="#" className="hover:text-white transition-colors">使用指南</a>
            <a href="#" className="hover:text-white transition-colors">学习方法</a>
          </div>
          <div className="flex flex-col space-y-3 text-white/60">
            <span className="text-white font-medium mb-1">关于我们</span>
            <a href="#" className="hover:text-white transition-colors">关于 StudyWithMe AI</a>
            <a href="#" className="hover:text-white transition-colors">隐私/协议</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
