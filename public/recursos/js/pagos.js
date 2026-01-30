import { apiFetch } from './configuracion.js';

document.addEventListener('DOMContentLoaded', cargarPagos);

async function cargarPagos() {
  try {
    const pagos = await apiFetch('/pagos');
    renderPagos(pagos);
  } catch (error) {
    console.error('Error cargando pagos:', error);
  }
}

function renderPagos(pagos) {
  const tbody = document.getElementById('tabla-pagos');
  tbody.innerHTML = '';

  pagos.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-2">${p.jugador}</td>
      <td class="px-4 py-2">${p.fecha.split('T')[0]}</td>
      <td class="px-4 py-2">${p.tipo}</td>
      <td class="px-4 py-2">${p.observacion || ''}</td>
      <td class="px-4 py-2 font-bold">$${p.monto}</td>
    `;
    tbody.appendChild(tr);
  });
}
