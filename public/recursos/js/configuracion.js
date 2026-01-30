// public/recursos/js/configuracion.js
const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    });

    // Intentar obtener el JSON incluso si hay error (porque nuestro backend envía JSON en errores 500)
    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      responseData = await response.json();
    } else {
      // Si no es JSON (ej. error HTML de Vercel crudo)
      responseData = await response.text();
    }

    if (!response.ok) {
      console.error('❌ Error API (Status', response.status, '):', responseData);
      // Lanzar un error con el mensaje del servidor si existe
      const msg = (responseData && responseData.detalle) || responseData.error || 'Error en la API';
      throw new Error(msg);
    }

    return responseData;
  } catch (error) {
    console.error('❌ apiFetch (Network/Parsing):', error);
    throw error;
  }
}

