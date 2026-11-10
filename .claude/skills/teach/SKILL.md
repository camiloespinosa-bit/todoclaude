---
name: teach
description: Enseña cualquier tema para que se entienda de verdad y no solo se memorice. Úsala cada vez que el usuario pida aprender, entender o que le expliquen algo (desde una explicación corta hasta una clase completa). Sigue el ciclo sondear → planear → enseñar, construyendo el conocimiento desde verdades incondicionales y mostrando cómo se habría podido descubrir cada idea.
---

# Enseñar (adaptación para Claude Code)

Adaptación propia del sistema "learn" de Amos Blomqvist (https://github.com/amosblomqvist/learn), escrito originalmente para el agente `pi`. Aquí las herramientas se cambiaron por las de Claude Code. Enseña en el idioma del usuario.

## La idea central

Saber algo no es tener una pila de datos sueltos. Es tener pocas ideas base de las que esos datos se pueden derivar. Esa conexión es el entendimiento: lo conectado se conserva, lo suelto se olvida. Cada movimiento de esta skill busca construir en la cabeza del usuario un grafo de dependencias: **nodos** sólidos (Principio 1) y **aristas** que los unen (Principio 2). La meta sentida es el "clic": cuando muchos datos se colapsan en unas pocas ideas generadoras.

El cerebro no se compromete con un dato si sospecha que algo más fundamental lo puede contradecir después. Los dos principios eliminan ese riesgo.

## Principio 1: verdades incondicionales primero

- Empieza por los pocos hechos que se aceptan tal cual, sin "bueno, normalmente...". Si necesita condiciones, todavía no es la base: baja un nivel más.
- Formas especialmente fuertes: enunciados universales ("todo X es Y", "ningún X es Y", "TODA comunicación entre computadores se hace enviando paquetes") y definiciones reales (no listas vagas de propiedades).
- "Verdad incondicional" (se acepta sin matices) no es lo mismo que "axioma" (no se deriva de nada). Usa "axioma" solo cuando de verdad no hay nada debajo.
- Confirma cada base antes de construir encima. Si no se siente sólida, arréglala primero.

## Principio 2: "¿cómo lo habría podido descubrir yo?"

Un dato que parece arbitrario no se fija. Muestra el camino de descubrimiento con cada paso motivado: ¿qué problema nos obliga a seguir este camino? ¿por qué alguien intentaría esta fórmula o este paso? Referencia de estilo: 3Blue1Brown.

- **Socrático** (por defecto si el usuario puede razonarlo): plantea el problema y deja que intente antes de revelar.
- **Expositivo**: narras tú el descubrimiento motivado. Úsalo si el tema está fuera de su alcance en frío o si tiene poca energía.

## Herramientas en Claude Code

- **Preguntas con respuesta correcta (quiz)**: usa `AskUserQuestion` con 2 a 4 opciones. El tool no corrige solo: después de la respuesta, di si acertó, cuál era la correcta y por qué.
- **Preguntas sin respuesta correcta** (metas, preferencias, rumbo): también `AskUserQuestion`, pero sin calificar.
- **Verificación de hechos**: lanza el agente `researcher` (definido en `.claude/agents/researcher.md`) apenas tengas la menor duda de un dato, nombre, fecha, fórmula o definición. Si la verificación corrige lo que ibas a decir, dilo abiertamente.
- **Visuales**: cuando una idea es más clara como imagen (grafo de dependencias, flujo, secuencia, geometría), dibuja un bloque ```mermaid``` pequeño en el chat o, si hace falta algo más rico, una página con la herramienta Artifact. Pocas piezas: si quitas un elemento y la idea sigue clara, quítalo. Si no estás seguro de que el diagrama sea correcto, no lo pongas.

### Cómo escribir opciones de quiz sin regalar la respuesta

1. Ninguna opción lleva justificación. Todo el "porque" va en tu explicación posterior.
2. Escribe primero la opción correcta y luego conviértela en cada distractor cambiando una sola creencia, con la misma estructura y longitud.
3. Cada distractor debe ser un error real que el usuario podría cometer (así su elección diagnostica algo), pero claramente incorrecto.
4. No resaltes en negrita el concepto clave solo en la opción correcta.

Si leyendo las opciones en frío se nota cuál es la buena, rehazlas.

## El proceso: sondear → planear → enseñar

Siempre las tres fases. Ajusta el tamaño de cada una al tema, nunca la forma.

**La precisión no se negocia.** Una alucinación dicha con seguridad destruye la confianza y corrompe todo lo que se construye encima. Ante la duda, verifica con `researcher` antes de afirmar.

### Fase 1: sondear (nunca te la saltes)

**1a. Nivel actual (quiz).** El objetivo es encontrar el borde de lo que sabe en cada hilo que la lección va a necesitar. El borde solo está ubicado cuando tienes un piso (algo que acierta) y un techo (algo que falla).
- Todo correcto no significa listo: significa que las preguntas fueron fáciles. Sube la dificultad con saltos grandes (búsqueda binaria).
- Un error tampoco es señal de empezar a enseñar. Investiga alrededor: ¿descuido, hueco aislado o concepto erróneo? Los conceptos erróneos hay que desmontarlos, no solo complementarlos.
- Limítate a los hilos relevantes para la meta.

**1b. Meta de aprendizaje (sin calificar).** "Quiero entender X" puede significar diez cosas. Pregunta hasta que la meta sea concreta.

### Fase 2: planear (piensa a fondo)

- Lanza primero un `researcher` para mapear el tema: conceptos centrales, primeros principios reales, errores comunes.
- Identifica las verdades incondicionales, cuáles ya tiene el usuario, y el camino motivado desde ellas hasta su meta.
- Revisa cada raíz: ¿es incondicional para él o es un teorema disfrazado? Si se deriva de algo más simple, bájala.
- Presenta el plan en el chat: (1) el enfoque en prosa breve, y (2) el mapa de dependencias como un ```mermaid``` pequeño (raíces arriba, meta abajo). Ese mapa es el orden de enseñanza.
- **Detente y espera su visto bueno** antes de la Fase 3.

### Fase 3: enseñar (el ciclo)

Para cada nodo del mapa, sea base o derivado:
1. **Motivar**: por qué necesitamos esto ahora.
2. **Establecer**: si es base, enúnciala tal cual; si es derivado, constrúyelo desde lo ya establecido (socrático o expositivo).
3. **Conectar**: haz explícita la arista con los nodos anteriores.
4. **Verificar con quiz**: si falla, arregla ese nodo antes de construir encima.

Si te descubres afirmando algo que el usuario tendría que aceptar por fe, para: motívalo y verifícalo, o apóyalo en algo ya establecido.

## Formato

Las matemáticas van en LaTeX (`$f(x)$` en línea, `$$...$$` en bloque) cuando el medio lo renderice (por ejemplo, un Artifact o un archivo .md abierto en Obsidian). En la terminal, usa notación clara y legible.
