"""Banner horizontal de 190 x 40 cm para imprimir (Gimnasio del Cerebro + Oki).

Reemplaza el banner anterior con el logo del arbol, que esta retirado. Genera
html/07-banner-190x40.html; render.js lo convierte a PDF al tamano real.
Uso: python3 identidad-marca/banner.py
"""
from build import AZUL, AZUL_OSC, NARANJA, OUT, TYPEKIT, VERDE, oki

GRIS_TEXTO = "#6B7C88"

W, H = 1900, 400  # mm

HTML = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="hz:slide-selector" content=".slide">
<title>Banner Gimnasio del Cerebro 190x40</title>
{TYPEKIT}
<style>
@page{{size:{W}mm {H}mm;margin:0;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#fff;font-family:"poppins",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
.slide{{position:relative;overflow:hidden;background:#fff;width:{W}mm;height:{H}mm;}}
</style></head><body>
<section class="slide">
 <div style="position:absolute;left:0;right:0;bottom:0;height:16mm;display:flex;">
  <div style="flex:6;background:{AZUL};"></div><div style="flex:2;background:{VERDE};"></div><div style="flex:2;background:{NARANJA};"></div>
 </div>
 <img src="{oki('base-saludo')}" style="position:absolute;left:110mm;top:42mm;width:300mm;height:299mm;">
 <div style="position:absolute;left:470mm;top:84mm;">
  <p style="font-weight:900;font-size:340pt;line-height:.9;color:{AZUL_OSC};letter-spacing:-.01em;">GIMNASIO</p>
  <p style="font-weight:900;font-size:208pt;line-height:1;color:{AZUL};margin-top:8mm;">DEL CEREBRO</p>
 </div>
 <div style="position:absolute;left:1270mm;top:80mm;width:3mm;height:220mm;background:#D9E1E7;border-radius:2mm;"></div>
 <div style="position:absolute;left:1330mm;top:84mm;width:520mm;">
  <p style="font-weight:800;font-size:96pt;line-height:1.12;color:{AZUL_OSC};">El cerebro se entrena como un músculo.</p>
  <p style="font-weight:600;font-size:46pt;color:{NARANJA};margin-top:16mm;letter-spacing:.06em;text-transform:uppercase;">Rionegro · Antioquia</p>
  <p style="font-weight:600;font-size:60pt;color:{AZUL_OSC};margin-top:16mm;">gimnasiodelcerebro.co</p>
  <p style="font-weight:600;font-size:60pt;color:{AZUL_OSC};margin-top:6mm;">WhatsApp 301 491 6120</p>
  <p style="font-weight:400;font-size:34pt;color:{GRIS_TEXTO};margin-top:14mm;">Centro Cognitivo para el Aprendizaje (CCA)</p>
 </div>
</section>
</body></html>"""

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    (OUT / "07-banner-190x40.html").write_text(HTML, encoding="utf-8")
    print("07-banner-190x40")
