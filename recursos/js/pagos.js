import { getPagos, crearPago } from './api.js';
import './configuracion.js';

document.addEventListener('DOMContentLoaded', () => {
  cargarPagos();
  cargarJugadores();
});

const formPago = document.getElementById('formPago');
const tablaPagos = document.getElementById('tabla-pagos');
const selectJugador = document.getElementById('jugador_id');

/* ============================
   📥 CARGAR PAGOS
============================ */
async function cargarPagos() {
  try {
    const pagos = await getPagos();
    let html = '';

    pagos.forEach(p => {
      const estado = evaluarEstadoPago(p);

      html += `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-2">${p.jugador_nombre}</td>
          <td class="p-2">${formatearFecha(p.fecha_pago)}</td>
          <td class="p-2 font-semibold">${formatearMoneda(p.monto)}</td>
          <td class="p-2">
            <span class="px-2 py-1 rounded text-xs ${estado.clase}">
              ${estado.texto}
            </span>
          </td>
        </tr>
      `;
    });

    tablaPagos.innerHTML = html || `
      <tr><td colspan="4" class="p-4 text-center text-gray-500">
        No hay pagos registrados
      </td></tr>
    `;
  } catch (err) {
    console.error(err);
    mostrarAlerta('Error cargando pagos', 'error');
  }
}

/* ============================
   👦 CARGAR JUGADORES
============================ */
async function cargarJugadores() {
  try {
    const res = await fetch('/api/jugadores');
    const jugadores = await res.json();

    selectJugador.innerHTML = `
      <option value="">Seleccione jugador</option>
      ${jugadores.map(j =>
        `<option value="${j.id}">${j.nombre} – ${j.categoria}</option>`
      ).join('')}
    `;
  } catch (err) {
    console.error(err);
    mostrarAlerta('Error cargando jugadores', 'error');
  }
}

/* ============================
   💾 REGISTRAR PAGO
============================ */
formPago.addEventListener('submit', async e => {
  e.preventDefault();

  const data = {
    jugador_id: selectJugador.value,
    monto: document.getElementById('monto').value,
    fecha_pago: document.getElementById('fecha').value
  };

  if (!data.jugador_id || data.monto <= 0) {
    return mostrarAlerta('Datos inválidos', 'error');
  }

  try {
    await crearPago(data);
    mostrarAlerta('Pago registrado correctamente');
    formPago.reset();
    cargarPagos();
  } catch (err) {
    console.error(err);
    mostrarAlerta('Error registrando pago', 'error');
  }
});

/* ============================
   🚨 LÓGICA DE ALERTAS
============================ */
function evaluarEstadoPago(pago) {
  const hoy = new Date();
  const fechaPago = new Date(pago.fecha_pago);
  const dias = (hoy - fechaPago) / (1000 * 60 * 60 * 24);

  if (dias <= 30) {
    return { texto: 'Al día', clase: 'bg-green-100 text-green-700' };
  }

  if (dias > 30 && dias <= 40) {
    return { texto: 'Próximo a pagar', clase: 'bg-yellow-100 text-yellow-700' };
  }

  return { texto: 'Atrasado', clase: 'bg-red-100 text-red-700' };
}

/* ============================
   🛠️ UTILIDADES
============================ */
function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(valor);
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-CO');
}

function mostrarAlerta(msg, tipo = 'success') {
  const alerta = document.getElementById('alerta');
  alerta.textContent = msg;
  alerta.className = `
    mb-4 p-3 rounded text-sm
    ${tipo === 'error'
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700'}
  `;
  alerta.classList.remove('hidden');

  setTimeout(() => alerta.classList.add('hidden'), 4000);
}
