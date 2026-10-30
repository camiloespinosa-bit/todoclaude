"""Efectos de sonido sintetizados desde cero (sin derechos de terceros). WAV 48 kHz mono."""
import sys, wave
import numpy as np
SR = 48000; out = sys.argv[1]; rng = np.random.default_rng(7)
def t(d): return np.arange(int(SR * d)) / SR
def env(n, a, r):            # ataque y caída exponencial
    x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / r)
def lp(x, fc):              # pasa bajos de un polo
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s = (1 - a) * v + a * s; y[i] = s
    return y
def bp_sweep(x, f0, f1):    # pasa banda que barre (filtro de estado variable)
    n = len(x); f = np.geomspace(f0, f1, n); low = band = 0.0; y = np.empty(n); q = 0.5
    for i in range(n):
        g = 2 * np.sin(np.pi * f[i] / SR); high = x[i] - low - q * band
        band += g * high; low += g * band; y[i] = band
    return y
def save(name, x, peak=0.5):
    x = x / (np.abs(x).max() + 1e-9) * peak
    fade = min(len(x), 480); x[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(f"{out}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
n = rng.standard_normal
# barrido de aire (el edificio sube / palabras que vuelan)
d = 0.9; x = bp_sweep(n(int(SR * d)), 300, 3500) * np.sin(np.pi * t(d) / d) ** 2; save("whoosh", x)
d = 1.4; x = bp_sweep(n(int(SR * d)), 200, 1800) * np.sin(np.pi * t(d) / d) ** 2; save("whoosh_sube", x)
# pop suave (paredes, etiquetas)
d = 0.18; tt = t(d); x = np.sin(2 * np.pi * (520 + 900 * np.exp(-tt * 40)) * tt) * env(len(tt), 0.002, 0.05); save("pop", x, 0.45)
# tic (cada ventana)
d = 0.06; tt = t(d); x = np.sin(2 * np.pi * 1800 * tt) * env(len(tt), 0.001, 0.012); save("tic", x, 0.35)
# brillo (colores): acorde de campanitas
d = 1.2; tt = t(d); x = sum(np.sin(2 * np.pi * f * tt) * env(len(tt), 0.003 + i * 0.08, 0.35) * (tt > i * 0.08)
                          for i, f in enumerate([1318.5, 1568, 1975.5, 2637])); save("brillo", x, 0.3)
# golpe del letrero / bases: grave con un poco de ruido
d = 0.6; tt = t(d); x = np.sin(2 * np.pi * (55 + 70 * np.exp(-tt * 18)) * tt) * env(len(tt), 0.003, 0.16) + 0.15 * lp(n(len(tt)), 900) * env(len(tt), 0.001, 0.03)
save("golpe", x, 0.6)
# rodillo de pintura: ruido de banda media con vaivén
d = 1.6; tt = t(d); x = bp_sweep(n(len(tt)), 500, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt)) * np.sin(np.pi * tt / d) ** 0.6; save("rodillo", x, 0.35)
d = 0.7; tt = t(d); x = bp_sweep(n(len(tt)), 600, 1200) * np.sin(np.pi * tt / d); save("brocha", x, 0.3)
# grieta: chasquidos irregulares que se agrandan
d = 0.9; x = np.zeros(int(SR * d))
for k in range(26):
    p = int(SR * d * (k / 26) ** 0.8 + rng.integers(0, 600)); L = rng.integers(200, 1400)
    seg = n(L) * env(L, 0.0005, 0.004 + 0.01 * k / 26) * (0.4 + k / 26)
    x[p:p + L] += seg[: max(0, len(x) - p)]
x = x - lp(x, 300); save("grieta", x, 0.5)
# retumbo (bases bajo tierra)
d = 1.8; tt = t(d); x = lp(n(len(tt)), 90) * env(len(tt), 0.25, 0.7); save("retumbo", x, 0.6)
# viento del huracán: ruido con ráfagas
d = 16.5; tt = t(d); g = 0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * tt) * np.sin(2 * np.pi * 0.61 * tt + 1)
x = bp_sweep(n(len(tt)), 250, 700) * g * np.minimum(1, tt / 1.5) * np.minimum(1, (d - tt) / 1.5); save("viento", x, 0.45)
# crujido de madera (el edificio se mece)
d = 1.6; tt = t(d); f = 140 + 60 * np.sin(2 * np.pi * 0.7 * tt)
x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(tt)) < 0.35) * np.sin(np.pi * tt / d); x = lp(x, 1500); save("crujido", x, 0.3)
# derrumbe: grave + escombros
d = 2.2; tt = t(d); x = lp(n(len(tt)), 160) * env(len(tt), 0.01, 0.6) * 1.4
for k in range(40):
    p = int(rng.uniform(0.05, 1.6) * SR); L = rng.integers(400, 3000)
    x[p:p + L] += n(L) * env(L, 0.0005, 0.01) * rng.uniform(0.2, 0.8)
save("derrumbe", x, 0.65)
print("ok")
