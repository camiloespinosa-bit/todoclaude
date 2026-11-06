# S24 · The Time Travel Stage (CCA, Show Bloque 4)

Abrir `S24_TimeTravelStage.html` con doble clic (Chrome o Edge). Funciona sin internet y sin servidor.

## Teclas
| Pantalla | Teclas |
|---|---|
| Bienvenida | `1` Jerónimo, `2` Luciana (o clic) |
| Build your world | Flechas + `Enter` elegir/quitar, `Backspace` quitar el último, `Enter` en "Done" para seguir |
| Ready | `Espacio` arranca el show |
| Show | `Espacio` siguiente isla, `1` `2` `3` estrellas (`0` las borra), `P` pausa, `R` reinicia la isla, `H` muestra atajos |
| Resultados | `D` descarga CSV, `N` siguiente jugador |
| Siempre | `F` pantalla completa, `M` sonido on/off |

Para practicar con menos tiempo: `S24_TimeTravelStage.html?t=10` (10 s por isla).

## Desarrollo
```
npm install
npm run build    # genera S24_TimeTravelStage.html (three.js + Poppins embebidos)
npm run verify   # recorrido headless con Playwright, capturas en test/shots
```
