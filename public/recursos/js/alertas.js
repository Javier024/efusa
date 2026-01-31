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
    const container = document.getElementById('con-alertas');
    if(container) container.innerHTML = `
      <div class="bg-white p-8 rounded-2xl text-center text-red-500 border border-red-200">
        <i class="ph ph-warning text-4xl mb-2"></i>
        <p>Error al cargar las alertas.</p>
      </div>
    `;
  }
}

function renderizarAlertas() {
  const tbody = document.getElementById('tabla-alertas');
  const containerMovil = document.getElementById('vista-movil-alertas');
  
  if (!tbody || !containerMovil) return;
  
  tbody.innerHTML = '';
  containerMovil.innerHTML = '';

  if (deudores.length === 0) {
    document.getElementById('sin-alertas').classList.remove('hidden');
    document.getElementById('con-alertas').classList.add('hidden');
    return;
  }

  document.getElementById('sin-alertas').classList.add('hidden');
  document.getElementById('con-alertas').classList.remove('hidden');

  deudores.forEach(j => {
    // Cálculos
    const progreso = Math.min((j.pagado / 50000) * 100, 100);
    
    // Formatear Mes Abonado
    let mesInfo = '';
    if (j.mes_abono) {
      mesInfo = `<span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold border border-blue-100">${j.mes_abono}</span>`;
    } else {
      mesInfo = `<span class="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-semibold">Sin historial</span>`;
    }

    // --- RENDERIZAR ESCRITORIO (FILA TABLA) ---
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-slate-100 last:border-0 transition duration-150";
    
    tr.innerHTML = `
      <td class="px-6 py-4">
        <div class="font-bold text-slate-900 text-base">${j.nombre}</div>
        <div class="text-xs text-slate-500">${j.categoria || 'Sin categoría'}</div>
      </td>
      
      <td class="px-6 py-4 text-center">
        ${mesInfo}
      </td>
      
      <td class="px-6 py-4 text-center">
        <div class="flex flex-col items-center gap-1">
          <div class="w-full bg-slate-100 rounded-full h-2 max-w-[120px] mx-auto overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500" style="width: ${progreso}%"></div>
          </div>
          <div class="text-[10px] text-slate-400 font-medium">
            Pagado: $${j.pagado.toLocaleString()}
          </div>
        </div>
      </td>
      
      <td class="px-6 py-4 text-center">
        <div class="inline-flex flex-col items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
          <span>Debe: $${j.deuda.toLocaleString()}</span>
        </div>
      </td>
      
      <td class="px-6 py-4 text-right">
        <button onclick="enviarWhatsApp('${j.telefono}', '${j.nombre.replace(/'/g, "\\'")}', ${j.deuda}, '${j.mes_abono || ''}')" class="group flex items-center gap-2 justify-end bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-bold transition border border-green-200">
          <i class="ph ph-whatsapp-logo text-lg group-hover:scale-110 transition-transform"></i> 
          Cobrar
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    // --- RENDERIZAR MÓVIL (TARJETA) ---
    const card = document.createElement('div');
    card.className = "bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden group hover:shadow-md transition-all";
    
    // Barra de progreso decorativa arriba
    card.innerHTML = `
      <div class="absolute top-0 left-0 h-1 bg-rose-500" style="width: 100%"></div>
      
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-bold text-slate-900 text-lg">${j.nombre}</h3>
          <p class="text-xs text-slate-500">${j.categoria}</p>
        </div>
        <div class="text-right">
           <div class="text-rose-600 font-bold text-lg">$${j.deuda.toLocaleString()}</div>
           <div class="text-[10px] text-rose-400 uppercase font-semibold tracking-wider">Deuda Total</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <div class="text-[10px] text-slate-400 font-bold uppercase mb-1">Último Pago</div>
          <div class="text-sm font-bold text-slate-700">${j.mes_abono || '-'}</div>
        </div>
        <div class="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <div class="text-[10px] text-slate-400 font-bold uppercase mb-1">Progreso</div>
          <div class="flex items-center gap-2">
             <div class="flex-grow bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${progreso}%"></div>
             </div>
             <span class="text-xs font-bold text-slate-600">${Math.round(progreso)}%</span>
          </div>
        </div>
      </div>

      <button onclick="enviarWhatsApp('${j.telefono}', '${j.nombre.replace(/'/g, "\\'")}', ${j.deuda}, '${j.mes_abono || ''}')" class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition shadow-lg shadow-green-500/30">
        <i class="ph ph-whatsapp-logo text-xl"></i>
        Enviar Recordatorio
      </button>
    `;
    containerMovil.appendChild(card);
  });
}

// Función mejorada para WhatsApp
window.enviarWhatsApp = function(telefono, nombre, deuda, mesAbono) {
  if (!telefono) {
    alert('Este jugador no tiene número de teléfono registrado.');
    return;
  }

  // Limpieza básica del número
  let numeroLimpio = telefono.replace(/[^0-9]/g, '');
  
  // Asignar indicativo Colombia si falta
  if (numeroLimpio.length === 10) {
    numeroLimpio = '57' + numeroLimpio;
  }

  let mensaje = `Hola ${nombre}, te recordamos tu pago pendiente con EFUSA.%0A`;
  mensaje += `💰 *Saldo Adeudado:* $${deuda.toLocaleString()}%0A`;
  
  if (mesAbono) {
    mensaje += `📅 *Tu último pago:* Fue para el mes de ${mesAbono}.%0A`;
  } else {
    mensaje += `📅 *Estado:* Sin pagos recientes registrados.%0A`;
  }
  
  mensaje += `Te agradecemos ponernos al día a la brevedad posible. 🚀`;

  const url = `https://wa.me/${numeroLimpio}?text=${mensaje}`;
  window.open(url, '_blank');
};