import { horasDisponibles, crearReserva, reportarPago } from './supabase.js'

const form = document.getElementById('form-reserva')
const inputFecha = form.elements.fecha
const contHoras = document.getElementById('horas')
const mensaje = document.getElementById('mensaje')
const btnReservar = document.getElementById('btn-reservar')
const seccionPago = document.getElementById('pago')
const mensajePago = document.getElementById('mensaje-pago')
const btnPague = document.getElementById('btn-pague')

const ERRORES = {
  SIN_CUPO: 'Esa hora se acaba de llenar. Elige otra.',
  DIA_CERRADO: 'Ese día no atendemos. Elige otro día.',
  HORA_PASADA: 'Esa hora ya pasó. Elige otra.',
  HORA_INVALIDA: 'Elige una hora de la lista.',
  RESERVA_VENCIDA: 'Pasaron los 15 minutos y el cupo se liberó. Haz la reserva de nuevo.',
}

let horaElegida = null
let reservaId = null

function hoyEnBogota() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

function textoHora(h) {
  if (h === 12) return '12:00 m.'
  return h < 12 ? `${h}:00 a.m.` : `${h - 12}:00 p.m.`
}

function traducirError(error) {
  const clave = Object.keys(ERRORES).find((k) => error?.message?.includes(k))
  return clave ? ERRORES[clave] : 'No pudimos completar la reserva. Intenta de nuevo.'
}

async function cargarHoras() {
  horaElegida = null
  contHoras.innerHTML = ''
  if (!inputFecha.value) return

  contHoras.textContent = 'Buscando horas...'
  try {
    const horas = await horasDisponibles(inputFecha.value)
    contHoras.innerHTML = ''
    if (horas.length === 0) {
      contHoras.textContent = 'No hay horas para ese día.'
      return
    }
    for (const { hora, cupos_libres } of horas) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('role', 'radio')
      btn.setAttribute('aria-checked', 'false')
      btn.textContent = textoHora(hora)
      btn.disabled = cupos_libres <= 0
      btn.title = cupos_libres <= 0 ? 'Lleno' : `${cupos_libres} cupo(s) libre(s)`
      btn.addEventListener('click', () => {
        horaElegida = hora
        for (const b of contHoras.children) b.setAttribute('aria-checked', String(b === btn))
      })
      contHoras.append(btn)
    }
  } catch {
    contHoras.textContent = 'No pudimos cargar las horas. Revisa tu conexión.'
  }
}

function validar(datos) {
  if (datos.clienteNombre.length < 2) return 'Escribe tu nombre.'
  if (!/^\+?[0-9]{10,13}$/.test(datos.clienteTelefono)) return 'Escribe un celular válido, por ejemplo 3001234567.'
  if (!datos.perroNombre) return 'Escribe el nombre de tu perro.'
  if (!datos.fecha) return 'Elige una fecha.'
  if (horaElegida === null) return 'Elige una hora.'
  return null
}

inputFecha.min = hoyEnBogota()
inputFecha.addEventListener('change', cargarHoras)

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  mensaje.textContent = ''

  const f = form.elements
  const datos = {
    clienteNombre: f.clienteNombre.value.trim(),
    clienteTelefono: f.clienteTelefono.value.replace(/[\s-]/g, ''),
    perroNombre: f.perroNombre.value.trim(),
    perroRaza: f.perroRaza.value.trim(),
    fecha: f.fecha.value,
    hora: horaElegida,
    aceptaWhatsapp: f.aceptaWhatsapp.checked,
  }

  const error = validar(datos)
  if (error) {
    mensaje.textContent = error
    return
  }

  btnReservar.disabled = true
  try {
    const reserva = await crearReserva(datos)
    reservaId = reserva.id
    document.getElementById('llave-breb').textContent = import.meta.env.VITE_LLAVE_BREB ?? ''
    form.hidden = true
    seccionPago.hidden = false
  } catch (err) {
    mensaje.textContent = traducirError(err)
    cargarHoras()
  } finally {
    btnReservar.disabled = false
  }
})

btnPague.addEventListener('click', async () => {
  mensajePago.textContent = ''
  btnPague.disabled = true
  try {
    await reportarPago(reservaId)
    seccionPago.hidden = true
    document.getElementById('listo').hidden = false
  } catch (err) {
    mensajePago.textContent = traducirError(err)
    btnPague.disabled = false
  }
})
