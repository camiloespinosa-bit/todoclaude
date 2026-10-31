"""Recorta a la persona cuadro a cuadro (MediaPipe selfie_multiclass con LiteRT) y guarda PNG con transparencia.
La máscara se suaviza en el tiempo (promedio con el cuadro anterior) y en el borde, para que no titile."""
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter
from ai_edge_litert.interpreter import Interpreter
src, dst, model = sys.argv[1:4]
it = Interpreter(model_path=model); it.allocate_tensors()
i_in, i_out = it.get_input_details()[0], it.get_output_details()[0]
_, H, W, _ = i_in["shape"]
prev = None
for f in sorted(glob.glob(os.path.join(src, "*.png"))):
    im = Image.open(f).convert("RGB")
    x = np.asarray(im.resize((W, H), Image.BILINEAR), np.float32)[None] / 255.0
    it.set_tensor(i_in["index"], x); it.invoke()
    m = 1 - it.get_tensor(i_out["index"])[0][..., 0]
    m = np.asarray(Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR), np.float32) / 255
    m = m if prev is None else 0.6 * m + 0.4 * prev
    prev = m
    a = Image.fromarray((np.clip((m - 0.35) / 0.3, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
    out = im.convert("RGBA"); out.putalpha(a); out.save(os.path.join(dst, os.path.basename(f)))
print("ok")
