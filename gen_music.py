#!/usr/bin/env python3
"""Generate high-quality background music WAV files for StudyWithMe AI."""
import struct, math, random

SR = 44100
DUR = 120
N = SR * DUR

def write_wav(path, samples):
    n = len(samples)
    peak = max(abs(min(samples)), abs(max(samples)), 0.001)
    scale = 0.85 / peak
    with open(path, 'wb') as f:
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + n * 2))
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write(struct.pack('<IHHIIHH', 16, 1, 1, SR, SR * 2, 2, 16))
        f.write(b'data')
        f.write(struct.pack('<I', n * 2))
        for s in samples:
            v = int(max(-32767, min(32767, s * scale * 32767)))
            f.write(struct.pack('<h', v))

def piano_note(freq, duration, velocity=0.7):
    n = int(SR * duration)
    harmonics = [(1,1.0,4.5),(2,0.5,3.0),(3,0.25,2.5),(4,0.12,2.0),(5,0.06,1.5)]
    samples = [0.0] * n
    for mult, amp, dr in harmonics:
        for i in range(n):
            t = i / SR
            env = math.exp(-t * dr) * (1 - math.exp(-t * 60))
            samples[i] += math.sin(2 * math.pi * freq * mult * t) * env * amp * velocity
    return samples

def add_reverb(samples, mix=0.3, delay_ms=50, decay=0.5):
    ds = int(SR * delay_ms / 1000)
    out = list(samples)
    for i in range(len(samples)):
        if i >= ds:
            out[i] = out[i] * (1 - mix) + out[i - ds] * mix * decay
    return out

def lp(samples, cutoff):
    alpha = cutoff / (cutoff + SR)
    out = [0.0] * len(samples)
    prev = 0.0
    for i, s in enumerate(samples):
        prev += alpha * (s - prev)
        out[i] = prev
    return out

OUT = "public/music"

# 03 - Lofi
print('03 Lofi...')
t = [0.0] * N
mel = [(261.63,0,2),(293.66,2,2),(329.63,4,3),(261.63,8,2),(293.66,10,2),(349.23,12,4),
       (261.63,17,2),(329.63,19,3),(293.66,23,2),(261.63,25,3),
       (261.63,29,2),(293.66,31,2),(329.63,33,3),(349.23,37,2),(392.00,39,2),(329.63,41,4)]
for freq, start, dur in mel:
    seg = piano_note(freq, dur, 0.35)
    s = int(start * SR)
    for j in range(min(len(seg), N - s)): t[s + j] += seg[j]
for _ in range(N // 200):
    pos = random.randint(0, N - 10)
    t[pos] += random.uniform(-0.008, 0.008)
for i in range(0, N, int(SR * 0.5)):
    for j in range(min(500, N - i)):
        env = math.exp(-j / SR * 20)
        t[i + j] += math.sin(2 * math.pi * 50 * j / SR) * env * 0.06
t = lp(t, 3000)
t = add_reverb(t, 0.25, 40, 0.4)
write_wav(f'{OUT}/03-lofi-calm.wav', t)

# 04 - Focus Piano
print('04 Focus Piano...')
t = [0.0] * N
pattern = [261.63, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66, 261.63]
for block in range(15):
    for i, freq in enumerate(pattern):
        start = block * 8 + i * 0.75
        seg = piano_note(freq, 1.2, 0.3)
        s = int(start * SR)
        for j in range(min(len(seg), N - s)): t[s + j] += seg[j]
t = add_reverb(t, 0.3, 45, 0.5)
write_wav(f'{OUT}/04-focus-piano.wav', t)

# 05 - Jazz Piano
print('05 Jazz Piano...')
t = [0.0] * N
jazz_notes = [(261.63,0,1.5),(293.66,1.5,0.5),(329.63,2.5,1.5),(349.23,4,0.5),(392.00,5,2),
              (349.23,7.5,1),(329.63,9,0.5),(293.66,10,1.5),(261.63,12,2),
              (329.63,14.5,1),(349.23,16,1),(392.00,17.5,2),(349.23,20,1),(329.63,21.5,1),
              (293.66,23,1.5),(261.63,25,1),(293.66,26.5,1.5),(261.63,28.5,0.5)]
for freq, start, dur in jazz_notes:
    seg = piano_note(freq, dur, 0.4)
    s = int(start * SR)
    for j in range(min(len(seg), N - s)): t[s + j] += seg[j]
t = add_reverb(t, 0.2, 35, 0.45)
write_wav(f'{OUT}/05-jazz-piano.wav', t)

# 06 - Ambient Pad
print('06 Ambient...')
t = [0.0] * N
for freq in [65.41, 98.00, 130.81]:
    for i in range(N):
        ti = i / SR
        mod = 0.5 + 0.5 * math.sin(2 * math.pi * 0.15 * ti + freq)
        env = (1 - math.exp(-ti * 0.5)) * math.exp(-ti * 0.001)
        val = (math.sin(2*math.pi*freq*ti)*0.4 + math.sin(2*math.pi*freq*2*ti)*0.15 + math.sin(2*math.pi*freq*3*ti)*0.08) * env * mod
        t[i] += val * 0.3
t = lp(t, 1500)
t = add_reverb(t, 0.5, 100, 0.7)
write_wav(f'{OUT}/06-ambient-pad.wav', t)

# 07 - Classical Guitar (Karplus-Strong)
print('07 Guitar...')
t = [0.0] * N
def guitar_note(freq, dur):
    n = int(SR * dur)
    buf_len = int(SR / freq)
    buf = [random.uniform(-1, 1) for _ in range(buf_len)]
    samples = [0.0] * n
    for i in range(n):
        j = i % buf_len
        samples[i] = buf[j]
        buf[j] = (buf[j] + buf[(j+1) % buf_len]) * 0.495
    for i in range(n):
        samples[i] *= math.exp(-i / (SR * 0.8))
    return samples

gm = [(196,0,3),(261.63,3,3),(329.63,6,3),(261.63,9,3),
      (246.94,12,3),(293.66,15,3),(349.23,18,3),(293.66,21,3),
      (261.63,24,3),(329.63,27,3),(392,30,4),(261.63,35,4),
      (220,40,3),(293.66,43,3),(349.23,46,3),(293.66,49,3)]
for freq, start, dur in gm:
    seg = guitar_note(freq, dur)
    s = int(start * SR)
    for j in range(min(len(seg), N - s)): t[s + j] += seg[j] * 0.5
t = add_reverb(t, 0.35, 55, 0.55)
write_wav(f'{OUT}/07-classical-guitar.wav', t)

# 08 - Meditation
print('08 Meditation...')
t = [0.0] * N
for freq in [261.63, 329.63, 392.00]:
    for i in range(N):
        ti = i / SR
        env = (1 - math.exp(-ti * 0.3)) * math.exp(-ti * 0.0005)
        lfo = 0.5 + 0.5 * math.sin(2*math.pi*0.1*ti)
        val = (math.sin(2*math.pi*freq*ti)*0.25 + math.sin(2*math.pi*freq*2*ti)*0.08) * env * lfo
        t[i] += val * 0.25
t = lp(t, 2000)
t = add_reverb(t, 0.6, 120, 0.75)
write_wav(f'{OUT}/08-meditation.wav', t)

# 09 - Rain Piano
print('09 Rain Piano...')
t = [0.0] * N
rm = [(261.63,0,4),(293.66,5,3),(349.23,9,4),(329.63,14,3),(261.63,18,4),(293.66,23,3),(349.23,27,5),(261.63,33,4)]
for freq, start, dur in rm:
    seg = piano_note(freq, dur, 0.3)
    s = int(start * SR)
    for j in range(min(len(seg), N - s)): t[s + j] += seg[j]
t = add_reverb(t, 0.5, 80, 0.65)
write_wav(f'{OUT}/09-rain-piano.wav', t)

# 10 - Cafe Ambient
print('10 Cafe...')
t = [0.0] * N
cm = [(261.63,0,3),(329.63,4,3),(349.23,8,2),(392,11,3),(349.23,15,2),(329.63,18,3),(293.66,22,2),(261.63,25,4)]
for freq, start, dur in cm:
    seg = piano_note(freq, dur, 0.25)
    s = int(start * SR)
    for j in range(min(len(seg), N - s)): t[s + j] += seg[j] * 0.7
t = lp(t, 4000)
t = add_reverb(t, 0.2, 30, 0.4)
write_wav(f'{OUT}/10-cafe-ambient.wav', t)

# 11 - Soft Strings
print('11 Strings...')
t = [0.0] * N
sm = [(261.63,0,6),(329.63,7,6),(392,14,8),(349.23,23,6),(293.66,30,6),(261.63,37,8),(329.63,46,6),(261.63,53,8)]
for freq, start, dur in sm:
    n2 = int(SR * dur)
    for i in range(n2):
        ti = i / SR
        env = (1 - math.exp(-ti * 1.5)) * math.exp(-ti * 0.2)
        val = (math.sin(2*math.pi*freq*ti)*0.35 + math.sin(2*math.pi*freq*2*ti)*0.15 + math.sin(2*math.pi*freq*3*ti)*0.06) * env * 0.4
        s = int(start * SR) + i
        if s < N: t[s] += val
t = add_reverb(t, 0.4, 60, 0.6)
write_wav(f'{OUT}/11-soft-strings.wav', t)

# 12 - Night Piano
print('12 Night Piano...')
t = [0.0] * N
nm = [(261.63,0,5),(293.66,6,4),(329.63,11,5),(349.23,17,3),(329.63,21,4),(293.66,26,5),(261.63,32,6)]
for freq, start, dur in nm:
    seg = piano_note(freq, dur, 0.35)
    s = int(start * SR)
    for j in range(min(len(seg), N - s)): t[s + j] += seg[j]
t = lp(t, 2500)
t = add_reverb(t, 0.4, 70, 0.6)
write_wav(f'{OUT}/12-night-piano.wav', t)

print('All 10 music tracks done!')
