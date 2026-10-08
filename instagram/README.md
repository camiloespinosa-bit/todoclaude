# Rediseño de @gimnasiodelcerebro.co (antes @somos_cca)

Todo el material usa los SVG oficiales de Oki (`assets/img/oki/`) y la paleta del manual de marca.
El logo del árbol queda retirado.

## 1. Foto de perfil

`perfil.png` (1080×1080). Instagram la recorta en círculo; Oki ya está centrado para eso.

## 2. Usuario y nombre

Usuario: `@gimnasiodelcerebro.co` (igual al dominio de la web).

Nombre (es lo que Instagram indexa en búsquedas):

```
Gimnasio del Cerebro | CCA Rionegro
```

## 3. Bio (máx. 150 caracteres)

```
🧠 El cerebro se entrena como un músculo
🐙 Para niños, familias y adultos mayores
🔬 Basado en neurociencia
📍 Rionegro, Antioquia
👇 Clase de prueba gratis
```

- Enlace: `https://gimnasiodelcerebro.co` (reemplaza a `centrocognitivo.co`, que es la web anterior)
- Botón de contacto: activar **WhatsApp** (+57 301 491 6120) en Editar perfil → Opciones de contacto.

## 4. Historias destacadas

| Archivo | Nombre del destacado | Oki | Qué va adentro |
|---|---|---|---|
| `hl-cca.png` | ¿Qué es CCA? | Saludo | Qué hacemos, en 3 a 5 historias |
| `hl-familias.png` | Familias | Empatía | Fases por edad, preguntas frecuentes de padres |
| `hl-retos.png` | Retos | Ejercitando | Ejemplos cortos de retos cognitivos |
| `hl-ciencia.png` | Ciencia | Leyendo | Evidencia detrás del método, enlaces al blog |
| `hl-logros.png` | Logros | Celebrando | Avances y testimonios (con consentimiento) |
| `hl-contacto.png` | Contacto | Señalando | Horarios, ubicación, WhatsApp |

Cada portada mide 1080×1920; lo que Instagram muestra es el círculo del centro.

## 5. Cómo subirlo (manual: la API de Instagram no permite cambiar foto, bio ni destacados)

1. Editar perfil → Cambiar foto → `perfil.png`.
2. Pegar nombre y bio de arriba.
3. Para cada destacado: subir primero al menos una historia con su contenido, crear el destacado
   y en "Editar portada" elegir el PNG correspondiente.
4. Archivar la imagen sin texto del 25 de julio de 2026 (no aporta y rompe el nuevo look).

Para regenerar los PNG: `node build/render.mjs` desde `instagram/build/`.
