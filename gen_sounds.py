#!/usr/bin/env python3
"""Generate high-quality environmental sound WAV files for StudyWithMe AI.
120-second loops at 44.1kHz, 16-bit mono/stereo, with internal variation."""

import math
import random
import struct
import os
from pathlib import Path

SR = 44100  # CD quality
DUR = 120   # 2-minute loops
TOTAL = SR * DUR
OUT = Path(os.environ.get("GEN_SOUNDS_OUT", str(Path(__file__).resolve().parent / "public" / "sounds")))
OUT.mkdir(parents=True, exist_ok=True)

# ---- Audio primitives ----

def write_wav(path, samples):
    """Write 16-bit mono WAV."""
    n = len(samples)
    with open(path, 'wb') as f:
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + n * 2))
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write(struct.pack('<IHHIIHH', 16, 1, 1, SR, SR * 2, 2, 16))
        f.write(b'data')
        f.write(struct.pack('<I', n * 2))
        max_val = 32767
        for s in samples:
            clipped = max(-1.0, min(1.0, s))
            f.write(struct.pack('<h', int(clipped * max_val)))

def normalize(samples, target_peak=0.95):
    peak = max(abs(min(samples)), abs(max(samples)))
    if peak == 0:
        return samples
    scale = target_peak / peak
    return [s * scale for s in samples]

def pink_noise(n):
    """Improved Voss-McCartney pink noise."""
    samples = [0.0] * n
    b = [0.0] * 7
    for i in range(n):
        w = random.random() * 2 - 1
        b[0] = 0.99886 * b[0] + w * 0.0555179
        b[1] = 0.99332 * b[1] + w * 0.0750759
        b[2] = 0.969 * b[2] + w * 0.153852
        b[3] = 0.8665 * b[3] + w * 0.3104856
        b[4] = 0.55 * b[4] + w * 0.5329522
        b[5] = -0.7616 * b[5] - w * 0.016898
        b[6] = w * 0.115926
        samples[i] = (sum(b) + w * 0.5362) * 0.11
    return samples

def white_noise(n):
    return [random.random() * 2 - 1 for _ in range(n)]

def brown_noise(n):
    samples = [0.0] * n
    last = 0.0
    for i in range(n):
        w = random.random() * 2 - 1
        last = (last + 0.02 * w) / 1.02
        samples[i] = last * 3.5
    return samples

def apply_lowpass(samples, cutoff):
    """2-pole lowpass filter (smoother than 1-pole)."""
    alpha = cutoff / (cutoff + SR)
    out = [0.0] * len(samples)
    prev1 = prev2 = samples[0] if samples else 0
    for i, s in enumerate(samples):
        prev1 = prev1 + alpha * (s - prev1)
        prev2 = prev2 + alpha * (prev1 - prev2)
        out[i] = prev2
    return out

def apply_highpass(samples, cutoff):
    """2-pole highpass filter."""
    alpha = cutoff / (cutoff + SR)
    out = [0.0] * len(samples)
    for i in range(len(samples)):
        if i == 0:
            out[i] = samples[i]
        elif i == 1:
            out[i] = alpha * (out[i-1] + samples[i] - samples[i-1])
        else:
            out[i] = alpha * (alpha * (out[i-1] + samples[i] - samples[i-1]) +
                              (1-alpha) * (out[i-1] - out[i-2]))
    return out

def apply_bandpass(samples, low, high):
    return apply_highpass(apply_lowpass(samples, high), low)

def fade_in(samples, duration_samples):
    ds = int(duration_samples)
    out = samples[:]
    for i in range(min(ds, len(samples))):
        out[i] *= i / ds
    return out

def fade_out(samples, duration_samples):
    ds = int(duration_samples)
    out = samples[:]
    n = len(samples)
    for i in range(min(ds, n)):
        out[n - ds + i] *= (ds - i) / ds
    return out

def envelope_adsr(samples, attack, decay, sustain, release):
    """ADSR envelope for a buffer."""
    n = len(samples)
    a = min(attack, n)
    d = min(attack + decay, n)
    r_start = max(n - release, attack + decay)
    out = [0.0] * n
    for i in range(n):
        if i < a:
            env = i / a if a > 0 else 1
        elif i < d:
            env = 1.0 - (1.0 - sustain) * (i - a) / decay if decay > 0 else sustain
        elif i < r_start:
            env = sustain
        else:
            env = sustain * (1.0 - (i - r_start) / release) if release > 0 else 0
        out[i] = samples[i] * env
    return out

def mix_layers(layers, weights=None):
    """Mix multiple sample arrays with optional weights."""
    if not layers:
        return [0.0] * TOTAL
    n = min(len(l) for l in layers)
    result = [0.0] * n
    if weights is None:
        weights = [1.0] * len(layers)
    for samples, w in zip(layers, weights):
        for i in range(n):
            result[i] += samples[i] * w
    return result

# ---- Sound generators ----

def gen_rain():
    print("Generating rain (high quality, 120s)...")
    s = [0.0] * TOTAL
    # Layer 1: Steady rain sheet (pink noise, lowpass ~3kHz)
    bg = pink_noise(TOTAL)
    bg = apply_lowpass(bg, 3000)
    for i in range(TOTAL):
        # Gentle slow amplitude modulation for "weather changes"
        t = i / SR
        mod = 0.85 + 0.15 * math.sin(2 * math.pi * 0.015 * t + 1.3) * math.sin(2 * math.pi * 0.031 * t)
        s[i] = bg[i] * 0.2 * mod

    # Layer 2: Medium drops (filtered higher, shorter decay)
    pos = 0
    while pos < TOTAL - 400:
        dur = 200 + int(random.expovariate(1 / 300))
        amp = 0.3 + random.random() * 0.4
        for j in range(min(dur, TOTAL - pos)):
            decay = math.exp(-j / (dur * 0.12))
            s[pos + j] += random.random() * amp * decay * 0.25
        pos += random.randint(40, 150)

    # Layer 3: Heavy splashes (occasional)
    pos = 0
    while pos < TOTAL - 600:
        pos += random.randint(3000, 12000)
        if pos >= TOTAL:
            break
        dur = 300 + int(random.expovariate(1 / 200))
        amp = 0.5 + random.random() * 0.5
        for j in range(min(dur, TOTAL - pos)):
            decay = math.exp(-j / (dur * 0.15))
            # Water splash has some low end too
            splash = (random.random() * 2 - 1) * decay * amp
            s[pos + j] += splash * 0.3
        # Small secondary splash
        pos2 = pos + random.randint(30, 100)
        for j in range(min(100, TOTAL - pos2)):
            decay = math.exp(-j / 15)
            s[pos2 + j] += (random.random() * 2 - 1) * amp * decay * 0.15

    s = apply_bandpass(s, 50, 10000)
    s = fade_in(s, SR * 2)
    s = fade_out(s, SR * 2)
    s = normalize(s, 0.88)
    write_wav(OUT / "rain.wav", s)
    print("  rain.wav done")


def gen_thunder():
    print("Generating thunder (high quality, 120s)...")
    s = [0.0] * TOTAL

    # Low continuous rumble
    rumble = brown_noise(TOTAL)
    rumble = apply_lowpass(rumble, 100)
    for i in range(TOTAL):
        t = i / SR
        mod = 0.6 + 0.4 * math.sin(2 * math.pi * 0.008 * t)
        s[i] = rumble[i] * 0.15 * mod

    # Multiple thunder events at varying distances
    pos = 0
    while pos < TOTAL - 15000:
        pos += random.randint(15000, 35000)
        if pos >= TOTAL - 15000:
            break
        dur = int(8000 + random.expovariate(1 / 12000))

        # Distance simulation: further = more lowpass, less amplitude
        distance = random.random()  # 0 = close, 1 = far
        amp_mod = 1.0 - distance * 0.6
        lp_cutoff = 80 + distance * 300

        for j in range(min(dur, TOTAL - pos)):
            t = j / SR
            # Complex rumble sweep
            freq = (60 + 30 * distance) * math.exp(-t * (1.5 + distance * 0.5))
            fade = math.exp(-t * (1.0 + distance * 0.5))
            rumble_val = math.sin(2 * math.pi * freq * t) * fade * amp_mod * 0.5

            # Noise crack component
            crack_val = (random.random() * 2 - 1) * fade * amp_mod * 0.3 * (0.3 + 0.7 * (1 - distance))

            # Sub-bass thud at start
            thud = 0
            if j < int(0.4 * SR):
                thud_t = j / SR
                thud = math.sin(2 * math.pi * 25 * thud_t) * math.exp(-thud_t * 8) * amp_mod * 0.5

            s[pos + j] += (rumble_val + crack_val + thud) * (0.6 + 0.4 * (1 - distance))

            # Apply distance lowpass
            if distance > 0.3:
                alpha = lp_cutoff / (lp_cutoff + SR)
                lp = s[pos + j] * alpha  # simplified per-sample lowpass
                s[pos + j] = lp if j == 0 else lp * alpha + s[pos + j] * (1 - alpha)

    s = apply_lowpass(s, 400)
    s = fade_in(s, SR * 3)
    s = fade_out(s, SR * 3)
    s = normalize(s, 0.9)
    write_wav(OUT / "thunder.wav", s)
    print("  thunder.wav done")


def gen_fire():
    print("Generating fire (high quality, 120s)...")
    s = [0.0] * TOTAL

    # Layer 1: Constant hiss (pink noise, highpass)
    hiss = pink_noise(TOTAL)
    hiss = apply_highpass(hiss, 800)
    hiss = apply_lowpass(hiss, 6000)
    for i in range(TOTAL):
        t = i / SR
        mod = 0.7 + 0.3 * math.sin(2 * math.pi * 0.12 * t) * math.sin(2 * math.pi * 0.05 * t + 2.1)
        s[i] = hiss[i] * 0.06 * mod

    # Layer 2: Crackles and pops
    pos = 0
    while pos < TOTAL - 500:
        # Varying pop sizes
        pop_type = random.random()
        if pop_type < 0.5:
            # Small pop
            dur = int(random.uniform(15, 80))
            amp = 0.2 + random.random() * 0.3
            gap = random.randint(20, 200)
        elif pop_type < 0.85:
            # Medium crackle
            dur = int(random.uniform(60, 200))
            amp = 0.4 + random.random() * 0.5
            gap = random.randint(100, 500)
        else:
            # Large pop / log shift
            dur = int(random.uniform(150, 400))
            amp = 0.6 + random.random() * 0.4
            gap = random.randint(500, 2000)

        for j in range(min(dur, TOTAL - pos)):
            decay = math.exp(-j / (dur * 0.15))
            # Mix snap (high freq) with thud (low freq)
            snap_freq = 2000 + random.random() * 4000
            snap = math.sin(2 * math.pi * snap_freq * j / SR) * decay * amp * 0.3
            thud = (random.random() * 2 - 1) * decay * amp * 0.2
            hiss2 = (random.random() * 2 - 1) * decay * amp * 0.08
            s[pos + j] += snap + thud + hiss2

        pos += dur + gap

    # Layer 3: Subtle "whoosh" gusts (wind interacting with fire)
    for _ in range(random.randint(30, 50)):
        p = random.randint(0, TOTAL - 2000)
        dur = random.randint(800, 2500)
        for j in range(dur):
            t = j / SR
            env = (1 - math.exp(-t * 3)) * math.exp(-t * 2)
            whoosh = (random.random() * 2 - 1) * env * 0.04
            s[p + j] += whoosh

    s = apply_highpass(s, 60)
    s = fade_in(s, SR * 1)
    s = fade_out(s, SR * 1)
    s = normalize(s, 0.85)
    write_wav(OUT / "fire.wav", s)
    print("  fire.wav done")


def gen_wind():
    print("Generating wind (high quality, 120s)...")
    s = brown_noise(TOTAL)
    s = apply_lowpass(s, 500)

    # Complex amplitude modulation with multiple LFOs
    for i in range(TOTAL):
        t = i / SR
        # Primary gusts
        mod1 = math.sin(2 * math.pi * 0.04 * t + 0.5) * 0.3
        mod2 = math.sin(2 * math.pi * 0.08 * t + 1.8) * 0.25
        mod3 = math.sin(2 * math.pi * 0.15 * t + 3.1) * 0.2
        mod4 = math.sin(2 * math.pi * 0.22 * t + 0.7) * 0.15
        # Occasional strong gust (lower freq)
        mod5 = max(0, math.sin(2 * math.pi * 0.025 * t)) * 0.3

        total_mod = 0.35 + 0.65 * max(0.15, (mod1 + mod2 + mod3 + mod4 + mod5 + 0.3))
        s[i] *= total_mod

    # Add "ghostly howl" tones during strong gusts
    for i in range(TOTAL):
        t = i / SR
        gust = max(0, math.sin(2 * math.pi * 0.025 * t + 0.3))
        if gust > 0.7:
            howl_freq = 200 + 300 * gust
            howl = math.sin(2 * math.pi * howl_freq * t) * (gust - 0.7) * 0.08
            s[i] += howl

    s = fade_in(s, SR * 3)
    s = fade_out(s, SR * 3)
    s = normalize(s, 0.82)
    write_wav(OUT / "wind.wav", s)
    print("  wind.wav done")


def gen_birds():
    print("Generating birds (high quality, 120s)...")
    s = [0.0] * TOTAL

    # Morning ambience base (very quiet filtered noise)
    amb = pink_noise(TOTAL)
    amb = apply_bandpass(amb, 200, 2000)
    for i in range(TOTAL):
        s[i] = amb[i] * 0.02

    # Multiple bird "species" with different call patterns
    species = [
        {"base_freq": 1800, "range": 2000, "call_len": (400, 900), "gap": (2000, 8000), "warble": 30},
        {"base_freq": 2500, "range": 1500, "call_len": (200, 500), "gap": (3000, 10000), "warble": 50},
        {"base_freq": 3500, "range": 2000, "call_len": (300, 700), "gap": (5000, 15000), "warble": 40},
        {"base_freq": 1500, "range": 1000, "call_len": (500, 1200), "gap": (8000, 20000), "warble": 20},
        {"base_freq": 2200, "range": 2500, "call_len": (150, 400), "gap": (1000, 5000), "warble": 60},
        {"base_freq": 2800, "range": 1800, "call_len": (350, 800), "gap": (4000, 12000), "warble": 35},
    ]

    for sp in species:
        pos = random.randint(0, 5000)
        while pos < TOTAL - 2000:
            dur = int(sp["call_len"][0] + random.expovariate(1 / (sp["call_len"][1] - sp["call_len"][0])))
            freq = sp["base_freq"] + random.uniform(-sp["range"], sp["range"])
            amp = 0.15 + random.random() * 0.2

            # Determine if this is a call-and-response (paired chirps)
            paired = random.random() < 0.3

            for chirp_num in range(2 if paired else 1):
                if chirp_num > 0:
                    pos += random.randint(300, 1200)
                    freq += random.uniform(-300, 300)

                for j in range(min(dur, TOTAL - pos)):
                    t = j / SR
                    progress = j / max(dur, 1)
                    # Upward sweep with some variation
                    sweep_freq = freq + progress * random.uniform(300, 1500)
                    # Fast attack, medium decay
                    env = (1 - math.exp(-t * 300)) * math.exp(-t * (5 + random.random() * 5))
                    # Warble
                    warble = 1 + 0.25 * math.sin(2 * math.pi * sp["warble"] * t)
                    # Harmonics
                    val = (math.sin(2 * math.pi * sweep_freq * t * warble) * 0.5 +
                           math.sin(2 * math.pi * sweep_freq * 2 * t * warble) * 0.2 +
                           math.sin(2 * math.pi * sweep_freq * 3 * t * warble) * 0.08)
                    s[pos + j] += val * env * amp
                pos += dur

            gap = random.randint(sp["gap"][0], sp["gap"][1])
            pos += gap

    s = apply_bandpass(s, 200, 8000)
    s = fade_in(s, SR * 2)
    s = fade_out(s, SR * 2)
    s = normalize(s, 0.8)
    write_wav(OUT / "birds.wav", s)
    print("  birds.wav done")


def gen_ocean():
    print("Generating ocean (high quality, 120s)...")
    s = [0.0] * TOTAL

    # Layer 1: Distant ocean rumble (very quiet brown noise)
    rumble = brown_noise(TOTAL)
    rumble = apply_lowpass(rumble, 80)
    for i in range(TOTAL):
        s[i] = rumble[i] * 0.1

    # Layer 2: Mid-range wave sound (pink noise, modulated)
    mid = pink_noise(TOTAL)
    mid = apply_bandpass(mid, 100, 1500)

    for i in range(TOTAL):
        t = i / SR
        # Wave rhythm: ~8 second primary, ~3 second secondary
        wave1 = math.sin(2 * math.pi * 0.125 * t + 0.3) * 0.5
        wave2 = math.sin(2 * math.pi * 0.33 * t + 1.7) * 0.3
        wave3 = math.sin(2 * math.pi * 0.08 * t + 2.8) * 0.3
        total_wave = max(0, wave1 + wave2 + wave3 + 0.2)

        s[i] += mid[i] * 0.35 * (0.3 + 0.7 * total_wave)

    # Layer 3: Wave crashes (high frequency burst)
    pos = 0
    wave_period = int(SR * 8)  # ~8 seconds
    while pos < TOTAL - 3000:
        pos += wave_period + random.randint(-int(SR * 2), int(SR * 2))
        if pos >= TOTAL - 3000:
            break

        # Wave crash: sharp attack, slow decay
        crash_dur = int(2000 + random.expovariate(1 / 1500))
        crash_amp = 0.3 + random.random() * 0.5
        for j in range(min(crash_dur, TOTAL - pos)):
            t = j / SR
            env = (1 - math.exp(-t * 8)) * math.exp(-t * 1.2)
            # White noise burst for foam
            foam = (random.random() * 2 - 1) * env * crash_amp * 0.5
            # Low thump
            thump = math.sin(2 * math.pi * 60 * t) * math.exp(-t * 5) * crash_amp * 0.3
            s[pos + j] += foam + thump

        # Secondary smaller crash
        pos2 = pos + random.randint(500, 1500)
        for j in range(min(800, TOTAL - pos2)):
            t = j / SR
            env = math.exp(-t * 2.5)
            s[pos2 + j] += (random.random() * 2 - 1) * env * crash_amp * 0.2

    # Layer 4: Pebble/churning sounds (occasional)
    for _ in range(random.randint(40, 80)):
        p = random.randint(0, TOTAL - 500)
        dur = random.randint(200, 800)
        for j in range(min(dur, TOTAL - p)):
            t = j / SR
            env = (1 - math.exp(-t * 10)) * math.exp(-t * 3)
            pebble = (random.random() * 2 - 1) * env * 0.06
            tick = math.sin(2 * math.pi * random.uniform(300, 1000) * t) * env * 0.03
            s[p + j] += pebble + tick

    s = apply_bandpass(s, 20, 6000)
    s = fade_in(s, SR * 2)
    s = fade_out(s, SR * 2)
    s = normalize(s, 0.88)
    write_wav(OUT / "ocean.wav", s)
    print("  ocean.wav done")


def gen_cafe():
    print("Generating cafe (high quality, 120s)...")
    s = [0.0] * TOTAL

    # Base ambient: filtered pink noise
    amb = pink_noise(TOTAL)
    amb = apply_bandpass(amb, 100, 3000)
    for i in range(TOTAL):
        s[i] = amb[i] * 0.06

    # Multiple conversation layers (formants synthesis for voice-like sounds)
    num_chatters = 8
    chatters = []
    for _ in range(num_chatters):
        pos = random.randint(0, TOTAL // 2)
        n_chunks = random.randint(5, 20)
        chunks = []
        for _ in range(n_chunks):
            dur = int(random.uniform(SR * 0.5, SR * 3))
            gap = int(random.uniform(SR * 0.5, SR * 5))
            chunks.append((pos, dur))
            pos += dur + gap
        chatters.append(chunks)

    for chatter in chatters:
        for pos, dur in chatter:
            if pos >= TOTAL:
                break
            # Generate pseudo-voice using formant synthesis
            f1 = 200 + random.random() * 400
            f2 = 600 + random.random() * 600
            f3 = 1200 + random.random() * 800
            amp = 0.05 + random.random() * 0.08

            for j in range(min(dur, TOTAL - pos)):
                t = j / SR
                # Gentle amplitude modulation for speech-like quality
                mod = 0.5 + 0.5 * math.sin(2 * math.pi * 3.5 * t) * math.sin(2 * math.pi * 7 * t)
                env = (1 - math.exp(-t * 2)) * math.exp(-t * 0.3)
                voice = (math.sin(2 * math.pi * f1 * t) * 0.4 +
                         math.sin(2 * math.pi * f2 * t) * 0.3 +
                         math.sin(2 * math.pi * f3 * t) * 0.2)
                s[pos + j] += voice * env * amp * mod

    # Occasional distinct sounds (cup clink, chair, footsteps)
    for _ in range(random.randint(15, 25)):
        pos = random.randint(0, TOTAL - 500)
        if pos >= TOTAL:
            break
        sound_type = random.randint(0, 2)
        dur = random.randint(100, 500)

        for j in range(min(dur, TOTAL - pos)):
            t = j / SR
            env = math.exp(-t * (10 + random.random() * 10))

            if sound_type == 0:  # Cup clink
                val = math.sin(2 * math.pi * 2000 * t) * env * 0.15
            elif sound_type == 1:  # Muffled thud
                val = math.sin(2 * math.pi * 80 * t) * env * 0.2
            else:  # Quick scrape
                val = (random.random() * 2 - 1) * env * 0.1
            s[pos + j] += val

    s = apply_bandpass(s, 60, 5000)
    s = fade_in(s, SR * 1)
    s = fade_out(s, SR * 1)
    s = normalize(s, 0.8)
    write_wav(OUT / "cafe.wav", s)
    print("  cafe.wav done")


def gen_keyboard():
    print("Generating keyboard (high quality, 120s)...")
    s = [0.0] * TOTAL
    pos = 0

    # Varying typing speed: bursts of fast typing, then pauses
    while pos < TOTAL - 500:
        burst_len = random.randint(3, 15)
        for _ in range(burst_len):
            if pos >= TOTAL - 200:
                break
            # Each keystroke
            dur = int(random.uniform(20, 80))
            key_freq = 100 + random.random() * 600

            for j in range(min(dur, TOTAL - pos)):
                t = j / SR
                # Sharp attack, quick decay
                env = math.exp(-t * (60 + random.random() * 40))
                # Click sound: high frequency pulse + low thud
                click = (math.sin(2 * math.pi * key_freq * t) * 0.4 +
                         math.sin(2 * math.pi * 3000 * t) * 0.3) * env
                thud = math.sin(2 * math.pi * 60 * t) * env * 0.2
                s[pos + j] += (click + thud) * (0.2 + random.random() * 0.3)

            pos += dur + random.randint(30, 150)

            # Space bar (occasional, heavier)
            if random.random() < 0.15:
                for j2 in range(min(dur + 30, TOTAL - pos)):
                    t2 = j2 / SR
                    env2 = math.exp(-t2 * 40)
                    space = (math.sin(2 * math.pi * 50 * t2) * 0.5) * env2 * 0.4
                    if pos + j2 < TOTAL:
                        s[pos + j2] += space
                pos += random.randint(60, 200)

        # Pause between bursts
        pos += random.randint(1000, 5000)

    s = apply_highpass(s, 50)
    s = fade_in(s, SR * 0.5)
    s = fade_out(s, SR * 0.5)
    s = normalize(s, 0.75)
    write_wav(OUT / "keyboard.wav", s)
    print("  keyboard.wav done")


def gen_forest():
    print("Generating forest (high quality, 120s)...")
    s = [0.0] * TOTAL

    # Layer 1: Wind through leaves (filtered brown noise + subtle modulation)
    wind_base = brown_noise(TOTAL)
    wind_base = apply_bandpass(wind_base, 80, 2000)
    for i in range(TOTAL):
        t = i / SR
        # Very gentle wind
        mod = 0.5 + 0.5 * math.sin(2 * math.pi * 0.03 * t + 0.8) * math.sin(2 * math.pi * 0.06 * t)
        s[i] = wind_base[i] * 0.08 * mod

    # Layer 2: Bird calls (fewer than dedicated birds track, more distant)
    species = [
        {"base_freq": 1600, "call_len": (400, 1000), "gap": (10000, 30000)},
        {"base_freq": 2400, "call_len": (200, 600), "gap": (8000, 25000)},
        {"base_freq": 3000, "call_len": (300, 800), "gap": (15000, 40000)},
        {"base_freq": 2000, "call_len": (200, 500), "gap": (12000, 35000)},
    ]

    for sp in species:
        pos = random.randint(0, 10000)
        while pos < TOTAL - 1500:
            dur = int(sp["call_len"][0] + random.expovariate(1 / (sp["call_len"][1] - sp["call_len"][0])))
            freq = sp["base_freq"] + random.uniform(-500, 500)

            for j in range(min(dur, TOTAL - pos)):
                t = j / SR
                progress = j / max(dur, 1)
                sweep_freq = freq + progress * random.uniform(500, 1000)
                env = (1 - math.exp(-t * 250)) * math.exp(-t * 8)
                warble = 1 + 0.2 * math.sin(2 * math.pi * 35 * t)
                val = (math.sin(2 * math.pi * sweep_freq * t * warble) * 0.5 +
                       math.sin(2 * math.pi * sweep_freq * 2 * t * warble) * 0.15)
                s[pos + j] += val * env * 0.12  # quieter, more distant

            pos += dur + random.randint(sp["gap"][0], sp["gap"][1])

    # Layer 3: Insects (high frequency, steady)
    insects = pink_noise(TOTAL)
    insects = apply_bandpass(insects, 3000, 8000)
    for i in range(TOTAL):
        t = i / SR
        mod = 0.6 + 0.4 * math.sin(2 * math.pi * 0.2 * t)
        s[i] += insects[i] * 0.015 * mod

    # Layer 4: Occasional rustles (leaves, small animals)
    for _ in range(random.randint(15, 25)):
        pos = random.randint(0, TOTAL - 2000)
        dur = random.randint(500, 2000)
        for j in range(min(dur, TOTAL - pos)):
            t = j / SR
            env = (1 - math.exp(-t * 4)) * math.exp(-t * 1.5)
            rustle = (random.random() * 2 - 1) * env * 0.08
            s[pos + j] += rustle

    s = apply_bandpass(s, 50, 9000)
    s = fade_in(s, SR * 3)
    s = fade_out(s, SR * 3)
    s = normalize(s, 0.8)
    write_wav(OUT / "forest.wav", s)
    print("  forest.wav done")


def gen_noises():
    print("Generating noise colors (120s)...")

    print("  white noise...")
    w = white_noise(TOTAL)
    w = fade_in(w, SR * 0.2)
    w = fade_out(w, SR * 0.2)
    write_wav(OUT / "white.wav", normalize(w, 0.35))

    print("  pink noise...")
    p = pink_noise(TOTAL)
    p = fade_in(p, SR * 0.2)
    p = fade_out(p, SR * 0.2)
    write_wav(OUT / "pink.wav", normalize(p, 0.45))

    print("  brown noise...")
    b = brown_noise(TOTAL)
    b = fade_in(b, SR * 0.2)
    b = fade_out(b, SR * 0.2)
    write_wav(OUT / "brown.wav", normalize(b, 0.45))
    print("  noises done")


if __name__ == "__main__":
    gen_rain()
    gen_thunder()
    gen_fire()
    gen_wind()
    gen_birds()
    gen_ocean()
    gen_cafe()
    gen_keyboard()
    gen_forest()
    gen_noises()
    print(f"\nAll 12 sounds generated! Files in: {OUT}")
