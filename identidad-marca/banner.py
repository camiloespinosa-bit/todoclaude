"""Banner horizontal de 190 x 40 cm para imprimir (Gimnasio del Cerebro + Oki).

Reemplaza el banner anterior con el logo del arbol, que esta retirado. Genera
html/07-banner-190x40.html; render.js lo convierte a PDF al tamano real.
Uso: python3 identidad-marca/banner.py
"""
import base64
import io
from urllib.parse import quote

import segno

from build import AMARILLO, AZUL, AZUL_OSC, NARANJA, OUT, TYPEKIT, VERDE, oki

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

# Version para la fachada del local: fondo oscuro, poco texto y QR que abre WhatsApp con un
# mensaje prellenado, para saber que el contacto vino del aviso.
WA_URL = "https://wa.me/573014916120?text=" + quote("Hola, vi el aviso del local y quiero información")


def qr_data_uri(url):
    svg = io.BytesIO()
    segno.make(url, error="m").save(svg, kind="svg", scale=10, border=4, dark=AZUL_OSC, light="#FFFFFF",
                                     xmldecl=False, svgns=True)
    return "data:image/svg+xml;base64," + base64.b64encode(svg.getvalue()).decode()


HTML_EXTERIOR = HTML.split("<section", 1)[0].replace(
    "Banner Gimnasio del Cerebro 190x40", "Banner exterior Gimnasio del Cerebro 190x40") + f"""<section class="slide" style="background:{AZUL_OSC};">
 <div style="position:absolute;left:0;right:0;bottom:0;height:16mm;display:flex;">
  <div style="flex:6;background:{AZUL};"></div><div style="flex:2;background:{VERDE};"></div><div style="flex:2;background:{NARANJA};"></div>
 </div>
 <img src="{oki('base-saludo')}" style="position:absolute;left:90mm;top:42mm;width:300mm;height:299mm;">
 <div style="position:absolute;left:440mm;top:70mm;">
  <p style="font-weight:900;font-size:300pt;line-height:.9;color:#fff;letter-spacing:-.01em;">GIMNASIO</p>
  <p style="font-weight:900;font-size:184pt;line-height:1;color:#fff;margin-top:6mm;">DEL CEREBRO</p>
  <p style="font-weight:700;font-size:76pt;color:{AMARILLO};margin-top:14mm;">Entrenamiento cognitivo para niños y adultos</p>
 </div>
 <div style="position:absolute;left:1290mm;top:96mm;width:330mm;">
  <p style="font-weight:700;font-size:44pt;color:{AMARILLO};letter-spacing:.06em;text-transform:uppercase;">Evaluación gratuita</p>
  <p style="font-weight:600;font-size:56pt;color:#fff;margin-top:10mm;">Escríbenos al WhatsApp</p>
  <p style="font-weight:900;font-size:120pt;line-height:1.05;color:#fff;margin-top:4mm;">301 491 6120</p>
  <p style="font-weight:400;font-size:44pt;color:#fff;opacity:.82;margin-top:12mm;">gimnasiodelcerebro.co</p>
 </div>
 <div style="position:absolute;left:1630mm;top:70mm;width:230mm;">
  <img src="{qr_data_uri(WA_URL)}" style="width:230mm;height:230mm;border-radius:6mm;">
  <p style="font-weight:600;font-size:30pt;color:#fff;text-align:center;margin-top:6mm;">Escanea y escríbenos</p>
 </div>
</section>
</body></html>"""

# Version con lista de servicios, reconstruida desde un boceto hecho con IA: se conserva la
# composicion (servicios, Oki, contacto) pero con el SVG oficial de Oki y un QR real.
SERVICIOS = ["Estimulación temprana", "Mejora de la memoria", "Agilidad mental", "Concentración",
             "Resolución de problemas", "Cursos de inglés"]
_lista = "".join(
    f'<div style="display:flex;align-items:center;gap:12mm;margin-bottom:{15 if i < len(SERVICIOS) - 1 else 0}mm;">'
    f'<div style="width:22mm;height:22mm;border-radius:50%;background:{[AMARILLO, VERDE, NARANJA][i % 3]};flex:none;"></div>'
    f'<p style="font-weight:700;font-size:76pt;line-height:1;color:#fff;white-space:nowrap;">{s}</p></div>'
    for i, s in enumerate(SERVICIOS))

HTML_SERVICIOS = HTML.split("<section", 1)[0].replace(
    "Banner Gimnasio del Cerebro 190x40", "Banner servicios Gimnasio del Cerebro 190x40") + f"""<section class="slide" style="background:{AZUL_OSC};">
 <div style="position:absolute;left:1020mm;top:-200mm;width:1300mm;height:800mm;border-radius:50%;background:{AZUL};"></div>
 <div style="position:absolute;left:0;right:0;bottom:0;height:16mm;display:flex;">
  <div style="flex:6;background:{AZUL};"></div><div style="flex:2;background:{VERDE};"></div><div style="flex:2;background:{NARANJA};"></div>
 </div>
 <div style="position:absolute;left:80mm;top:0;bottom:16mm;display:flex;flex-direction:column;justify-content:center;">{_lista}</div>
 <img src="{oki('base-saludo')}" style="position:absolute;left:660mm;top:40mm;width:320mm;height:319mm;">
 <div style="position:absolute;left:1040mm;top:110mm;width:220mm;">
  <img src="{qr_data_uri(WA_URL)}" style="width:220mm;height:220mm;border-radius:6mm;">
  <p style="font-weight:600;font-size:28pt;color:#fff;text-align:center;margin-top:5mm;">Escanea y escríbenos</p>
 </div>
 <div style="position:absolute;left:1310mm;top:50mm;width:560mm;">
  <p style="font-weight:900;font-size:200pt;line-height:.95;color:{AMARILLO};">GIMNASIO</p>
  <p style="font-weight:900;font-size:128pt;line-height:1;color:#fff;margin-top:2mm;">DEL CEREBRO</p>
  <p style="font-weight:600;font-size:46pt;color:#fff;margin-top:10mm;">Entrenamiento cognitivo para niños y adultos</p>
  <div style="display:inline-block;background:{AMARILLO};padding:3mm 10mm;border-radius:3mm;margin-top:10mm;"><p style="font-weight:800;font-size:40pt;letter-spacing:.05em;color:{AZUL_OSC};">EVALUACIÓN GRATUITA</p></div>
  <p style="font-weight:600;font-size:40pt;color:#fff;margin-top:9mm;">Escríbenos al WhatsApp</p>
  <p style="font-weight:900;font-size:104pt;line-height:1.05;color:#fff;">301 491 6120</p>
  <p style="font-weight:400;font-size:38pt;color:#fff;opacity:.82;margin-top:3mm;">gimnasiodelcerebro.co</p>
 </div>
</section>
</body></html>"""

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    (OUT / "07-banner-190x40.html").write_text(HTML, encoding="utf-8")
    (OUT / "08-banner-exterior-190x40.html").write_text(HTML_EXTERIOR, encoding="utf-8")
    (OUT / "09-banner-servicios-190x40.html").write_text(HTML_SERVICIOS, encoding="utf-8")
    print("07-banner-190x40, 08-banner-exterior-190x40, 09-banner-servicios-190x40")
