# S24 · The Time Travel Stage (CCA, Show Bloque 4)

Abrir `S24_TimeTravelStage.html` con doble clic (Chrome o Edge). Funciona sin internet y sin servidor.

## Versión juego (S24_TimeTravelStage.html)
El niño maneja a su viajero del tiempo por 3 mundos: YESTERDAY LAND (past), TODAY TOWN (present), TOMORROW CITY (future).
En cada mundo hay 4 retos, guiados por una flecha amarilla y un rayo de luz:
1. **Find 3 things**: caminar hasta 3 objetos brillantes (de 6). Son sus pistas para hablar.
2. **Word Stones**: leer la frase y pararse sobre la palabra correcta (3 frases). Si falla, "Try again!".
3. **Talk on the stage**: subirse al escenario. Corre el minuto de presentación oral con los sentence frames. El profe da 1/2/3 estrellas.
4. **Go into the portal**: el portal se abre y lo lleva por el túnel del tiempo al siguiente mundo.
Al final: "Time Master" con resultados por mundo y CSV.

| Quién | Teclas |
|---|---|
| Niño | Flechas o WASD = caminar, Espacio = saltar (también funciona un control de videojuego) |
| Profe, en el escenario | `1` `2` `3` estrellas (`0` borra), `Enter` termina la charla, `R` reinicia el reloj |
| Profe, siempre | `P` pausa, `K` salta el reto actual, `H` ayuda, `F` pantalla completa, `M` música |
| Resultados | `D` descarga CSV, `N` siguiente jugador |

CSV: `player, world, challenge, score, max, details, date` (3 filas por mundo: objetos, Word Stones al primer intento, estrellas de la charla). Incluye a todos los niños de la sesión.

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
