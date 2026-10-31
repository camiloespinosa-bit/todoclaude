"""Sincronía tramo por tramo de un video editado frente a su original.
Para cada tramo: busca el audio del original (s+0.8 .. s+2.0) en una ventana amplia del final, y luego
la imagen del original en s+1.4 cerca de ese punto. Imprime: dónde cayó el audio respecto a lo esperado
y el desfase imagen-voz (positivo = la imagen llega tarde = la voz va adelantada)."""
import json, subprocess, sys
import numpy as np
orig, final, plan = sys.argv[1:4]
saltar = [tuple(map(float, r.split("-"))) for r in sys.argv[4].split(",")] if len(sys.argv) > 4 else []
keep = json.load(open(plan))["keep"]
def au(f, t, d):
    return np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{max(t,0):.3f}", "-t", str(d), "-i", f, "-vn", "-ac", "1",
                         "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout, np.int16).astype(np.float32)
def fr(f, t, d):
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "info", "-copyts", "-ss", f"{max(t,0):.3f}", "-t", str(d), "-i", f, "-an", "-vf",
                        "showinfo,crop=1300:800:0:200,scale=96:54,format=gray", "-fps_mode", "passthrough", "-f", "rawvideo", "-"], capture_output=True)
    ts = [float(l.split("pts_time:")[1].split()[0]) for l in r.stderr.decode().splitlines() if "pts_time:" in l]
    x = np.frombuffer(r.stdout, np.uint8).reshape(-1, 54, 96).astype(np.float32)
    n = min(len(ts), len(x)); return x[:n], ts[:n]
acc = 0.0
for i, (s, e) in enumerate(keep):
    L = e - s
    g = acc
    if L > 2.6 and not any(a <= g <= b for a, b in saltar):
        am = au(orig, s + 0.8, 1.2); af = au(final, g - 3.2, 8.4)
        c = np.correlate(af - af.mean(), am - am.mean(), "valid"); ta = g - 3.2 + np.argmax(c) / 8000   # dónde suena s+0.8 en el final
        fm, tm = fr(orig, s + 1.4, 0.1); fm, t_m = fm[0], tm[0]
        ff, tf = fr(final, ta + (t_m - (s + 0.8)) - 1.0, 2.0)
        k = int(np.argmin([np.abs(x - fm).mean() for x in ff])); tv = tf[k] - (t_m - (s + 0.8))
        print(f"tramo {i:2d} esperado {g + 0.8:7.2f}s  voz en {ta:7.2f} ({1000*(ta-g-0.8):+5.0f} ms)  desfase imagen-voz {1000*(tv-ta):+5.0f} ms")
    acc += L
