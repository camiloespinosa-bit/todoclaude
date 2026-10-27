# Plantillas de WhatsApp para Twilio

Se crean en Twilio: **Messaging > Content Template Builder > Create new**. Para las tres:

- **Content type:** Text
- **Language:** Spanish (es)
- Al terminar: **Save and submit for WhatsApp approval**, categoría **Utility**.

Las variables `{{1}}`, `{{2}}`… se escriben tal cual. Twilio pide un valor de ejemplo para cada una (para que Meta entienda el mensaje); usa los de la tabla.

Después de aprobadas, cada plantilla tiene un **Content SID** que empieza por `HX`. Ese es el que va en los secretos de Supabase.

## 1. Confirmación (secreto `TWILIO_PLANTILLA_CONFIRMACION`)

Nombre sugerido: `gc_confirmacion_reserva`

```
Hola {{1}}, confirmamos tu reserva en El Gimnasio del Cerebro: {{2}} el {{3}} a las {{4}}, {{5}}. Si necesitas cambiarla, escríbenos al 301 491 6120.
```

| Variable | Qué es | Ejemplo |
|---|---|---|
| {{1}} | Nombre | Ana Gómez |
| {{2}} | Tipo de clase | clase de 1 hora |
| {{3}} | Fecha | miércoles 4 de noviembre |
| {{4}} | Hora | 1:00 p.m. |
| {{5}} | Lugar o enlace | por Google Meet: https://meet.google.com/abc-defg-hij |

## 2. Recordatorio del día antes (secreto `TWILIO_PLANTILLA_DIA_ANTES`)

Nombre sugerido: `gc_recordatorio_dia_antes`

```
Hola {{1}}, te recordamos que mañana tienes {{2}} en El Gimnasio del Cerebro a las {{3}}, {{4}}. Si no puedes asistir, escríbenos al 301 491 6120.
```

| Variable | Qué es | Ejemplo |
|---|---|---|
| {{1}} | Nombre | Ana Gómez |
| {{2}} | Tipo de clase | clase de 1 hora |
| {{3}} | Hora | 1:00 p.m. |
| {{4}} | Lugar o enlace | en nuestra sede de Rionegro |

## 3. Recordatorio 1 hora antes (secreto `TWILIO_PLANTILLA_HORA_ANTES`)

Nombre sugerido: `gc_recordatorio_hora_antes`

```
Hola {{1}}, tu clase en El Gimnasio del Cerebro empieza a las {{2}}, {{3}}. ¡Te esperamos!
```

| Variable | Qué es | Ejemplo |
|---|---|---|
| {{1}} | Nombre | Ana Gómez |
| {{2}} | Hora | 1:00 p.m. |
| {{3}} | Lugar o enlace | por Google Meet: https://meet.google.com/abc-defg-hij |

## Notas

- Son mensajes de servicio (categoría **Utility**), no publicidad: no deben llevar ofertas ni promociones, o Meta los puede rechazar o reclasificar como marketing (más caros).
- Twilio solo envía; no recibe respuestas. Por eso los mensajes piden escribir al 301 491 6120.
- Solo reciben mensajes quienes marcaron la casilla de WhatsApp al reservar.
