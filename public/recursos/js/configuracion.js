// recursos/js/configuracion.js
const API_BASE = 'https://script.google.com/macros/s/AKfycbyUEPm1ajeT_josdA-krwJIpDBLg9ZO_bQ1M9GgQhh2NcYK9XKUGkaR8d05599VhXviAg/exec';

export const MENSUALIDAD_OBJETIVO = 50000;

export async function apiFetch(endpoint, options = {}) {
  // 1. Limpiar ruta
  const cleanPath = endpoint.replace(/^\//, '');
  
  // 2. Construir URL con parametro 'path'
  let finalUrl = `${API_BASE}?path=${cleanPath}`;

  // 3. Manejo de métodos (Tunneling para PUT/DELETE)
  let requestMethod = 'GET';
  if (options.method === 'POST') {
    requestMethod = 'POST';
  } else if (options.method === 'PUT' || options.method === 'DELETE') {
    requestMethod = 'POST';
    finalUrl += `&method=${options.method}`;
  }

  const headers = {
    'Content-Type': 'text/plain',
    ...options.headers
  };

  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(finalUrl, {
      method: requestMethod,
      headers: headers,
      body: (requestMethod === 'POST') ? body : undefined
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      if (e instanceof SyntaxError) return text;
      throw e;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}
