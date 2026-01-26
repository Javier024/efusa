document.addEventListener('DOMContentLoaded', cargarAlertas);

async function cargarAlertas() {
  try {
    const res = await fetch('/api/alertas');
    const alertas = await res.json();

    const tbody = document.querySelector('#tabla-alertas');
    tbody.innerHTML = '';

    if (alertas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center p-4 text-gray-500">
            No hay alertas pendientes 🎉
          </td>
        </tr>
      `;
      return;
    }

    let html = '';

    alertas.forEach(a => {
      html += `
        <tr class="border-b hover:bg-red-50">
          <td class="p-2">${a.nombre}</td>
          <td class="p-2">${a.categoria}</td>
          <td class="p-2">$${a.mensualidad}</td>
          <td class="p-2 text-red-600 font-semibold">
            ${a.meses_deuda} mes(es)
          </td>
          <td class="p-2">
            <button 
              onclick="enviarWhatsApp('${a.telefono}', '${a.nombre}', ${a.meses_deuda}, ${a.mensualidad})"
              class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
              WhatsApp
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

  } catch (error) {
    console.error(error);
    alert('Error cargando alertas');
  }
}

/**
 * 📲 Enviar recordatorio por WhatsApp
 */
function enviarWhatsApp(telefono, nombre, meses, monto) {
  const mensaje = `
Hola ${nombre} 👋
Te recordamos que tienes ${meses} mes(es) pendiente(s) en EFUSA.
Valor mensual: $${monto}

Por favor regulariza tu pago.
Gracias ⚽
  `;

  const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}
