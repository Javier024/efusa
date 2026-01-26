import { getJugadores } from './api.js';

document.addEventListener('DOMContentLoaded', cargarJugadores);

async function cargarJugadores() {
  try {
    const jugadores = await getJugadores();
    const tbody = document.querySelector('#tabla-jugadores');

    tbody.innerHTML = '';

    jugadores.forEach(j => {
      tbody.innerHTML += `
        <tr class="border-b">
          <td>${j.nombre}</td>
          <td>${j.categoria}</td>
          <td>${j.telefono}</td>
          <td>${j.activo ? 'Sí' : 'No'}</td>
        </tr>
      `;
    });
  } catch (err) {
    alert('Error cargando jugadores');
  }
}
