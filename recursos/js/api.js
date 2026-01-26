const API_URL = '/api';

export async function getJugadores() {
  const res = await fetch(`${API_URL}/jugadores`);
  if (!res.ok) throw new Error('Error cargando jugadores');
  return res.json();
}

export async function crearJugador(data) {
  const res = await fetch(`${API_URL}/jugadores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}
