# English Lab (adultos 1 a 1)

Página: `juegos/lab.html` → gimnasiodelcerebro.co/juegos/lab.html

App de clase en vivo. El profe juzga y marca; la página registra cada acierto por estructura (structureId) para que la estudiante vea su progreso clase tras clase. Sin grabación ni reconocimiento de voz.

- Estudiantes: Paula (PA, B1 → B2, 3 clases/semana) y Luisa (LU, A1 → A2, 1 y luego 2 clases/semana). Cada una con 12 unidades.
- 11 juegos en la pestaña Games (marca en naranja los que se usaron la clase anterior):
  - Hablar: Spin & Speak (ruleta), Jeopardy (4 tableros para Paula, 2 para Luisa), Hidden Mission (role-play con giro y objetivos secretos), Story Chain (historia por turnos, la palabra sorteada manda), Mystery Box, Structure Bingo.
  - Mixto: Escape Room (4 candados, 4 dígitos, 12 minutos).
  - Precisión: Rapid Transform (8 frases contra reloj), Translation Duel (trampas del español), Grammar Auction (apostar $1000 a las frases correctas), Spot the Bug.
- Error Court al cierre y Notebook (cuaderno) abierto toda la clase.
- Progreso: New / Practicing / Mastered (Mastered = 80 % o más en 3 clases distintas). Son datos de práctica, no una prueba de nivel.
- Entrada: misma clave del Panel del profe (si ya entraste en profe.html en ese dispositivo, entra sola).

## Vista de progreso para la estudiante
Página: `juegos/progreso.html`, de solo lectura, pensada para celular. La estudiante ve su mapa por unidades, sus clases, sus frases logradas y sus frases para pulir (con modo práctica que tapa la respuesta).
- El profe crea el enlace en lab.html > Progress > "Create link", y lo copia o lo envía por WhatsApp.
- El enlace lleva una llave secreta después de `#`, por ejemplo `progreso.html#PA.<llave>`. En Supabase solo se guarda la huella de esa llave (tabla `lab_views`).
- "New link" o "Turn off" apagan el enlace anterior al instante. Con el enlace de una estudiante no se pueden leer los datos de otra.
- El contenido (estructuras, planes, juegos) vive en `juegos/lab-data.js`, compartido por lab.html y progreso.html.

## Activar la base de datos (una sola vez)
1. supabase.com > tu proyecto (el mismo de saga.sql) > SQL Editor.
2. Pega todo `lab.sql` y pulsa Run. Se puede repetir sin problema.
3. Hasta que lo corras, lo que marques queda guardado solo en ese navegador y se sube solo cuando la base responda (el indicador arriba a la derecha lo dice).

No se guardan nombres en la base: solo los códigos PA y LU. Los nombres de pila están en el código de la página.

## Agregar una estudiante o contenido
Todo el contenido está en el objeto `STUDENTS` de `juegos/lab.html` (unidades, ruleta, Jeopardy, bugs, Mystery Box). Cada objetivo lleva su structureId del mapa `ST`.
