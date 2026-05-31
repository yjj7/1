import React, { useEffect, useRef } from 'react';

/** 音频视觉化 — 底部频谱条 */
export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bars = 24;
    const heights = new Float32Array(bars);
    const speeds = new Float32Array(bars);

    for (let i = 0; i < bars; i++) {
      heights[i] = 5 + Math.random() * 15;
      speeds[i] = 0.5 + Math.random() * 1.5;
    }

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      const barW = (w - (bars + 1) * 2) / bars;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < bars; i++) {
        heights[i] += speeds[i];
        if (heights[i] > h * 0.8 || heights[i] < 3) speeds[i] *= -1;

        const centerBass = bars / 2;
        const distFromCenter = Math.abs(i - centerBass) / centerBass;
        const alpha = 0.15 + (1 - distFromCenter) * 0.35;

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        const x = 2 + i * (barW + 2);
        const y = h - heights[i];
        ctx.beginPath();
        ctx.roundRect(x, y, barW, heights[i], [2, 2, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute bottom-24 left-0 right-0 z-20 h-20 opacity-40 pointer-events-none" />;
}
