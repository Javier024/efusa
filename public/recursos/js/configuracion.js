// recursos/js/configuracion.js
const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // 1. Configuración de Headers (Decimos que el contenido será JSON)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 2. LÓGICA CORREGIDA PARA EL BODY
  // Si el body es un objeto Javascript, lo convertimos a texto JSON manualmente.
  let body = options.body;
  
  // Solo hacemos stringify si es un objeto normal y no es un archivo (FormData)
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...options, // Esparcimos las opciones (method, etc)
      headers: headers, // Usamos nuestros headers configurados
      body: body, // Usamos el body convertido a JSON
    });

    // Intentar leer la respuesta (sea éxito o error)
    let responseData;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.indexOf("application/json") !== -1) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      console.error('❌ Error API (Status', response.status, '):', responseData);
      
      // Extraemos el mensaje de error del backend para mostrarlo al usuario
      const msg = (responseData && responseData.detalle) || responseData.error || 'Error desconocido en el servidor';
      throw new Error(msg);
    }

    return responseData;
  } catch (error) {
    console.error('❌ Error en apiFetch (Red):', error);
    throw error;
  }
}

