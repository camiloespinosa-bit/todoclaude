# Banco de retos · Brain Warm-up

Cada reto tiene: función, material, preparación, reglas en inglés (para decir y pegar), dinámica,
solución verificada, guion de "Your brain" y "Si le cuesta / si arrasa". Todas las soluciones se
comprobaron con `scripts/verificar.py` o `scripts/pitillos.py`.

---

## 1. Jarras de Luchins · Flexibilidad

**Material:** versión física con 3 recipientes de 8, 5 y 3 litros (o vasos marcados), o versión en papel.

**Versión papel (la clásica, basada en Luchins 1942).** Tres jarras A, B y C; hay que obtener la
cantidad meta. Los problemas 1 a 5 se resuelven todos con la misma fórmula, B − A − 2C, y crean el hábito.

| # | A | B | C | Meta | B − A − 2C | Atajo |
|---|---|---|---|---|---|---|
| 1 | 21 | 127 | 3 | 100 | sí | no |
| 2 | 14 | 163 | 25 | 99 | sí | no |
| 3 | 18 | 43 | 10 | 5 | sí | no |
| 4 | 9 | 42 | 6 | 21 | sí | no |
| 5 | 20 | 59 | 4 | 31 | sí | no |
| 6 | 23 | 49 | 3 | 20 | sí | A − C |
| 7 | 15 | 39 | 3 | 18 | sí | A + C |
| 8 | 28 | 76 | 3 | 25 | **NO** | A − C (extinción: solo sirve el atajo) |
| 9 | 18 | 48 | 4 | 22 | sí | A + C |
| 10 | 14 | 36 | 8 | 6 | sí | A − C |

**Versión física 8-5-3.** La jarra de 8 está llena. Meta: dejar 4 y 4. Mínimo 7 trasvases:
(8,0,0) → (3,5,0) → (3,2,3) → (6,2,0) → (6,0,2) → (1,5,2) → (1,4,3) → (4,4,0).

**Rules:** *"You can only pour until a jar is full or empty. No measuring by eye."*

**Your brain:** *"Su cerebro guardó una receta que funcionaba y dejó de buscar. Eso se llama rigidez
mental, o efecto Einstellung. Pasa también en inglés: repetimos la misma estructura aunque haya una más simple."*

**Si le cuesta:** calculadora permitida (útil en discalculia). **Si arrasa:** que invente un problema
nuevo que tenga atajo, para su compañera.

---

## 2. Pitillos tramposos · Insight

**Material:** unos 20 pitillos rectos (cortar la parte doblable) o palillos chinos.
**Cómo se arma:** I = 1 palito; V = 2 palitos en V; X = 2 palitos cruzados; "+" = 2; "=" = 2; "−" = 1.

**Rules:** *"Move ONLY ONE straw to make the equation true."*

Diez retos con solución única, de fácil a difícil (imprimibles ya hechos en el repositorio:
`Retos_Pitillos_Estudiantes.png` y `Retos_Pitillos_Soluciones_Profe.png`):

| # | Nivel | Reto | Solución |
|---|---|---|---|
| 1 | Mover un número | VI = VII + I | VII = VI + I |
| 2 | Mover un número | IV = II + IV | VI = II + IV |
| 3 | Mover un número | III + IV = V | II + IV = VI |
| 4 | Cambiar el signo | VI − V = X | V + V = X |
| 5 | Cambiar el signo | IV = IV − I | V = IV + I |
| 6 | Cambiar el signo | IX = V − IV | IX − V = IV |
| 7 | Romper la letra | X + V = X | V + V = X |
| 8 | Romper la letra | IV + VI = V | IV + VI = X |
| 9 | La trampa | VI = VI + VI | VI = VI = VI |
| 10 | La trampa | I − XIV = V | IX − IV = V |

Ojo: III = III + III tiene 7 soluciones válidas; no usarlo si se busca una sola respuesta.

**Your brain:** *"En el reto 9 casi todos siguen moviendo números porque eso funcionó antes. Las
jarras y los pitillos son la misma trampa: el cerebro repite lo que le funcionó."*

**Si le cuesta:** hacer solo 1, 4, 7 y 9. **Si arrasa:** que invente uno y lo verifique la compañera.

---

## 3. Torre de Hanoi · Planificación

**Material:** 4 cuadrados de papel o cartón de unos 20, 15, 10 y 6 cm, numerados del 1 (el más
pequeño) al 4; 3 lugares marcados con cinta: A, B, C. La torre empieza en A, la pieza grande abajo.

**Rules:** *"1. Move only one piece at a time. 2. Move only the top piece. 3. Never put a big piece
on a small piece. 4. Move the tower from A to C."*

**Dinámica:** se turnan las jugadas y piden permiso: *"Can I move the small one to C?" "Yes, go!" / "No, wait!"*.
Ronda 1 con 3 piezas; ronda 2 con 4. Cuentan los movimientos.

**Solución:**
- 3 piezas, 7 movimientos: 1→C, 2→B, 1→B, 3→C, 1→A, 2→C, 1→C.
- 4 piezas, 15 movimientos: 1→B, 2→C, 1→C, 3→B, 1→A, 2→B, 1→B, 4→C, 1→C, 2→A, 1→A, 3→C, 1→B, 2→C, 1→C.
- Regla: con un número impar de piezas, la pequeña empieza yendo a C; con un número par, a B.

**Your brain:** *"Planificar es ver el futuro antes de actuar. Tareas como esta se usan en
neuropsicología para observar la planificación; hoy no medimos nada, solo practicamos."*

**Si le cuesta:** empezar con 2 piezas (3 movimientos). **Si arrasa:** 4 piezas en 15 movimientos exactos.

---

## 4. Stroop saltado · Inhibición

**Material:** tapete de 4 colores; 12 tarjetas con palabras de color en inglés escritas con tinta de
OTRO color (por ejemplo RED escrito en azul). Verificar qué colores tiene el tapete y usar solo esos.

**Rules:** *"Look at the INK, not the word. Say the ink color and jump on it."*

**Dinámica:** una muestra tarjetas, la otra salta y dice el color. Ronda 1: tarjetas donde palabra y
tinta coinciden (fácil). Ronda 2: no coinciden. Cambian de rol. Cronometrar cada ronda.

**Solución:** no hay solución única; lo correcto es el color de la tinta.

**Your brain:** *"Leer es automático: el cerebro lee aunque no quiera. Frenar esa lectura es
inhibición (efecto Stroop, 1935). En inglés frenamos el español para que no salga 'I am agree'."*

**Si le cuesta:** solo 2 colores. **Si arrasa:** regla cambiante: con tarjeta roja, se dice la palabra.

---

## 5. Los 9 puntos · Salir del marco

**Material:** 9 platillos o conos en cuadrícula de 3 × 3 en el piso, a un metro uno de otro; cinta
de enmascarar o una cuerda.

**Rules:** *"Connect the 9 dots with 4 straight lines. Don't lift the tape."*

**Solución (verificada):** con los puntos en coordenadas de 0 a 2, la cinta pasa por (−1,−1) → (2,2)
→ (−1,2) → (2,−1) → (2,1). Es decir: diagonal de afuera hasta la esquina opuesta, fila de arriba
saliendo del cuadrado, diagonal inversa saliendo por abajo, y columna de la derecha hacia arriba.
Las líneas TIENEN que salir del cuadrado.

**Advertencia:** si alguien ya conoce el acertijo, el reto se acaba. Preguntar antes y, si lo conoce,
que sea la "pista" del grupo en vez de jugadora.

**Your brain:** *"Nadie dijo que no se podía salir del cuadrado. El límite lo puso su cerebro."*

**Si le cuesta:** pista: *"The lines can go outside."* **Si arrasa:** que encuentre otra solución
empezando desde una esquina distinta (las rotaciones y reflejos de la solución también sirven).

---

## 6. El vaso escondido · Memoria de trabajo

**Material:** 3 o 4 vasos desechables boca abajo en fila, numerados de izquierda a derecha; una pelota de ping pong.

**Rules:** *"Listen. Follow the ball in your head. Point to the cup."*

**Dinámica:** ronda 1, los vasos SÍ se mueven (la compañera los intercambia según lo que dice el
facilitador). Ronda 2, los vasos NO se mueven: solo se escuchan los intercambios y se sigue la pelota
en la mente. Los intercambios se dicen en inglés: *"Swap cup one and cup two."*

**Secuencias verificadas:**
- 3 vasos, pelota en 1: 1-2, 2-3 → termina en **3**.
- 3 vasos, pelota en 2: 1-2, 1-3, 2-3, 1-2 → termina en **1**.
- 4 vasos, pelota en 4: 1-4, 2-4, 3-4, 1-2, 2-3 → termina en **3**.

**Your brain:** *"Mantener y actualizar información al mismo tiempo es memoria de trabajo. Es la que
usamos para sostener el inicio de una frase en inglés mientras armamos el final."*

**Si le cuesta:** 3 vasos y 2 intercambios. **Si arrasa:** que ella diga la secuencia para el grupo.

---

## 7. Hedbanz · Inferencia con preguntas

**Material:** juego Hedbanz.

**Rules:** *"Ask yes / no questions. Ten questions maximum."*

**Dinámica:** la que tiene la tarjeta pregunta: *"Am I an animal?" "Do I live in the water?" "Can I fly?"*.
La compañera responde con respuesta corta: *"Yes, you are." "No, you can't."*

**Solución:** la de la tarjeta.

**Your brain:** *"Cada pregunta descarta posibilidades. Las buenas preguntas son las que parten el
problema por la mitad."*

**Si le cuesta:** banco de preguntas pegado en la mesa. **Si arrasa:** máximo 6 preguntas.

---

## 8. Buki · Razonamiento espacial

**Material:** Buki con su lámina de patrones.

**Rules:** *"Describe the pattern. Your partner builds it without looking at the card."*

**Dinámica:** una describe con preposiciones (*"on top of", "next to", "on the left", "behind"*), la
otra construye sin ver la lámina. Comparan al final y cambian de rol.

**Solución:** la de la lámina.

**Your brain:** *"Convertir una imagen en palabras y las palabras otra vez en imagen exige
razonamiento espacial y lenguaje preciso."*

**Si le cuesta:** patrones de 3 piezas. **Si arrasa:** sin gestos, solo palabras.

---

## Cómo agregar un reto nuevo

1. Usar material del inventario (`cca-actividades-corporales`).
2. Definir la función mental y comprobar que no repite la de la clase anterior.
3. Si tiene solución, escribir su verificador en `scripts/` y correrlo.
4. Agregar la ficha aquí con el mismo formato.
