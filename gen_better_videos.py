"""
Re-generate forest_cabin and city_skyline videos with higher quality.
Uses Edge headless to render SVG properly, then ffmpeg to encode at higher bitrate.
"""
import subprocess
import os
import time

FFMPEG = r"C:\Users\Administrator\.workbuddy\binaries\python\versions\3.13.12\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
SVG_DIR = r"C:\Users\Administrator\Desktop\moss-new-site\src\assets\images"
OUTPUT_DIR = r"C:\Users\Administrator\Desktop\moss-new-site\public\videos"
TEMP_DIR = r"C:\Users\Administrator\Desktop\moss-new-site\tmp"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

SCENES = [
    {
        "id": "forest_cabin",
        "svg": "forest_cabin.svg",
        "color_filter": "eq=brightness=0.0:saturation=1.0,colorbalance=rh=0.03:gh=0.01:bh=-0.02",
    },
    {
        "id": "city_skyline",
        "svg": "city_skyline.svg",
        "color_filter": "eq=brightness=-0.06:saturation=1.1,colorbalance=rh=0.02:gh=0.01:bh=0.08",
    },
]

for scene in SCENES:
    scene_id = scene["id"]
    output_path = os.path.join(OUTPUT_DIR, f"{scene_id}.mp4")
    svg_path = os.path.join(SVG_DIR, scene["svg"])
    html_path = os.path.join(TEMP_DIR, f"{scene_id}.html")

    # Build HTML with SVG inline, set explicit size
    with open(svg_path, "r", encoding="utf-8") as f:
        svg_content = f.read()

    # Wrap in proper HTML that forces the SVG to fill 1920x1080
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: #000; }}
  svg {{ width: 1920px; height: 1080px; display: block; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    # Use Edge headless to screenshot — use --window-size and --force-device-scale-factor=1
    png_path = os.path.join(TEMP_DIR, f"{scene_id}.png")
    if os.path.exists(png_path):
        os.remove(png_path)

    cmd = [
        EDGE,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--window-size=1920,1080",
        f"--screenshot={png_path}",
        "--hide-scrollbars",
        f"file:///{html_path}",
    ]

    print(f"Rendering {scene_id}...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    time.sleep(2)  # Wait for file write

    if not os.path.exists(png_path):
        print(f"  FAILED: PNG not created. stderr: {result.stderr[:300]}")
        continue

    png_size = os.path.getsize(png_path)
    print(f"  PNG: {png_size} bytes")

    # Generate video with higher bitrate
    if os.path.exists(output_path):
        os.remove(output_path)

    cmd = [
        FFMPEG, "-y",
        "-loop", "1",
        "-i", png_path,
        "-t", "12",
        "-vf",
        "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        "zoompan=z='min(zoom+0.0003,1.08)':x='iw/2-(iw/zoom/2)+sin(on*0.01)*3':"
        "y='ih/2-(ih/zoom/2)+cos(on*0.008)*2':d=1:s=1920x1080:fps=24,"
        f"{scene['color_filter']},format=yuv420p",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-an",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        print(f"  FFMPEG ERROR: {result.stderr[-500:]}")
    else:
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"  OK: {size_mb:.1f} MB")

    # Cleanup temp
    if os.path.exists(png_path):
        os.remove(png_path)
    if os.path.exists(html_path):
        os.remove(html_path)

print("Done!")
