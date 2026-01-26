import './configuracion.js';

/**
 * 🔗 BASE API
 * En producción (Vercel) se queda vacío
 */
const API_URL = '/api';

/* ======================================================
   👦 JUGADORES
====================================================== */

export async function getJugadores() {
  return apiFetch(`${API_URL}/jugadores`);
}

export async function crearJugador(data) {
  return apiFetch(`${API_URL}/jugadores`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function actualizarJugador(data) {
  return apiFetch(`${API_URL}/jugadores`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function eliminarJugador(id) {
  return apiFetch(`${API_URL}/jugadores?id=${id}`, {
    method: 'DELETE'
  });
}

/* ======================================================
   💸 PAGOS
====================================================== */

export async function getPagos() {
  return apiFetch(`${API_URL}/pagos`);
}

export async function crearPago(data) {
  return apiFetch(`${API_URL}/pagos`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/* ======================================================
   🔔 ALERTAS
====================================================== */

export async function getAlertas() {
  return apiFetch(`${API_URL}/alertas`);
}
