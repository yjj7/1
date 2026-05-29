import React from 'react';
import { motion } from 'motion/react';

interface CinematicBackgroundProps {
  imageUrl: string;
  sceneId: string;
}

export function CinematicBackground({ imageUrl, sceneId }: CinematicBackgroundProps) {
  const isRain = sceneId === 'rainy_cafe';
  const isNight = sceneId === 'night_library';
  const isMorning = sceneId === 'morning_window';

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
      {/* Layer 1: Background (Window / Distance) */}
      <motion.div
        className="absolute inset-[-10%] w-[120%] h-[120%]"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // Slight blur for depth of field on the background
          filter: isNight ? 'brightness(0.9) blur(1px)' : 'brightness(1.05) blur(2px)',
        }}
        animate={{
          x: ['-2%', '2%', '-2%'],
          y: ['-1%', '1%', '-1%'],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Cloud Pass / Light Shift Overlay */}
      {isMorning && (
        <motion.div
          className="absolute inset-0 z-0 mix-blend-overlay opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
            width: '200%',
          }}
          animate={{ x: ['-100%', '50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Layer 2: Foreground (Desk / Close Objects) */}
      <motion.div
        className="absolute inset-[-5%] w-[110%] h-[110%]"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // Mask out the top half softly to reveal the moving background behind it!
          // This creates the faux 3D parallax effect on a flat image.
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, black 65%)',
          maskImage: 'linear-gradient(to bottom, transparent 20%, black 65%)',
        }}
        animate={{
          x: ['1%', '-1%', '1%'],
          y: ['1%', '-1%', '1%'],
        }}
        transition={{
          duration: 35, // Slightly different duration from background for parallax drift
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Dynamic Lighting / Environmental Effects */}
      
      {/* Night Library: Flickering Warm Light */}
      {isNight && (
        <motion.div
          className="absolute inset-0 z-10 mix-blend-overlay"
          style={{
            background: 'radial-gradient(circle at 50% 80%, rgba(255,180,100,0.15) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.7, 1, 0.8, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Rainy Cafe: Moving Rain Drops mapping */}
      {isRain && (
        <div className="absolute inset-0 z-10 mix-blend-soft-light opacity-50">
          <svg width="100%" height="100%">
            <filter id="water-ripple">
              <feTurbulence type="fractalNoise" baseFrequency="0.01 0.1" numOctaves="2" result="noise">
                <animate attributeName="baseFrequency" values="0.01 0.1; 0.015 0.12; 0.01 0.1" dur="10s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <rect width="100%" height="100%" fill="rgba(200,200,250,0.1)" filter="url(#water-ripple)" />
          </svg>
          <motion.div 
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}

      {/* Global Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] mix-blend-multiply pointer-events-none" />
    </div>
  );
}
