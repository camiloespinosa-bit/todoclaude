# English Lab (adultos 1 a 1)

Página: `juegos/lab.html` → gimnasiodelcerebro.co/juegos/lab.html

App de clase en vivo. El profe juzga y marca; la página registra cada acierto por estructura (structureId) para que la estudiante vea su progreso clase tras clase. Sin grabación ni reconocimiento de voz.

- Estudiantes: Paula (PA, B1 → B2, 3 clases/semana) y Luisa (LU, A1 → A2, 1 y luego 2 clases/semana). Cada una con 12 unidades.
- Juegos: Spin & Speak (ruleta), Jeopardy, Structure Bingo, Spot the Bug, Mystery Box, Error Court. Cuaderno (Notebook) abierto toda la clase.
- Progreso: New / Practicing / Mastered (Mastered = 80 % o más en 3 clases distintas). Son datos de práctica, no una prueba de nivel.
- Entrada: misma clave del Panel del profe (si ya entraste en profe.html en ese dispositivo, entra sola).

## Activar la base de datos (una sola vez)
1. supabase.com > tu proyecto (el mismo de saga.sql) > SQL Editor.
2. Pega todo `lab.sql` y pulsa Run. Se puede repetir sin problema.
3. Hasta que lo corras, lo que marques queda guardado solo en ese navegador y se sube solo cuando la base responda (el indicador arriba a la derecha lo dice).

No se guardan nombres en la base: solo los códigos PA y LU. Los nombres de pila están en el código de la página.

## Agregar una estudiante o contenido
Todo el contenido está en el objeto `STUDENTS` de `juegos/lab.html` (unidades, ruleta, Jeopardy, bugs, Mystery Box). Cada objetivo lleva su structureId del mapa `ST`.
