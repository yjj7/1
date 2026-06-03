"""
Generate Ken Burns videos from the two PNG files converted from SVG.
"""
import subprocess
import os

FFMPEG = r"C:\Users\Administrator\.workbuddy\binaries\python\versions\3.13.12\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
IMAGES_DIR = r"C:\Users\Administrator\Desktop\moss-new-site\src\assets\images"
OUTPUT_DIR = r"C:\Users\Administrator\Desktop\moss-new-site\public\videos"

os.makedirs(OUTPUT_DIR, exist_ok=True)

SCENES = [
    ("forest_cabin", "forest_cabin_temp.png", 12, 24,
     "eq=brightness=0.0:saturation=1.0,colorbalance=rh=0.03:gh=0.01:bh=-0.02"),
    ("city_skyline", "city_skyline_temp.png", 12, 24,
     "eq=brightness=-0.06:saturation=1.1,colorbalance=rh=0.02:gh=0.01:bh=0.08"),
]

for scene_id, filename, duration, fps, color_filter in SCENES:
    input_path = os.path.join(IMAGES_DIR, filename)
    output_path = os.path.join(OUTPUT_DIR, f"{scene_id}.mp4")

    if not os.path.exists(input_path):
        print(f"SKIP (no input): {filename}")
        continue

    if os.path.exists(output_path):
        print(f"SKIP (exists): {scene_id}.mp4")
        continue

    print(f"Generating: {scene_id}.mp4...")
    cmd = [
        FFMPEG, "-y",
        "-loop", "1",
        "-i", input_path,
        "-t", str(duration),
        "-vf",
        f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        f"zoompan=z='min(zoom+0.0003,1.08)':x='iw/2-(iw/zoom/2)+sin(on*0.01)*3':"
        f"y='ih/2-(ih/zoom/2)+cos(on*0.008)*2':d=1:s=1920x1080:fps={fps},"
        f"{color_filter},format=yuv420p",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-an",
        output_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr[-500:]}")
    else:
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"  OK: {size_mb:.1f} MB")

print("\nDone!")
