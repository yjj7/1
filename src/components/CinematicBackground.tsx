import React from "react";
import { motion } from "motion/react";

interface CinematicBackgroundProps {
  imageUrl: string;
  sceneId: string;
}

export function CinematicBackground({
  imageUrl,
  sceneId,
}: CinematicBackgroundProps) {
  const isRain = sceneId === "rainy_cafe";
  const isNight = sceneId === "night_library";
  const isMorning = sceneId === "morning_window";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
      {/* Static Background instead of parallax to reduce dizziness */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: isNight ? "brightness(0.9) blur(1px)" : "brightness(1.05)",
        }}
      />

      {/* Cloud Pass / Light Shift Overlay */}
      {isMorning && (
        <motion.div
          className="absolute inset-0 z-0 mix-blend-overlay opacity-30"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
            width: "200%",
          }}
          animate={{ x: ["-100%", "50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Dynamic Lighting / Environmental Effects */}

      {/* Night Library: Flickering Warm Light */}
      {isNight && (
        <motion.div
          className="absolute inset-0 z-10 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(circle at 50% 80%, rgba(255,180,100,0.15) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.7, 1, 0.8, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Rainy Cafe: Static raindrops overlay instead of turbulent moving noise to prevent dizziness */}
      {isRain && (
        <div className="absolute inset-0 z-10 mix-blend-overlay opacity-20 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      )}

      {/* Global Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] mix-blend-multiply pointer-events-none" />
    </div>
  );
}
