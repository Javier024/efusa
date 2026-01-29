/**
 * 📢 ALERTAS DE PAGO – EFUSA
 * Detecta jugadores con deuda y genera alertas + WhatsApp
 */

import { getJugadores, getPagos } from './api.js'
import {
  enviarWhatsApp,
  mensajeRecordatorio
} from './whatsapp.js'
import { formatearMoneda } from './configuracion.js'

const tbody = document.getElementById('alertas')

let jugadores = []
let pagos = []

/**
 * Inicializar
 */
document.addEventListener('DOMContentLoaded', async () => {
  await cargarDatos()
  generarAlertas()
})

/**
 * Cargar jugadores y pagos
 */
async function cargarDatos() {
  jugadores = await getJugadores()
  pagos = await getPagos()
}

/**
 * Generar alertas de deuda
 */
function generarAlertas() {
  tbody.innerHTML = ''

  jugadores.forEach(jugador => {
    const pagosJugador = pagos.filter(p => p.jugador_id === jugador.id)

    const totalPagado = pagosJugador.reduce(
      (sum, p) => sum + Number(p.monto),
      0
    )

    const mensualidad = jugador.mensualidad || 0
    const mesesEsperados = jugador.meses || 1
    const totalEsperado = mensualidad * mesesEsperados
    const deuda = totalEsperado - totalPagado

    if (deuda <= 0) return

    const tr = document.createElement('tr')
    tr.className = 'border-b hover:bg-gray-50'

    tr.innerHTML = `
      <td class="p-3 font-medium">${jugador.nombre}</td>
      <td class="p-3">${jugador.categoria || '-'}</td>
      <td class="p-3">${formatearMoneda(mensualidad)}</td>
      <td class="p-3 text-red-600 font-bold">
        ${formatearMoneda(deuda)}
      </td>
      <td class="p-3">
        <button
          class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
          onclick="enviarRecordatorio(${jugador.id})">
          WhatsApp
        </button>
      </td>
    `

    tbody.appendChild(tr)
  })
}

/**
 * Enviar WhatsApp
 */
window.enviarRecordatorio = function (jugadorId) {
  const jugador = jugadores.find(j => j.id === jugadorId)
  if (!jugador || !jugador.telefono) {
    alert('Jugador sin teléfono registrado')
    return
  }

  const mensaje = mensajeRecordatorio(
    jugador.nombre,
    jugador.mensualidad,
    jugador.meses || 1
  )

  enviarWhatsApp(jugador.telefono, mensaje)
}

