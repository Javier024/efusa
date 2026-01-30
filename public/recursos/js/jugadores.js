import { apiFetch } from './configuracion.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const jugadores = await apiFetch('/jugadores');
    renderJugadores(jugadores);
  } catch (error) {
    console.error('Error cargando jugadores:', error);
    alert('Error cargando jugadores');
  }
}

function renderJugadores(jugadores) {
  const tbody = document.getElementById('tabla-jugadores');
  tbody.innerHTML = '';

  jugadores.forEach(j => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="px-4 py-2">${j.nombre}</td>
      <td class="px-4 py-2">${j.categoria}</td>
      <td class="px-4 py-2">${j.telefono || ''}</td>
      <td class="px-4 py-2">$${j.mensualidad}</td>
      <td class="px-4 py-2">
        ${j.fecha_nacimiento ? j.fecha_nacimiento.split('T')[0] : ''}
      </td>
      <td class="px-4 py-2">
        ${j.activo ? 'Activo' : 'Inactivo'}
      </td>
    `;

    tbody.appendChild(tr);
  });
}

