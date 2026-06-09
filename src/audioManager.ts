import { Howl, Howler } from 'howler';

class AudioManager {
  music: Howl | null = null;
  bg: Howl | null = null;
  musicVol: number = 0.5;
  bgVol: number = 0.5;
  bgSrc: string = '';

  musicSrc: string = '';

  init() {
    Howler.autoUnlock = true;
  }

  setMusic(src: string) {
    if (this.musicSrc === src && this.music) return;
    const wasPlaying = this.music?.playing();
    if (this.music) {
      this.music.unload();
      this.music = null;
    }
    this.musicSrc = src;
    if (!src) return;

    this.music = new Howl({
      src: [src],
      loop: true,
      html5: true,
      volume: this.musicVol
    });
    
    if (wasPlaying) {
      this.music.play();
    }
  }

  setBg(src: string) {
    if (this.bgSrc === src && this.bg) return;
    if (this.bg) {
      this.bg.unload();
    }
    this.bgSrc = src;
    if (!src) return;
    
    this.bg = new Howl({
      src: [src],
      loop: true,
      html5: true,
      volume: this.bgVol
    });
  }

  play() {
    if (this.music && !this.music.playing()) this.music.play();
    if (this.bg && !this.bg.playing()) this.bg.play();
  }

  pause() {
    if (this.music) this.music.pause();
    if (this.bg) this.bg.pause();
  }

  setMusicVolume(v: number) {
    this.musicVol = v;
    if (this.music) this.music.volume(v);
  }

  setBgVolume(v: number) {
    this.bgVol = v;
    if (this.bg) this.bg.volume(v);
  }

  stop() {
    if (this.music) this.music.stop();
    if (this.bg) this.bg.stop();
  }
}

export const audioManager = new AudioManager();
