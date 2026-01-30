const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error API:', text);
      throw new Error('Error en la API');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ apiFetch:', error);
    throw error;
  }
}

