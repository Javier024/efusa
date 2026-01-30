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
    renderJugadores(jugadores);
  } catch (error) {
    console.error('Error cargando jugadores:', error);
  }
}

async function guardarJugador(e) {
  e.preventDefault();

  const data = {
    nombre: document.getElementById('nombre').value,
    categoria: document.getElementById('categoria').value,
    telefono: document.getElementById('telefono').value,
    mensualidad: Number(document.getElementById('mensualidad').value),
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null
  };

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
    alert('❌ Error guardando jugador');
  }
}

function renderJugadores(jugadores) {
  const tbody = document.getElementById('tabla-jugadores');
  tbody.innerHTML = '';

  jugadores.forEach(j => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${j.nombre}</td>
      <td>${j.categoria}</td>
      <td>${j.telefono || ''}</td>
      <td>$${j.mensualidad}</td>
      <td>${j.fecha_nacimiento ? j.fecha_nacimiento.split('T')[0] : ''}</td>
      <td>${j.activo ? 'Activo' : 'Inactivo'}</td>
    `;
    tbody.appendChild(tr);
  });
}

