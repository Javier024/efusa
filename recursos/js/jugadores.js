import { getJugadores } from './api.js';

document.addEventListener('DOMContentLoaded', cargarJugadores);

async function cargarJugadores() {
  try {
    const jugadores = await getJugadores();
    const tbody = document.querySelector('#tabla-jugadores');
    let html = '';

    jugadores.forEach(j => {
      // Actualizado para mostrar los nuevos campos
      html += `
        <tr class="border-b hover:bg-gray-50" data-id="${j.id}">
          <td class="p-2">
            <div class="font-bold text-sm">${j.nombre}</div>
            <div class="text-xs text-gray-500">${j.identificacion || 'Sin ID'}</div>
          </td>
          <td class="p-2 text-sm">${j.categoria}</td>
          <td class="p-2 text-sm">
            ${j.goles || 0} Goles <br>
            <span class="text-xs text-gray-500">${j.partidos_jugados || 0} Partidos</span>
          </td>
          <td class="p-2">
            <span class="px-2 py-1 rounded text-xs ${j.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
              ${j.activo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td class="p-2">
            <button onclick="prepararEdicion(${j.id})" class="text-blue-600 hover:underline mr-2">Editar</button>
            <button onclick="confirmarEliminacion(${j.id})" class="text-red-600 hover:underline">Eliminar</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  } catch (err) {
    console.error(err);
    alert('Error cargando jugadores');
  }
}