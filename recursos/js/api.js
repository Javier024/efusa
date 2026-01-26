const API_URL = '/api';

// 🔥 Función central para todas las peticiones
async function apiFetch(url, options = {}) {
  const res = await fetch(API_URL + url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Error en la petición');
  }

  return res.json();
}

// =======================
// JUGADORES
// =======================
export const getJugadores = () => apiFetch('/jugadores');

export const crearJugador = (data) =>
  apiFetch('/jugadores', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const actualizarJugador = (data) =>
  apiFetch('/jugadores', {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const eliminarJugador = (id) =>
  apiFetch(`/jugadores?id=${id}`, { method: 'DELETE' });

// =======================
// PAGOS
// =======================
export const getPagos = (jugador_id = '') =>
  apiFetch(jugador_id ? `/pagos?jugador_id=${jugador_id}` : '/pagos');

export const registrarPago = (data) =>
  apiFetch('/pagos', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const eliminarPago = (id) =>
  apiFetch(`/pagos?id=${id}`, { method: 'DELETE' });
