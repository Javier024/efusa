// recursos/js/configuracion.js

// PEGA AQUÍ TU NUEVA URL DE GOOGLE
// recursos/js/configuracion.js

const API_BASE = 'https://script.google.com/macros/s/AKfycbyUEPm1ajeT_josdA-krwJIpDBLg9ZO_bQ1M9GgQhh2NcYK9XKUGkaR8d05599VhXviAg/exec';


// Constante global que usa dashboard.js
export const MENSUALIDAD_OBJETIVO = 50000;

export async function apiFetch(endpoint, options = {}) {
  // 1. Construir la URL con los parámetros necesarios para Google
  const url = new URL(API_BASE);
  
  // Le decimos a Google qué "ruta" queremos usando el parámetro ?path=...
  // Ejemplo: /jugadores se convierte en ?path=jugadores
  const cleanEndpoint = endpoint.replace(/^\//, ''); 
  url.searchParams.append('path', cleanEndpoint);

  // 2. Manejo de Métodos (Tunneling)
  // Google Apps Script solo acepta GET o POST directamente.
  // Si quieres usar PUT o DELETE, lo enviamos vía POST pero le avisamos con ?method=PUT
  let method = options.method || 'GET';
  
  if (method === 'PUT' || method === 'DELETE') {
    url.searchParams.append('method', method);
    method = 'POST'; // Forzamos POST para la petición real HTTP
  }

  // 3. Configuración de Headers
  // Usamos 'text/plain' en lugar de 'application/json' para evitar errores de CORS complejos (pre-flight)
  const headers = {
    'Content-Type': 'text/plain',
    ...options.headers
  };

  // 4. Preparar el Cuerpo (Body)
  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  try {
    // 5. Ejecutar la petición
    const response = await fetch(url.toString(), {
      method: method,
      headers: headers,
      body: method === 'POST' ? body : undefined
    });

    // 6. Leer la respuesta (Google devuelve texto, no JSON directo a veces)
    const text = await response.text();
    
    // Intentar convertir a JSON
    try {
      const data = JSON.parse(text);
      
      // Si Google devuelve un error interno, lo lanzamos
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (e) {
      // Si no es JSON (raro pero posible), devolvemos el texto crudo o el error
      if (e instanceof SyntaxError) {
         console.warn("La respuesta no era JSON:", text);
         return text;
      }
      throw e;
    }

  } catch (error) {
    console.error('❌ Error de conexión con Google:', error);
    throw error;
  }
}

