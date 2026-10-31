"""Posición de la cara (Haar) cada N s: imprime percentiles del borde derecho, izquierdo, arriba y abajo (en px de 1920x1080)."""
import subprocess, sys
import numpy as np, cv2
f, paso = sys.argv[1], float(sys.argv[2])
r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", f, "-vf", f"fps=1/{paso},scale=960:540,format=gray", "-f", "rawvideo", "-"], capture_output=True)
fr = np.frombuffer(r.stdout, np.uint8).reshape(-1, 540, 960)
cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
B = []
for i, x in enumerate(fr):
    fs = cas.detectMultiScale(x, 1.1, 5, minSize=(80, 80))
    if len(fs): a = max(fs, key=lambda b: b[2] * b[3]); B.append([i * paso, *(a * 2)])
B = np.array(B); x, y, w, h = B[:, 1], B[:, 2], B[:, 3], B[:, 4]
print(f"cuadros con cara {len(B)}/{len(fr)}")
for n, v in [("izq", x), ("der", x + w), ("arriba", y), ("abajo", y + h), ("centro_x", x + w / 2)]:
    print(n, " ".join(f"p{p}={np.percentile(v, p):.0f}" for p in (2, 10, 50, 90, 98)))
