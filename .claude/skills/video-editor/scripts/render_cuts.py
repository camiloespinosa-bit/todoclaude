#!/usr/bin/env python3
"""render_cuts.py - aplica plan.json con FFmpeg y exporta en calidad máxima.

    python3 render_cuts.py entrada.mp4 plan.json salida.mp4 \
        [--vertical] [--captions palabras.json --fontsdir DIR] [--no-loudnorm]

--vertical       1080x1920 (Reels, TikTok, Shorts). Si la fuente es horizontal, recorta el centro.
--captions       subtítulos con la marca (Poppins 700, blanco con borde azul #145389), tomados de
                 palabras.json y ajustados a la línea de tiempo ya cortada.
--fontsdir       carpeta con la fuente Poppins en .ttf/.otf.
Audio: loudnorm a -16 LUFS (estándar para redes), salvo --no-loudnorm.
"""
import argparse, json, os, subprocess, sys

def probe(path):
    """Ancho y alto como se ven (con la rotación del celular aplicada) y cuadros por segundo."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate:stream_side_data=rotation", "-of", "json",
                          path], capture_output=True, text=True)
    s = json.loads(out.stdout)["streams"][0]
    rot = next((abs(int(d.get("rotation", 0))) for d in s.get("side_data_list", [])), 0)
    w, h = (s["height"], s["width"]) if rot in (90, 270) else (s["width"], s["height"])
    return w, h, s.get("r_frame_rate", "30/1")

def ass_time(t):
    h, r = divmod(max(t, 0), 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def remap(t, keep):
    """Tiempo original -> tiempo en el video cortado (None si cae en un corte)."""
    acc = 0.0
    for s, e in keep:
        if s <= t <= e: return acc + (t - s)
        acc += e - s
    return None

def build_ass(words_path, keep, w, h, vertical, path):
    words = json.load(open(words_path))["words"]
    per = 3 if vertical else 6
    size = round(h * (0.058 if vertical else 0.055))
    margin_v = round(h * (0.22 if vertical else 0.07))
    lines, chunk = [], []
    def flush():
        if not chunk: return
        a, b = remap(chunk[0]["start"], keep), remap(chunk[-1]["end"], keep)
        if a is not None and b is not None and b > a:
            lines.append((a, b, " ".join(x["word"] for x in chunk)))
        chunk.clear()
    for x in words:
        if remap(x["start"], keep) is None: flush(); continue
        if chunk and (len(chunk) >= per or x["start"] - chunk[-1]["end"] > 0.6): flush()
        chunk.append(x)
        if x["word"][-1:] in ".,;:?!": flush()  # el subtítulo corta donde corta la idea
    flush()
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: GC,Poppins,{size},&H00FFFFFF,&H0035D8FD,&H00895314,&H64000000,-1,0,0,0,100,100,0,0,1,{max(3, size // 10)},2,2,{round(w * 0.08)},{round(w * 0.08)},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
        for a, b, t in lines:
            f.write(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},GC,,0,0,0,,{t}\n")
    return len(lines)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input"); ap.add_argument("plan"); ap.add_argument("output")
    ap.add_argument("--vertical", action="store_true")
    ap.add_argument("--captions")
    ap.add_argument("--fontsdir")
    ap.add_argument("--no-loudnorm", action="store_true")
    a = ap.parse_args()
    if os.path.abspath(a.input) == os.path.abspath(a.output):
        sys.exit("La salida no puede ser el archivo original.")
    keep = json.load(open(a.plan))["keep"]
    sel = "+".join(f"between(t,{s},{e})" for s, e in keep)
    w, h, fps = probe(a.input)
    # Los celulares graban con cuadros por segundo variables: se fijan antes de cortar para que el
    # audio no se desfase de los labios.
    v = f"fps={fps},select='{sel}',setpts=N/FRAME_RATE/TB"
    if a.vertical:
        w, h = 1080, 1920
        v += ",scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"
    if a.captions:
        ass = os.path.splitext(a.output)[0] + ".ass"
        n = build_ass(a.captions, keep, w, h, a.vertical, ass)
        v += f",ass='{ass}'" + (f":fontsdir='{a.fontsdir}'" if a.fontsdir else "")
        print(f"{n} líneas de subtítulos -> {ass}", file=sys.stderr)
    au = f"aselect='{sel}',asetpts=N/SR/TB" + ("" if a.no_loudnorm else ",loudnorm=I=-16:TP=-1.5:LRA=11")
    script = os.path.splitext(a.output)[0] + ".filter.txt"
    open(script, "w").write(f"[0:v]{v}[v];[0:a]{au}[a]")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a.input,
           "-filter_complex_script", script, "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", a.output]
    subprocess.run(cmd, check=True)
    print(f"listo -> {os.path.abspath(a.output)}", file=sys.stderr)

if __name__ == "__main__":
    main()
