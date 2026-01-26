const API = '/api';

export async function getJugadores() {
  return fetch(`${API}/jugadores`).then(r => r.json());
}

export async function getPagos() {
  return fetch(`${API}/pagos`).then(r => r.json());
}

export async function crearPago(data) {
  return fetch(`${API}/pagos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export async function getAlertas() {
  return fetch(`${API}/alertas`).then(r => r.json());
}
