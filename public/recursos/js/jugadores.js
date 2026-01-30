// public/recursos/js/jugadores.js
import { apiFetch } from './configuracion.js';

document.addEventListener('DOMContentLoaded', () => {
  cargarJugadores();

  const form = document.getElementById('formJugador');
  if (form) {
    form.addEventListener('submit', guardarJugador);
  }
});

async function cargarJugadores() {
  try {
    const jugadores = await apiFetch('/jugadores');
    
    if (Array.isArray(jugadores)) {
      renderJugadores(jugadores);
    } else {
      console.warn('La API no devolvió un array:', jugadores);
      renderJugadores([]); 
    }
  } catch (error) {
    console.error('Error cargando jugadores:', error.message);
    const tbody = document.getElementById('tabla-jugadores');
    if(tbody) {
        // colspan="5" porque ahora tenemos 5 columnas
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 py-4">Error al cargar: ${error.message}</td></tr>`;
    }
  }
}

async function guardarJugador(e) {
  e.preventDefault();

  // Obtenemos los datos (sin fecha_nacimiento)
  const data = {
    nombre: document.getElementById('nombre').value,
    categoria: document.getElementById('categoria').value,
    telefono: document.getElementById('telefono').value,
    mensualidad: Number(document.getElementById('mensualidad').value)
  };

  if(!data.nombre || !data.categoria) {
      alert('Por favor completa nombre y categoría');
      return;
  }

  try {
    await apiFetch('/jugadores', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    e.target.reset();
    cargarJugadores();
    alert('✅ Jugador agregado correctamente');
  } catch (error) {
    console.error('Error guardando jugador:', error);
    alert('❌ Error guardando jugador: ' + error.message);
  }
}

function renderJugadores(jugadores) {
  const tbody = document.getElementById('tabla-jugadores');
  tbody.innerHTML = '';

  if (!jugadores || jugadores.length === 0) {
    // colspan="5"
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">No hay jugadores registrados.</td></tr>`;
    return;
  }

  jugadores.forEach(j => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4">${j.nombre}</td>
      <td class="px-6 py-4"><span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">${j.categoria}</span></td>
      <td class="px-6 py-4">${j.telefono || '-'}</td>
      <td class="px-6 py-4">$${parseFloat(j.mensualidad).toFixed(2)}</td>
      <td class="px-6 py-4">
        <span class="${j.activo ? 'text-green-600' : 'text-red-600'} font-medium">
          ${j.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}