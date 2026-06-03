import { useEffect, useRef, useState, useCallback } from 'react';

interface CinematicBackgroundProps {
  imageUrl: string;
  sceneId: string;
  videoUrl?: string;
  onLoad?: () => void;
}

// Scene-specific effect configs
const SCENE_EFFECTS: Record<string, {
  overlay: string;
  particles: 'float' | 'rain' | 'firefly' | 'spark' | 'none';
  particleColor: string;
  particleCount: number;
  tint: string;
}> = {
  morning_window: {
    overlay: 'radial-gradient(ellipse at 30% 20%, rgba(255,200,120,0.12) 0%, transparent 60%)',
    particles: 'float',
    particleColor: 'rgba(255,220,150,0.6)',
    particleCount: 30,
    tint: 'rgba(255,200,100,0.03)',
  },
  rainy_cafe: {
    overlay: 'radial-gradient(ellipse at 60% 40%, rgba(255,180,100,0.08) 0%, transparent 70%)',
    particles: 'rain',
    particleColor: 'rgba(200,220,255,0.3)',
    particleCount: 80,
    tint: 'rgba(20,30,50,0.04)',
  },
  night_library: {
    overlay: 'radial-gradient(ellipse at 50% 80%, rgba(255,160,60,0.15) 0%, transparent 70%)',
    particles: 'float',
    particleColor: 'rgba(255,200,120,0.3)',
    particleCount: 20,
    tint: 'rgba(10,5,0,0.05)',
  },
  seaside_study: {
    overlay: 'linear-gradient(to top, rgba(100,180,255,0.08) 0%, transparent 40%)',
    particles: 'spark',
    particleColor: 'rgba(200,230,255,0.4)',
    particleCount: 25,
    tint: 'rgba(0,50,100,0.03)',
  },
  deep_night_desk: {
    overlay: 'radial-gradient(ellipse at 50% 60%, rgba(100,150,255,0.1) 0%, transparent 70%)',
    particles: 'float',
    particleColor: 'rgba(150,180,255,0.2)',
    particleCount: 15,
    tint: 'rgba(0,0,20,0.05)',
  },
  forest_cabin: {
    overlay: 'radial-gradient(ellipse at 50% 70%, rgba(255,140,60,0.12) 0%, transparent 70%)',
    particles: 'firefly',
    particleColor: 'rgba(255,220,100,0.7)',
    particleCount: 40,
    tint: 'rgba(20,40,10,0.03)',
  },
  city_skyline: {
    overlay: 'linear-gradient(to bottom, rgba(20,20,60,0.2) 0%, transparent 30%, rgba(255,100,200,0.05) 100%)',
    particles: 'spark',
    particleColor: 'rgba(255,200,100,0.5)',
    particleCount: 50,
    tint: 'rgba(10,0,30,0.04)',
  },
  landing: {
    overlay: 'radial-gradient(ellipse at 50% 30%, rgba(200,180,255,0.06) 0%, transparent 70%)',
    particles: 'float',
    particleColor: 'rgba(200,200,255,0.3)',
    particleCount: 25,
    tint: 'rgba(20,10,30,0.02)',
  },
};

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; life: number; maxLife: number;
  phase: number;
}

export function CinematicBackground({ imageUrl, sceneId, videoUrl, onLoad }: CinematicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const effect = SCENE_EFFECTS[sceneId] || SCENE_EFFECTS.landing;

  // Image preload
  useEffect(() => {
    setImgLoaded(false); setVideoLoaded(false);
    const img = new Image();
    img.onload = () => { setImgLoaded(true); onLoad?.(); };
    img.onerror = () => { setImgLoaded(true); onLoad?.(); };
    img.src = imageUrl;
  }, [imageUrl]);

  // Video autoplay
  useEffect(() => {
    if (!videoUrl) return;
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.play().then(() => setVideoLoaded(true)).catch(() => setVideoLoaded(false));
  }, [videoUrl]);

  // Particle animation
  const initParticles = useCallback(() => {
    if (effect.particles === 'none') { particlesRef.current = []; return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const arr: Particle[] = [];
    for (let i = 0; i < effect.particleCount; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: effect.particles === 'rain' ? 1 + Math.random() * 2 : effect.particles === 'firefly' ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * 0.3,
        size: effect.particles === 'rain' ? 1 + Math.random() * 1.5 : effect.particles === 'firefly' ? 2 + Math.random() * 4 : 1.5 + Math.random() * 3,
        opacity: Math.random(),
        life: 0,
        maxLife: effect.particles === 'rain' ? 200 + Math.random() * 300 : 300 + Math.random() * 500,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = arr;
  }, [effect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || effect.particles === 'none') return;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += dt / 16;
        if (p.life > p.maxLife) {
          // Reset particle
          p.x = Math.random() * canvas.width;
          p.y = effect.particles === 'rain' ? -10 : Math.random() * canvas.height;
          p.life = 0;
          p.opacity = Math.random();
          continue;
        }

        // Movement
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);

        // Wrap around
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y > canvas.height + 20) { p.y = effect.particles === 'rain' ? -10 : canvas.height + 20; }
        if (p.y < -20 && effect.particles !== 'rain') p.y = canvas.height + 20;

        // Life-based opacity
        const lifeRatio = p.life / p.maxLife;
        let alpha = 0;
        if (effect.particles === 'firefly') {
          // Pulsing glow
          const pulse = Math.sin(p.phase + now * 0.002) * 0.5 + 0.5;
          alpha = pulse * (1 - Math.abs(lifeRatio - 0.5) * 2) * 0.4;
        } else if (lifeRatio < 0.1) {
          alpha = lifeRatio / 0.1;
        } else if (lifeRatio > 0.9) {
          alpha = (1 - lifeRatio) / 0.1;
        } else {
          alpha = 1;
        }
        alpha *= effect.particles === 'rain' ? 0.5 : effect.particles === 'spark' ? 0.6 : 0.4;

        // Draw
        ctx.beginPath();
        if (effect.particles === 'firefly') {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          gradient.addColorStop(0, effect.particleColor.replace('0.7', `${alpha}`));
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        } else if (effect.particles === 'rain') {
          ctx.strokeStyle = effect.particleColor.replace('0.3', `${alpha}`);
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.size * 5);
          ctx.stroke();
          continue;
        } else {
          ctx.fillStyle = effect.particleColor.replace(/[\d.]+\)$/, `${alpha})`);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [effect, initParticles]);

  const showVideo = videoUrl && videoLoaded;
  const showImage = !showVideo && imgLoaded;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
      {/* Video layer */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted loop playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: 'slowDrift 25s ease-in-out infinite alternate' }}
        />
      )}

      {/* Image layer (fallback) */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${showVideo ? 'opacity-0' : ''}`}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: showImage ? 1 : 0,
          animation: `${videoUrl ? '' : 'slowDrift 25s ease-in-out infinite alternate'}`,
        }}
      />

      {/* Scene tint overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: effect.tint }} />

      {/* Scene-specific gradient overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: effect.overlay }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Global vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] mix-blend-multiply pointer-events-none" />

      {/* Scene-specific CSS animations via style tag */}
      <style>{`
        @keyframes rainDrop {
          0% { transform: translateY(-10px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
