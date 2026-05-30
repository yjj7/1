import React, { useEffect, useState } from 'react';

/** 极简实时时钟 — 毛玻璃风格，融入沉浸场景 */
export function SceneClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  // 根据时间段显示不同的问候
  const hour = now.getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 9 ? '早安' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : hour < 22 ? '晚上好' : '夜深了';

  return (
    <div className="absolute top-6 right-6 z-30 pointer-events-none select-none">
      <div className="flex flex-col items-end space-y-1 px-4 py-2.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
        {/* 时间 */}
        <div className="flex items-baseline space-x-0.5 font-light tracking-tight">
          <span className="text-3xl md:text-4xl text-white/90 tabular-nums">{hours}</span>
          <span className="text-3xl md:text-4xl text-white/40 animate-pulse">:</span>
          <span className="text-3xl md:text-4xl text-white/90 tabular-nums">{minutes}</span>
          <span className="text-sm text-white/30 ml-1 tabular-nums">{seconds}</span>
        </div>
        {/* 问候语 */}
        <span className="text-xs text-white/40 tracking-widest">{greeting}</span>
      </div>
    </div>
  );
}
