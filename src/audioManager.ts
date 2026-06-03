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
  startNoise(id: string, volume: number) {
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
    }
  }

  stopAllNoise() {
    noiseNodes.forEach((_, id) => this.stopNoise(id));
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

    // === Reverb ===
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;
    const delays: DelayNode[] = [];
    const dTimes = [0.043, 0.057, 0.073, 0.091, 0.107];
    dTimes.forEach((dt, i) => {
      const d = ctx.createDelay(0.2);
      d.delayTime.value = dt;
      const g = ctx.createGain();
      g.gain.value = 0.18 / (i + 1);
      d.connect(g);
      g.connect(d); // feedback loop
      g.connect(reverbGain);
      delays.push(d);
    });
    reverbGain.connect(ctx.destination);

    // Dry mix
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.7;
    dryGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = this.musicVol * 0.6;
    musicGain.connect(dryGain);
    delays.forEach(d => musicGain!.connect(d));
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

    // Scales: C major, pentatonic, and minor variations
    const cMajor = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    // Pentatonic: C D E G A C D E
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    // Bass octave
    const bassNotes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63];

    // Extended sequences with chord progressions
    const sequences: Record<string, { melody: number[]; rhythm: number[]; bass: number[]; chordRoots: number[] }> = {
      gymnopedie: {
        melody: [0,2,4,5,7,6,4,2, 0,2,4,1,3,5,4,2],
        rhythm: [1.5,1,1.5,1,2,1,1.5,0.5, 1.5,1,1,1.5,1,1,1.5,1],
        bass:    [0,0,3,3,4,4,3,3],
        chordRoots: [0,3,4,5,0,3,2,0],
      },
      clair: {
        melody: [0,3,5,7,6,4,2,0, 3,5,6,7,5,3,2,0],
        rhythm: [2,1,1.5,1,1,1.5,1,2, 2,1,1,1.5,1,1,1,2],
        bass:    [0,3,4,0,4,2,3,0],
        chordRoots: [0,4,5,3,0,4,2,0],
      },
      lofi: {
        melody: [0,1,3,4,2,3,5,4, 3,1,2,4,0,3,1,0],
        rhythm: [0.75,0.75,1,0.75,0.75,1,0.75,0.75, 1,0.75,0.75,1,0.75,0.75,1,1],
        bass:    [0,0,3,3,4,4,0,0],
        chordRoots: [0,3,4,5,0,3,4,0],
      },
      piano: {
        melody: [0,2,4,5,7,6,4,2, 0,3,5,7,5,3,2,0],
        rhythm: [1,1.5,1,1,2,1,1.5,0.5, 1,1,1.5,1,1,1,1.5,1],
        bass:    [0,3,4,5,0,3,2,0],
        chordRoots: [0,3,4,5,0,3,2,0],
      },
      jazz: {
        melody: [0,4,6,2,3,5,7,1, 0,4,3,6,5,2,7,0],
        rhythm: [1,0.75,1.5,0.75,1,1,1.5,0.5, 0.75,1,0.75,1,0.75,1,0.75,1.5],
        bass:    [0,3,4,5,0,3,2,0],
        chordRoots: [0,3,4,2,0,3,6,0],
      },
      ambient: {
        melody: [0,0,2,2,4,4,5,5, 3,3,5,5,2,2,0,0],
        rhythm: [3,2,3,2,2,3,2,3, 3,2,3,2,2,3,2,3],
        bass:    [0,0,4,4,5,5,2,2],
        chordRoots: [0,0,4,4,5,5,2,2],
      },
      guitar: {
        melody: [0,2,4,5,3,1,2,4, 0,4,2,5,3,6,4,0],
        rhythm: [0.5,0.5,1,0.5,0.5,1,0.5,0.5, 1,0.5,0.5,1,0.5,0.5,1,1],
        bass:    [0,3,4,2,3,0,4,0],
        chordRoots: [0,4,5,3,4,0,2,0],
      },
      meditation: {
        melody: [0,0,0,2,0,0,2,4, 2,0,2,4,0,0,0,0],
        rhythm: [4,3,4,3,4,3,4,3, 4,3,4,3,4,3,4,3],
        bass:    [0,0,0,0,2,2,0,0],
        chordRoots: [0,0,0,0,4,4,0,0],
      },
      cafe: {
        melody: [0,4,3,5,1,2,5,4, 0,3,5,4,2,0,4,3],
        rhythm: [1.5,1,1,1.5,1,1,1,1.5, 1,1,1.5,1,1,1.5,1,1],
        bass:    [0,4,3,5,0,2,4,3],
        chordRoots: [0,4,3,5,0,2,4,3],
      },
      nature: {
        melody: [0,2,0,4,0,2,0,5, 0,2,0,4,0,3,0,0],
        rhythm: [2,1,2,1,2,1,2,1, 2,1,2,1,2,1,2,1],
        bass:    [0,0,4,4,0,0,2,0],
        chordRoots: [0,0,4,4,0,0,2,0],
      },
    };

    const seq = sequences[musicType] || sequences.piano;
    let noteIdx = 0;
    let bassIdx = 0;
    const activeNodes: AudioScheduledSourceNode[] = [];

    // Helper: create a note with envelope
    const createNote = (freq: number, type: OscillatorType, vol: number, dur: number, rampIn: number = 0.03, rampOut: number = 0.7) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(vol, ctx.currentTime + rampIn);
      env.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * rampOut);
      osc.connect(env);
      env.connect(musicGain!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.15);
      activeNodes.push(osc);
      return { osc, env };
    };

    // Velocity jitter
    const v = () => 0.85 + Math.random() * 0.15;

    const playNote = () => {
      if (!musicRunning || !musicGain) return;
      // Clean old nodes (keep last 12)
      while (activeNodes.length > 12) {
        const n = activeNodes.shift()!;
        try { n.stop(); } catch {}
      }

      const melodyNote = seq.melody[noteIdx % seq.melody.length];
      const chordRoot = seq.chordRoots[noteIdx % seq.chordRoots.length];
      const bassNote = seq.bass[bassIdx % seq.bass.length];
      const dur = seq.rhythm[noteIdx % seq.rhythm.length] * 0.6;

      const baseScale = musicType === 'jazz' ? cMajor : pentatonic;
      const freq = baseScale[melodyNote % baseScale.length];

      // Layer 1: Main voice (softer triangle for piano-like warmth)
      createNote(freq, 'triangle', 0.12 * v(), dur);

      // Layer 2: Harmonics (sine, softer)
      createNote(freq * 2, 'sine', 0.04 * v(), dur, 0.05, 0.5);

      // Layer 3: Chord - root + third + fifth
      const chordFreqs = [
        cMajor[chordRoot % cMajor.length],
        cMajor[(chordRoot + 2) % cMajor.length],
        cMajor[(chordRoot + 4) % cMajor.length],
      ];
      chordFreqs.forEach(cf => {
        const osc = ctx.createOscillator();
        osc.type = musicType === 'ambient' ? 'sine' : 'triangle';
        osc.frequency.value = cf;
        const env = ctx.createGain();
        const chordVol = musicType === 'ambient' ? 0.06 : 0.04;
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.linearRampToValueAtTime(chordVol * v(), ctx.currentTime + 0.08);
        env.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * 0.8);
        osc.connect(env);
        env.connect(musicGain!);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur + 0.15);
        activeNodes.push(osc);
      });

      // Layer 4: Bass (lower octave, triangle)
      createNote(bassNotes[bassNote % bassNotes.length], 'triangle', 0.08 * v(), dur * 1.5, 0.05, 0.9);

      // Layer 5: Stereo shimmer (for ambient/lofi types)
      if (musicType === 'ambient' || musicType === 'meditation' || musicType === 'lofi') {
        const pan = ctx.createStereoPanner();
        pan.pan.value = (noteIdx % 3 === 0) ? -0.4 : (noteIdx % 3 === 1) ? 0.4 : 0;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq * 3;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.linearRampToValueAtTime(0.03 * v(), ctx.currentTime + 0.1);
        env.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * 0.5);
        osc.connect(env);
        env.connect(pan);
        pan.connect(musicGain!);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur + 0.15);
        activeNodes.push(osc);
      }

      noteIdx = (noteIdx + 1) % seq.melody.length;
      bassIdx = (bassIdx + 1) % seq.bass.length;
    };

    playNote();
    const interval = setInterval(() => {
      if (!musicRunning) { clearInterval(interval); return; }
      playNote();
    }, seq.rhythm[(noteIdx === 0 ? seq.rhythm.length - 1 : noteIdx - 1) % seq.rhythm.length] * 600);
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
