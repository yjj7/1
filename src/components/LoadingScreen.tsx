import React, { useEffect, useState } from 'react';
import { audioManager } from '../audioManager';
import { SCENES, MUSIC_TRACKS } from '../data';
import { useT } from '../i18n';

interface LoadingScreenProps {
  sceneId: string;
  musicId: string;
  musicUrl: string;
  musicVolume: number;
  bgVolume: number;
  onReady: () => void;
}

export function LoadingScreen({ sceneId, musicId, musicUrl, musicVolume, bgVolume, onReady }: LoadingScreenProps) {
  const scene = SCENES.find(s => s.id === sceneId) || SCENES[0];
  const musicTrack = MUSIC_TRACKS.find(m => m.id === musicId) || MUSIC_TRACKS[0];
  const [phase, setPhase] = useState<'image' | 'audio' | 'ready'>('image');
  const { t } = useT();

  useEffect(() => {
    const img = new Image();
    img.onload = () => setPhase('audio');
    img.onerror = () => setPhase('audio');
    img.src = scene.imageUrl;
  }, [scene.imageUrl]);

  useEffect(() => {
    if (phase !== 'audio') return;
    let musicReady = !musicUrl;
    let bgReady = !scene?.audioUrl;
    let done = false;

    const checkReady = () => {
      if (done) return;
      if (musicReady && bgReady) {
        done = true;
        try { audioManager.play(); } catch (e) { console.warn('play error', e); }
        setPhase('ready');
      }
    };

    try {
      if (musicUrl) {
        audioManager.setMusic(musicUrl, {
          onLoad: () => { musicReady = true; checkReady(); },
          onError: () => { musicReady = true; checkReady(); },
        });
      }
      if (scene?.audioUrl) {
        audioManager.setBg(scene.audioUrl, {
          onLoad: () => { bgReady = true; checkReady(); },
          onError: () => { bgReady = true; checkReady(); },
        });
      }
      audioManager.setMusicVolume(musicVolume / 100);
      audioManager.setBgVolume(bgVolume / 100);
      checkReady();
    } catch (e) {
      console.warn('Audio init failed', e);
      setPhase('ready');
    }

    const tOut = setTimeout(() => {
      if (!done) {
        console.warn('[LoadingScreen] Audio load timeout, proceeding anyway');
        done = true;
        try { audioManager.play(); } catch (e) {}
        setPhase('ready');
      }
    }, 8000);
    return () => clearTimeout(tOut);
  }, [phase, musicUrl, scene, musicVolume, bgVolume]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const tOut = setTimeout(onReady, 700);
    return () => clearTimeout(tOut);
  }, [phase, onReady]);

  const phaseLabel = { image: t('loadingBg'), audio: t('loadingAudio'), ready: t('readyLabel') }[phase];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${scene.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px) brightness(0.3)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-light text-white/90 tracking-[0.2em] mb-2">
            {scene.title}
          </h2>
          <p className="text-sm text-white/50 tracking-wide">{scene.description}</p>
        </div>

        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          {phase === 'ready' ? (
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="#4ade80" strokeWidth="2"
                strokeDasharray="226"
                strokeDashoffset="0"
                strokeLinecap="round"
                style={{ transformOrigin: '40px 40px' }}
                className="origin-center -rotate-90"
              />
              <polyline
                points="26,42 36,52 56,30"
                fill="none" stroke="#4ade80" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          ) : (
            <>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="absolute rounded-full border border-white/30"
                  style={{
                    width: `${20 + i * 28}px`,
                    height: `${20 + i * 28}px`,
                    animation: `pluse-ring 2s ease-out ${i * 0.4}s infinite`,
                  }}
                />
              ))}
            </>
          )}
        </div>

        <div className="flex flex-col items-center space-y-1">
          <span className="text-base text-white/80 font-light tracking-[0.15em] transition-all duration-500">
            {phaseLabel}
          </span>
          {phase !== 'ready' && (
            <span className="text-xs text-white/40 tracking-wide">{t('enteringScene')}</span>
          )}
        </div>
      </div>

      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ animation: 'scan-line 3s ease-in-out infinite', top: '30%' }}
      />

      <style>{`
        @keyframes pluse-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1); opacity: 0.15; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }
        @keyframes scan-line {
          0% { top: 30%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 70%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}