import { apiFetch } from './configuracion.js';

// VARIABLES GLOBALES
let todosLosPagos = [];
let jugadoresList = [];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

document.addEventListener('DOMContentLoaded', () => {
  Promise.all([cargarPagos(), cargarJugadoresSelect()])
    .then(() => {
      filtrarPagos();
      renderizarResumen('todos');
      initMultipleMonthsLogic(); // INICIALIZAR NUEVA LÓGICA
    });

  // Listeners existentes
  const buscador = document.getElementById('buscador');
  const fechaInicio = document.getElementById('filtro-inicio');
  const fechaFin = document.getElementById('filtro-fin');

  if (buscador) buscador.addEventListener('input', filtrarPagos);
  if (fechaInicio) fechaInicio.addEventListener('change', filtrarPagos);
  if (fechaFin) fechaFin.addEventListener('change', filtrarPagos);

  const form = document.getElementById('formPago');
  if (form) form.addEventListener('submit', guardarPago);
});

// ==========================
// NUEVA LÓGICA: PAGO MÚLTIPLE
// ==========================

function initMultipleMonthsLogic() {
  const radios = document.getElementsByName('pago_multiple');
  const wrapper = document.getElementById('pago-multiple-wrapper');
  const mesInicioSelect = document.getElementById('mes_inicio_select');
  const cantidadInput = document.getElementById('cantidad_meses');
  const periodoInicioInput = document.getElementById('periodo_inicio');

  // 1. Llenar el select de meses iniciales
  mesInicioSelect.innerHTML = MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('');

  // Poner por defecto el mes actual
  const mesActualIndex = new Date().getMonth();
  mesInicioSelect.value = mesActualIndex;

  // 2. Manejar visibilidad del wrapper
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'si') {
        wrapper.classList.remove('hidden');
        calcularPeriodo(); // Calcular inicialmente
      } else {
        wrapper.classList.add('hidden');
        // Resetear campos ocultos si se cancela
        document.getElementById('periodo_fin').value = '';
        document.getElementById('mes_final_text').value = '';
        document.getElementById('resumen-meses-texto').innerText = '';
      }
    });
  });

  // 3. Listeners para recalcular
  const inputsToWatch = [cantidadInput, mesInicioSelect, periodoInicioInput];
  inputsToWatch.forEach(input => {
    input.addEventListener('change', calcularPeriodo);
    input.addEventListener('input', calcularPeriodo);
  });

  // Si no hay fecha de inicio, poner hoy por defecto
  if(!periodoInicioInput.value) {
    periodoInicioInput.valueAsDate = new Date();
  }
}

function calcularPeriodo() {
  const cantidad = parseInt(document.getElementById('cantidad_meses').value) || 1;
  const mesInicioIdx = parseInt(document.getElementById('mes_inicio_select').value);
  const fechaInicioVal = document.getElementById('periodo_inicio').value;

  if (!fechaInicioVal) return;

  const fechaInicio = new Date(fechaInicioVal + 'T00:00:00'); // Forzar zona horaria local aprox
  const fechaFin = new Date(fechaInicio);
  
  // Sumar meses a la fecha
  fechaFin.setMonth(fechaFin.getMonth() + cantidad);
  
  // Formatear fecha fin para el input (YYYY-MM-DD)
  const yearFin = fechaFin.getFullYear();
  const monthFin = String(fechaFin.getMonth() + 1).padStart(2, '0');
  const dayFin = String(fechaFin.getDate()).padStart(2, '0');
  const fechaFinStr = `${yearFin}-${monthFin}-${dayFin}`;

  document.getElementById('periodo_fin').value = fechaFinStr;

  // Calcular nombre del mes final
  const mesFinIdx = (mesInicioIdx + cantidad - 1) % 12; 
  // Nota: Simple cálculo de nombre, no asume salto de año para el nombre, solo para la fecha
  document.getElementById('mes_final_text').value = MESES[mesFinIdx];

  // Generar lista de meses (Ej: Enero, Febrero, Marzo)
  let listaMeses = [];
  for (let i = 0; i < cantidad; i++) {
    let idx = (mesInicioIdx + i) % 12;
    listaMeses.push(MESES[idx]);
  }
  
  // Si pasa un año, podríamos añadir el año, pero por simplicidad mantenemos los nombres
  document.getElementById('resumen-meses-texto').innerText = listaMeses.join(', ');
  
  // Actualizar campo oculto 'mes_pago' con el primer mes para compatibilidad
  document.getElementById('mes_pago').value = MESES[mesInicioIdx];
}

// ==========================
// CARGA DE DATOS (Sin cambios mayores)
// ==========================

async function cargarPagos() {
  try {
    const data = await apiFetch('/pagos');
    todosLosPagos = data;
  } catch (error) {
    console.error('Error cargando pagos:', error);
    mostrarNotificacion('Error cargando pagos', 'error');
  }
}

async function cargarJugadoresSelect() {
  try {
    const data = await apiFetch('/jugadores');
    jugadoresList = data;
    
    const selectJugador = document.getElementById('jugador_id');
    if (selectJugador) {
      selectJugador.innerHTML = '<option value="">Seleccione jugador...</option>';
      data.forEach(j => {
        selectJugador.innerHTML += `<option value="${j.id}">${j.nombre} (${j.categoria})</option>`;
      });
    }
  } catch (error) {
    console.error('Error cargando jugadores:', error);
  }
}

// ==========================
// UTILIDADES DE FECHA
// ==========================

function obtenerSaludo() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

// Formatea fecha YYYY-MM-DD a DD/MM/YYYY
function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

// Calcula el siguiente mes a partir de una fecha "YYYY-MM-DD"
function obtenerProximoPagoStr(fechaFinStr) {
  if (!fechaFinStr) return '';
  const fecha = new Date(fechaFinStr + 'T12:00:00'); // Mediodía para evitar problemas de zona horaria
  fecha.setMonth(fecha.getMonth() + 1); // Sumar 1 mes a la fecha fin
  
  const mesNombre = MESES[fecha.getMonth()];
  const year = fecha.getFullYear();
  const day = String(fecha.getDate()).padStart(2, '0');
  
  return `El ${day} de ${mesNombre} de ${year}`;
}

// ==========================
// WHATSAPP MEJORADO
// ==========================
function enviarWhatsapp(idPago) {
  const pago = todosLosPagos.find(p => p.id === idPago);

  if (!pago) {
    alert('Error: No se encontró el pago.');
    return;
  }

  if (!pago.jugador_telefono) {
    alert('El jugador no tiene teléfono registrado en la base de datos.');
    return;
  }

  const nombre = pago.jugador;
  const saludo = obtenerSaludo(); 
  const monto = Number(pago.monto).toLocaleString();
  const concepto = pago.tipo.toUpperCase();
  const fecha = pago.fecha.split('T')[0];
  const obs = pago.observacion ? `Obs: ${pago.observacion}` : '';
  
  let mensaje = '';

  // Detectar si es pago múltiple por la existencia de periodo_fin
  const esPagoMultiple = pago.cantidad_meses > 1 && pago.periodo_fin;

  if (esPagoMultiple) {
    // --- CASO: PAGO ADELANTADO (Varios meses) ---
    const inicio = formatearFecha(pago.periodo_inicio);
    const fin = formatearFecha(pago.periodo_fin);
    const proximoPago = obtenerProximoPagoStr(pago.periodo_fin);
    const mesesPagados = pago.cantidad_meses;

    mensaje = `${saludo} ${nombre}, ¡Muchas gracias por pagar ${mesesPagados} meses por adelantado! 🚀✨%0A`;
    mensaje += `Tu apoyo es fundamental para el club. Aquí están los detalles de tu pago:%0A%0A`;
    mensaje += `💰 *Monto Pagado:* $${monto}%0A`;
    mensaje += `📅 *Fecha de Pago:* ${fecha}%0A`;
    mensaje += `🏷️ *Concepto:* ${concepto}%0A`;
    mensaje += `📆 *Periodo Cubierto:* Desde el ${inicio} hasta el ${fin}.%0A`;
    mensaje += `📢 *Tu próximo pago vence el:* ${proximoPago}.%0A`; // Cálculo exacto
    if (obs) mensaje += `📝 ${obs}%0A`;
    mensaje += `%0A¡Gracias por tu compromiso! ⚽`;

  } else {
    // --- CASO: PAGO NORMAL (1 mes o único) ---
    // Intentamos calcular el próximo mes basado en mes_pago si existe, o fecha
    let infoProximo = '';
    if (pago.mes_pago) {
      // Si solo tenemos el nombre del mes (viejo estilo)
      const index = MESES.indexOf(pago.mes_pago);
      const nextIndex = (index + 1) % 12;
      infoProximo = `Tu próximo pago corresponde a ${MESES[nextIndex]}.`;
    } else if (pago.periodo_inicio) {
      // Si tenemos fecha de inicio, asumimos un mes
      const fechaFin = new Date(pago.periodo_inicio + 'T12:00:00');
      fechaFin.setMonth(fechaFin.getMonth() + 1);
      infoProximo = `Tu próximo pago será el ${String(fechaFin.getDate()).padStart(2,'0')} de ${MESES[fechaFin.getMonth()]}.`;
    }

    mensaje = `${saludo} ${nombre}, confirmamos tu pago en EFUSA.%0A`;
    mensaje += `💰 *Valor:* $${monto}%0A`;
    mensaje += `📅 *Fecha:* ${fecha}%0A`;
    mensaje += `🏷️ *Concepto:* ${concepto}%0A`;
    if (pago.mes_pago) mensaje += `📆 *Mes:* ${pago.mes_pago}.%0A`;
    if (infoProximo) mensaje += `📢 ${infoProximo}%0A`;
    if (obs) mensaje += `📝 ${obs}`;
  }

  window.open(`https://wa.me/57${pago.jugador_telefono}?text=${mensaje}`, '_blank');
}

// ==========================
// RENDERIZAR RESUMEN (Sin cambios lógicos, solo visual)
// ==========================
function renderizarResumen(tipo) {
  const tbody = document.getElementById('tabla-resumen');
  const containerMovil = document.getElementById('vista-movil-resumen');
  
  if (!tbody || !containerMovil) return;
  
  tbody.innerHTML = '';
  containerMovil.innerHTML = '';

  let listaFiltrada = jugadoresList;
  
  if (tipo === 'deudores') {
    listaFiltrada = jugadoresList.filter(j => j.mensualidad < 50000);
  } else if (tipo === 'pagados') {
    listaFiltrada = jugadoresList.filter(j => j.mensualidad >= 50000);
  }

  listaFiltrada.sort((a, b) => b.mensualidad - a.mensualidad);

  if (listaFiltrada.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">No hay registros.</td></tr>`;
    containerMovil.innerHTML = `<div class="text-center py-6 text-gray-400">No hay registros.</div>`;
    return;
  }

  listaFiltrada.forEach(j => {
    const pagado = j.mensualidad;
    const debe = 50000 - pagado;
    
    let estadoBadge = '';
    let deudaTexto = '';
    
    if (debe <= 0) {
      estadoBadge = `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Al día</span>`;
      deudaTexto = `<span class="text-xs text-gray-400">No debe nada</span>`;
    } else if (pagado > 0) {
      estadoBadge = `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">Debe $${debe.toLocaleString()}</span>`;
      deudaTexto = `<span class="text-xs text-gray-500">Pagó: $${pagado.toLocaleString()}</span>`;
    } else {
      estadoBadge = `<span class="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">Debe $50,000</span>`;
      deudaTexto = `<span class="text-xs text-gray-500">Sin pagos</span>`;
    }

    // HTML Desktop
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-slate-100 last:border-0";
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="font-medium text-slate-900">${j.nombre}</div>
        <div class="text-xs text-slate-500">${j.categoria}</div>
      </td>
      <td class="px-4 py-3 text-center">${estadoBadge}</td>
      <td class="px-4 py-3 text-center text-xs text-slate-600">${deudaTexto}</td>
      <td class="px-4 py-3 text-center text-sm font-bold text-slate-900">$${pagado.toLocaleString()}</td>
      <td class="px-4 py-3 text-right">
        <button onclick="irAPagar(${j.id})" class="text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3 py-1.5 rounded-md transition flex items-center gap-1 ml-auto">
          <i class="ph ph-plus-circle"></i> Pagar
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    // HTML Mobile (Tarjeta)
    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm";
    card.innerHTML = `
       <div class="flex justify-between items-start mb-3">
          <div>
             <h3 class="font-bold text-slate-900 text-base">${j.nombre}</h3>
             <p class="text-xs text-slate-500">${j.categoria}</p>
          </div>
          ${estadoBadge}
       </div>
       <div class="flex justify-between items-end mb-4">
          <div>
            <p class="text-[10px] text-slate-400 uppercase font-bold">Acumulado</p>
            <p class="font-bold text-slate-900">$${pagado.toLocaleString()}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-600">${deudaTexto}</p>
          </div>
       </div>
       <button onclick="irAPagar(${j.id})" class="w-full py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition">
          Registrar Pago
       </button>
    `;
    containerMovil.appendChild(card);
  });
}

function irAPagar(id) {
  const select = document.getElementById('jugador_id');
  const formContainer = document.getElementById('formPago').closest('section');
  
  if (select) {
    select.value = id;
    formContainer.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('monto').focus(), 500);
  }
}

// ==========================
// HISTORIAL Y FILTROS
// ==========================

function filtrarPagos() {
  const textoBusqueda = document.getElementById('buscador').value.toLowerCase();
  const inicio = document.getElementById('filtro-inicio').value;
  const fin = document.getElementById('filtro-fin').value;

  const pagosFiltrados = todosLosPagos.filter(p => {
    const cumpleTexto = 
      p.jugador.toLowerCase().includes(textoBusqueda) || 
      p.tipo.toLowerCase().includes(textoBusqueda);
    
    let cumpleFechas = true;
    const fechaPago = p.fecha.split('T')[0];

    if (inicio && fechaPago < inicio) cumpleFechas = false;
    if (fin && fechaPago > fin) cumpleFechas = false;

    return cumpleTexto && cumpleFechas;
  });

  renderPagos(pagosFiltrados);
  actualizarTotal(pagosFiltrados);
}

function actualizarTotal(pagos) {
  const total = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const elTotal = document.getElementById('total-filtrado');
  if (elTotal) elTotal.innerText = '$' + total.toLocaleString();
}

async function guardarPago(e) {
  e.preventDefault();
  
  const esMultiple = document.querySelector('input[name="pago_multiple"]:checked').value === 'si';
  
  // Construcción del payload base
  const payload = {
    jugador_id: document.getElementById('jugador_id').value,
    monto: Number(document.getElementById('monto').value),
    fecha: document.getElementById('fecha').value,
    tipo: document.getElementById('tipo').value,
    observacion: document.getElementById('observacion').value,
    mes_pago: document.getElementById('mes_pago').value, // Se llena con la lógica multiple
    cantidad_meses: 1,
    periodo_inicio: null,
    periodo_fin: null
  };

  // Si es pago múltiple, sobreescribimos con los datos calculados
  if (esMultiple) {
    payload.cantidad_meses = Number(document.getElementById('cantidad_meses').value);
    payload.periodo_inicio = document.getElementById('periodo_inicio').value;
    payload.periodo_fin = document.getElementById('periodo_fin').value;
    // mes_pago ya está calculado en initMultipleMonthsLogic
  } else {
    // Si es pago simple, periodo_inicio es la fecha de pago, periodo_fin null
    // Opcional: podrías poner periodo_fin = 1 mes después, pero por ahora null es más seguro
    payload.periodo_inicio = payload.fecha; 
  }

  if (!payload.jugador_id) {
    mostrarNotificacion('Seleccione un jugador', 'error');
    return;
  }

  try {
    await apiFetch('/pagos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    mostrarNotificacion('✅ Pago registrado correctamente');
    document.getElementById('formPago').reset();
    // Resetear estado UI de multiple
    document.getElementById('pago-multiple-wrapper').classList.add('hidden');
    document.querySelector('input[name="pago_multiple"][value="no"]').checked = true;
    
    await cargarPagos();
    filtrarPagos();
    await cargarJugadoresSelect();
    renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked').value);

  } catch (error) {
    console.error('Error guardando:', error);
    mostrarNotificacion('❌ Error al guardar pago', 'error');
  }
}

async function eliminarPago(id) {
  if (!confirm('¿Estás seguro de eliminar este registro?')) return;

  try {
    await apiFetch(`/pagos?id=${id}`, { method: 'DELETE' });
    mostrarNotificacion('Pago eliminado', 'info');
    await cargarPagos();
    filtrarPagos();
    await cargarJugadoresSelect();
    renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked').value);
  } catch (error) {
    mostrarNotificacion('Error al eliminar', 'error');
  }
}

function limpiarFiltros() {
  document.getElementById('buscador').value = '';
  document.getElementById('filtro-inicio').value = '';
  document.getElementById('filtro-fin').value = '';
  filtrarPagos();
}

function renderPagos(pagos) {
  const tbody = document.getElementById('tabla-pagos');
  const containerMovil = document.getElementById('vista-movil-historial');
  if (!tbody || !containerMovil) return;
  
  tbody.innerHTML = '';
  containerMovil.innerHTML = '';

  if (pagos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-400">No hay pagos.</td></tr>`;
    containerMovil.innerHTML = `<div class="text-center py-6 text-gray-400">No hay pagos.</div>`;
    return;
  }

  pagos.forEach(p => {
    let badgeColor = 'bg-gray-100 text-gray-700';
    if(p.tipo === 'abono') badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
    if(p.tipo === 'inscripcion') badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200';
    if(p.tipo === 'uniforme') badgeColor = 'bg-orange-50 text-orange-700 border border-orange-200';

    // Detalles adicionales
    let detallesExtra = '';
    if(p.mes_pago) detallesExtra += `<div class="text-[10px] text-slate-500">Mes: ${p.mes_pago}</div>`;
    if(p.cantidad_meses > 1) detallesExtra += `<div class="text-[10px] text-slate-500">Cant: ${p.cantidad_meses} meses</div>`;

    // HTML Desktop
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="px-6 py-4 font-medium text-slate-900">${p.jugador}</td>
      <td class="px-6 py-4 text-slate-600">${p.fecha.split('T')[0]}</td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badgeColor}">${p.tipo}</span>
      </td>
      <td class="px-6 py-4 text-slate-500 text-xs italic max-w-xs truncate" title="${p.observacion || ''}">
        ${p.observacion || '-'}
      </td>
      <td class="px-6 py-4 font-bold text-slate-900">$${p.monto.toLocaleString()}</td>
      <td class="px-6 py-4 text-center">
        <div class="flex justify-center gap-1">
          <button onclick="enviarWhatsapp(${p.id})" class="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition" title="Enviar WhatsApp">
            <i class="ph ph-whatsapp-logo text-lg"></i>
          </button>
          <button onclick="eliminarPago(${p.id})" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition" title="Eliminar">
            <i class="ph ph-trash text-lg"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);

    // HTML Mobile
    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative";
    card.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div>
           <h3 class="font-bold text-slate-900 text-base">${p.jugador}</h3>
           <p class="text-xs text-slate-400">${p.fecha.split('T')[0]}</p>
        </div>
        <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">$${p.monto.toLocaleString()}</span>
      </div>
      <div class="mb-3">
         <span class="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ${badgeColor}">${p.tipo}</span>
         ${detallesExtra}
      </div>
      <div class="flex justify-between items-center pt-2 border-t border-slate-50">
         <button onclick="eliminarPago(${p.id})" class="text-xs text-rose-500 hover:bg-rose-50 px-2 py-1 rounded transition">Eliminar</button>
         <button onclick="enviarWhatsapp(${p.id})" class="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-100 transition">
            <i class="ph ph-whatsapp-logo text-base"></i> Enviar
         </button>
      </div>
    `;
    containerMovil.appendChild(card);
  });
}

function mostrarNotificacion(msg, type = 'success') {
    console.log(`[${type}] ${msg}`);
}

window.eliminarPago = eliminarPago;
window.limpiarFiltros = limpiarFiltros;
window.irAPagar = irAPagar;
window.renderizarResumen = renderizarResumen;
window.enviarWhatsapp = enviarWhatsapp;