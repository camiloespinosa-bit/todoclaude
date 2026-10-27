---
name: video-editor
description: Editor de video de Camilo (Gimnasio del Cerebro). Corta repeticiones y pausas usando la transcripción de Whisper con tiempos por palabra, separa grabaciones con varios videos, exporta en 9:16 para Reels/TikTok/Shorts o en horizontal para YouTube, pone subtítulos con la marca, nivela voces y revisa si la imagen está oscura o con grano. Úsala cuando el usuario diga "edita este video", "corta las repeticiones", "quita los silencios", "ponle subtítulos", "sácame un reel de esto", "divide esta grabación", o suba un video para editar.
---

# video-editor

Camilo es el director. Esta skill edita; él revisa y publica. Nada se publica desde aquí.

Receta original de "Jam" (pegada por Camilo el 2026-10-27), adaptada a dos realidades:
1. Puede correr en una sesión en la nube (contenedor que se borra al terminar) o en el computador de
   Camilo con Claude Code. Revisa dónde estás antes de empezar (paso 0).
2. La marca ya existe en el repo, así que nunca se le preguntan colores ni fuente (regla 5).

## Paso 0: herramientas

Comprueba antes de cada sesión de edición. Explica cada paso en una o dos frases.

```bash
ffmpeg -version | head -1      # cortar, unir, exportar
node --version                 # lo necesita HyperFrames para gráficos animados
```

**Whisper** (voz a texto con el tiempo de cada palabra). Se usa `faster-whisper`, que corre los
mismos modelos de OpenAI pero más rápido en un computador sin tarjeta gráfica:

```bash
python3 -m venv "$WORK/venv" && "$WORK/venv/bin/pip" install -q faster-whisper
```

El modelo se descarga de Hugging Face la primera vez. En la nube la red debe permitir
`huggingface.co` y los dominios de descarga de Hugging Face (`*.hf.co`, por ejemplo
`cas-server.xethub.hf.co` y `us.aws.cdn.hf.co`). Si la descarga da 403, díselo a Camilo con el
dominio exacto que falló; no inventes una transcripción.

Si algo pide contraseña o `sudo` en el computador de Camilo, para y pregunta antes.

**HyperFrames** (HeyGen, Apache 2.0, autorizado por Camilo el 2026-10-27) sirve para gráficos
animados y títulos hechos en HTML. Sus 4 skills (`hyperframes`, `hyperframes-cli`,
`hyperframes-registry`, `media-use`) ya están en `.claude/skills/`. El programa corre con
`npx hyperframes` (probado con la versión 0.8.209). Solo se usa si el video lleva gráficos; un corte
limpio o con subtítulos se hace solo con FFmpeg.

**Tiempos medidos en la nube (4 núcleos, sin tarjeta gráfica):** `small` tarda más o menos lo mismo
que dura el audio; `medium` tarda unas 2,6 veces la duración (14,6 s de audio en 38 s). Un video de
10 minutos con `medium` puede tardar del orden de media hora: avísale a Camilo antes de empezar.

## Antes de cada edición: 3 preguntas (siempre)

1. ¿A dónde va el video? (Instagram, TikTok, YouTube Shorts o YouTube largo)
2. ¿Qué quieres que haga quien lo vea al final? (por defecto en la marca: escribir al WhatsApp
   301 491 6120 o pedir la evaluación cognitiva gratuita; un solo llamado por video)
3. ¿Subtítulos y gráficos, o corte limpio?

No empieces a cortar sin las tres respuestas.

## Reglas

**1. Nunca se toca el original.** Copia el archivo a una carpeta de trabajo:
- En la nube: `$WORK` = el directorio scratchpad de la sesión, subcarpeta `video/AAAA-MM-DD-nombre/`.
- En el computador de Camilo: una carpeta fuera de iCloud, Dropbox o Google Drive (los videos
  grandes se cortan al sincronizar), por ejemplo `~/VideoTrabajo/`.

El video terminado se guarda junto al original con nombre nuevo:
`<nombre-original>__editado-<destino>.mp4` (por ejemplo `clase01__editado-reel.mp4`). En la nube,
entrégalo además con la herramienta de enviar archivos. **Esa herramienta acepta hasta 500 MiB**: un
video largo en calidad máxima (CRF 16) pasa de eso (5:28 en vertical pesó 804 MiB). En ese caso
guarda el máster y entrega una copia `...-entrega.mp4` a 10 Mbps
(`-c:v libx264 -preset slow -b:v 10M -maxrate 14M -bufsize 20M -c:a copy`). **Nunca hagas commit de videos al repo.**

**2. Transcribe todo con tiempos por palabra.**

```bash
"$WORK/venv/bin/python" -I scripts/transcribe.py entrada.mp4 --model medium --out $WORK/palabras.json
```

Usa `medium` para español (más preciso); `small` solo para pruebas rápidas. El script decodifica el
audio con FFmpeg, así que no depende de la versión de PyAV.

**Los subtítulos siempre se revisan.** Whisper se equivoca en palabras sueltas (en la prueba
escribió "lee" donde se decía "ve"). Antes de quemar subtítulos, muéstrale a Camilo el texto y
corrige `palabras.json` si hace falta.

**3. Repeticiones y pausas.**

```bash
python3 -I scripts/plan_cuts.py $WORK/palabras.json --gap 0.5 --out $WORK/plan.json
```

**Camilo marca sus repeticiones con una cuenta regresiva: "3, 2, 1"** (no dice "repito"). El
script avisa cada cuenta regresiva; la toma mala es la que viene justo antes y la decides tú
mirando las palabras con sus tiempos. Para ese caso usa el modo manual:
`--drop-ranges "20.10-26.90,78.70-81.60"` (rangos en segundos a quitar).

El script también marca: pausas de más de 0,5 s, frases que empiezan igual que la anterior (repetición) y
frases como "repito", "otra vez", "de nuevo", "corta", "vamos otra vez", "let's redo that". **Tú
decides con criterio** cuál toma es la mejor (normalmente la última completa) y editas
`plan.json` antes de renderizar. Muestra a Camilo la lista de cortes con sus tiempos antes de
renderizar algo largo.

```bash
python3 -I scripts/render_cuts.py entrada.mp4 $WORK/plan.json salida.mp4 \
    [--vertical] [--captions palabras.json --fontsdir assets/fonts] [--append tarjeta-final.mp4]
```

Renderiza en dos pasos: cada tramo a un archivo temporal y luego todo junto (subtítulos, volumen,
calidad máxima). Así usa poca memoria: el método de un solo filtro con ~100 tramos agotó la memoria
del contenedor. Los tramos de `keep` se pegan **en el orden en que están**, así que un Reel puede
reordenar la toma (por ejemplo, abrir con la escena y después la explicación). Si reordenas, revisa
mayúsculas de los subtítulos en un `palabras_reel.json` aparte.

**Primer video real (2026-10-27):** 6:48 de grabación quedaron en 5:23 para YouTube (5 tomas
repetidas, 32 pausas) y un Reel de 24 s. Whisper `medium` tardó 6,5 min para 6,8 min de audio.

**4. Una grabación con varios videos se divide en archivos.** Busca en la transcripción los cortes
naturales (cambio de tema, "siguiente video", silencios largos con reinicio) y propone los puntos a
Camilo antes de dividir. Un archivo por video: `<original>__parte-01.mp4`, etc.

**5. Marca.** Ya está definida. No preguntes.
- Fuente: Poppins (archivos en `assets/fonts/`). Subtítulos en Poppins 700.
- Colores (de `assets/css/style.css`): azul `#145389`, naranja `#F57C00`, verde `#7CB342`,
  amarillo `#FDD835`, texto `#1D2733`, blanco `#FFFFFF`.
- Subtítulos: texto blanco con borde azul `#145389`; la palabra clave de cada frase puede ir en
  amarillo `#FDD835`. Máximo 2 líneas, abajo en horizontal; en vertical, en el tercio inferior
  pero por encima de la zona de botones de la app.
- Oki: solo los SVG oficiales de `assets/img/oki/`. **Nunca generar ni recrear a Oki con IA.**
- Voz y llamados: `.claude/youtube/voice.md`. Nada de promesas de resultados.
- Si existe una carpeta `B-roll kit` (en el repo o junto al video), de ahí salen logo, fotos y
  gráficos. Si no existe, usa solo lo del repo.

**6. Formato.** 9:16 (1080x1920) para Reels, TikTok y Shorts. 16:9 (1920x1080 o la resolución
original si es mayor) para YouTube. Calidad máxima: H.264 `-crf 16 -preset slow`, audio AAC 320k,
`-pix_fmt yuv420p`, `-movflags +faststart`. Nunca escales hacia arriba sin avisar.

**7. Voz IA y voz real en el mismo video.** Nivela cada voz por separado (filtro `loudnorm` a
-16 LUFS para cada pista antes de mezclar), para que la voz de Camilo no quede más baja.

**8. Imagen oscura o con grano.** Mide primero (`signalstats`, brillo medio YAVG). Si está oscura,
corrige suave (`eq`, `curves`) y si hay grano, `hqdn3d` leve. Dile a Camilo con honestidad cuánto
mejoró y si **conviene volver a grabar**: si la cara queda gris, con ruido o se ve "plástica" por
el filtro, lo honesto es recomendar regrabar con más luz.

**9. Al terminar.** Antes de entregar, confirma que el render terminó y que el archivo se lee
completo: `ffprobe` da duración de video y audio, y `ffmpeg -v error -i salida.mp4 -f null -` no
da errores. (El 2026-10-27 se entregó un Reel mientras todavía se escribía y llegó incompleto.)
Mira 3 o 4 cuadros sueltos para revisar subtítulos y encuadre. Luego di dónde quedó el archivo (ruta completa) y recuérdale: **"Míralo una vez
completo antes de publicarlo. Tú eres el director."**

## Lo que esta skill no hace

- No publica nada en ninguna red.
- No inventa tiempos ni transcripciones si Whisper no corre.
- No sube videos al repo.
