// recursos/js/alertas.js
import { apiFetch } from './configuracion.js';

let deudores = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarAlertas();
});

async function cargarAlertas() {
  try {
    deudores = await apiFetch('/alertas');
    renderizarAlertas();
  } catch (error) {
    console.error('Error cargando alertas:', error);
    document.getElementById('lista-alertas').innerHTML = `
      <div class="p-4 text-center text-red-500">Error al cargar las alertas.</div>
    `;
  }
}

function renderizarAlertas() {
  const tbody = document.getElementById('tabla-alertas');
  tbody.innerHTML = '';

  if (deudores.length === 0) {
    document.getElementById('sin-alertas').classList.remove('hidden');
    document.getElementById('con-alertas').classList.add('hidden');
    return;
  }

  document.getElementById('sin-alertas').classList.add('hidden');
  document.getElementById('con-alertas').classList.remove('hidden');

  deudores.forEach(j => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-slate-100 last:border-0 transition";

    // Porcentaje de barra de progreso
    const progreso = Math.min((j.pagado / 50000) * 100, 100);

    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="font-medium text-slate-900">${j.nombre}</div>
        <div class="text-xs text-slate-500">${j.categoria || 'Sin categoría'}</div>
      </td>
      
      <td class="px-4 py-3 text-center">
        <div class="text-xs text-slate-400 mb-1">Pagado: $${j.pagado.toLocaleString()}</div>
        <div class="w-full bg-slate-200 rounded-full h-1.5">
          <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${progreso}%"></div>
        </div>
      </td>
      
      <td class="px-4 py-3 text-center">
        <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Debe: $${j.deuda.toLocaleString()}
        </div>
      </td>
      
      <td class="px-4 py-3 text-center text-sm text-slate-500">
        ${j.telefono || '-'}
      </td>

      <td class="px-4 py-3 text-right">
        <button onclick="enviarWhatsApp('${j.telefono}', '${j.nombre.replace(/'/g, "\\'")}', ${j.deuda})" class="flex items-center gap-1 justify-end text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold transition">
          <i class="ph ph-whatsapp-logo text-lg"></i> Recordar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Función para abrir WhatsApp Web con mensaje predefinido
window.enviarWhatsApp = function(telefono, nombre, deuda) {
  if (!telefono) {
    alert('Este jugador no tiene número de teléfono registrado.');
    return;
  }

  // Limpieza básica del número (quitar espacios, guiones)
  let numeroLimpio = telefono.replace(/[^0-9]/g, '');
  
  // Si falta el indicativo de país, asumimos Colombia (57) como ejemplo
  if (numeroLimpio.length === 10) {
    numeroLimpio = '57' + numeroLimpio;
  }

  const mensaje = `Hola ${nombre}, te recordamos que tienes un saldo pendiente de $${deuda.toLocaleString()} con la escuela de fútbol EFUSA. Quedamos atentos a tu pago. 🚀`;
  const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;

  // Abrir en nueva pestaña
  window.open(url, '_blank');
};
