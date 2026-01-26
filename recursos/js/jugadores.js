import { getJugadores } from './api.js';

document.addEventListener('DOMContentLoaded', cargarJugadores);

async function cargarJugadores() {
  try {
    const jugadores = await getJugadores();
    const tbody = document.querySelector('#tabla-jugadores');

    // 1. Usamos un solo string para evitar múltiples redibujados
    let html = '';

    jugadores.forEach(j => {
      // 2. Agregamos clases de Tailwind para que se vea bien y botones de acción
      html += `
        <tr class="border-b hover:bg-gray-50" data-id="${j.id}">
          <td class="p-2">${j.nombre}</td>
          <td class="p-2">${j.categoria}</td>
          <td class="p-2">${j.telefono}</td>
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