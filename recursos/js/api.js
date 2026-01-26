const API_URL = '/api';

// --- JUGADORES ---

export async function getJugadores() {
  const res = await fetch(`${API_URL}/jugadores`);
  if (!res.ok) throw new Error('Error al obtener jugadores');
  return res.json();
}

export async function crearJugador(data) {
  const res = await fetch(`${API_URL}/jugadores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al crear jugador');
  return res.json();
}

export async function actualizarJugador(data) {
  const res = await fetch(`${API_URL}/jugadores`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar jugador');
  return res.json();
}

export async function eliminarJugador(id) {
  const res = await fetch(`${API_URL}/jugadores?id=${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar jugador');
  return res.json();
}

// --- PAGOS (Preparación para lo que viene) ---

export async function registrarPago(pagoData) {
  const res = await fetch(`${API_URL}/pagos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pagoData)
  });
  return res.json();
}