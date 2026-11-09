# S24 · The Time Travel Stage (CCA, Show Bloque 4)

Abrir `S24_TimeTravelStage.html` con doble clic (Chrome o Edge). Funciona sin internet y sin servidor.

## Versión juego (S24_TimeTravelStage.html) · Bloque 4 completo
El niño maneja a su viajero del tiempo por 4 mundos. Mismas mecánicas en todos: caminar, saltar, pisar la respuesta, hablar en el escenario y entrar al portal. Una flecha amarilla y un rayo de luz guían al siguiente reto. Extras: trampolines y cristales del tiempo (bonus).

| Mundo | Retos (sesión) |
|---|---|
| YESTERDAY LAND (past) | Find 3 things · Word Stones (pasado) · Escenario · Portal |
| TODAY TOWN (present) | What are they doing? (S13, personajes animados con las 12 acciones) · Every day or right now? (S14) · Can Stones (S17) · Opinion Corner (S21) · Escenario · Portal |
| TOMORROW CITY (future) | Pick 3 dreams (S19 + S20) · Prediction Track (S15) · Today or tomorrow? (S15) · Advice Clinic (S18) · Escenario · Portal |
| ULTIMATE CHALLENGE | Ultimate Stones: 5 preguntas mezcladas (S16 + S22) · Portal dorado al final |

El contenido sale de los materiales de clase y está en `src/content.js` (fácil de editar).

| Quién | Teclas |
|---|---|
| Niño | Flechas o WASD = caminar, Espacio = saltar (también funciona un control de videojuego) |
| Profe, en el escenario | `1` `2` `3` estrellas (fila de números o teclado numérico; `0` borra) o clic en las estrellas, `Enter` termina la charla, `R` reinicia el reloj |
| Profe, resultados | Clic en las estrellas de cada mundo para corregirlas (el CSV se actualiza) |
| Profe, Opinion Corner | `Enter` pasa a la siguiente opinión (o espera 10 s) |
| Profe, siempre | `P` pausa, `K` salta el reto actual, `H` ayuda, `F` pantalla completa, `M` música |
| Resultados | `D` descarga CSV, `N` siguiente jugador |

CSV: `player, world, challenge, score, max, details, date`. Una fila por reto (puntaje al primer intento), estrellas de cada charla y cristales. Incluye a todos los niños de la sesión.

Para practicar con menos tiempo de charla: `S24_TimeTravelStage.html?t=10`.

## Versión simple (S24_TimeTravelStage_v1.html)
La primera versión "escenario": 3 islas, elegir objetos y presentar 1 minuto por isla. Queda como respaldo.

## Desarrollo
```
npm install
npm run build          # genera los dos HTML (three.js + Poppins embebidos)
npm run verify         # recorre el juego completo en Playwright, capturas en test/shots
node test/verify_v1.mjs
```
