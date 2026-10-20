"""Genera el paquete de identidad de marca CCA (manual, kit de redes, papeleria) como HTML.

Cada HTML es autocontenido: los SVG oficiales de Oki se incrustan como data URI y la
tipografia Poppins se carga desde Adobe Fonts. Uso: python3 identidad-marca/build.py
"""
import base64
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OKI_DIR = ROOT.parent / "assets" / "img" / "oki"
# Con EXPRESS=1 cada Oki se reemplaza por un recuadro rotulado con su pose: el importador de Adobe
# Express no descarga imagenes externas, asi que ahi se arrastra el SVG original a mano.
EXPRESS = os.environ.get("EXPRESS") == "1"
OUT = ROOT / ("html-express" if EXPRESS else "html")

TYPEKIT = '<link rel="stylesheet" href="https://use.typekit.net/ljh2acu.css">'

AZUL, AZUL_OSC, VERDE, NARANJA = "#145389", "#2C5F7C", "#7CB342", "#F57C00"
FONDO, AMARILLO, TURQUESA = "#F0F4F8", "#FDD835", "#57A6B5"
TEXTO = "#1D3F54"

POSES = [
    ("base-saludo", "Base / saludo", "Bienvenidas, portadas, hero del sitio"),
    ("pensando", "Pensando", "Preguntas, retos, llamados a reflexionar"),
    ("celebrando", "Celebrando", "Logros, avances, cierres de fase"),
    ("senalando", "Señalando", "Llamados a la acción, datos clave"),
    ("leyendo", "Leyendo / estudiando", "Blog, guías, contenido educativo"),
    ("ejercitando", "Ejercitando", "Sesiones, circuitos, Adulto Vital"),
    ("empatia", "Empatía / apoyo", "Familias, acompañamiento, nosotros"),
    ("sorpresa", "Sorpresa / descubrimiento", "Hallazgos, curiosidades, ciencia"),
]

_cache = {}


def oki(pose):
    if EXPRESS:
        return f"OKI:{pose}"
    if pose not in _cache:
        raw = (OKI_DIR / f"oki-{pose}.svg").read_bytes()
        _cache[pose] = "data:image/svg+xml;base64," + base64.b64encode(raw).decode()
    return _cache[pose]


def rgb(hexcode):
    h = hexcode.lstrip("#")
    return ", ".join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))


BASE_CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#cfd8e0;font-family:"poppins",sans-serif;color:{TEXTO};}}
.slide{{position:relative;overflow:hidden;background:{FONDO};margin:0 auto 40px;font-family:"poppins",sans-serif;}}
.dark{{background:{AZUL_OSC};color:#fff;}}
.white{{background:#fff;}}
img{{display:block;}}
.kicker{{font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{AZUL};}}
.dark .kicker{{color:{AMARILLO};}}
.foot{{position:absolute;left:96px;right:96px;bottom:40px;display:flex;justify-content:space-between;font-size:18px;opacity:.6;}}
@media print{{
 body{{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
 .slide{{margin:0;page-break-after:always;}}
 .slide:last-child{{page-break-after:avoid;}}
}}
"""


def placeholder(m):
    pose, style = m.group(1), m.group(2)
    size = max(14, int(re.search(r"width:(\d+)px", style).group(1)) // 14)
    return (f'<div style="{style}border:3px dashed {TURQUESA};border-radius:16px;display:flex;align-items:center;'
            f'justify-content:center;text-align:center;font-weight:700;font-size:{size}px;color:{TURQUESA};">'
            f'Oki<br>oki-{pose}.svg</div>')


def doc(title, w, h, css, slides):
    body = "\n".join(
        f'<section class="slide {cls}" data-canvas-width="{w}" data-canvas-height="{h}" '
        f'style="width:{w}px;height:{h}px;">{inner}</section>'
        for cls, inner in slides
    )
    if EXPRESS:
        body = re.sub(r'<img src="OKI:([a-z-]+)" style="([^"]*)">', placeholder, body)
    return f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="hz:slide-selector" content=".slide">
<title>{title}</title>
{TYPEKIT}
<style>@page{{size:{w}px {h}px;margin:0;}}{BASE_CSS}{css}</style>
</head><body>
{body}
</body></html>"""


# ---------------------------------------------------------------- Manual (1920x1080)

M_CSS = f"""
.pad{{position:absolute;inset:96px 96px 110px 96px;}}
.kicker{{font-size:22px;margin-bottom:18px;}}
h1{{font-weight:900;font-size:104px;line-height:1.02;}}
h2{{font-weight:800;font-size:64px;line-height:1.08;color:{AZUL_OSC};margin-bottom:28px;}}
.dark h2{{color:#fff;}}
p.lead{{font-size:28px;line-height:1.5;max-width:900px;}}
.card{{background:#fff;border-radius:16px;border:2px solid #E2E8F0;box-shadow:0 4px 14px rgba(0,0,0,.06);padding:28px 32px;}}
.card h3{{font-weight:700;font-size:28px;color:{AZUL_OSC};margin-bottom:8px;}}
.card p{{font-size:21px;line-height:1.45;}}
.grid{{display:flex;flex-wrap:wrap;gap:28px;}}
.note{{background:#EAF4F6;border-left:8px solid {AZUL};border-radius:0 14px 14px 0;padding:20px 28px;font-size:22px;line-height:1.45;}}
.badge{{width:52px;height:52px;border-radius:50%;color:#fff;font-weight:900;font-size:24px;display:flex;align-items:center;justify-content:center;flex:none;}}
"""


def foot(n, dark=False):
    return f'<div class="foot"><span>CCA · El Gimnasio del Cerebro</span><span>Manual de identidad · {n:02d}</span></div>'


def manual():
    s = []
    s.append(("dark", f"""
<div style="position:absolute;left:120px;top:150px;width:900px;">
 <div class="kicker" style="font-size:24px;">Centro Cognitivo para el Aprendizaje</div>
 <h1 style="margin:10px 0 36px;">Manual de identidad de marca</h1>
 <div style="width:140px;height:10px;background:{AMARILLO};border-radius:5px;margin-bottom:36px;"></div>
 <p style="font-size:34px;font-weight:600;">CCA · El Gimnasio del Cerebro</p>
 <p style="font-size:26px;opacity:.82;margin-top:10px;">Rionegro, Antioquia, Colombia · Versión 1.0, 2026</p>
</div>
<img src="{oki('base-saludo')}" style="position:absolute;right:90px;top:150px;width:780px;height:778px;">
"""))
    items = ["Esencia de marca", "Oki, nuestro personaje", "Las 8 poses oficiales", "Uso correcto de Oki",
             "Lo que nunca se hace", "Paleta de color", "Color de Oki y combinaciones", "Tipografía Poppins",
             "Jerarquía tipográfica", "Elementos gráficos", "Tono de voz", "Formatos y aplicaciones"]
    rows = "".join(
        f'<div style="display:flex;align-items:center;gap:22px;width:780px;margin-bottom:18px;">'
        f'<div class="badge" style="background:{[AZUL, VERDE, NARANJA][i % 3]};">{i + 1}</div>'
        f'<span style="font-size:28px;font-weight:600;">{t}</span></div>' for i, t in enumerate(items))
    s.append(("", f"""<div class="pad"><div class="kicker">Contenido</div><h2>Qué encontrarás aquí</h2>
<div style="display:flex;flex-wrap:wrap;column-gap:60px;height:440px;flex-direction:column;">{rows}</div></div>{foot(2)}"""))

    publicos = [("Niños 0 a 15 años", "Sesiones semanales que entrenan el cerebro con movimiento y juego con sentido.", AZUL),
                ("Docentes", "Formación en neurociencia aplicada y acompañamiento real en el aula.", VERDE),
                ("Adulto Vital", "Circuitos de movimiento y reto mental para mantener la función cognitiva.", NARANJA),
                ("Fase Experta", "Inglés como vehículo para entrenar funciones ejecutivas.", TURQUESA)]
    cards = "".join(f'<div class="card" style="width:396px;border-top:8px solid {c};"><h3>{t}</h3><p>{d}</p></div>'
                    for t, d, c in publicos)
    s.append(("", f"""<div class="pad"><div class="kicker">01 · Esencia de marca</div>
<h2 style="font-size:84px;">El cerebro se entrena<br>como un músculo.</h2>
<p class="lead" style="max-width:1400px;margin-bottom:56px;">Entrenamos memoria de trabajo, atención, autocontrol y flexibilidad cognitiva a través de retos con movimiento y sentido, no de hojas de ejercicios. La misma base científica, adaptada a cada etapa de la vida.</p>
<div class="grid">{cards}</div></div>{foot(3)}"""))

    s.append(("dark", f"""<img src="{oki('pensando')}" style="position:absolute;left:80px;top:150px;width:760px;height:760px;">
<div style="position:absolute;left:920px;top:170px;width:880px;">
<div class="kicker" style="font-size:22px;margin-bottom:18px;">02 · Nuestro personaje</div>
<h2 style="font-size:96px;margin-bottom:30px;">Oki</h2>
<p style="font-size:30px;line-height:1.5;margin-bottom:30px;">Un pulpo estilizado con <b style="color:{AMARILLO};">“9 cerebros”</b>: la metáfora visual de la función ejecutiva, el sistema que planea, se adapta y se autorregula.</p>
<p style="font-size:24px;line-height:1.55;opacity:.82;">Oki es la identidad central de CCA. Aparece en marketing, redes sociales, la plataforma con sus 200 retos cognitivos y el videojuego en desarrollo. Reemplaza por completo el antiguo logo del árbol-neurona.</p>
</div>{foot(4)}"""))

    tiles = "".join(
        f'<div class="card" style="width:396px;height:372px;padding:20px;display:flex;flex-direction:column;align-items:center;">'
        f'<img src="{oki(p)}" style="width:230px;height:230px;margin-bottom:12px;">'
        f'<h3 style="font-size:24px;text-align:center;">{n}</h3><p style="font-size:17px;text-align:center;opacity:.8;">{u}</p></div>'
        for p, n, u in POSES)
    s.append(("", f"""<div style="position:absolute;inset:70px 96px 100px 96px;"><div class="kicker">03 · Las 8 poses oficiales</div>
<div class="grid" style="gap:28px;margin-top:20px;">{tiles}</div></div>{foot(5)}"""))

    fondos = [("#FFFFFF", "Blanco", TEXTO), (FONDO, "Fondo claro", TEXTO), (AZUL_OSC, "Azul oscuro", "#fff")]
    fb = "".join(
        f'<div style="width:520px;"><div style="background:{bg};border:2px solid #E2E8F0;border-radius:16px;height:400px;display:flex;align-items:center;justify-content:center;">'
        f'<img src="{oki("senalando")}" style="width:330px;height:330px;"></div>'
        f'<p style="font-size:22px;font-weight:600;margin-top:14px;">{name} · {bg}</p></div>' for bg, name, fg in fondos)
    s.append(("", f"""<div class="pad"><div class="kicker">04 · Uso correcto de Oki</div><h2>Fondos permitidos y espacio de respiro</h2>
<div style="display:flex;gap:60px;margin-bottom:40px;">{fb}</div>
<div class="note" style="max-width:1700px;"><b>Recomendación por validar con el equipo:</b> dejar alrededor de Oki un margen libre de al menos la mitad del ancho de un tentáculo y no usarlo a menos de 120 px de alto en pantalla (25 mm en impresión), para que la expresión se lea.</div>
</div>{foot(6)}"""))

    nunca = ["Regenerar, redibujar o “mejorar” a Oki con herramientas de IA de imagen.",
             "Inventar poses nuevas. Si hace falta una, se pide al equipo (Sebastián).",
             "Deformar, estirar, rotar o recortar partes del cuerpo de Oki.",
             "Cambiar sus colores o aplicarle filtros, sombras o contornos extra.",
             "Usar el logo anterior del árbol de nodos o su paleta turquesa, verde, naranja y gris oscuro.",
             "Poner a Oki sobre fotos recargadas o fondos que no sean de la paleta."]
    li = "".join(f'<div style="display:flex;gap:22px;align-items:flex-start;margin-bottom:24px;">'
                 f'<div class="badge" style="background:{NARANJA};">✕</div><p style="font-size:27px;line-height:1.4;padding-top:6px;">{t}</p></div>'
                 for t in nunca)
    s.append(("", f"""<div class="pad"><div class="kicker">05 · Lo que nunca se hace</div><h2>Reglas críticas de marca</h2>
<div style="width:1150px;">{li}</div></div>
<img src="{oki('sorpresa')}" style="position:absolute;right:90px;top:300px;width:470px;height:468px;">{foot(7)}"""))

    pal = [("Azul", AZUL, "Principal. Bordes, acentos, CTA principales", "#fff"),
           ("Azul oscuro", AZUL_OSC, "Fondos institucionales y títulos", "#fff"),
           ("Verde", VERDE, "Progreso, éxito, Reto 2", "#fff"),
           ("Naranja", NARANJA, "Énfasis, CTA, Reto 3", "#fff"),
           ("Amarillo", AMARILLO, "Solo sobre azul oscuro", AZUL_OSC),
           ("Turquesa", TURQUESA, "Secundario, usos puntuales", "#fff"),
           ("Fondo claro", FONDO, "Fondos neutros y tarjetas", TEXTO)]
    sw = "".join(
        f'<div style="width:222px;"><div style="background:{c};height:330px;border-radius:16px 16px 0 0;border:2px solid #E2E8F0;border-bottom:none;padding:22px;color:{fg};font-weight:800;font-size:26px;">{n}</div>'
        f'<div style="background:#fff;border:2px solid #E2E8F0;border-radius:0 0 16px 16px;padding:18px 20px;height:220px;">'
        f'<p style="font-weight:700;font-size:24px;">{c}</p><p style="font-size:17px;opacity:.75;margin-bottom:10px;">RGB {rgb(c)}</p>'
        f'<p style="font-size:18px;line-height:1.35;">{u}</p></div></div>' for n, c, u, fg in pal)
    s.append(("", f"""<div class="pad"><div class="kicker">06 · Paleta de color</div><h2>Paleta estricta, sin excepciones</h2>
<div style="display:flex;gap:24px;">{sw}</div></div>{foot(8)}"""))

    tints = "".join(f'<div style="text-align:center;"><div style="width:150px;height:150px;border-radius:50%;background:{t};border:2px solid #E2E8F0;"></div><p style="font-size:20px;font-weight:600;margin-top:10px;">{t}</p></div>'
                    for t in ["#EAF4F6", "#F1F8E9", "#FFF3E0", "#1D3F54"])
    s.append(("", f"""<div class="pad"><div class="kicker">07 · Color de Oki y combinaciones</div><h2>Colores exclusivos y tintes permitidos</h2>
<div style="display:flex;gap:60px;">
 <div style="width:800px;">
  <div style="display:flex;gap:24px;margin-bottom:18px;">
   <div class="card" style="width:388px;"><div style="height:120px;border-radius:10px;background:#94C4F4;margin-bottom:14px;"></div><h3>#94C4F4</h3><p>Brillo del cuerpo de Oki</p></div>
   <div class="card" style="width:388px;"><div style="height:120px;border-radius:10px;background:#3E97C6;margin-bottom:14px;"></div><h3>#3E97C6</h3><p>Textura de tentáculos</p></div>
  </div>
  <div class="note">Estos dos tonos se usan <b>solo</b> al ilustrar o describir a Oki, nunca en el resto de materiales.</div>
  <p style="font-size:24px;font-weight:700;margin:34px 0 18px;">Tintes permitidos</p><div style="display:flex;gap:44px;">{tints}</div>
 </div>
 <div style="width:780px;">
  <div style="background:{AZUL_OSC};border-radius:16px;padding:40px;margin-bottom:24px;"><p style="color:{AMARILLO};font-weight:800;font-size:40px;">Amarillo sobre azul oscuro</p><p style="color:#fff;opacity:.82;font-size:22px;margin-top:8px;">Única combinación permitida para el amarillo.</p></div>
  <div style="background:#fff;border:2px solid #E2E8F0;border-radius:16px;padding:40px;margin-bottom:24px;"><p style="color:{AMARILLO};font-weight:800;font-size:40px;">Amarillo sobre blanco</p><p style="font-size:22px;margin-top:8px;"><b style="color:{NARANJA};">✕ Prohibido:</b> no se lee.</p></div>
  <div class="card"><h3>Colores prohibidos</h3><p>Morado, rosa, rojo, azul rey, dorado y cualquier color que no esté en esta paleta.</p></div>
 </div>
</div></div>{foot(9)}"""))

    pesos = [(400, "Regular", "Cuerpo de texto"), (600, "SemiBold", "Subtítulos"), (700, "Bold", "Títulos de sección"),
             (800, "ExtraBold", "Títulos"), (900, "Black", "Portadas y badges")]
    pw = "".join(f'<div style="display:flex;align-items:baseline;gap:40px;border-bottom:2px solid #E2E8F0;padding:14px 0;">'
                 f'<span style="font-weight:{w};font-size:64px;width:720px;color:{AZUL_OSC};">Entrena tu cerebro</span>'
                 f'<span style="font-size:24px;font-weight:700;width:280px;">{w} · {n}</span><span style="font-size:22px;opacity:.75;">{u}</span></div>'
                 for w, n, u in pesos)
    s.append(("", f"""<div class="pad"><div class="kicker">08 · Tipografía</div>
<div style="display:flex;align-items:flex-end;gap:50px;margin-bottom:24px;"><h2 style="font-size:120px;font-weight:900;margin:0;">Poppins</h2>
<p style="font-size:24px;padding-bottom:22px;max-width:760px;">Única fuente de la marca. Disponible en Google Fonts y Adobe Fonts. Nunca Arial, Calibri, Helvetica, Georgia ni Trebuchet.</p></div>
{pw}</div>{foot(10)}"""))

    s.append(("", f"""<div class="pad"><div class="kicker">09 · Jerarquía tipográfica</div><h2>Así se ordena un texto CCA</h2>
<div style="display:flex;gap:60px;">
 <div class="card" style="width:1000px;padding:50px;border-left:10px solid {AZUL};">
  <p style="font-weight:700;font-size:20px;letter-spacing:.12em;color:{AZUL};text-transform:uppercase;">Fase 2 · Memoria de trabajo</p>
  <p style="font-weight:800;font-size:58px;color:{AZUL_OSC};line-height:1.1;margin:14px 0;">Tu hijo descubrió cómo recordar más</p>
  <p style="font-weight:600;font-size:30px;margin-bottom:16px;">Un reto con movimiento, ocho semanas de avance</p>
  <p style="font-weight:400;font-size:24px;line-height:1.55;">El texto de cuerpo va en Poppins Regular, con interlineado amplio y párrafos cortos. Se escribe cálido y claro, sin jerga técnica cuando hablamos con familias.</p>
  <div style="display:inline-block;margin-top:26px;background:{NARANJA};color:#fff;font-weight:700;font-size:24px;padding:16px 34px;border-radius:40px;">Agenda tu evaluación</div>
 </div>
 <div style="width:560px;font-size:23px;line-height:1.5;">
  <p style="margin-bottom:22px;"><b>Antetítulo</b><br>Bold 700, mayúsculas, espaciado amplio, color azul.</p>
  <p style="margin-bottom:22px;"><b>Título</b><br>ExtraBold 800, azul oscuro.</p>
  <p style="margin-bottom:22px;"><b>Subtítulo</b><br>SemiBold 600.</p>
  <p style="margin-bottom:22px;"><b>Cuerpo</b><br>Regular 400, interlineado 1.5.</p>
  <p><b>Botón</b><br>Bold 700 sobre naranja, esquinas redondeadas.</p>
 </div>
</div></div>{foot(11)}"""))

    s.append(("", f"""<div class="pad"><div class="kicker">10 · Elementos gráficos</div><h2>Piezas reutilizables</h2>
<div style="display:flex;gap:36px;margin-bottom:36px;">
 <div class="card" style="width:560px;border-left:8px solid {AZUL};"><h3>Card blanca</h3><p>Fondo blanco, radio 10 px, borde gris claro y sombra suave. Acento lateral azul para destacar.</p></div>
 <div style="width:560px;background:{AZUL_OSC};border-radius:16px;padding:28px 32px;color:#fff;"><h3 style="color:{AMARILLO};font-size:28px;margin-bottom:8px;">Bloque institucional</h3><p style="font-size:21px;line-height:1.45;opacity:.82;">Fondo azul oscuro, título amarillo, texto blanco al 82 %.</p></div>
 <div style="width:560px;"><div class="note"><b>Barra de nota</b><br>Fondo #EAF4F6 con borde izquierdo azul. Para aclaraciones y tips.</div></div>
</div>
<div style="display:flex;gap:40px;align-items:center;">
 <div class="badge" style="background:{AZUL};width:90px;height:90px;font-size:40px;">1</div>
 <div class="badge" style="background:{VERDE};width:90px;height:90px;font-size:40px;">2</div>
 <div class="badge" style="background:{NARANJA};width:90px;height:90px;font-size:40px;">3</div>
 <p style="font-size:24px;max-width:900px;"><b>Badges circulares</b> para numerar pasos y retos: azul para el Reto 1, verde para el Reto 2, naranja para el Reto 3. Número en Poppins Black blanco.</p>
</div></div>{foot(12)}"""))

    voces = [("Facilitadores", "Operativo e imperativo.", "“Ejecuta el gesto.”", "“Se sugiere realizar el gesto.”", AZUL),
             ("Familias", "Cálido, paisa, sin jerga.", "“Tu hijo descubrió…”", "“El infante procesó…”", VERDE),
             ("Socios", "Profesional y basado en evidencia. Solo datos verificables.", "“Evaluamos cada 8 semanas.”", "Promesas sin respaldo.", NARANJA),
             ("Niños", "Lúdico, con emojis y Oki siempre presente.", "“¡Oki te reta! ⭐”", "Lenguaje adulto y frío.", TURQUESA)]
    vc = "".join(f'<div class="card" style="width:396px;border-top:8px solid {c};height:560px;"><h3 style="font-size:32px;">{a}</h3>'
                 f'<p style="margin-bottom:24px;">{d}</p><p style="font-size:18px;font-weight:700;color:{VERDE};">✓ ASÍ</p><p style="font-size:24px;font-weight:600;margin-bottom:20px;">{si}</p>'
                 f'<p style="font-size:18px;font-weight:700;color:{NARANJA};">✕ ASÍ NO</p><p style="font-size:22px;opacity:.75;">{no}</p></div>' for a, d, si, no, c in voces)
    s.append(("", f"""<div class="pad"><div class="kicker">11 · Tono de voz</div><h2>Una marca, cuatro conversaciones</h2>
<div class="grid">{vc}</div></div>{foot(13)}"""))

    fmts = [("Documentos HTML", "A4 · 210 × 297 mm"), ("Documentos Word", "Carta (US Letter)"),
            ("Presentaciones", "16:9 · portada y divisoras en azul oscuro, contenido en fondo claro"),
            ("Instagram", "Post 1080 × 1350 · Historia 1080 × 1920"), ("LinkedIn", "1200 × 627"),
            ("Tarjeta de presentación", "3.5 × 2 in")]
    fc = "".join(f'<div class="card" style="width:540px;"><h3>{a}</h3><p>{b}</p></div>' for a, b in fmts)
    s.append(("", f"""<div class="pad"><div class="kicker">12 · Formatos y aplicaciones</div><h2>Medidas de trabajo</h2>
<div class="grid" style="width:1180px;">{fc}</div></div>
<img src="{oki('leyendo')}" style="position:absolute;right:80px;top:320px;width:500px;height:500px;">{foot(14)}"""))

    s.append(("dark", f"""<img src="{oki('celebrando')}" style="position:absolute;left:600px;top:90px;width:720px;height:718px;">
<div style="position:absolute;left:0;right:0;top:820px;text-align:center;">
<p style="font-weight:900;font-size:64px;">El cerebro se entrena como un músculo.</p>
<p style="font-size:28px;opacity:.82;margin-top:14px;">gimnasiodelcerebro.co · WhatsApp +57 301 491 6120</p></div>"""))
    return doc("Manual de identidad CCA", 1920, 1080, M_CSS, s)


# ---------------------------------------------------------------- Kit de redes

def ig_posts():
    css = f""".t{{font-weight:800;line-height:1.08;}} .b{{font-size:34px;line-height:1.45;}}
.tag{{display:inline-block;font-weight:700;font-size:26px;letter-spacing:.1em;text-transform:uppercase;padding:12px 26px;border-radius:40px;}}
.brand{{position:absolute;left:80px;bottom:60px;font-weight:700;font-size:26px;}}"""
    s = []
    s.append(("dark", f"""<div style="position:absolute;left:80px;top:100px;width:920px;">
<span class="tag" style="background:{AMARILLO};color:{AZUL_OSC};">Anuncio</span>
<p class="t" style="font-size:96px;margin:40px 0 30px;">Título del anuncio en dos líneas</p>
<p class="b" style="opacity:.82;">Texto de apoyo corto: qué, cuándo y para quién.</p></div>
<img src="{oki('senalando')}" style="position:absolute;right:40px;bottom:120px;width:560px;height:558px;">
<div style="position:absolute;left:80px;bottom:150px;background:{NARANJA};color:#fff;font-weight:700;font-size:32px;padding:22px 44px;border-radius:50px;">Agenda aquí</div>
<p class="brand">gimnasiodelcerebro.co</p>"""))
    s.append(("", f"""<div style="position:absolute;left:80px;top:100px;width:920px;">
<span class="tag" style="background:{AZUL};color:#fff;">Dato científico</span>
<p class="t" style="font-size:150px;color:{AZUL};margin:40px 0 10px;">[Cifra]</p>
<p class="t" style="font-size:56px;color:{AZUL_OSC};margin-bottom:30px;">Qué significa este dato, en una frase clara.</p>
<div class="note" style="background:#EAF4F6;border-left:8px solid {AZUL};border-radius:0 14px 14px 0;padding:22px 28px;font-size:26px;width:640px;">Fuente: autor, año, revista. Solo datos verificables.</div></div>
<img src="{oki('sorpresa')}" style="position:absolute;right:30px;bottom:110px;width:400px;height:398px;">
<p class="brand" style="color:{AZUL};">CCA · El Gimnasio del Cerebro</p>"""))
    s.append(("white", f"""<div style="position:absolute;inset:0 0 auto 0;height:12px;background:{VERDE};"></div>
<div style="position:absolute;left:80px;top:100px;width:920px;">
<span class="tag" style="background:#F1F8E9;color:#4E7A23;">Tip para familias</span>
<p class="t" style="font-size:82px;color:{AZUL_OSC};margin:40px 0 40px;">Un gesto sencillo para hacer hoy en casa</p>
<div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:26px;"><div class="badge" style="width:64px;height:64px;border-radius:50%;background:{AZUL};color:#fff;font-weight:900;font-size:30px;display:flex;align-items:center;justify-content:center;flex:none;">1</div><p class="b" style="width:560px;">Primer paso, en lenguaje cálido.</p></div>
<div style="display:flex;gap:24px;align-items:flex-start;"><div style="width:64px;height:64px;border-radius:50%;background:{VERDE};color:#fff;font-weight:900;font-size:30px;display:flex;align-items:center;justify-content:center;flex:none;">2</div><p class="b" style="width:560px;">Segundo paso, sin jerga.</p></div></div>
<img src="{oki('empatia')}" style="position:absolute;right:30px;bottom:110px;width:440px;height:438px;">
<p class="brand" style="color:{AZUL};">gimnasiodelcerebro.co</p>"""))
    s.append(("dark", f"""<div style="position:absolute;left:80px;top:100px;width:920px;">
<span class="tag" style="background:{AMARILLO};color:{AZUL_OSC};">Reto de la semana</span>
<p class="t" style="font-size:88px;margin:40px 0 30px;">¿Puedes resolver este reto con Oki?</p>
<p class="b" style="opacity:.82;width:560px;">Describe el reto aquí. Responde en comentarios.</p></div>
<img src="{oki('pensando')}" style="position:absolute;right:30px;bottom:110px;width:520px;height:518px;">
<p class="brand">CCA · El Gimnasio del Cerebro</p>"""))
    return doc("Kit Instagram post CCA", 1080, 1350, css, s)


def ig_stories():
    css = """.t{font-weight:800;line-height:1.08;}"""
    s = []
    s.append(("dark", f"""<div style="position:absolute;left:80px;right:80px;top:260px;text-align:center;">
<p style="font-weight:700;font-size:30px;letter-spacing:.12em;color:{AMARILLO};text-transform:uppercase;">CCA · El Gimnasio del Cerebro</p>
<p class="t" style="font-size:100px;margin:40px 0;">Título de la historia</p>
<p style="font-size:38px;opacity:.82;">Mensaje corto de apoyo.</p></div>
<img src="{oki('base-saludo')}" style="position:absolute;left:190px;top:900px;width:700px;height:698px;">
<div style="position:absolute;left:240px;right:240px;bottom:150px;background:{NARANJA};color:#fff;font-weight:700;font-size:36px;padding:26px;border-radius:60px;text-align:center;">Escríbenos</div>"""))
    s.append(("", f"""<div style="position:absolute;left:80px;right:80px;top:220px;">
<p style="font-weight:700;font-size:30px;letter-spacing:.12em;color:{AZUL};text-transform:uppercase;">Logro de la semana</p>
<p class="t" style="font-size:96px;color:{AZUL_OSC};margin:36px 0;">¡Celebramos este avance!</p>
<div style="background:#fff;border-radius:20px;border:2px solid #E2E8F0;border-left:10px solid {VERDE};padding:40px;font-size:36px;line-height:1.45;">Describe el logro, con permiso de la familia.</div></div>
<img src="{oki('celebrando')}" style="position:absolute;left:190px;bottom:180px;width:700px;height:698px;">"""))
    return doc("Kit historias CCA", 1080, 1920, css, s)


def linkedin():
    css = """.t{font-weight:800;line-height:1.1;}"""
    s = []
    s.append(("dark", f"""<div style="position:absolute;left:70px;top:80px;width:620px;">
<p style="font-weight:700;font-size:20px;letter-spacing:.12em;color:{AMARILLO};text-transform:uppercase;">CCA · El Gimnasio del Cerebro</p>
<p class="t" style="font-size:54px;margin:22px 0;">Título del artículo o anuncio institucional</p>
<p style="font-size:22px;opacity:.82;">Neurociencia aplicada al aprendizaje · Rionegro, Antioquia</p></div>
<img src="{oki('leyendo')}" style="position:absolute;right:50px;top:90px;width:420px;height:420px;">"""))
    s.append(("", f"""<div style="position:absolute;left:0;top:0;bottom:0;width:16px;background:{AZUL};"></div>
<div style="position:absolute;left:80px;top:80px;width:600px;">
<p style="font-weight:700;font-size:20px;letter-spacing:.12em;color:{AZUL};text-transform:uppercase;">Para socios y colegios</p>
<p class="t" style="font-size:52px;color:{AZUL_OSC};margin:22px 0;">Formación docente con evidencia</p>
<p style="font-size:22px;">Mensaje principal en una o dos líneas. Solo datos verificables.</p></div>
<img src="{oki('senalando')}" style="position:absolute;right:40px;top:110px;width:400px;height:400px;">"""))
    return doc("Kit LinkedIn CCA", 1200, 627, css, s)


# ---------------------------------------------------------------- Papeleria

def a4():
    css = ""
    s = []
    s.append(("white", f"""<div style="position:absolute;left:0;right:0;top:0;height:120px;background:{AZUL_OSC};"></div>
<img src="{oki('base-saludo')}" style="position:absolute;left:56px;top:18px;width:84px;height:84px;">
<div style="position:absolute;left:156px;top:30px;color:#fff;"><p style="font-weight:800;font-size:22px;">CCA · El Gimnasio del Cerebro</p>
<p style="font-size:13px;opacity:.82;">Centro Cognitivo para el Aprendizaje · Rionegro, Antioquia</p></div>
<div style="position:absolute;left:72px;right:72px;top:180px;font-size:14px;line-height:1.7;">
<p style="margin-bottom:24px;">Rionegro, [fecha]</p><p style="margin-bottom:24px;">Señores<br>[Nombre de la institución]</p>
<p style="font-weight:700;color:{AZUL_OSC};margin-bottom:18px;">Asunto: [asunto]</p>
<p>Cuerpo de la carta en Poppins Regular 11 a 12 pt.</p></div>
<div style="position:absolute;left:72px;right:72px;bottom:40px;border-top:3px solid {AZUL};padding-top:12px;display:flex;justify-content:space-between;font-size:12px;color:{AZUL_OSC};">
<span>gimnasiodelcerebro.co</span><span>WhatsApp +57 301 491 6120</span><span>Rionegro, Antioquia</span></div>"""))
    s.append(("dark", f"""<div style="position:absolute;left:64px;top:90px;width:640px;">
<p style="font-weight:700;font-size:16px;letter-spacing:.12em;color:{AMARILLO};text-transform:uppercase;">Propuesta comercial</p>
<p style="font-weight:900;font-size:52px;line-height:1.05;margin:20px 0;">[Nombre de la propuesta]</p>
<div style="width:90px;height:8px;background:{AMARILLO};border-radius:4px;margin-bottom:20px;"></div>
<p style="font-size:20px;opacity:.82;">Preparada para: [institución]<br>[Mes, año]</p></div>
<img src="{oki('senalando')}" style="position:absolute;left:120px;top:440px;width:560px;height:558px;">
<p style="position:absolute;left:64px;bottom:44px;font-weight:700;font-size:16px;">CCA · El Gimnasio del Cerebro · gimnasiodelcerebro.co</p>"""))
    return doc("Papeleria A4 CCA", 794, 1123, css, s)


def tarjeta():
    s = []
    s.append(("dark", f"""<img src="{oki('base-saludo')}" style="position:absolute;left:60px;top:90px;width:420px;height:419px;">
<div style="position:absolute;left:520px;top:170px;width:470px;">
<p style="font-weight:900;font-size:64px;line-height:1;">CCA</p>
<p style="font-weight:700;font-size:34px;color:{AMARILLO};margin:12px 0;">El Gimnasio del Cerebro</p>
<p style="font-size:24px;opacity:.82;">El cerebro se entrena como un músculo.</p></div>"""))
    s.append(("white", f"""<div style="position:absolute;left:0;top:0;bottom:0;width:20px;background:{AZUL};"></div>
<div style="position:absolute;left:90px;top:110px;">
<p style="font-weight:800;font-size:52px;color:{AZUL_OSC};">[Nombre y apellido]</p>
<p style="font-weight:600;font-size:30px;color:{AZUL};margin-bottom:50px;">[Cargo]</p>
<p style="font-size:28px;line-height:1.7;">WhatsApp +57 301 491 6120<br>gimnasiodelcerebro.co<br>Rionegro, Antioquia</p></div>
<img src="{oki('empatia')}" style="position:absolute;right:50px;bottom:50px;width:260px;height:259px;">"""))
    return doc("Tarjeta de presentacion CCA", 1050, 600, "", s)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, fn in [("01-manual-identidad", manual), ("02-instagram-post", ig_posts), ("03-instagram-historias", ig_stories),
                     ("04-linkedin", linkedin), ("05-papeleria-a4", a4), ("06-tarjeta-presentacion", tarjeta)]:
        (OUT / f"{name}.html").write_text(fn(), encoding="utf-8")
        print(name, round((OUT / f"{name}.html").stat().st_size / 1024), "KB")
