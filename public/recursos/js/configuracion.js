/**
 * ⚙️ CONFIGURACIÓN GENERAL – EFUSA
 * Archivo global de configuración y utilidades
 */

/* ======================================================
   🌍 ENTORNO
====================================================== */

// En Vercel se deja vacío
export const API_BASE_URL = '';

/* ======================================================
   🏫 CATEGORÍAS EFUSA
====================================================== */

export const CATEGORIAS = [
  'Sub 8',
  'Sub 12',
  'Sub 14',
  'Sub 16'
];

/* ======================================================
   📅 CONFIGURACIÓN DE PAGOS
====================================================== */

export const CONFIG_PAGOS = {
  diaLimitePago: 5, // Día máximo para pagar mensualidad
  moneda: 'COP'
};

/* ======================================================
   💰 FORMATO MONEDA
====================================================== */

export function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: CONFIG_PAGOS.moneda,
    minimumFractionDigits: 0
  }).format(valor);
}

/* ======================================================
   📆 FECHAS
====================================================== */

export function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

/* ======================================================
   📡 FETCH GLOBAL CON ERRORES
====================================================== */

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!res.ok) {
    let mensaje = 'Error en la API';
    try {
      const error = await res.json();
      mensaje = error.error || error.mensaje || mensaje;
    } catch (_) {}
    throw new Error(mensaje);
  }

  return res.json();
}
