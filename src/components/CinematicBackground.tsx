import React, { useEffect, useState } from 'react';

interface CinematicBackgroundProps {
  imageUrl: string;
  sceneId: string;
  onLoad?: () => void;
}

export function CinematicBackground({ imageUrl, sceneId, onLoad }: CinematicBackgroundProps) {
  const isNight = sceneId === 'night_library' || sceneId === 'deep_night_desk';
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    const img = new Image();
    img.onload = () => {
      setImgLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setImgLoaded(true);
      onLoad?.();
    };
    img.src = imageUrl;
  }, [imageUrl, onLoad]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
      {/* 静态背景图 - 无任何动画 */}
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: isNight ? 'brightness(0.85)' : 'brightness(1)',
          opacity: imgLoaded ? 1 : 0,
        }}
      />

      {/* 深夜场景：微弱暖光叠加（静态） */}
      {isNight && (
        <div
          className="absolute inset-0 z-10 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 80%, rgba(255,180,100,0.2) 0%, transparent 70%)',
          }}
        />
      )}

      {/* 全局暗角 - 增加深度感 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] mix-blend-multiply pointer-events-none" />
    </div>
  );
}
