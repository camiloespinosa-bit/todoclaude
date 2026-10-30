"""Tarjeta de una base para clips verticales: PNG 1080x1920 transparente con un hueco donde FFmpeg pone
el mini video (240x240 en x=HX, y=HY)."""
import sys
from PIL import Image, ImageDraw, ImageFont
fonts, n, nombre, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
W, H = 1080, 1920
X, Y, CW, CH, R = 190, 120, 700, 290, 36          # tarjeta
HX, HY, HS, HR = X + 25, Y + 25, 240, 26           # hueco del video
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(sombra).rounded_rectangle((X, Y + 14, X + CW, Y + CH + 14), R, fill=(0, 0, 0, 70))
from PIL import ImageFilter
img = Image.alpha_composite(img, sombra.filter(ImageFilter.GaussianBlur(16)))
d = ImageDraw.Draw(img)
d.rounded_rectangle((X - 6, Y - 6, X + CW + 6, Y + CH + 6), R + 6, fill=(253, 216, 53, 255))  # borde amarillo
d.rounded_rectangle((X, Y, X + CW, Y + CH), R, fill=(255, 255, 255, 255))
hueco = Image.new("L", (W, H), 0)
ImageDraw.Draw(hueco).rounded_rectangle((HX, HY, HX + HS, HY + HS), HR, fill=255)
a = img.getchannel("A"); a.paste(0, mask=hueco); img.putalpha(a)
d = ImageDraw.Draw(img)
f_pill = ImageFont.truetype(f"{fonts}/poppins-800.woff", 38)
f_nom = ImageFont.truetype(f"{fonts}/poppins-700.woff", 58 if len(nombre) < 12 else 48)
tx = HX + HS + 30
pill = f"Base {n}"
pw = d.textlength(pill, font=f_pill)
d.rounded_rectangle((tx, Y + 60, tx + pw + 36, Y + 118), 29, fill=(253, 216, 53, 255))
d.text((tx + 18, Y + 89), pill, font=f_pill, fill=(20, 83, 137, 255), anchor="lm")
lineas = nombre.split("|")
for i, l in enumerate(lineas):
    d.text((tx, Y + 150 + i * 62), l, font=f_nom, fill=(29, 39, 51, 255), anchor="lt")
img.save(out)
print(out, HX, HY, HS)
