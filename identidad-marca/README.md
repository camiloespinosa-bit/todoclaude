# Identidad de marca CCA · El Gimnasio del Cerebro

Paquete generado a partir del skill `cca-marca` y de los 8 SVG oficiales de Oki (`assets/img/oki/`).

| Pieza | Formato | PDF |
|---|---|---|
| Manual de identidad (15 páginas) | 1920 × 1080 | `pdf/01-manual-identidad.pdf` |
| Plantillas post Instagram (4) | 1080 × 1350 | `pdf/02-instagram-post.pdf` |
| Plantillas historias (2) | 1080 × 1920 | `pdf/03-instagram-historias.pdf` |
| Plantillas LinkedIn (2) | 1200 × 627 | `pdf/04-linkedin.pdf` |
| Membrete y portada de propuesta | A4 | `pdf/05-papeleria-a4.pdf` |
| Tarjeta de presentación (frente y reverso) | 3.5 × 2 in | `pdf/06-tarjeta-presentacion.pdf` |

- `html/`: versión completa con Oki incrustado (fuente de los PDF).
- `html-express/`: versión importada a Adobe Express. El importador no descarga imágenes externas,
  así que cada Oki aparece como un recuadro punteado con el nombre del SVG que va ahí.
  En Express se arrastra el archivo correspondiente de `assets/img/oki/` sobre el recuadro.

Regenerar:

```bash
python3 identidad-marca/build.py            # html/
EXPRESS=1 python3 identidad-marca/build.py  # html-express/
NODE_PATH=/opt/node-tools/node_modules node identidad-marca/render.js  # pdf/
```

Nunca regenerar a Oki con IA (regla de `cca-marca`). La recomendación de espacio de respiro y tamaño
mínimo de la página 6 del manual está marcada como pendiente de validar con el equipo.
