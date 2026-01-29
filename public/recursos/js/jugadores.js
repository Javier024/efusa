/**
 * 👥 JUGADORES – EFUSA
 * Listado, estado de pagos y alertas
 */

import { apiFetch, formatearMoneda } from './configuracion.js'

let jugadores = []
let pagos = []

document.addEventListener('DOMContentLoaded', init)

async function init() {
  try {
    jugadores = await apiFetch('/jugadores')
    pagos = await apiFetch('/pagos')

    renderJugadores()
  } catch (error) {
    console.error('Error cargando jugadores:', error)
    mostrarError('Error cargando jugadores')
  }
}

/* ======================================================
   🎨 RENDER
====================================================== */

function renderJugadores() {
  const tbody = document.getElementById('tabla-jugadores')
  if (!tbody) return

  tbody.innerHTML = ''

  jugadores.forEach(j => {
    const totalPagado = pagos
      .filter(p => p.jugador_id === j.id)
      .reduce((s, p) => s + Number(p.monto || 0), 0)

    const deuda = Math.max(
      (j.mensualidad || 0) - totalPagado,
      0
    )

    const estado = deuda > 0
      ? `<span class="text-red-600 font-bold">Moroso</span>`
      : `<span class="text-green-600 font-bold">Al día</span>`

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-3">${j.nombre}</td>
        <td class="p-3">${j.categoria || '-'}</td>
        <td class="p-3">${formatearMoneda(j.mensualidad)}</td>
        <td class="p-3">${formatearMoneda(deuda)}</td>
        <td class="p-3">${estado}</td>
      </tr>
    `
  })
}

/* ======================================================
   ⚠️ UI
====================================================== */

function mostrarError(mensaje) {
  const tbody = document.getElementById('tabla-jugadores')
  if (!tbody) return

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="p-4 text-center text-red-600 font-bold">
        ${mensaje}
      </td>
    </tr>
  `
}
