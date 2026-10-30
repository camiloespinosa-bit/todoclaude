"""Para cada tramo de keep: ubica en el video final el audio y la imagen de un mismo instante del master.
desfase = t_imagen - t_audio en el final (positivo: la imagen llega tarde = la voz va adelantada)."""
import json, subprocess, sys
import numpy as np
master, final, plan = sys.argv[1:4]
keep = json.load(open(plan))["keep"]
def au(f, t, d):
    return np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{max(t,0):.3f}", "-t", str(d), "-i", f, "-vn", "-ac", "1", "-ar", "8000",
                         "-f", "s16le", "-"], capture_output=True).stdout, np.int16).astype(np.float32)
def fr(f, t, d):
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "info", "-copyts", "-ss", f"{max(t,0):.3f}", "-t", str(d), "-i", f, "-an", "-vf",
                        "showinfo,scale=96:54,format=gray", "-fps_mode", "passthrough", "-f", "rawvideo", "-"], capture_output=True)
    ts = [float(l.split("pts_time:")[1].split()[0]) for l in r.stderr.decode().splitlines() if "pts_time:" in l]
    x = np.frombuffer(r.stdout, np.uint8).reshape(-1, 54, 96).astype(np.float32)
    return x[:len(ts)], ts[:len(x)]
acc = 0.0
for i, (s, e) in enumerate(keep):
    L = e - s
    if L > 2.5:
        g = acc + 0.034 * i          # posición esperada en el final (un cuadro de más por tramo)
        am = au(master, s + 0.8, 1.2); af = au(final, g + 0.8 - 1.0, 3.2)
        c = np.correlate(af - af.mean(), am - am.mean(), "valid"); ta = g - 0.2 + np.argmax(c) / 8000
        fm, tm = fr(master, s + 1.4, 0.1); fm = fm[0]; t_m = tm[0]
        ff, tf = fr(final, g + 1.4 - 0.6, 1.4)
        k = int(np.argmin([np.abs(x - fm).mean() for x in ff])); tv = tf[k] - (t_m - (s + 0.8))
        print(f"tramo {i:2d} final≈{g:6.1f}s  desfase {1000*(tv-ta):5.0f} ms")
    acc += L
