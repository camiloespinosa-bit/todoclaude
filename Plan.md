# Plan: App Wag & Wash

Wag & Wash es una tienda para bañar mascotas. Los clientes reservan y pagan el servicio. La dueña, Adriana, manejará la app.

## Pantallas

1. **Página de reserva**: el cliente elige fecha y hora, registra a su perro y paga.
2. **Mis reservas**: el cliente ve sus reservas.
3. **Dashboard de la dueña**: Adriana ve y gestiona las reservas del negocio.

## Backend

Al crear una reserva, el backend:

1. Chequea que haya disponibilidad.
2. Toma el pago de $50.000 (50K) con **Bre-B**.
3. Guarda la reserva.
4. Envía un recordatorio por **WhatsApp**.

## Integraciones

### Pagos: Bre-B

Bre-B es el sistema de pagos inmediatos de Colombia, del Banco de la República. El cliente paga en segundos desde su banco o billetera usando la llave Bre-B del negocio.

- La app no se conecta directo al Banco de la República. Se integra a través de un banco o proveedor de pagos que ofrezca una API de cobros Bre-B. Falta elegir cuál.
- Flujo: la app genera el cobro de $50.000, el cliente paga, el proveedor avisa a la app (webhook) y solo entonces la reserva queda confirmada.
- Si el pago no llega en un tiempo límite (por ejemplo 15 minutos), el cupo se libera.
- La llave Bre-B del negocio ya existe. No se escribe en el código ni en este repositorio: se guarda como configuración privada (variable de entorno) para poder cambiarla sin tocar el código.

**Opción para arrancar (versión 1) sin proveedor:** la app muestra la llave Bre-B y el valor a pagar, el cliente paga desde su banco y Adriana confirma el pago en su dashboard (marca la reserva como "Pagada"). Funciona desde el día uno, pero la confirmación es manual. Cuando haya proveedor con API, la confirmación pasa a ser automática.

## Disponibilidad

- Cada baño dura 1 hora.
- Caben 2 baños al mismo tiempo, es decir, 2 cupos por cada franja de 1 hora.
- Una franja está disponible si tiene menos de 2 reservas activas (pagadas o pendientes de pago dentro del tiempo límite).
- Horario de atención: lunes a sábado, de 8:00 a.m. a 6:00 p.m. Domingo cerrado.
- Franjas por día: 8, 9, 10, 11 a.m., 12 m., 1, 2, 3, 4 y 5 p.m. (10 franjas; la última empieza a las 5:00 p.m. para terminar a las 6:00 p.m.).
- Capacidad máxima: 20 baños por día y 120 por semana.
- No se pueden reservar franjas que ya pasaron.

### Recordatorios: WhatsApp

- Se envían con la API oficial de WhatsApp Business (Meta), directo o mediante un proveedor.
- Los mensajes que inicia el negocio deben usar plantillas aprobadas por Meta y el cliente debe haber aceptado recibirlos (casilla de autorización en la página de reserva).
- Mensajes sugeridos: confirmación al pagar y recordatorio el día anterior a la cita.

## Pendientes por decidir

- Proveedor o banco para confirmar pagos Bre-B automáticamente (o arrancar con confirmación manual).
- Proveedor de WhatsApp Business (Meta directo u otro).
- ¿Hay hora de almuerzo u otra pausa sin baños?
- ¿Se atiende en festivos?

## Datos (tienda)

- **Clientes**
- **Perros**
- **Reservas**
