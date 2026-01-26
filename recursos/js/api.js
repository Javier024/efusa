// Archivo: recursos/js/api.js

export async function getJugadores() {
  const res = await fetch('/api/jugadores');
  return res.json();
}

export async function getPagos() {
  const res = await fetch('/api/pagos');
  return res.json();
}

export async function crearPago(data) {
  const res = await fetch('/api/pagos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}