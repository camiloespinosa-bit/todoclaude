import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env')
}

export const supabase = createClient(url, anonKey)

export async function horasDisponibles(fecha) {
  const { data, error } = await supabase.rpc('horas_disponibles', { p_fecha: fecha })
  if (error) throw error
  return data
}

export async function crearReserva(reserva) {
  const { data, error } = await supabase.rpc('crear_reserva', {
    p_cliente_nombre: reserva.clienteNombre,
    p_cliente_telefono: reserva.clienteTelefono,
    p_perro_nombre: reserva.perroNombre,
    p_perro_raza: reserva.perroRaza,
    p_fecha: reserva.fecha,
    p_hora: reserva.hora,
    p_acepta_whatsapp: reserva.aceptaWhatsapp,
  })
  if (error) throw error
  return data
}

export async function reportarPago(id) {
  const { error } = await supabase.rpc('reportar_pago', { p_id: id })
  if (error) throw error
}
