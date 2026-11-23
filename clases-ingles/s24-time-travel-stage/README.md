# Time Travel Saga · un juego 3D por bloque (CCA, Jero y Luciana)

Mismo motor y mismas mecánicas en todos los bloques (caminar, saltar, pisar la respuesta, hablar en el escenario, portal). Cada bloque es un archivo de contenido en `src/games/`.

| Bloque | Archivo | Estado |
|---|---|---|
| 1 · Me and My World | `Bloque1_MeTown.html` | Listo · en línea: gimnasiodelcerebro.co/juegos/me-town.html |
| 2 · My World Around Me | (pendiente) | |
| 3 · My Stories | (pendiente) | |
| 4 · The World is Mine | `S24_TimeTravelStage.html` | Listo (sin conexión) |
| 5 · I Am Ready | (pendiente) | |

## Bloque 1 · Me Town
- **HELLO PARK:** Presentation Stations (S1), Meet 3 new friends (S2), Question Stones (do/does), Report Stones (he likes / she plays).
- **DESCRIBE IT TOWN:** Opposites Run con objetos 3D (S3), Describe Stones, I Like It Because... (S7).
- **MY DAY STREET:** My Day Track (S5), Your Day: meet 3 neighbors (S6), I or He / She?, He Wakes Up! (tercera persona, do/does/don't/doesn't), My 1-Minute Show (S8).

## Modo en línea (los dos niños a la vez + vista del profe)
La página web está cerrada: sin código de clase nadie puede jugar.
1. Profe: abre el enlace privado del profe (`me-town.html?profe=CLAVE`) o escribe la clave en la casilla "Class code" y pulsa Go. La clave no está en el repositorio; el navegador la recuerda. Pulsa `T`, luego "Nuevo código". Sale un código de 4 letras y el enlace para los niños.
2. Niños: abren el enlace (o escriben el código y pulsan Go). El código solo funciona mientras la vista del profe está abierta (y hasta 12 horas después).
3. En la vista del profe ves en qué reto va cada uno, aciertos y errores, y puedes dar estrellas, terminar la charla, pausar o saltar un reto.
4. "Descargar CSV" junta los resultados de las partidas terminadas.

Privacidad: los mensajes van cifrados con el código de clase y sin nombres (p0 / p1). El candado es del lado del navegador: frena a cualquier visitante, pero no es un login de servidor.

Sin internet, el archivo HTML funciona igual con doble clic (sin la vista del profe).

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
