/**
 * 📲 WHATSAPP EFUSA
 * Envío de mensajes automáticos
 */

/**
 * Enviar mensaje genérico por WhatsApp
 */
function enviarWhatsApp(telefono, mensaje) {
  if (!telefono) {
    alert('Número de teléfono no válido');
    return;
  }

  // 🇨🇴 Colombia → +57
  const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

/**
 * 💸 Mensaje de confirmación de pago
 */
function mensajePago(nombre, monto, tipo) {
  return `
Hola ${nombre} 👋
Hemos registrado tu ${tipo} en EFUSA ⚽

Monto: ${formatearMoneda(monto)}

¡Gracias por apoyar el proceso deportivo! 💚
`;
}

/**
 * ⏰ Mensaje de recordatorio de pago
 */
function mensajeRecordatorio(nombre, monto, meses) {
  return `
Hola ${nombre} 👋
Te recordamos que tienes ${meses} mes(es) pendiente(s) en EFUSA ⚠️

Valor mensual: ${formatearMoneda(monto)}

Por favor regulariza tu pago.
¡Gracias! ⚽
`;
}

/**
 * 🧾 Mensaje de inscripción
 */
function mensajeInscripcion(nombre, categoria) {
  return `
Bienvenido a EFUSA ⚽💚

Jugador: ${nombre}
Categoría: ${categoria}

Gracias por confiar en nuestra escuela.
`;
}
