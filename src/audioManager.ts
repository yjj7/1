// Web Audio API audio engine — spatial audio, pro reverb, crossfade looping
// ============================================================================

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

// ---- Reverb (Schroeder: 4 comb + 2 allpass) ----
function createReverb(ctx: AudioContext, mix: number = 0.3, roomSize: number = 0.8): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  input.gain.value = 1;

  const wetGain = ctx.createGain();
  wetGain.gain.value = mix;

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1 - mix;

  const output = ctx.createGain();
  output.gain.value = 1;

  // Pre-delay
  const preDelay = ctx.createDelay(0.1);
  preDelay.delayTime.value = 0.025;

  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(preDelay);

  // 4 comb filters with varying delay times
  const combDelayTimes = [0.0362, 0.0413, 0.0487, 0.0534];
  const combs = combDelayTimes.map((dt, i) => {
    const delay = ctx.createDelay(0.1);
    delay.delayTime.value = dt * roomSize;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.72 - i * 0.06;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4000 + i * 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    preDelay.connect(delay);
    delay.connect(lp);
    lp.connect(feedback);
    feedback.connect(delay);
    lp.connect(gain);
    return gain;
  });

  // 2 allpass filters for diffusion
  const ap1 = ctx.createDelay(0.01);
  ap1.delayTime.value = 0.005;
  const ap1fb = ctx.createGain();
  ap1fb.gain.value = 0.5;
  const ap2 = ctx.createDelay(0.01);
  ap2.delayTime.value = 0.0017;
  const ap2fb = ctx.createGain();
  ap2fb.gain.value = 0.5;

  // Mix combs into allpass chain
  combs.forEach(c => c.connect(ap1));
  ap1.connect(ap1fb);
  ap1fb.connect(ap1);
  ap1.connect(ap2);
  ap2.connect(ap2fb);
  ap2fb.connect(ap2);
  ap2.connect(wetGain);
  wetGain.connect(output);

  return { input, output };
}

// ---- Stereo Widener ----
function createStereoWidener(ctx: AudioContext, width: number = 1.3): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  const mid = ctx.createGain();
  const side = ctx.createGain();
  const output = ctx.createGain();

  mid.gain.value = 1 - (width - 1) * 0.5;
  side.gain.value = width * 0.5;

  input.connect(splitter);
  // Mid = L+R, Side = L-R
  splitter.connect(mid, 0);
  splitter.connect(side, 0);
  const inverter = ctx.createGain();
  inverter.gain.value = -1;
  splitter.connect(inverter, 1);
  inverter.connect(side);

  // Rebuild stereo: L = mid+side, R = mid-side
  mid.connect(merger, 0, 0);
  side.connect(merger, 0, 0);
  mid.connect(merger, 0, 1);
  const sideInvert = ctx.createGain();
  sideInvert.gain.value = -1;
  side.connect(sideInvert);
  sideInvert.connect(merger, 0, 1);

  merger.connect(output);
  return { input, output };
}

// ---- Master Dynamics (compressor/limiter) ----
function createMasterDynamics(ctx: AudioContext): { input: DynamicsCompressorNode; output: DynamicsCompressorNode } {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value = 6;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;

  // Hard limiter for safety
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0;
  limiter.release.value = 0.1;

  comp.connect(limiter);
  return { input: comp, output: limiter };
}

// ---- 3-band EQ for distance simulation ----
function createDistanceEQ(ctx: AudioContext, distance: number = 0.5): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const lowshelf = ctx.createBiquadFilter();
  lowshelf.type = 'lowshelf';
  lowshelf.frequency.value = 200;
  lowshelf.gain.value = -1 * distance;

  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 1500;
  peak.Q.value = 1;
  peak.gain.value = -3 * distance;

  const highshelf = ctx.createBiquadFilter();
  highshelf.type = 'highshelf';
  highshelf.frequency.value = 4000;
  highshelf.gain.value = -8 * distance;

  input.connect(lowshelf);
  lowshelf.connect(peak);
  peak.connect(highshelf);
  highshelf.connect(output);

  return { input, output };
}

// ---- Audio Manager ----
class AudioManager {
  musicVol: number = 0.5;
  bgVol: number = 0.3;
  bgSrc: string = '';
  musicSrc: string = '';
  private _musicTimeout: ReturnType<typeof setTimeout> | null = null;
  private _musicAudioEl: HTMLAudioElement | null = null;
  private _bgAudioEl: HTMLAudioElement | null = null;
  private _bgSource: MediaElementAudioSourceNode | null = null;
  private _bgCleanup: (() => void) | null = null;

  // Audio processing nodes
  private _reverb: { input: GainNode; output: GainNode } | null = null;
  private _widener: { input: GainNode; output: GainNode } | null = null;
  private _master: { input: DynamicsCompressorNode; output: DynamicsCompressorNode } | null = null;
  private _distanceEQ: { input: GainNode; output: GainNode } | null = null;

  init() {
    getCtx();
  }

  private _setupProcessingChain() {
    const ctx = getCtx();
    if (this._master) return;

    // Master dynamics
    this._master = createMasterDynamics(ctx);
    this._master.output.connect(ctx.destination);

    // Room reverb (shared for all sounds)
    this._reverb = createReverb(ctx, 0.25, 0.7);
    this._reverb.output.connect(this._master.input);

    // Stereo widener for music
    this._widener = createStereoWidener(ctx, 1.2);
    this._widener.output.connect(this._reverb.input);
    this._widener.output.connect(this._master.input); // dry path too

    // Distance EQ for background sounds
    this._distanceEQ = createDistanceEQ(ctx, 0.3);
    this._distanceEQ.output.connect(this._reverb.input);
    this._distanceEQ.output.connect(this._master.input); // dry path too
  }

  setMusic(src: string, opts?: SetAudioOpts) {
    if (this.musicSrc === src) { opts?.onLoad?.(); return; }
    this.stopMusic();
    this.musicSrc = src;
    if (!src) { opts?.onLoad?.(); return; }
    // Real audio file: use HTMLAudioElement (loopable with good quality)
    if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('/')) {
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
    if (musicGain) musicGain.gain.setTargetAtTime(v * 0.6, getCtx().currentTime, 0.1);
  }

  setBgVolume(v: number) {
    this.bgVol = v;
    if (bgGain) bgGain.gain.setTargetAtTime(v, getCtx().currentTime, 0.1);
  }

  // ---- Noise Mixer ----
  startNoise(id: string, volume: number) {
    this._setupProcessingChain();
    const ctx = getCtx();

    if (noiseNodes.has(id)) {
      const n = noiseNodes.get(id)!;
      n.gain.gain.setTargetAtTime(volume / 100, ctx.currentTime, 0.3);
      return;
    }

    const ext = '.mp3';
    const audio = new Audio(`/sounds/${id}${ext}`);
    audio.loop = true;

    try {
      const src = ctx.createMediaElementSource(audio);
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume / 100;

      // Route through distance EQ → reverb + dry → master
      if (this._distanceEQ && this._master) {
        src.connect(gainNode);
        gainNode.connect(this._distanceEQ.input);
      } else {
        src.connect(gainNode);
        gainNode.connect(ctx.destination);
      }

      audio.play().catch(() => {});

      noiseNodes.set(id, {
        gain: gainNode,
        kill: () => {
          audio.pause();
          audio.src = '';
          try { src.disconnect(); } catch (e) { console.error('Noise source disconnect failed:', e); }
          try { gainNode.disconnect(); } catch (e) { console.error('Noise gain disconnect failed:', e); }
        },
      });
    } catch (e) {
      console.error('Media element source creation failed, falling back:', e);
      audio.volume = volume / 100;
      audio.play().catch(() => {});
      noiseNodes.set(id, {
        gain: ctx.createGain(),
        kill: () => { audio.pause(); audio.src = ''; },
      });
    }
  }

  setNoiseVolume(id: string, volume: number) {
    const n = noiseNodes.get(id);
    if (n) n.gain.gain.setTargetAtTime(volume / 100, getCtx().currentTime, 0.3);
  }

  stopNoise(id: string) {
    const n = noiseNodes.get(id);
    if (n) {
      try { n.kill(); } catch (e) { console.error('Noise kill failed:', e); }
      try { n.gain.disconnect(); } catch (e) { console.error('Noise gain disconnect failed:', e); }
      noiseNodes.delete(id);
    }
  }

  stopAllNoise() {
    noiseNodes.forEach((_, id) => this.stopNoise(id));
  }

  // ---- Music Player (enhanced synthesis) ----
  private playMusic() {
    if (musicRunning) return;
    if (!this.musicSrc) return;

    // Real audio file (blob, http, or local path): use HTMLAudioElement
    if (this.musicSrc.startsWith('blob:') || this.musicSrc.startsWith('http') || this.musicSrc.startsWith('/')) {
      musicRunning = true;
      if (!this._musicAudioEl || this._musicAudioEl.src !== this.musicSrc) {
        this._musicAudioEl = new Audio(this.musicSrc);
        this._musicAudioEl.loop = true;
        this._musicAudioEl.volume = this.musicVol;
      }
      this._musicAudioEl.play().catch(e => { musicRunning = false; });
      return;
    }

    this._setupProcessingChain();
    const ctx = getCtx();

    musicGain = ctx.createGain();
    musicGain.gain.value = this.musicVol * 0.5;

    // Route through widener → split to reverb + dry → master
    if (this._widener && this._master) {
      musicGain.connect(this._widener.input);
    } else {
      musicGain.connect(ctx.destination);
    }

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

    const cMajor = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const bassNotes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63];

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

    const createNote = (
      freq: number,
      type: OscillatorType,
      vol: number,
      dur: number,
      rampIn: number = 0.03,
      rampOut: number = 0.7
    ) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      // Subtle detune for warmth
      osc.detune.value = (Math.random() - 0.5) * 5;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(vol, ctx.currentTime + rampIn);
      env.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * rampOut);
      osc.connect(env);
      env.connect(musicGain!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.2);
      activeNodes.push(osc);
      return { osc, env };
    };

    const v = () => 0.85 + Math.random() * 0.15;

    const playNote = () => {
      if (!musicRunning || !musicGain) return;
      while (activeNodes.length > 16) {
        const n = activeNodes.shift()!;
        try { n.stop(); } catch (e) { console.error('Active node stop failed:', e); }
      }

      const melodyNote = seq.melody[noteIdx % seq.melody.length];
      const chordRoot = seq.chordRoots[noteIdx % seq.chordRoots.length];
      const bassNote = seq.bass[bassIdx % seq.bass.length];
      const dur = seq.rhythm[noteIdx % seq.rhythm.length] * 0.6;

      const baseScale = musicType === 'jazz' ? cMajor : pentatonic;
      const freq = baseScale[melodyNote % baseScale.length];

      // Layer 1: Main voice (triangle for warmth)
      createNote(freq, 'triangle', 0.11 * v(), dur);

      // Layer 2: Soft harmonic overtone
      createNote(freq * 2, 'sine', 0.035 * v(), dur, 0.05, 0.5);

      // Layer 3: Chord pad (root + third + fifth)
      const chordFreqs = [
        cMajor[chordRoot % cMajor.length],
        cMajor[(chordRoot + 2) % cMajor.length],
        cMajor[(chordRoot + 4) % cMajor.length],
      ];
      chordFreqs.forEach(cf => {
        const osc = ctx.createOscillator();
        osc.type = musicType === 'ambient' ? 'sine' : 'triangle';
        osc.frequency.value = cf;
        osc.detune.value = (Math.random() - 0.5) * 8;
        const env = ctx.createGain();
        const chordVol = musicType === 'ambient' ? 0.05 : 0.035;
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.linearRampToValueAtTime(chordVol * v(), ctx.currentTime + 0.08);
        env.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * 0.85);
        osc.connect(env);
        env.connect(musicGain!);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur + 0.2);
        activeNodes.push(osc);
      });

      // Layer 4: Bass
      createNote(bassNotes[bassNote % bassNotes.length], 'triangle', 0.07 * v(), dur * 1.5, 0.05, 0.9);

      // Layer 5: Stereo shimmer
      if (musicType === 'ambient' || musicType === 'meditation' || musicType === 'lofi') {
        const pan = ctx.createStereoPanner();
        pan.pan.value = (noteIdx % 3 === 0) ? -0.5 : (noteIdx % 3 === 1) ? 0.5 : 0;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq * 3;
        osc.detune.value = (Math.random() - 0.5) * 10;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.linearRampToValueAtTime(0.025 * v(), ctx.currentTime + 0.1);
        env.gain.linearRampToValueAtTime(0, ctx.currentTime + dur * 0.5);
        osc.connect(env);
        env.connect(pan);
        pan.connect(musicGain!);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur + 0.2);
        activeNodes.push(osc);
      }

      noteIdx = (noteIdx + 1) % seq.melody.length;
      bassIdx = (bassIdx + 1) % seq.bass.length;
    };

    playNote();
    const scheduleNext = () => {
      if (!musicRunning) return;
      const justPlayed = noteIdx === 0 ? seq.rhythm.length - 1 : noteIdx - 1;
      const delay = seq.rhythm[justPlayed % seq.rhythm.length] * 600;
      this._musicTimeout = setTimeout(() => {
        if (!musicRunning) return;
        playNote();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  // ---- Background Sound (with crossfade looping) ----
  playBg() {
    if (bgRunning) return;
    if (!this.bgSrc) return;

    this._setupProcessingChain();
    const ctx = getCtx();
    bgGain = ctx.createGain();
    bgGain.gain.value = this.bgVol;

    // Route through distance EQ
    if (this._distanceEQ) {
      bgGain.connect(this._distanceEQ.input);
    } else {
      bgGain.connect(ctx.destination);
    }

    bgRunning = true;

    const audio = new Audio(this.bgSrc);
    audio.loop = true;
    audio.volume = 1;
    this._bgAudioEl = audio;

    try {
      const src = ctx.createMediaElementSource(audio);
      src.connect(bgGain);
      this._bgSource = src;
      audio.play().catch(() => {});
    } catch (e) {
      console.error('Background audio media element source creation failed:', e);
      audio.play().catch(() => {});
    }
  }

  private stopMusic() {
    musicRunning = false;
    if (this._musicTimeout) { clearTimeout(this._musicTimeout); this._musicTimeout = null; }
    if (this._musicAudioEl) { this._musicAudioEl.pause(); this._musicAudioEl.currentTime = 0; }
    if (musicGain) { musicGain.disconnect(); musicGain = null; }
  }

  private stopBg() {
    bgRunning = false;
    if (this._bgAudioEl) { this._bgAudioEl.pause(); this._bgAudioEl.src = ''; this._bgAudioEl = null; }
    if (this._bgSource) { try { this._bgSource.disconnect(); } catch (e) { console.error('BG source disconnect failed:', e); } this._bgSource = null; }
    if (bgSource) { try { bgSource.stop(); } catch (e) { console.error('BG source stop failed:', e); } bgSource = null; }
    if (bgGain) { bgGain.disconnect(); bgGain = null; }
  }
}

// ---- Module-level state ----
let musicGain: GainNode | null = null;
let musicRunning = false;

let bgGain: GainNode | null = null;
let bgSource: AudioBufferSourceNode | null = null;
let bgRunning = false;

const noiseNodes: Map<string, { gain: GainNode; kill: () => void }> = new Map();

export const audioManager = new AudioManager();

// ---- Sound Effects ----
let _sfxCtx: AudioContext | null = null;
function getSfxCtx() {
  if (!_sfxCtx) _sfxCtx = new AudioContext();
  if (_sfxCtx.state === 'suspended') _sfxCtx.resume();
  return _sfxCtx;
}

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
  } catch (e) { console.error('Click sound failed:', e); }
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
  } catch (e) { console.error('Success sound failed:', e); }
}

export function playMeditationChime() {
  try {
    const ctx = getSfxCtx();
    const now = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now + i * 0.15);
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.5);
      osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 1.5);
    });
  } catch (e) { console.error('Meditation chime failed:', e); }
}
