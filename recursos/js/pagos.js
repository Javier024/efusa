import { getPagos, crearPago } from './api.js';
import './configuracion.js';

document.addEventListener('DOMContentLoaded', () => {
  cargarPagos();
  cargarJugadoresEnSelect();
});

const formPago = document.getElementById('formPago');
const tablaPagos = document.getElementById('tabla-pagos');
const selectJugador = document.getElementById('jugador_id');

/**
 * 📥 Cargar pagos registrados
 */
async function cargarPagos() {
  try {
    const pagos = await getPagos();
    let html = '';

    pagos.forEach(p => {
      html += `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-2">${p.jugador}</td>
          <td class="p-2">${formatearMoneda(p.monto)}</td>
          <td class="p-2">${p.tipo}</td>
          <td class="p-2">${p.fecha}</td>
        </tr>
      `;
    });

    tablaPagos.innerHTML = html;
  } catch (err) {
    console.error(err);
    alert('Error cargando pagos');
  }
}

/**
 * 👦 Cargar jugadores en el select
 */
async function cargarJugadoresEnSelect() {
  try {
    const res = await fetch('/api/jugadores');
    const jugadores = await res.json();

    let options = '<option value="">Seleccionar jugador</option>';

    jugadores.forEach(j => {
      options += `<option value="${j.id}">${j.nombre}</option>`;
    });

    selectJugador.innerHTML = options;
  } catch (err) {
    console.error(err);
    alert('Error cargando jugadores');
  }
}

/**
 * 💾 Guardar pago
 */
formPago.addEventListener('submit', async e => {
  e.preventDefault();

  const data = {
    jugador_id: selectJugador.value,
    monto: document.getElementById('monto').value,
    tipo: document.getElementById('tipo').value
  };

  try {
    await crearPago(data);
    formPago.reset();
    cargarPagos();
  } catch (err) {
    console.error(err);
    alert('Error guardando pago');
  }
});
