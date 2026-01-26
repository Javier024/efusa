import { getPagos, crearPago, getJugadores } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarJugadores();
  await cargarPagos();
});

const form = document.getElementById('formPago');
const tabla = document.getElementById('tabla-pagos');
const select = document.getElementById('jugador_id');

// ================== JUGADORES ==================
async function cargarJugadores() {
  const jugadores = await getJugadores();
  select.innerHTML =
    '<option value="">Seleccione jugador</option>' +
    jugadores.map(j =>
      `<option value="${j.id}">${j.nombre}</option>`
    ).join('');
}

// ================== PAGOS ==================
async function cargarPagos() {
  const pagos = await getPagos();
  tabla.innerHTML = pagos.map(p => `
    <tr>
      <td>${p.jugador}</td>
      <td>$${p.monto}</td>
      <td>${p.fecha_pago}</td>
    </tr>
  `).join('');
}

// ================== REGISTRAR ==================
form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!select.value) return alert('Selecciona un jugador');

  await crearPago({
    jugador_id: Number(select.value),
    monto: Number(monto.value),
    fecha_pago: fecha.value
  });

  form.reset();
  cargarPagos();
});
