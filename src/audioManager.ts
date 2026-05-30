// Web Audio API 内建音频合成——不依赖任何外部 URL

interface SetAudioOpts {
  onLoad?: () => void;
  onError?: () => void;
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 音乐合成器
let musicGain: GainNode | null = null;
let musicRunning = false;

// 背景音合成器
let bgGain: GainNode | null = null;
let bgSource: AudioBufferSourceNode | null = null;
let bgRunning = false;

class AudioManager {
  musicVol: number = 0.5;
  bgVol: number = 0.3;
  bgSrc: string = '';
  musicSrc: string = '';
  private _musicInterval: ReturnType<typeof setInterval> | null = null;

  init() {
    // 初始化 AudioContext（实际解锁依赖用户手势，在 App.tsx 中处理）
    getCtx();
  }

  setMusic(src: string, opts?: SetAudioOpts) {
    if (this.musicSrc === src) {
      opts?.onLoad?.();
      return;
    }
    this.stopMusic();
    this.musicSrc = src;
    if (!src) {
      opts?.onLoad?.();
      return;
    }
    setTimeout(() => opts?.onLoad?.(), 10);
  }

  setBg(src: string, opts?: SetAudioOpts) {
    if (this.bgSrc === src) {
      opts?.onLoad?.();
      return;
    }
    this.stopBg();
    this.bgSrc = src;
    if (!src) {
      opts?.onLoad?.();
      return;
    }
    setTimeout(() => opts?.onLoad?.(), 10);
  }

  play() {
    this.playMusic();
    this.playBg();
  }

  pause() {
    this.stopMusic();
    this.stopBg();
  }

  stop() {
    this.stopMusic();
    this.stopBg();
  }

  setMusicVolume(v: number) {
    this.musicVol = v;
    if (musicGain) musicGain.gain.setTargetAtTime(v, getCtx().currentTime, 0.1);
  }

  setBgVolume(v: number) {
    this.bgVol = v;
    if (bgGain) bgGain.gain.setTargetAtTime(v, getCtx().currentTime, 0.1);
  }

  // ---- Music Synthesizer ----
  private playMusic() {
    if (musicRunning) return;
    if (!this.musicSrc) return;
    const ctx = getCtx();

    musicGain = ctx.createGain();
    musicGain.gain.value = this.musicVol;
    musicGain.connect(ctx.destination);
    musicRunning = true;

    const musicType = this.musicSrc.includes('lofi') ? 'lofi'
      : this.musicSrc.includes('cafe') ? 'cafe'
      : this.musicSrc.includes('nature') ? 'nature'
      : this.musicSrc.includes('piano') || this.musicSrc.includes('focus') ? 'piano'
      : this.musicSrc.includes('clair') || this.musicSrc.includes('debussy') ? 'clair'
      : this.musicSrc.includes('gymnop') || this.musicSrc.includes('satie') ? 'gymnopedie'
      : 'none';

    if (musicType === 'none') { musicRunning = false; return; }

    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const sequences: Record<string, number[][]> = {
      gymnopedie: [[0, 2, 4, 1, 3, 5, 4, 2], [1.5, 1, 1.5, 1, 1, 1.5, 1, 1.5]],
      clair:      [[0, 3, 5, 3, 0, 4, 2, 0],  [2, 1, 1.5, 1, 1, 1.5, 1, 2]],
      lofi:       [[0, 1, 3, 2, 4, 3, 5, 4],  [1, 1, 1, 1, 1, 1, 1, 1]],
      piano:      [[0, 2, 4, 5, 3, 1, 2, 0],  [1, 1.5, 1, 1, 1, 1.5, 1, 1]],
      cafe:       [[0, 4, 3, 1, 2, 5, 4, 0],  [1.5, 1, 1, 1.5, 1, 1, 1, 1.5]],
      nature:     [[0, 2, 0, 4, 0, 2, 0, 5],  [2, 1, 2, 1, 2, 1, 2, 1]],
    };

    const [notes, durations] = sequences[musicType] || sequences.piano;
    let noteIdx = 0;
    let activeNodes: OscillatorNode[] = [];

    const playNote = () => {
      if (!musicRunning || !musicGain) return;
      activeNodes.forEach(n => { try { n.stop(); } catch {} });
      activeNodes = [];

      const freq = pentatonic[notes[noteIdx] % pentatonic.length];
      const dur = durations[noteIdx] * 0.6;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = freq;
      const env1 = ctx.createGain();
      env1.gain.setValueAtTime(0, ctx.currentTime);
      env1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      env1.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * 0.9);
      osc1.connect(env1);
      env1.connect(musicGain);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + dur + 0.1);
      activeNodes.push(osc1);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.5;
      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0, ctx.currentTime);
      env2.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.03);
      env2.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * 0.7);
      osc2.connect(env2);
      env2.connect(musicGain);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + dur + 0.1);
      activeNodes.push(osc2);

      noteIdx = (noteIdx + 1) % notes.length;
    };

    playNote();
    const interval = setInterval(() => {
      if (!musicRunning) { clearInterval(interval); return; }
      playNote();
    }, durations[noteIdx === 0 ? notes.length - 1 : noteIdx - 1] * 600);

    this._musicInterval = interval;
  }

  // ---- Background Sound Synthesizer ----
  private playBg() {
    if (bgRunning) return;
    if (!this.bgSrc) return;
    const ctx = getCtx();

    bgGain = ctx.createGain();
    bgGain.gain.value = this.bgVol;
    bgGain.connect(ctx.destination);
    bgRunning = true;

    const bgType = this.bgSrc.includes('bird') || this.bgSrc.includes('Bird') ? 'birds'
      : this.bgSrc.includes('rain') || this.bgSrc.includes('Rain') ? 'rain'
      : this.bgSrc.includes('wave') || this.bgSrc.includes('Ocean') || this.bgSrc.includes('ocean') ? 'ocean'
      : this.bgSrc.includes('keyboard') || this.bgSrc.includes('Keyboard') ? 'keyboard'
      : this.bgSrc.includes('forest') ? 'forest'
      : this.bgSrc.includes('city') || this.bgSrc.includes('City') ? 'city'
      : this.bgSrc.includes('silence') || this.bgSrc.includes('Silence') ? 'silence'
      : 'silence';

    switch (bgType) {
      case 'rain': this._playNoise(ctx, bgGain, { colour: 'pink', lowpass: 2000 }); break;
      case 'birds': this._playBirds(ctx, bgGain); break;
      case 'ocean': this._playOcean(ctx, bgGain); break;
      case 'keyboard': this._playKeyboard(ctx, bgGain); break;
      case 'forest': this._playForest(ctx, bgGain); break;
      case 'city': this._playCityDrone(ctx, bgGain); break;
      case 'silence': /* 无音频输出 */ break;
    }
  }

  private stopMusic() {
    musicRunning = false;
    if (this._musicInterval) { clearInterval(this._musicInterval); this._musicInterval = null; }
    if (musicGain) {
      musicGain.disconnect();
      musicGain = null;
    }
  }

  private stopBg() {
    bgRunning = false;
    if (bgSource) {
      try { bgSource.stop(); } catch {}
      bgSource = null;
    }
    if (bgGain) {
      bgGain.disconnect();
      bgGain = null;
    }
  }

  // ---- Ambient Sound Generators ----

  private _playNoise(ctx: AudioContext, out: GainNode, opts: { colour?: string; lowpass?: number }) {
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (opts.colour === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.05;
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = opts.lowpass || 2000;

    src.connect(filter);
    filter.connect(out);
    src.start();
    bgSource = src;
  }

  private _playBirds(ctx: AudioContext, out: GainNode) {
    const scheduleChirp = () => {
      if (!bgRunning || !bgGain) return;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const baseFreq = 2000 + Math.random() * 3000;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.15);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

      osc.connect(env);
      env.connect(out);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);

      setTimeout(scheduleChirp, 800 + Math.random() * 4000);
    };
    scheduleChirp();
  }

  private _playOcean(ctx: AudioContext, out: GainNode) {
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    lfoGain.connect(filter.frequency);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 50;

    src.connect(filter);
    filter.connect(filter2);
    filter2.connect(out);
    src.start();
    lfo.start();
    bgSource = src;
  }

  private _playKeyboard(ctx: AudioContext, out: GainNode) {
    const scheduleKey = () => {
      if (!bgRunning || !bgGain) return;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 800 + Math.random() * 400;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.005);
      env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.04);

      osc.connect(env);
      env.connect(out);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);

      setTimeout(scheduleKey, 200 + Math.random() * 600);
    };
    scheduleKey();
  }

  private _playForest(ctx: AudioContext, out: GainNode) {
    this._playNoise(ctx, out, { colour: 'pink', lowpass: 3000 });
    this._playBirds(ctx, out);
  }

  private _playCityDrone(ctx: AudioContext, out: GainNode) {
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.03;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    src.connect(filter);
    filter.connect(out);
    src.start();
    lfo.start();
    bgSource = src;
  }
}

export const audioManager = new AudioManager();
