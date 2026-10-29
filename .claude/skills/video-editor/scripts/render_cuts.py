#!/usr/bin/env python3
"""render_cuts.py - aplica plan.json con FFmpeg y exporta en calidad máxima.

    python3 render_cuts.py entrada.mp4 plan.json salida.mp4 \
        [--vertical] [--captions palabras.json --fontsdir DIR] [--no-loudnorm]

--vertical       1080x1920 (Reels, TikTok, Shorts). Si la fuente es horizontal, recorta el centro.
--captions       subtítulos con la marca (Poppins 700, blanco con borde azul #145389), tomados de
                 palabras.json y ajustados a la línea de tiempo ya cortada.
--fontsdir       carpeta con la fuente Poppins (.woff/.ttf/.otf).
                 Una palabra entre asteriscos en palabras.json ("*mesita*") sale en amarillo #FDD835:
                 una palabra clave por frase, como en los Reels de referencia.
--title          título fijo arriba durante el gancho: "texto|etiqueta|hasta_s". En el texto,
                 *palabras* entre asteriscos van en amarillo; la etiqueta va en una caja amarilla.
Audio: loudnorm a -16 LUFS (estándar para redes), salvo --no-loudnorm.
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile

AMARILLO, BLANCO = r"{\c&H0035D8FD&}", r"{\c&H00FFFFFF&}"

def destacar(t):
    """*palabra* -> palabra en amarillo (colores ASS en orden BGR)."""
    return re.sub(r"\*([^*]+)\*", lambda m: AMARILLO + m.group(1) + BLANCO, t)

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
    hit = locate(t, keep)
    return hit[0] if hit else None

def locate(t, keep):
    """(tiempo en el video cortado, índice del tramo) o None. Sirve también con tramos reordenados."""
    acc = 0.0
    for i, (s, e) in enumerate(keep):
        if s <= t <= e: return acc + (t - s), i
        acc += e - s
    return None

def build_ass(words_path, keep, w, h, vertical, path, title=None):
    words = json.load(open(words_path))["words"]
    per = 3 if vertical else 6
    size = round(h * (0.058 if vertical else 0.055))
    margin_v = round(h * (0.22 if vertical else 0.07))
    lines, chunk = [], []
    def flush():
        if not chunk: return
        # Cada línea vive dentro de un solo tramo: el final se mide desde su propio inicio, no buscando
        # el tiempo de la última palabra (con tramos reordenados ese tiempo puede caer en otro tramo).
        i = chunk[0]["_tramo"]
        a = remap(chunk[0]["start"], keep)
        b = a + min(chunk[-1]["end"], keep[i][1]) - chunk[0]["start"]
        if b > a:
            lines.append((a, b, destacar(" ".join(x["word"] for x in chunk))))
        chunk.clear()
    for x in words:
        hit = locate(x["start"], keep)
        if hit is None: flush(); continue
        x["_tramo"] = hit[1]
        if chunk and (len(chunk) >= per or x["start"] - chunk[-1]["end"] > 0.6 or chunk[-1]["_tramo"] != hit[1]):
            flush()
        chunk.append(x)
        if x["word"][-1:] in ".,;:?!": flush()  # el subtítulo corta donde corta la idea
    flush()
    # Título grande (como en los Reels de referencia); "\\N" en el texto parte la línea y la etiqueta
    # va justo debajo de la última línea.
    t_size, t_top = round(h * 0.056), round(h * 0.07)
    n_lineas = title.split("|")[0].count("\\N") + 1 if title else 1
    e_top = round(t_top + n_lineas * t_size * 1.22 + h * 0.014)
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: GC,Poppins,{size},&H00FFFFFF,&H0035D8FD,&H00895314,&H64000000,-1,0,0,0,100,100,0,0,1,{max(3, size // 10)},2,2,{round(w * 0.08)},{round(w * 0.08)},{margin_v},1
Style: Titulo,Poppins,{t_size},&H00FFFFFF,&H0035D8FD,&H00895314,&H64000000,-1,0,0,0,100,100,0,0,1,{round(h * 0.005)},3,8,{round(w * 0.06)},{round(w * 0.06)},{t_top},1
Style: Etiqueta,Poppins,{round(h * 0.028)},&H00895314,&H0035D8FD,&H0035D8FD,&H0035D8FD,-1,0,0,0,100,100,0,0,3,{round(h * 0.008)},0,8,{round(w * 0.06)},{round(w * 0.06)},{e_top},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
        if title:
            texto, etiqueta, hasta = title.split("|")
            fin = ass_time(float(hasta))
            f.write(f"Dialogue: 1,0:00:00.00,{fin},Titulo,,0,0,0,,{{\\fad(150,250)}}{destacar(texto)}\n")
            if etiqueta:
                f.write(f"Dialogue: 1,0:00:00.15,{fin},Etiqueta,,0,0,0,,{{\\fad(150,250)}}{etiqueta}\n")
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
    ap.add_argument("--append", help="video que se pega al final (tarjeta de cierre)")
    ap.add_argument("--overlay", help="video con fondo transparente (.mov ProRes 4444 de HyperFrames) que va encima "
                    "desde el segundo 0 del video cortado: tarjetas, seguidores de pasos, etc.")
    ap.add_argument("--title", help='título del gancho: "texto con *clave*|etiqueta|hasta_segundos"')
    a = ap.parse_args()
    if os.path.abspath(a.input) == os.path.abspath(a.output):
        sys.exit("La salida no puede ser el archivo original.")
    keep = json.load(open(a.plan))["keep"]
    w, h, fps = probe(a.input)
    if a.vertical:
        w, h = 1080, 1920
    # Paso 1: cada tramo a su propio archivo temporal, uno por uno (poca memoria aunque sean cientos
    # y en cualquier orden). Aquí se fijan los cuadros por segundo (los celulares graban con ritmo
    # variable y el audio se desfasaría de los labios) y el tamaño final.
    tmp = tempfile.mkdtemp(prefix="tramos-", dir=os.path.dirname(os.path.abspath(a.output)))
    norm_v = f"fps={fps},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1,format=yuv420p"
    enc = ["-c:v", "libx264", "-crf", "10", "-preset", "veryfast", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1"]
    lista = []
    for i, (s, e) in enumerate(keep):
        f = os.path.join(tmp, f"{i:04d}.mkv")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s), "-t", str(e - s),
                        "-i", a.input, "-vf", norm_v, *enc, f], check=True)
        lista.append(f)
    if a.append:
        # Tarjeta final (por ejemplo la de HyperFrames), con silencio si no trae audio.
        f = os.path.join(tmp, "zz-final.mkv")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a.append, "-f", "lavfi",
                        "-i", "anullsrc=r=48000:cl=mono", "-map", "0:v", "-map", "1:a", "-shortest",
                        "-vf", norm_v, *enc, f], check=True)
        lista.append(f)
    concat = os.path.join(tmp, "lista.txt")
    open(concat, "w").write("".join(f"file '{f}'\n" for f in lista))
    # Paso 2: se pegan en orden y en una sola pasada final van subtítulos, volumen y calidad máxima.
    # La capa transparente (--overlay) va debajo de los subtítulos y arriba del video.
    v = "[0:v]setpts=PTS-STARTPTS"
    if a.overlay:
        v += "[base];[1:v]setpts=PTS-STARTPTS,format=yuva420p[capa];[base][capa]overlay=0:0:eof_action=pass"
    if a.captions:
        ass = os.path.splitext(a.output)[0] + ".ass"
        n = build_ass(a.captions, keep, w, h, a.vertical, ass, a.title)
        v += f",ass='{ass}'" + (f":fontsdir='{a.fontsdir}'" if a.fontsdir else "")
        print(f"{n} líneas de subtítulos -> {ass}", file=sys.stderr)
    au = "anull" if a.no_loudnorm else "loudnorm=I=-16:TP=-1.5:LRA=11"
    capa = ["-i", a.overlay] if a.overlay else []
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", concat, *capa,
           "-filter_complex", f"{v}[v];[0:a]{au},aresample=48000[a]", "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", a.output]
    subprocess.run(cmd, check=True)
    shutil.rmtree(tmp)
    print(f"listo -> {os.path.abspath(a.output)}", file=sys.stderr)

if __name__ == "__main__":
    main()
