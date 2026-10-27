-- El Gimnasio del Cerebro: nuevo horario de atención (desde el 27 de octubre de 2026).
-- Lunes 6–1 y 7–8 p.m.; martes y jueves 6–12, 1–4 y 7–8 p.m.; miércoles 6–12 y 1–8 p.m.;
-- viernes 6–12; sábado 8–12 y 1–5. Domingo cerrado.
-- Es más amplio que el anterior, así que ninguna reserva existente queda por fuera.

delete from public.horario;

insert into public.horario (dia_semana, inicio, fin) values
  (1, 360, 780), (1, 1140, 1200),                 -- lunes 6 a.m.–1 p.m. y 7–8 p.m.
  (2, 360, 720), (2, 780, 960), (2, 1140, 1200),  -- martes 6–12, 1–4 y 7–8 p.m.
  (3, 360, 720), (3, 780, 1200),                  -- miércoles 6–12 y 1–8 p.m.
  (4, 360, 720), (4, 780, 960), (4, 1140, 1200),  -- jueves 6–12, 1–4 y 7–8 p.m.
  (5, 360, 720),                                  -- viernes 6–12
  (6, 480, 720), (6, 780, 1020);                  -- sábado 8–12 y 1–5
