/**
 * 💰 PAGOS – EFUSA
 * Registrar, listar y filtrar pagos
 */

import { apiFetch, apiPost, formatearMoneda, formatearFecha } from './configuracion.js'

let pagos = []
let jugadores = []

let pagina = 1
const filasPorPagina = 10

document.addEventListener('DOMContentLoaded', init)

async function init() {
  try {
    jugadores = await apiFetch('/jugadores')
    pagos = await apiFetch('/pagos')

    llenarSelectJugadores()
    renderTabla()
    actualizarTotal()

    document.getElementById('formPago').addEventListener('submit', guardarPago)
    document.getElementById('buscador').addEventListener('input', renderTabla)
  } catch (error) {
    console.error(error)
    mostrarAlerta('Error cargando datos', 'error')
  }
}

/* ======================================================
   📋 FORMULARIO
====================================================== */

function llenarSelectJugadores() {
  const select = document.getElementById('jugador_id')
  jugadores.forEach(j => {
    select.innerHTML += `<option value="${j.id}">${j.nombre}</option>`
  })
}

async function guardarPago(e) {
  e.preventDefault()

  const data = {
    jugador_id: document.getElementById('jugador_id').value,
    monto: document.getElementById('monto').value,
    fecha_pago: document.getElementById('fecha').value,
    tipo: document.getElementById('tipo').value,
    observacion: document.getElementById('observacion').value
  }

  if (!data.jugador_id || !data.monto || !data.fecha_pago) {
    mostrarAlerta('Complete todos los campos obligatorios', 'error')
    return
  }

  try {
    await apiPost('/pagos', data)
    mostrarAlerta('Pago registrado correctamente', 'success')

    document.getElementById('formPago').reset()
    pagos = await apiFetch('/pagos')

    pagina = 1
    renderTabla()
    actualizarTotal()
  } catch (error) {
    console.error(error)
    mostrarAlerta('Error guardando el pago', 'error')
  }
}

/* ======================================================
   📊 TABLA
====================================================== */

function getPagosFiltrados() {
  const texto = document.getElementById('buscador').value.toLowerCase()

  return pagos.filter(p => {
    const jugador = jugadores.find(j => j.id === p.jugador_id)
    return jugador?.nombre.toLowerCase().includes(texto)
  })
}

function renderTabla() {
  const tbody = document.getElementById('tabla-pagos')
  const lista = getPagosFiltrados()

  tbody.innerHTML = ''

  const inicio = (pagina - 1) * filasPorPagina
  const page = lista.slice(inicio, inicio + filasPorPagina)

  page.forEach(p => {
    const jugador = jugadores.find(j => j.id === p.jugador_id)

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-6 py-3">${jugador?.nombre || '—'}</td>
        <td class="px-6 py-3">${formatearFecha(p.fecha_pago)}</td>
        <td class="px-6 py-3 capitalize">${p.tipo || 'abono'}</td>
        <td class="px-6 py-3">${p.observacion || '-'}</td>
        <td class="px-6 py-3 font-bold">${formatearMoneda(p.monto)}</td>
        <td class="px-6 py-3 text-right">—</td>
      </tr>
    `
  })

  actualizarPaginacion(lista.length)
}

window.cambiarPagina = dir => {
  pagina += dir
  renderTabla()
}

/* ======================================================
   📈 TOTAL
====================================================== */

function actualizarTotal() {
  const total = getPagosFiltrados()
    .reduce((s, p) => s + Number(p.monto || 0), 0)

  document.getElementById('total-filtrado').innerText = formatearMoneda(total)
}

/* ======================================================
   ⚠️ ALERTAS
====================================================== */

function mostrarAlerta(msg, tipo = 'success') {
  const alerta = document.getElementById('alerta')
  alerta.className = `
    mb-6 p-4 rounded-lg border-l-4 text-sm font-bold shadow-sm flex items-center gap-2
    ${tipo === 'success'
      ? 'bg-green-100 border-green-500 text-green-700'
      : 'bg-red-100 border-red-500 text-red-700'}
  `
  alerta.textContent = msg
  alerta.classList.remove('hidden')

  setTimeout(() => alerta.classList.add('hidden'), 3000)
}
