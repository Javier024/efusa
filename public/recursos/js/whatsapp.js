/**
 * 📲 WHATSAPP EFUSA
 * Envío de mensajes automáticos
 */

import { formatearMoneda } from './configuracion.js';

/**
 * Enviar mensaje genérico por WhatsApp
 */
export function enviarWhatsApp(telefono, mensaje) {
  if (!telefono) {
    alert('Número de teléfono no válido');
    return;
  }

  // 🇨🇴 Colombia → +57
  const telefonoLimpio = telefono.toString().replace(/\D/g, '');

  const url = `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

/**
 * 💸 Mensaje de confirmación de pago
 */
export function mensajePago(nombre, monto, tipo = 'pago') {
  return `
Hola ${nombre} 👋
Hemos registrado tu ${tipo} en EFUSA ⚽

Monto: ${formatearMoneda(monto)}

¡Gracias por apoyar el proceso deportivo! 💚
`.trim();
}

/**
 * ⏰ Mensaje de recordatorio de pago
 */
export function mensajeRecordatorio(nombre, monto, meses) {
  return `
Hola ${nombre} 👋
Te recordamos que tienes ${meses} mes(es) pendiente(s) en EFUSA ⚠️

Valor mensual: ${formatearMoneda(monto)}

Por favor regulariza tu pago.
¡Gracias! ⚽
`.trim();
}

/**
 * 🧾 Mensaje de inscripción
 */
export function mensajeInscripcion(nombre, categoria) {
  return `
Bienvenido a EFUSA ⚽💚

Jugador: ${nombre}
Categoría: ${categoria}

Gracias por confiar en nuestra escuela.
`.trim();
}
