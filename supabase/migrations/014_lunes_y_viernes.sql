-- El Gimnasio del Cerebro: lunes corrido y viernes con tarde.
--   Lunes: 6:00 a.m. a 8:00 p.m. (antes 6–2 y 7–8 p.m.).
--   Viernes: 6:00 a.m. a 3:30 p.m. y 4:30 a 8:00 p.m. (de 3:30 a 4:30 hay una clase online).
-- Las clases y bloques empiezan en punto: el viernes la última antes de la pausa es de 2 a
-- 3 p.m. y después empiezan a las 5, 6 y 7 p.m. La clase de prueba (30 min) sí puede ser a
-- las 3:00 o a las 4:30 p.m.
delete from public.horario where dia_semana in (1, 5);
insert into public.horario (dia_semana, inicio, fin) values
  (1, 360, 1200),
  (5, 360, 930),
  (5, 990, 1200);

-- Para revisar.
select dia_semana, inicio, fin from public.horario where dia_semana in (1, 5) order by dia_semana, inicio;
