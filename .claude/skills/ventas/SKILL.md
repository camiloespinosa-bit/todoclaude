---
name: ventas
description: >-
  Conocimiento de ventas para Gimnasio del Cerebro (Rionegro, Antioquia):
  prospectar colegios, escribir el primer mensaje a un rector o coordinador,
  responder objeciones, pedir y trabajar referidos, y llevar una conversación
  hasta una reunión o un taller. Basado en la biblioteca de ventas de Harvey
  (ethanplusai/harvey, MIT), adaptado al español, a Colombia y a las tres
  ofertas: formación docente para colegios, inglés para adultos y docentes
  (Fase Experta) y clases para niños. Úsala cuando el usuario diga "escríbele a
  este colegio", "arma una lista de colegios", "me dijeron que no hay
  presupuesto", "cómo pido referidos", "respóndele a este papá", "mensaje de
  seguimiento" o cualquier tarea de prospección o cierre. Nunca envía nada: el
  usuario revisa y envía cada mensaje.
---

# ventas

Ayuda al usuario a conseguir clientes para Gimnasio del Cerebro sin sonar a
vendedor ni a robot. La skill redacta, prioriza y prepara. **El usuario envía.**

## Reglas que mandan sobre todo lo demás

1. **Nada se envía sin un "sí" explícito**, y aun así lo envía el usuario desde su
   correo, WhatsApp o LinkedIn. Esta skill no tiene acceso a envío.
2. **Marca: Gimnasio del Cerebro.** Nunca escribas "CCA" ni "Centro Cognitivo
   para el Aprendizaje" en mensajes a clientes (ver nota de marca en el
   `README.md` del repo). Si el usuario dice "CCA", entiende que se refiere al
   programa, pero el texto que sale va con la marca nueva.
3. **No inventes nada sobre el prospecto.** Si no verificaste un dato (nombre
   del rector, un evento del colegio, un problema que tengan), no lo uses. Un
   mensaje genérico honesto es mejor que uno "personalizado" falso.
4. **No prometas más que la evidencia.** El sitio dice "Hecho con base en
   evidencia, no en promesas", y los mensajes también. Nada de "mejora el
   rendimiento académico un X %" sin una fuente que lo diga para esa población.
   Las cifras de la marca (8+ años, 600+ sesiones, 100+ estudios) salen del
   sitio: úsalas tal cual, sin redondear hacia arriba.
5. **Lo que dice `productos/*.md` como "POR CONFIRMAR" no se usa** en un
   mensaje hasta que el usuario lo confirme.
6. **Privacidad (Ley 1581 de 2012).** Solo contactar datos institucionales
   publicados por el propio colegio (correo de rectoría, coordinación, PBX) o
   personas que dieron su dato. No armar bases con correos personales
   adivinados. Todo mensaje debe dejar una salida fácil ("si no es para ustedes,
   me dices y no vuelvo a escribir") y respetarla. La política de datos del
   sitio (`privacidad.html`) sigue en borrador; no la cites como vigente.
   Para WhatsApp y llamadas, la Ley 2300 de 2023 limita horarios y frecuencia
   del contacto comercial; no se ha verificado con un abogado si aplica igual a
   contacto entre empresas, así que por defecto respeta sus límites.

## Qué oferta, qué canal

| Oferta | Quién decide | Canal principal | Correo en frío |
|---|---|---|---|
| Formación docente para colegios (`productos/colegios.md`) | Rector, coordinador académico, psicoorientación | Correo institucional, luego WhatsApp si lo dan, LinkedIn | **Sí**, con las reglas de arriba |
| Inglés Fase Experta, adultos y docentes (`productos/ingles-adultos-docentes.md`) | La persona | Referidos, contenido en LinkedIn/Instagram, circuito de docentes | **No** a particulares. Sí a colegios para ofrecerlo a su planta docente |
| Clases para niños (`productos/ninos.md`) | Padres | Referidos, evaluación gratuita, WhatsApp cuando el padre escribe primero | **No.** Nunca escribir en frío a padres |

Si el usuario pide contactar en frío a particulares (padres, adultos), dile por
qué no conviene y propone la vía de referidos.

## Flujo por tarea

Lee solo los archivos que la tarea necesita. Los de `harvey/` están en inglés
y pensados para negocios pequeños en EE. UU.: toma los principios, no los
ejemplos ni las cifras de mercado.

### "Arma una lista de colegios"
Lee `productos/colegios.md`, `harvey/prospecting_tactics.md` (estrategias 1, 3
y 5), `harvey/lead_qualification.md` y `harvey/account_navigation.md`.

- Empieza por el Oriente antioqueño (Rionegro, La Ceja, El Retiro, Marinilla,
  Guarne, El Carmen de Viboral) y luego Medellín, salvo que el usuario diga otra
  cosa.
- Por colegio registra: nombre, municipio, oficial o privado, calendario A o B,
  web, contacto institucional público y la fuente de cada dato. Si buscas en la
  web, cita la URL; si no pudiste verificar, deja el campo vacío.
- Prioriza (alta, media, baja) con señales reales: privado con énfasis en
  bilingüismo o innovación, publicó vacantes docentes, tiene programa de
  formación docente visible, es cercano a Rionegro. No asignes prioridad por
  intuición sin decir cuál señal la justifica.
- Lista corta: de 10 a 20 colegios. Calidad antes que volumen.
- Colegios oficiales: la decisión suele pasar por la Secretaría de Educación.
  Revisa `convocatorias/pensar-con-otros-2026/` del repo antes de proponer un
  enfoque distinto.

### "Escríbele a este colegio" (primer mensaje y seguimientos)
Lee `productos/colegios.md`, `harvey/email_frameworks.md`,
`harvey/signal_playbook.md` y `harvey/offer_strategy.md`.

- Secuencia de máximo 3 mensajes (observación, ángulo, cierre amable), como en
  `email_frameworks.md`, separados al menos 4 a 7 días hábiles.
- Español de Colombia, trato de "usted" con rectores salvo que el usuario indique
  lo contrario. Corto: 60 a 120 palabras.
- Abre con algo concreto del colegio que sí verificaste. Si no hay nada, abre
  con el problema del aula (instrucciones repetidas, atención, autocontrol) sin
  fingir que sabes que ese colegio lo tiene.
- Una sola petición, de bajo compromiso: el taller docente gratuito. No pidas
  reunión de una hora en el primer mensaje.
- Prohibido: "Espero que se encuentre muy bien", "le escribo para presentarle",
  listas de beneficios, mayúsculas sostenidas, signos de admiración en serie,
  links de rastreo, adjuntos pesados en el primer correo.
- Entrega: asunto, cuerpo, y una línea explicando por qué ese ángulo. Después
  pasa el texto por la skill `li-human` si está disponible.

### "Me respondieron esto" (objeciones y respuestas)
Lee `harvey/objection_handling.md`, `harvey/sales_methodology.md` (flujo de
respuesta a reunión) y el archivo de producto que aplique.

- Clasifica primero: interesado, pregunta, objeción (presupuesto, autoridad,
  necesidad, momento), no interesado, pide que no le escriban más.
- "No me escriban más" o equivalente: respuesta de una línea agradeciendo,
  y recuérdale al usuario que lo anote para no volver a escribirle.
- Objeciones típicas de colegios y cómo leerlas:
  - "No hay presupuesto": el taller es gratuito; separa decisión de taller de
    decisión de compra. Pregunta cuándo planean el presupuesto del año
    siguiente.
  - "Ya tenemos formación docente": pregunta qué cubre; el diferencial es que
    el entrenamiento ocurre dentro de la clase, no en una charla aparte.
  - "Lo tengo que consultar": ofrece un resumen de una página para quien
    decide y pregunta quién más debería estar en el taller.
  - "Los docentes no tienen tiempo": el taller es corto y vivencial; confirma
    duración real en `productos/colegios.md` antes de prometerla.
- Si piden precio de la ruta de acompañamiento y no está confirmado en
  `productos/colegios.md`, no inventes cifra: propone conversarlo después del
  taller, cuando se sabe el alcance.

### "Cómo consigo más referidos"
Este es el canal que hoy funciona; trátalo como prioridad. Lee
`harvey/prospecting_tactics.md` (estrategia 6, Referral Mining) y
`harvey/offer_strategy.md`.

- Momento de pedirlo: justo después de un logro visible (el niño subió de
  nivel, el adulto pasó de 4 a 8 minutos en inglés, el colegio cerró el taller
  con buena respuesta). No al cobrar.
- Pedido específico, no "si conoce a alguien": "¿Hay otro papá del curso de
  Sofía que se esté preguntando lo mismo que usted hace tres meses?".
- Facilita el reenvío: un mensaje corto de WhatsApp listo para que el cliente
  lo reenvíe, con el link de la evaluación gratuita o del taller.
- Colegios: pide la presentación con otro rector o con la asociación de
  colegios privados del municipio, no solo "un contacto".
- No ofrezcas incentivos económicos por referir sin que el usuario lo decida; si
  se ofrece algo, debe ser igual para todos y quedar por escrito.
- Redacta los mensajes, un registro simple de quién refirió a quién, y una
  nota de agradecimiento al que refirió cuando el referido se inscribe.

### LinkedIn
Lee `harvey/linkedin_outreach.md` y, para escribir posts o comentarios, usa las
skills `li-*` del repo. Respeta los límites de seguridad de ese archivo: nada
de automatizar conexiones o mensajes.

### Archivos que no aplican
`harvey/selling_to_startups.md` está pensado para fundadores de startups de
Y Combinator. No lo uses salvo que el prospecto sea una startup.

## Cómo entregar

- Texto listo para copiar, separado de las explicaciones.
- Marca con "POR CONFIRMAR" cualquier dato que dependa del usuario (precio,
  fechas, duración, nombre de un contacto).
- Si algo del producto no está en `productos/`, pregunta antes de redactar.
- Cuando el usuario confirme datos nuevos (precios, duraciones, resultados), ofrece
  actualizar el archivo de `productos/` correspondiente.

## Origen

Biblioteca de ventas de [ethanplusai/harvey](https://github.com/ethanplusai/harvey)
(MIT, Ethan Rogers; ver `../ethanplusai-harvey.LICENSE`), copiada sin cambios
en `harvey/`. No se instaló la aplicación de Harvey (el agente que envía
correos solo); ver `harvey/README.md` para el mapa original de archivos.
Las fichas de `productos/` y este `SKILL.md` son propios de este repo.
