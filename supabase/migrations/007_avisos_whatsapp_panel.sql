-- El Gimnasio del Cerebro: confirmaciones y recordatorios por WhatsApp desde el panel.
-- El docente los envía desde su propio WhatsApp: el panel abre el chat con el mensaje ya
-- escrito y aquí queda registrado a quién se le envió, para no repetir.
-- Solo para reservas con acepta_whatsapp (lo revisa el panel y también esta función).

alter table public.reservas
  add column if not exists whatsapp_confirmacion_en timestamptz,
  add column if not exists whatsapp_recordatorio_en timestamptz;

-- Marca una reserva como confirmada o recordada. En un bloque de 2 horas marca las dos.
create function public.marcar_aviso(p_reserva uuid, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clave uuid;
begin
  if p_tipo not in ('confirmacion', 'recordatorio') then
    raise exception 'TIPO_INVALIDO';
  end if;

  select coalesce(bloque_id, id) into v_clave
  from reservas where id = p_reserva and estado = 'activa' and acepta_whatsapp;
  if v_clave is null then
    raise exception 'RESERVA_NO_EXISTE';
  end if;

  update reservas
  set whatsapp_confirmacion_en = case when p_tipo = 'confirmacion' then now() else whatsapp_confirmacion_en end,
      whatsapp_recordatorio_en = case when p_tipo = 'recordatorio' then now() else whatsapp_recordatorio_en end
  where coalesce(bloque_id, id) = v_clave and estado = 'activa';
end;
$$;

revoke execute on function public.marcar_aviso(uuid, text) from public, anon, authenticated;
grant execute on function public.marcar_aviso(uuid, text) to service_role;

-- La agenda del panel ahora dice a quién ya se le confirmó o recordó.
create or replace function public.panel_agenda(p_desde date, p_hasta date)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'id', s.id, 'fecha', s.fecha, 'inicio', s.inicio, 'clase', s.clase,
    'modalidad', s.modalidad, 'enlace_meet', s.enlace_meet,
    'en_calendario', s.google_event_id is not null,
    'ocupados', ocupados(s.id),
    'asistentes', (
      select json_agg(json_build_object(
        'id', r.id, 'tipo', r.tipo, 'bloque_id', r.bloque_id, 'nombre', r.nombre,
        'telefono', r.telefono, 'correo', r.correo, 'programa', r.programa,
        'personas', r.personas, 'acepta_whatsapp', r.acepta_whatsapp, 'creada_en', r.creada_en,
        'politica_version', r.politica_version,
        'whatsapp_confirmacion_en', r.whatsapp_confirmacion_en,
        'whatsapp_recordatorio_en', r.whatsapp_recordatorio_en
      ) order by r.creada_en)
      from reservas r where r.sesion_id = s.id and r.estado = 'activa'
    )
  ) order by s.fecha, s.inicio), '[]'::json)
  from sesiones s
  where s.fecha between p_desde and least(p_hasta, p_desde + 62)
    and ocupados(s.id) > 0;
$$;
