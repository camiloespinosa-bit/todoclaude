#!/usr/bin/env python3
"""render_cuts.py - aplica plan.json con FFmpeg y exporta en calidad máxima.

    python3 render_cuts.py entrada.mp4 plan.json salida.mp4 \
        [--vertical [--crop-x 0.46]] [--fps 355/12] [--captions palabras.json --fontsdir DIR] \
        [--title "texto|etiqueta|hasta_s" [--title-right]] [--grandes "x,y;desde-hasta;..."] \
        [--overlay capa.mov [--overlay-start S]] [--capas capas.json] [--sonidos sonidos.json] \
        [--append tarjeta-final.mp4] [--no-loudnorm]

--vertical       1080x1920 (Reels, TikTok, Shorts); --crop-x elige qué franja del horizontal se usa.
--fps            cuadros por segundo de salida (por defecto los del video de entrada).
--captions       subtítulos con la marca (Poppins 700, blanco con borde azul #145389), tomados de
                 palabras.json y ajustados a la línea de tiempo ya cortada. *palabra* sale en amarillo.
--fontsdir       carpeta con la fuente Poppins (.woff/.ttf/.otf).
--title          título fijo durante el gancho; --title-right lo pone arriba a la derecha (horizontal).
--grandes        las palabras *clave* aparecen en grande con un rebote en x,y, salvo en los rangos dados.
--overlay        capa transparente (.mov ProRes 4444 de HyperFrames) desde --overlay-start.
--zooms         JSON: Snap Zoom {tipo:snap,a,b,z,cx,cy} y Zoom Through Cut {tipo:corte,t,z}.
--escenas        JSON [{file,start,dur}]: escenas a pantalla completa; la persona pasa a un recuadro.
--capas          JSON [{file, x, y, start, end}]: .mp4 en bucle (mini videos), .png fijos y .mov que
                 corren una vez desde 'start' (escenas animadas). Van debajo de --overlay.
--sonidos        JSON [{file, start, vol}]: efectos mezclados bajo la voz antes de nivelar.
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

def build_ass(words_path, keep, w, h, vertical, path, title=None, al=8, grandes=None):
    words = json.load(open(words_path))["words"]
    per = 3 if vertical else 4
    size = round(h * (0.058 if vertical else 0.10))
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
    t_size, t_top = round(h * (0.048 if vertical else 0.095)), round(h * 0.07)
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
Style: Titulo,Poppins,{t_size},&H00FFFFFF,&H0035D8FD,&H00895314,&H64000000,-1,0,0,0,100,100,0,0,1,{round(h * 0.005)},3,{al},{round(w * 0.06)},{round(w * 0.06)},{t_top},1
Style: Grande,Poppins,{round(h * 0.15)},&H0035D8FD,&H0035D8FD,&H00895314,&H64000000,-1,0,0,0,100,100,0,0,1,{round(h * 0.009)},4,5,0,0,0,1
Style: Etiqueta,Poppins,{round(h * (0.023 if vertical else 0.042))},&H00895314,&H0035D8FD,&H0035D8FD,&H0035D8FD,-1,0,0,0,100,100,0,0,3,{round(h * 0.008)},0,{al},{round(w * 0.06)},{round(w * 0.06)},{e_top},1

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
        if grandes:
            # La palabra clave (las que van en amarillo) aparece en grande sobre la pared, con un pequeño rebote.
            gx, gy, gw, fuera = grandes
            clave, prev = [], None
            for x in words:
                if x["word"].startswith("*") and "_tramo" in x:
                    tt = remap(x["start"], keep)
                    limpio = re.sub(r"[*.,;:?!¿¡]", "", x["word"])
                    if clave and tt is not None and tt - prev < 0.9: clave[-1][1] += " " + limpio
                    elif tt is not None: clave.append([tt, limpio])
                    prev = tt
            ult = -9
            for tt, txt in clave:
                if any(a <= tt <= b for a, b in fuera) or tt - ult < 1.5: continue
                ult = tt
                txt = txt[0].upper() + txt[1:]
                # tamaño ajustado para que la palabra quepa en el ancho libre (gw px); si son dos palabras, van en dos líneas
                lineas = txt.split(" ") if gw and len(txt) * 0.6 * h * 0.15 > gw else [txt]
                fs = round(min(h * 0.15, gw / (0.62 * max(len(l) for l in lineas)))) if gw else round(h * 0.15)
                txt = "\\N".join(lineas)
                anim = f"{{\\pos({gx},{gy})\\fs{fs}\\fscx40\\fscy40\\t(0,170,\\fscx115\\fscy115)\\t(170,300,\\fscx100\\fscy100)\\fad(0,250)}}"
                f.write(f"Dialogue: 2,{ass_time(tt)},{ass_time(tt + 1.4)},Grande,,0,0,0,,{anim}{txt}\n")
    return len(lines)

def mascara_pip(pip, carpeta):
    """PNG gris con esquinas redondeadas para el recuadro de Camilo durante las escenas."""
    from PIL import Image, ImageDraw
    m = Image.new("L", (pip["w"], pip["h"]), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, pip["w"] - 1, pip["h"] - 1), pip.get("r", 26), fill=255)
    f = os.path.join(carpeta, "mascara_pip.png"); m.save(f); return f

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
    ap.add_argument("--overlay-start", type=float, default=0.0, help="segundo del video cortado en que arranca --overlay")
    ap.add_argument("--capas", help="JSON con videos en bucle debajo de --overlay: [{file, x, y, start, end}]")
    ap.add_argument("--zooms", help='JSON: [{"tipo":"snap","a":s,"b":s,"z":1.25,"cx":980,"cy":380}, {"tipo":"corte","t":s,"z":1.5}]')
    ap.add_argument("--escenas", help='JSON: [{"file":escena.mp4,"start":s,"dur":s}] a pantalla completa; Camilo pasa a un recuadro '
                    '(pip: x,y,w,h,r; por defecto arriba a la izquierda 560x315)')
    ap.add_argument("--grandes", help='palabras clave en grande: "x,y;desde-hasta;..." (rangos donde NO aparecen)')
    ap.add_argument("--sonidos", help="JSON con efectos: [{file, start, vol}] que se mezclan bajo la voz")
    ap.add_argument("--fps", help="cuadros por segundo de salida (por defecto los del video de entrada)")
    ap.add_argument("--crop-x", type=float, default=0.5, help="dónde recortar en --vertical: 0 izquierda, 0.5 centro, 1 derecha")
    ap.add_argument("--title-right", action="store_true", help="título arriba a la derecha (video horizontal)")
    ap.add_argument("--title", help='título del gancho: "texto con *clave*|etiqueta|hasta_segundos"')
    a = ap.parse_args()
    if os.path.abspath(a.input) == os.path.abspath(a.output):
        sys.exit("La salida no puede ser el archivo original.")
    keep = json.load(open(a.plan))["keep"]
    w, h, fps = probe(a.input)
    fps = a.fps or fps
    # Cada tramo dura un número entero de cuadros, y el audio de ese tramo se recorta o rellena a esa misma
    # duración. Así, al pegar decenas de tramos, la voz y la imagen no se separan (video 02, 2026-10-31:
    # sin esto la imagen llegó a ir 0,9 s detrás de la voz al final).
    num, _, den = str(fps).partition("/")
    fpsf = float(num) / float(den or 1)
    keep = [[s, s + round((e - s) * fpsf) / fpsf] for s, e in keep]
    if a.vertical:
        w, h = 1080, 1920
    # Paso 1: cada tramo a su propio archivo temporal, uno por uno (poca memoria aunque sean cientos
    # y en cualquier orden). Aquí se fijan los cuadros por segundo (los celulares graban con ritmo
    # variable y el audio se desfasaría de los labios) y el tamaño final.
    tmp = tempfile.mkdtemp(prefix="tramos-", dir=os.path.dirname(os.path.abspath(a.output)))
    norm_v = f"fps={fps},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}:(iw-ow)*{a.crop_x}:(ih-oh)/2,setsar=1,format=yuv420p"
    enc = ["-c:v", "libx264", "-crf", "10", "-preset", "veryfast", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1"]
    lista = []
    for i, (s, e) in enumerate(keep):
        f = os.path.join(tmp, f"{i:04d}.mkv")
        n = round((e - s) * fpsf)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s), "-t", f"{e - s + 0.3:.3f}",
                        "-i", a.input, "-vf", norm_v + ",setpts=PTS-STARTPTS", "-frames:v", str(n),
                        "-af", f"asetpts=PTS-STARTPTS,apad,atrim=end={n / fpsf:.6f}", *enc, f], check=True)
        lista.append(f)
    if a.append:
        # Tarjeta final (por ejemplo la de HyperFrames), con silencio si no trae audio.
        f = os.path.join(tmp, "zz-final.mkv")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a.append, "-f", "lavfi",
                        "-i", "anullsrc=r=48000:cl=mono", "-map", "0:v", "-map", "1:a", "-shortest",
                        "-vf", norm_v + ",setpts=PTS-STARTPTS", "-af", "asetpts=PTS-STARTPTS", *enc, f], check=True)
        # la tarjeta también: audio exactamente igual de largo que su video
        nf = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v", "-show_entries",
                                 "stream=nb_read_frames", "-of", "csv=p=0", f], capture_output=True, text=True).stdout.strip())
        g = f.replace(".mkv", "-exacta.mkv")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", f, "-c:v", "copy", "-af",
                        f"apad,atrim=end={nf / fpsf:.6f}", "-c:a", "pcm_s16le", f"-frames:v", str(nf), g], check=True)
        f = g
        lista.append(f)
    concat = os.path.join(tmp, "lista.txt")
    open(concat, "w").write("".join(f"file '{f}'\n" for f in lista))
    # Paso 2: se pegan en orden y en una sola pasada final van subtítulos, volumen y calidad máxima.
    # La capa transparente (--overlay) va debajo de los subtítulos y arriba del video.
    # Mini videos en bucle (entradas 2..n) debajo de la capa transparente; el seguidor va encima y los
    # bordes blancos de cada tarjeta tapan las esquinas del video.
    capas = json.load(open(a.capas)) if a.capas else []
    sonidos = json.load(open(a.sonidos)) if a.sonidos else []
    v = "[0:v]setpts=PTS-STARTPTS"
    # Zooms sobre la toma: Snap Zoom (golpe de acercamiento en una frase) y Zoom Through Cut (acercamiento con
    # desenfoque que esconde un corte). zoompan con d=1 da un cuadro por cuadro de entrada.
    zooms = json.load(open(a.zooms)) if a.zooms else []
    if zooms:
        partes, blur = [], []
        for zz in zooms:
            if zz["tipo"] == "snap":
                A, B = zz["a"], zz["b"]
                partes.append(f"{zz.get('z', 1.25) - 1}*min(1,max(0,(it-{A})/0.12))*min(1,max(0,({B}+0.25-it)/0.25))")
            else:
                T0 = zz["t"]
                partes.append(f"{zz.get('z', 1.5) - 1}*max(0,1-abs(it-{T0})/0.2)")
                blur.append(f"between(t,{T0 - 0.12},{T0 + 0.12})")
        cx, cy = zooms[0].get("cx", 960), zooms[0].get("cy", 380)
        zexp = "1+" + "+".join(partes)
        v += (f",zoompan=z='{zexp}':x='max(0,min(iw-iw/zoom,{cx}-iw/zoom/2))':y='max(0,min(ih-ih/zoom,{cy}-ih/zoom/2))'"
              f":d=1:s={w}x{h}:fps={fps}")
        if blur:
            v += f",gblur=sigma=14:enable='{'+'.join(blur)}'"
    escenas = json.load(open(a.escenas)) if a.escenas else []
    for j, c in enumerate(capas):
        if c["file"].endswith(".mov"):    # escena animada con transparencia: una sola vez, desde 'start'
            v += (f"[b{j}];[{j + 2}:v]format=yuva420p,tpad=start_duration={c['start']}:color=0x00000000,setpts=PTS-STARTPTS[m{j}];"
                  f"[b{j}][m{j}]overlay={c['x']}:{c['y']}:eof_action=pass")
        else:
            v += (f"[b{j}];[{j + 2}:v]setpts=PTS-STARTPTS[m{j}];[b{j}][m{j}]overlay={c['x']}:{c['y']}:shortest=1:"
                  f"enable='between(t,{c['start']},{c['end']})'")
    if escenas:
        b0 = 2 + len(capas) + len(sonidos)
        pip = escenas[0].get("pip", {"x": 40, "y": 40, "w": 560, "h": 315, "r": 26})
        ventanas = "+".join(f"between(t,{e['start']},{e['start'] + e['dur']})" for e in escenas)
        v += f"[e_in];[e_in]split[e_b][e_p];[e_p]scale={pip['w']}:{pip['h']},format=yuva420p[e_pc];[{b0}:v]format=gray,scale={pip['w']}:{pip['h']}[e_m];[e_pc][e_m]alphamerge[e_pip];[e_b]null"
        for k, e in enumerate(escenas):
            v += (f"[e{k}];[{b0 + 1 + k}:v]setpts=PTS-STARTPTS,tpad=start_duration={e['start']}[es{k}];"
                  f"[e{k}][es{k}]overlay=0:0:eof_action=pass:enable='between(t,{e['start']},{e['start'] + e['dur']})'")
        v += f"[e_f];[e_f][e_pip]overlay={pip['x']}:{pip['y']}:enable='{ventanas}'"
    if a.overlay:
        pad = f",tpad=start_duration={a.overlay_start}:color=0x00000000" if a.overlay_start else ""
        v += f"[base];[1:v]format=yuva420p{pad},setpts=PTS-STARTPTS[capa];[base][capa]overlay=0:0:eof_action=pass"
    # El video final dura exactamente lo que el montaje (tramos + tarjeta final): ninguna capa lo puede estirar.
    dur_total = sum(e - s for s, e in keep)
    if a.append:
        dur_total += float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.append],
                                          capture_output=True, text=True).stdout)
    if a.captions:
        ass = os.path.splitext(a.output)[0] + ".ass"
        gr = None
        if a.grandes:
            pos, *fz = a.grandes.split(";")
            xy = [int(v) for v in pos.split(",")] + [0]      # x,y[,ancho libre]
            gr = (xy[0], xy[1], xy[2], [tuple(float(v) for v in z.split("-")) for z in fz])
        n = build_ass(a.captions, keep, w, h, a.vertical, ass, a.title, 9 if a.title_right else 8, gr)
        v += f",ass='{ass}'" + (f":fontsdir='{a.fontsdir}'" if a.fontsdir else "")
        print(f"{n} líneas de subtítulos -> {ass}", file=sys.stderr)
    au = "anull" if a.no_loudnorm else "loudnorm=I=-16:TP=-1.5:LRA=11"
    # efectos bajo la voz: cada uno con su retraso y volumen, mezclados antes de nivelar
    mezcla, fuente = "", "[0:a]"
    if sonidos:
        base = 2 + len(capas)
        for j, s_ in enumerate(sonidos):
            mezcla += f"[{base + j}:a]aresample=48000,aformat=channel_layouts=mono,adelay={int(s_['start'] * 1000)}:all=1,volume={s_.get('vol', 0.5)}[s{j}];"
        mezcla += "[0:a]aformat=channel_layouts=mono[vox];[vox]" + "".join(f"[s{j}]" for j in range(len(sonidos)))
        mezcla += f"amix=inputs={len(sonidos) + 1}:duration=first:normalize=0[mx];"
        fuente = "[mx]"
    capa = ["-i", a.overlay] if a.overlay else ["-f", "lavfi", "-i", "color=c=black@0:s=16x16:d=1"]
    for c in capas:
        capa += (["-loop", "1", "-framerate", "30", "-i", c["file"]] if c["file"].endswith(".png")
                 else ["-i", c["file"]] if c["file"].endswith(".mov") else ["-stream_loop", "-1", "-i", c["file"]])
    for s_ in sonidos:
        capa += ["-i", s_["file"]]
    if escenas:
        total = sum(e - s for s, e in keep) + 30
        capa += ["-loop", "1", "-framerate", "30", "-t", f"{total:.2f}", "-i", mascara_pip(escenas[0].get("pip", {"w": 560, "h": 315, "r": 26}), os.path.dirname(os.path.abspath(a.output)))]
        for e in escenas:
            capa += ["-i", e["file"]]
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", concat, *capa,
           "-filter_complex", f"{v},trim=duration={dur_total:.3f}[v];{mezcla}{fuente}{au},aresample=48000[a]", "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", a.output]
    if os.environ.get("VER_COMANDO"):
        print(" ".join(repr(c) if " " in c or ";" in c else c for c in cmd), file=sys.stderr)
    subprocess.run(cmd, check=True)
    shutil.rmtree(tmp)
    print(f"listo -> {os.path.abspath(a.output)}", file=sys.stderr)

if __name__ == "__main__":
    main()
