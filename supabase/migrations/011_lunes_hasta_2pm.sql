-- El Gimnasio del Cerebro: el lunes en la mañana se atiende hasta las 2:00 p.m.
-- (última clase de 1:00 a 2:00 p.m.). Antes era hasta la 1:00 p.m.
update public.horario set fin = 840 where dia_semana = 1 and inicio = 360;

-- Para revisar: debe salir 360 | 840 y 1140 | 1200.
select inicio, fin from public.horario where dia_semana = 1 order by inicio;
