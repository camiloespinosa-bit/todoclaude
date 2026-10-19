# Wag & Wash: página de reserva

Formulario de reserva conectado a Supabase. Ver el plan completo en [`../Plan.md`](../Plan.md).

## 1. Crear la tabla en Supabase

1. Entra a tu proyecto en Supabase y abre **SQL Editor**.
2. Pega todo el contenido de `supabase/migrations/001_reservas.sql` y ejecútalo.

Esto crea:

- `reservas`: las reservas de los clientes.
- `festivos`: los festivos de Colombia (se llenan por año, ver abajo).
- Las funciones `horas_disponibles`, `crear_reserva` y `reportar_pago`, que aplican las reglas del negocio: lunes a sábado, de 8 a.m. a 6 p.m., sin baños a las 12 m., sin festivos y máximo 2 baños por hora.

El navegador no puede leer la tabla `reservas` directamente (seguridad a nivel de fila activada), así que un cliente no puede ver los datos de otros clientes.

## 2. Configurar el `.env`

Copia `.env.example` como `.env` en esta carpeta y llena:

```
VITE_SUPABASE_URL=...        # Project Settings > API > Project URL
VITE_SUPABASE_ANON_KEY=...   # Project Settings > API > anon / public
VITE_LLAVE_BREB=...          # la llave Bre-B del negocio
```

Solo las variables que empiezan por `VITE_` llegan al navegador. Usa la llave **anon**, nunca la `service_role`. El archivo `.env` no se sube al repositorio.

## 3. Correr la página

```
npm install
npm run dev
```

## Cargar festivos

En el SQL Editor, por ejemplo:

```sql
insert into festivos (fecha, nombre) values
  ('2026-12-08', 'Inmaculada Concepción'),
  ('2026-12-25', 'Navidad');
```

Verifica las fechas de cada año con el calendario oficial de festivos de Colombia.

## Cómo funciona el pago (versión 1)

1. El cliente reserva y su cupo queda apartado 15 minutos (`pendiente_pago`).
2. Paga por Bre-B a la llave del negocio y toca "Ya pagué" (`pago_reportado`). El cupo queda apartado hasta que Adriana revise.
3. Adriana verifica el pago en su banco y cambia la reserva a `pagada` (o `cancelada`). Mientras no exista el dashboard, lo hace en Supabase, en **Table Editor > reservas**.
