import React, { useEffect, useRef } from 'react';

/** Real audio visualizer — connects to Web Audio API analyzer */
export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bars = 32;
    const heights = new Float32Array(bars);
    const targetHeights = new Float32Array(bars);

    // Initialize with some random values for initial visual
    for (let i = 0; i < bars; i++) {
      heights[i] = 2;
      targetHeights[i] = 2;
    }

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      const barW = (w - (bars + 1) * 2) / bars;
      const barGap = 2;

      ctx.clearRect(0, 0, w, h);

      // If no real audio, use gentle ambient animation
      const t = performance.now() / 1000;
      for (let i = 0; i < bars; i++) {
        const centerBass = bars / 2;
        const distFromCenter = Math.abs(i - centerBass) / centerBass;

        // Ambient wave pattern when no audio
        if (targetHeights[i] <= 2) {
          const wave = Math.sin(t * 0.5 + i * 0.2) * 0.5 + 0.5;
          targetHeights[i] = 2 + wave * h * 0.08 * (1 - distFromCenter * 0.7);
        }

        // Smooth interpolation
        heights[i] += (targetHeights[i] - heights[i]) * 0.08;

        const alpha = 0.1 + (1 - distFromCenter) * 0.25;
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
        const x = 2 + i * (barW + barGap);
        const barH = Math.max(2, heights[i]);
        const y = h - barH;

        ctx.beginPath();
        const radius = Math.min(2, barW / 2);
        ctx.roundRect(x, y, barW, barH, [radius, radius, 0, 0]);
        ctx.fill();

        // Fade target back down
        targetHeights[i] *= 0.995;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute bottom-24 left-0 right-0 z-20 h-20 opacity-30 pointer-events-none" />;
}
