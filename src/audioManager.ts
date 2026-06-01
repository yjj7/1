// Web Audio API 内建音频合成 + HTMLAudioElement 支持 + 白噪音混合器

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

// 白噪音混合器节点
const noiseNodes: Map<string, { source: AudioBufferSourceNode; gain: GainNode; filter?: BiquadFilterNode }> = new Map();
let noiseMasterGain: GainNode | null = null;

class AudioManager {
  musicVol: number = 0.5;
  bgVol: number = 0.3;
  bgSrc: string = '';
  musicSrc: string = '';
  private _musicInterval: ReturnType<typeof setInterval> | null = null;
  private _musicAudioEl: HTMLAudioElement | null = null;

  init() {
    getCtx();
  }

  setMusic(src: string, opts?: SetAudioOpts) {
    if (this.musicSrc === src) { opts?.onLoad?.(); return; }
    this.stopMusic();
    this.musicSrc = src;
    if (!src) { opts?.onLoad?.(); return; }
    if (src.startsWith('blob:') || src.startsWith('http')) {
      const audio = new Audio(src);
      audio.addEventListener('canplaythrough', () => opts?.onLoad?.(), { once: true });
      audio.addEventListener('error', () => opts?.onError?.(), { once: true });
      audio.load();
    } else {
      setTimeout(() => opts?.onLoad?.(), 10);
    }
  }

  setBg(src: string, opts?: SetAudioOpts) {
    if (this.bgSrc === src) { opts?.onLoad?.(); return; }
    this.stopBg();
    this.bgSrc = src;
    if (!src) { opts?.onLoad?.(); return; }
    setTimeout(() => opts?.onLoad?.(), 10);
  }

  play() { this.playMusic(); this.playBg(); }
  pause() { this.stopMusic(); this.stopBg(); }
  stop() { this.stopMusic(); this.stopBg(); }

  setMusicVolume(v: number) {
    this.musicVol = v;
    if (this._musicAudioEl) this._musicAudioEl.volume = v;
    if (musicGain) musicGain.gain.setTargetAtTime(v, getCtx().currentTime, 0.1);
  }

  setBgVolume(v: number) {
    this.bgVol = v;
    if (bgGain) bgGain.gain.setTargetAtTime(v, getCtx().currentTime, 0.1);
  }

  // ---- Noise Mixer ----
  private _noiseCount = 0;
  private _maxNoise = 5;

  startNoise(id: string, volume: number) {
    if (this._noiseCount >= this._maxNoise) {
      console.warn(`[NoiseMixer] Max ${this._maxNoise} simultaneous noises reached, ignoring "${id}"`);
      return;
    }
    const ctx = getCtx();
    if (!noiseMasterGain) {
      noiseMasterGain = ctx.createGain();
      noiseMasterGain.gain.value = 1;
      noiseMasterGain.connect(ctx.destination);
    }
    if (noiseNodes.has(id)) {
      const n = noiseNodes.get(id)!;
      n.gain.gain.setTargetAtTime(volume / 100, ctx.currentTime, 0.3);
      return;
    }
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (id === 'pink' || id === 'rain' || id === 'cafe' || id === 'forest') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random()*2-1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.969*b2+w*0.153852;
        b3=0.8665*b3+w*0.3104856; b4=0.55*b4+w*0.5329522; b5=-0.7616*b5-w*0.016898;
        data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.05; b6=w*0.115926;
      }
    } else if (id === 'brown') {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random()*2-1;
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random()*2-1)*0.05;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = volume / 100;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const freqMap: Record<string, number> = {
      rain: 2000, thunder: 500, fire: 800, wind: 600, birds: 5000,
      ocean: 400, cafe: 2000, keyboard: 3000, forest: 3000,
      white: 8000, pink: 4000, brown: 300,
    };
    filter.frequency.value = freqMap[id] || 2000;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(noiseMasterGain);
    src.start();
    noiseNodes.set(id, { source: src, gain, filter });
    this._noiseCount++;
  }

  setNoiseVolume(id: string, volume: number) {
    const n = noiseNodes.get(id);
    if (n) n.gain.gain.setTargetAtTime(volume / 100, getCtx().currentTime, 0.3);
  }

  stopNoise(id: string) {
    const n = noiseNodes.get(id);
    if (n) {
      try { n.source.stop(); } catch {}
      n.gain.disconnect();
      noiseNodes.delete(id);
      this._noiseCount = Math.max(0, this._noiseCount - 1);
    }
  }

  stopAllNoise() {
    noiseNodes.forEach((_, id) => this.stopNoise(id));
    this._noiseCount = 0;
  }

  // ---- Fade Transitions ----
  fadeToScene(newMusicSrc: string, newBgSrc: string, duration = 0.8) {
    if (musicGain) musicGain.gain.linearRampToValueAtTime(0, getCtx().currentTime + duration);
    if (bgGain) bgGain.gain.linearRampToValueAtTime(0, getCtx().currentTime + duration);
    setTimeout(() => { this.stopMusic(); this.stopBg(); }, duration * 1000);
    setTimeout(() => {
      this.setMusic(newMusicSrc);
      this.setBg(newBgSrc);
      setTimeout(() => this.play(), 150);
    }, duration * 1000 + 100);
  }

  // ---- Music Player ----
  private playMusic() {
    if (musicRunning) return;
    if (!this.musicSrc) return;

    if (this.musicSrc.startsWith('blob:') || this.musicSrc.startsWith('http')) {
      musicRunning = true;
      if (!this._musicAudioEl || this._musicAudioEl.src !== this.musicSrc) {
        this._musicAudioEl = new Audio(this.musicSrc);
        this._musicAudioEl.loop = true;
        this._musicAudioEl.volume = this.musicVol;
      }
      this._musicAudioEl.play().catch(e => { console.warn('Music play failed:', e); musicRunning = false; });
      return;
    }

    const ctx = getCtx();
    musicGain = ctx.createGain();
    musicGain.gain.value = this.musicVol;
    musicGain.connect(ctx.destination);
    musicRunning = true;

    const musicType = this.musicSrc.includes('lofi') ? 'lofi'
      : this.musicSrc.includes('cafe') ? 'cafe'
      : this.musicSrc.includes('nature') ? 'nature'
      : this.musicSrc.includes('piano') || this.musicSrc.includes('focus') ? 'piano'
      : this.musicSrc.includes('jazz') ? 'jazz'
      : this.musicSrc.includes('ambient') ? 'ambient'
      : this.musicSrc.includes('guitar') ? 'guitar'
      : this.musicSrc.includes('meditation') ? 'meditation'
      : this.musicSrc.includes('clair') || this.musicSrc.includes('debussy') ? 'clair'
      : this.musicSrc.includes('gymnop') || this.musicSrc.includes('satie') ? 'gymnopedie'
      : 'none';

    if (musicType === 'none') { musicRunning = false; return; }

    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const sequences: Record<string, number[][]> = {
      gymnopedie: [[0,2,4,1,3,5,4,2],[1.5,1,1.5,1,1,1.5,1,1.5]],
      clair: [[0,3,5,3,0,4,2,0],[2,1,1.5,1,1,1.5,1,2]],
      lofi: [[0,1,3,2,4,3,5,4],[1,1,1,1,1,1,1,1]],
      piano: [[0,2,4,5,3,1,2,0],[1,1.5,1,1,1,1.5,1,1]],
      cafe: [[0,4,3,1,2,5,4,0],[1.5,1,1,1.5,1,1,1,1.5]],
      nature: [[0,2,0,4,0,2,0,5],[2,1,2,1,2,1,2,1]],
      jazz: [[0,4,2,5,1,3,0,6],[1.5,0.75,1.5,0.75,1,1,1.5,0.75]],
      ambient: [[0,0,2,2,4,4,2,0],[3,2,3,2,2,3,2,3]],
      guitar: [[0,2,4,2,0,3,5,3],[1,0.5,1,0.5,1,0.5,1,0.5]],
      meditation: [[0,0,0,0,2,2,0,0],[4,3,4,3,4,3,4,3]],
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
      osc2.frequency.value = musicType === 'jazz' ? freq * 1.414 : freq * 1.5;
      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0, ctx.currentTime);
      env2.gain.linearRampToValueAtTime(musicType === 'ambient' ? 0.08 : 0.05, ctx.currentTime + 0.03);
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

  // ---- Background Sound ----
  private playBg() {
    if (bgRunning) return;
    if (!this.bgSrc) return;
    const ctx = getCtx();
    bgGain = ctx.createGain();
    bgGain.gain.value = this.bgVol;
    bgGain.connect(ctx.destination);
    bgRunning = true;

    const bgType = this.bgSrc.includes('bird') ? 'birds'
      : this.bgSrc.includes('rain') ? 'rain'
      : this.bgSrc.includes('ocean') ? 'ocean'
      : this.bgSrc.includes('keyboard') ? 'keyboard'
      : this.bgSrc.includes('forest') ? 'forest'
      : this.bgSrc.includes('city') ? 'city'
      : 'silence';

    switch (bgType) {
      case 'rain': this._playNoise(ctx, bgGain, 'pink', 2000); break;
      case 'birds': this._playBirds(ctx, bgGain); break;
      case 'ocean': this._playOcean(ctx, bgGain); break;
      case 'keyboard': this._playKeyboard(ctx, bgGain); break;
      case 'forest': this._playNoise(ctx, bgGain, 'pink', 3000); this._playBirds(ctx, bgGain); break;
      case 'city': this._playNoise(ctx, bgGain, 'pink', 300); break;
    }
  }

  private stopMusic() {
    musicRunning = false;
    if (this._musicInterval) { clearInterval(this._musicInterval); this._musicInterval = null; }
    if (this._musicAudioEl) { this._musicAudioEl.pause(); this._musicAudioEl.currentTime = 0; }
    if (musicGain) { musicGain.disconnect(); musicGain = null; }
  }

  private stopBg() {
    bgRunning = false;
    if (bgSource) { try { bgSource.stop(); } catch {} bgSource = null; }
    if (bgGain) { bgGain.disconnect(); bgGain = null; }
  }

  private _playNoise(ctx: AudioContext, out: GainNode, colour: string, lowpass: number) {
    const sz = 4 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d = buf.getChannelData(0);
    if (colour === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i=0;i<sz;i++){const w=Math.random()*2-1;b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.969*b2+w*0.153852;b3=0.8665*b3+w*0.3104856;b4=0.55*b4+w*0.5329522;b5=-0.7616*b5-w*0.016898;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.05;b6=w*0.115926;}
    } else {
      for (let i=0;i<sz;i++) d[i]=(Math.random()*2-1)*0.05;
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = lowpass;
    src.connect(filter); filter.connect(out); src.start();
    bgSource = src;
  }

  private _playBirds(ctx: AudioContext, out: GainNode) {
    const go = () => {
      if (!bgRunning||!bgGain) return;
      const osc = ctx.createOscillator(); osc.type = 'sine';
      const f = 2000+Math.random()*3000;
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f*1.3, ctx.currentTime+0.08);
      osc.frequency.exponentialRampToValueAtTime(f*0.8, ctx.currentTime+0.15);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.08, ctx.currentTime+0.02);
      env.gain.linearRampToValueAtTime(0, ctx.currentTime+0.2);
      osc.connect(env); env.connect(out); osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.25);
      setTimeout(go, 800+Math.random()*4000);
    };
    go();
  }

  private _playOcean(ctx: AudioContext, out: GainNode) {
    const sz=4*ctx.sampleRate; const buf=ctx.createBuffer(1,sz,ctx.sampleRate); const d=buf.getChannelData(0);
    for(let i=0;i<sz;i++) d[i]=(Math.random()*2-1)*0.1;
    const src=ctx.createBufferSource(); src.buffer=buf; src.loop=true;
    const lfo=ctx.createOscillator(); lfo.frequency.value=0.12;
    const lfoG=ctx.createGain(); lfoG.gain.value=200; lfo.connect(lfoG);
    const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=400; lfoG.connect(f.frequency);
    const f2=ctx.createBiquadFilter(); f2.type='highpass'; f2.frequency.value=50;
    src.connect(f); f.connect(f2); f2.connect(out); src.start(); lfo.start();
    bgSource=src;
  }

  private _playKeyboard(ctx: AudioContext, out: GainNode) {
    const go=()=>{
      if(!bgRunning||!bgGain) return;
      const osc=ctx.createOscillator(); osc.type='triangle'; osc.frequency.value=800+Math.random()*400;
      const env=ctx.createGain();
      env.gain.setValueAtTime(0,ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.06,ctx.currentTime+0.005);
      env.gain.linearRampToValueAtTime(0,ctx.currentTime+0.04);
      osc.connect(env); env.connect(out); osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.06);
      setTimeout(go, 200+Math.random()*600);
    };
    go();
  }
}

export const audioManager = new AudioManager();

// Sound Effects
let _sfxCtx: AudioContext | null = null;
function getSfxCtx() { if (!_sfxCtx) _sfxCtx = new AudioContext(); if (_sfxCtx.state === 'suspended') _sfxCtx.resume(); return _sfxCtx; }

export function playClickSound() {
  try {
    const ctx = getSfxCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

export function playSuccessSound() {
  try {
    const ctx = getSfxCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.start(ctx.currentTime + i * 0.12); osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch {}
}

export function playEndChime() {
  try {
    const ctx = getSfxCtx();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t); osc.stop(t + 0.6);
    });
  } catch {}
}
