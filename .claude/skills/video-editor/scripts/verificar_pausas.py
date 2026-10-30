"""Revisa cada pausa que plan_cuts quitó entre dos tramos seguidos (no los rangos de 'drop'): si el audio
del hueco tiene voz (alguna ventana de 30 ms sobre UMBRAL dB), devuelve el hueco uniendo los tramos.
Whisper a veces pone mal el inicio de una palabra ("gratuita") y el recorte se comía la voz."""
import json, subprocess, sys
import numpy as np
src, plan, out = sys.argv[1], sys.argv[2], sys.argv[3]
UMBRAL = -25.0
p = json.load(open(plan))
drops = [(x["start"], x["end"]) for x in p["drop"]]
pcm = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                                   capture_output=True).stdout, np.int16).astype(np.float32) / 32768
def db_max(a, b):
    x = pcm[int(a * 16000):int(b * 16000)]
    if len(x) < 480: return -99
    w = x[: len(x) // 480 * 480].reshape(-1, 480)
    return float(20 * np.log10(np.sqrt((w ** 2).mean(1)).max() + 1e-9))
keep, n = [list(p["keep"][0])], 0
for s, e in p["keep"][1:]:
    a, b = keep[-1][1], s
    tapado = any(ds < b and de > a for ds, de in drops)      # hueco que toca una toma descartada: no se toca
    lv = db_max(a, b)
    if not tapado and lv > UMBRAL:
        print(f"  devuelvo {a:8.2f}-{b:8.2f} ({b-a:.2f} s, pico {lv:.0f} dB)"); keep[-1][1] = e; n += 1
    else:
        keep.append([s, e])
p["keep"] = keep; p["edited_s"] = round(sum(b - a for a, b in keep), 2)
json.dump(p, open(out, "w"), ensure_ascii=False, indent=1)
print(f"{out}: {n} huecos devueltos, {p['edited_s']} s")
