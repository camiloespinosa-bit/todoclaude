---
name: reto-bienvenida-adultos
description: "Protocolo Brain Warm-up del Gimnasio del Cerebro: el reto cognitivo con material físico que abre cada clase PRESENCIAL de inglés para adultos (Rookie a Avenger). Activar cuando el usuario pida el reto de inicio, la actividad de bienvenida, el calentamiento cognitivo, 'algo como las jarras de Luchins o los pitillos', un reto para recibir a los estudiantes, o quiera ampliar el banco de retos. Diseña el reto, verifica su solución con código antes de entregarlo, lo conecta con la gramática de la sesión y produce la tarjeta del facilitador, la hoja de reglas para estudiantes y las soluciones. NO aplica a clases virtuales."
---

# Reto de bienvenida · Protocolo Brain Warm-up (adultos, presencial)

Cada clase presencial de adultos abre con un reto cognitivo con material físico, de 10 a 12 minutos.
Nació de lo que el facilitador validó en clase: las jarras de Luchins y los pitillos tramposos.
Es un ritual de entrada (estrategia EN-10 de `gimnasio-cerebro-sesion-adultos`): predecible en la forma,
nuevo en el contenido.

## Alcance

- **Solo clases presenciales.** El reto depende de material físico y de trabajo en pareja o grupo
  en el mismo espacio. Si la clase es virtual, decirlo y no adaptar el protocolo; ofrecer en su lugar
  un calentamiento oral del skill `gimnasio-cerebro-sesion-adultos`.
- Programa adultos, todos los niveles. El reto es el mismo; cambia la gramática del momento 2.

## Estructura fija: 3 momentos (10 a 12 min)

| Momento | Min | Qué pasa |
|---|---|---|
| 1. The challenge | 5 a 7 | Reto en pareja o grupo. Reglas dichas y pegadas en inglés. |
| 2. Explain it | 2 a 3 | Narran en inglés cómo lo resolvieron, con la gramática de la sesión (ver tabla abajo). |
| 3. Your brain | 2 | El facilitador explica en español, en un minuto, qué función mental puso a prueba y qué trampa tenía. |

Gramática del momento 2 según lo que esté viendo el grupo:

| Gramática | Marco de frase |
|---|---|
| Presente simple | *"First you move…, then you…"* |
| Imperativo (entre compañeros) | *"Move the small one to C." "Wait!"* |
| Pasado simple | *"First, we moved… It was difficult because…"* |
| Going to | *"I'm going to move… because…"* (antes de cada jugada) |
| Modales perfectos (Gladiator en adelante) | *"We should have… We could have…"* |
| Condicional | *"If we move this one, then…"* |

## Rotación de funciones mentales

No repetir la misma función dos clases seguidas con el mismo grupo. Llevar el registro en
`references/registro-rotacion.md`, o pedirle al facilitador qué hizo la clase anterior.

Banco actual (detalle completo en `references/banco-retos.md`):

| # | Reto | Función | Material |
|---|---|---|---|
| 1 | Jarras de Luchins | Flexibilidad (rigidez mental) | Jarras o papel |
| 2 | Pitillos tramposos | Insight (romper el hábito) | Pitillos o palillos chinos |
| 3 | Torre de Hanoi | Planificación | Papel en 4 tamaños, cinta |
| 4 | Stroop saltado | Inhibición | Tapete de 4 colores, tarjetas |
| 5 | Los 9 puntos | Salir del marco | 9 platillos o conos, cinta |
| 6 | El vaso escondido | Memoria de trabajo | 3 o 4 vasos, pelota de ping pong |
| 7 | Hedbanz | Inferencia con preguntas | Hedbanz |
| 8 | Buki | Razonamiento espacial | Buki |

El inventario del gimnasio está en el skill `cca-actividades-corporales`. Confirmar con el facilitador
que el material sigue disponible antes de diseñar.

## Flujo de trabajo

1. **Contexto.** Preguntar solo lo que cambia el resultado: grupo y nivel, cuántas personas, qué
   gramática ve la sesión y qué reto se hizo la clase anterior.
2. **Elegir** del banco la siguiente función de la rotación, o diseñar un reto nuevo con material del
   inventario. Si es nuevo, agregarlo a `references/banco-retos.md`.
3. **Verificar con código.** Ningún reto con solución se entrega sin pasar por `scripts/`:
   `verificar.py` (jarras, Hanoi, 9 puntos, vasos) y `pitillos.py` (ecuaciones con un solo movimiento).
   Para un tipo de reto nuevo, escribir su verificador. Si hay varias soluciones válidas, decirlo en la
   hoja del facilitador; si el reto depende de una sola solución, buscar una versión con solución única.
4. **Producir** con el sistema visual de `cca-marca` (Carta, franja lateral, Oki con SVG oficiales,
   Poppins, sin emojis):
   - Tarjeta del facilitador: materiales, preparación, reglas, dinámica, solución, guion de los 3 momentos,
     "Si le cuesta / si arrasa".
   - Hoja de reglas para estudiantes, en inglés, legible de lejos (28 pt o más).
   - Soluciones, marcadas "SOLO PARA EL FACILITADOR".
5. **Revisar** el render página por página antes de entregar.

## Reglas de honestidad (obligatorias)

- No decir que el reto "aumenta la inteligencia" ni que "entrena el cerebro" para el inglés. La
  evidencia de transferencia lejana de los juegos cognitivos es débil. Su valor es la activación,
  la conversación auténtica en inglés y la metacognición.
- Hanoi y la Torre de Londres se usan en neuropsicología para **observar** la planificación; en clase
  no se mide nada y no se interpreta el desempeño de nadie.
- Citar autores solo cuando se esté seguro (Luchins 1942; Stroop 1935; Knoblich y colegas 1999 para
  los problemas de fósforos). Si hay duda, decir "verifica la referencia".
- Ningún reto expone a un estudiante: se trabaja en pareja, sin ranking individual. En discalculia o
  ansiedad alta, ver `gimnasio-cerebro-sesion-adultos/references/nee-adultos.md` (por ejemplo,
  calculadora permitida en Luchins).
