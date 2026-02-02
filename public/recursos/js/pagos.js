import { apiFetch } from './configuracion.js';

let todosLosPagos = [];
let jugadoresList = [];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

document.addEventListener('DOMContentLoaded', () => {
  Promise.all([cargarPagos(), cargarJugadoresSelect()])
    .then(() => {
      filtrarPagos();
      renderizarResumen('todos');
      inicializarFormulario();
    });

  // Listeners Filtros
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
// LÓGICA DEL FORMULARIO (ACTIVACIÓN Y CÁLCULO)
// ==========================

function inicializarFormulario() {
  // Llenar select de meses
  const selectMes = document.getElementById('mes_inicio_select');
  selectMes.innerHTML = MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('');
  
  // Poner mes actual por defecto
  selectMes.value = new Date().getMonth();

  // Poner fecha hoy por defecto
  const fechaInicioInput = document.getElementById('periodo_inicio');
  if(!fechaInicioInput.value) fechaInicioInput.valueAsDate = new Date();
}

// Función global llamada por el HTML
window.toggleMultiplePayment = function() {
  const esMultiple = document.querySelector('input[name="pago_multiple"]:checked').value === 'si';
  const wrapper = document.getElementById('pago-multiple-wrapper');
  
  if (esMultiple) {
    wrapper.classList.remove('hidden');
    calcularPeriodo(); // Calcular apenas se abre
  } else {
    wrapper.classList.add('hidden');
  }
};

window.calcularPeriodo = function() {
  const cantidad = parseInt(document.getElementById('cantidad_meses').value) || 1;
  const mesInicioIdx = parseInt(document.getElementById('mes_inicio_select').value);
  const fechaInicioVal = document.getElementById('periodo_inicio').value;

  if (!fechaInicioVal) return;

  // 1. Calcular Fecha Fin
  const fechaInicio = new Date(fechaInicioVal + 'T12:00:00'); 
  const fechaFin = new Date(fechaInicio);
  fechaFin.setMonth(fechaFin.getMonth() + cantidad);
  
  // Formatear YYYY-MM-DD para el input
  const y = fechaFin.getFullYear(), m = String(fechaFin.getMonth() + 1).padStart(2, '0'), d = String(fechaFin.getDate()).padStart(2, '0');
  document.getElementById('periodo_fin').value = `${y}-${m}-${d}`;

  // 2. Generar Lista de Meses (Ej: Enero, Febrero, Marzo)
  let listaNombres = [];
  for (let i = 0; i < cantidad; i++) {
    let idx = (mesInicioIdx + i) % 12;
    listaNombres.push(MESES[idx]);
  }
  const listaTexto = listaNombres.join(', ');
  
  // Mostrar en pantalla
  document.getElementById('resumen-meses-texto').innerText = listaTexto;

  // 3. Calcular Próximo Pago
  // La fecha fin + 1 día = siguiente mes
  const fechaProximo = new Date(fechaFin);
  fechaProximo.setDate(fechaProximo.getDate() + 1); // Sumar 1 día para caer en el siguiente mes
  const mesProximoNombre = MESES[fechaProximo.getMonth()];
  const añoProximo = fechaProximo.getFullYear();
  const diaProximo = fechaProximo.getDate();

  document.getElementById('next_payment_preview').value = `${diaProximo} de ${mesProximoNombre} de ${añoProximo}`;
  
  // Guardar el primer mes para compatibilidad
  document.getElementById('mes_pago').value = MESES[mesInicioIdx];
  
  // Guardar la lista de meses en un atributo data del input oculto para usarlo luego en WhatsApp
  document.getElementById('mes_pago').dataset.listaMeses = listaTexto;
};

// ==========================
// FUNCIONES DE DATOS
// ==========================

async function cargarPagos() {
  try {
    const data = await apiFetch('/pagos');
    todosLosPagos = data;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function cargarJugadoresSelect() {
  try {
    const data = await apiFetch('/jugadores');
    jugadoresList = data;
    const select = document.getElementById('jugador_id');
    if (select) {
      select.innerHTML = '<option value="">Seleccione jugador...</option>';
      data.forEach(j => { select.innerHTML += `<option value="${j.id}">${j.nombre} (${j.categoria})</option>`; });
    }
  } catch (error) { console.error(error); }
}

// ==========================
// WHATSAPP MEJORADO Y CALCULADO
// ==========================
function enviarWhatsapp(idPago) {
  const pago = todosLosPagos.find(p => p.id === idPago);
  if (!pago) return alert('Error: Pago no encontrado');
  if (!pago.jugador_telefono) return alert('Jugador sin teléfono');

  const nombre = pago.jugador;
  const saludo = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches";
  const monto = Number(pago.monto).toLocaleString();
  const fecha = pago.fecha.split('T')[0];
  const obs = pago.observacion ? `📝 ${pago.observacion}` : '';

  let mensaje = '';

  // Lógica principal para evitar errores
  if (pago.cantidad_meses > 1 && pago.periodo_fin) {
    // --- PAGO ADELANTADO ---
    const inicio = pago.periodo_inicio.split('T')[0];
    const fin = pago.periodo_fin.split('T')[0];
    
    // Reconstruir lista de meses si se guardó, o generarla de nuevo para estar seguros
    // Para generarla de nuevo: necesitamos mes_inicio (que tenemos en mes_pago usualmente) y cantidad
    let listaMeses = pago.mes_pago ? pago.mes_pago : ''; 
    // Intento de reconstrucción simple para el mensaje:
    if(listaMeses && pago.cantidad_meses) {
        // Si el DB solo guarda "Enero", el mensaje diría "Has pagado Enero", lo cual es confuso si son 2 meses.
        // Asumiremos que el usuario quiere ver el rango de fechas si la lista exacta no está clara.
        listaMeses = `del ${inicio} al ${fin}`;
    }

    // Calcular próximo pago basado en FECHA FIN (Método infalible)
    const fFin = new Date(pago.periodo_fin);
    fFin.setDate(fFin.getDate() + 1); // Siguiente día
    const mesProx = MESES[fFin.getMonth()];
    const diaProx = fFin.getDate();

    mensaje = `${saludo} ${nombre}, gracias por tu pago adelantado. 🚀%0A%0A`;
    mensaje += `💰 *Monto:* $${monto}%0A`;
    mensaje += `📅 *Fecha:* ${fecha}%0A`;
    mensaje += `📆 *Periodo Pagado:* ${listaMeses}%0A`; // Aquí va Enero, Febrero si se guardó bien
    mensaje += `📢 *Tu próximo pago:* ${diaProx} de ${mesProx}.%0A`; // Aquí calcula exactamente cuándo vence
    mensaje += `${obs}%0A`;
    mensaje += `¡Gracias por tu compromiso! ⚽`;

  } else {
    // --- PAGO SIMPLE ---
    let prox = "próximo mes";
    if (pago.mes_pago) {
      const idx = MESES.indexOf(pago.mes_pago);
      if (idx !== -1) prox = MESES[(idx + 1) % 12];
    }
    
    mensaje = `${saludo} ${nombre}, confirmamos tu pago.%0A%0A`;
    mensaje += `💰 *Valor:* $${monto}%0A`;
    mensaje += `📅 *Fecha:* ${fecha}%0A`;
    if (pago.mes_pago) mensaje += `🏷️ *Mes:* ${pago.mes_pago}%0A`;
    mensaje += `📢 *Próximo pago:* ${prox}.%0A`;
    mensaje += `${obs}`;
  }

  window.open(`https://wa.me/57${pago.jugador_telefono}?text=${mensaje}`, '_blank');
}

// ==========================
// GUARDAR PAGO (MANEJO DE DATOS)
// ==========================
async function guardarPago(e) {
  e.preventDefault();
  
  const esMultiple = document.querySelector('input[name="pago_multiple"]:checked').value === 'si';
  const payload = {
    jugador_id: document.getElementById('jugador_id').value,
    monto: Number(document.getElementById('monto').value),
    fecha: document.getElementById('fecha').value,
    tipo: document.getElementById('tipo').value,
    observacion: document.getElementById('observacion').value,
    mes_pago: document.getElementById('mes_pago').value,
    cantidad_meses: 1,
    periodo_inicio: null,
    periodo_fin: null
  };

  if (!payload.jugador_id) return mostrarNotificacion('Seleccione un jugador', 'error');

  if (esMultiple) {
    payload.cantidad_meses = Number(document.getElementById('cantidad_meses').value);
    payload.periodo_inicio = document.getElementById('periodo_inicio').value;
    payload.periodo_fin = document.getElementById('periodo_fin').value;
    
    // AGREGAR LA LISTA DE MESES A LA OBSERVACIÓN PARA QUE QUEDE REGISTRADO
    // (Opcional, pero ayuda a que el mensaje de WhatsApp lo lea si el DB no guarda arrays)
    const lista = document.getElementById('resumen-meses-texto').innerText;
    if(lista && !payload.observacion) {
      payload.observacion = `Meses pagados: ${lista}`;
    }
  } else {
    payload.periodo_inicio = payload.fecha;
  }

  try {
    await apiFetch('/pagos', { method: 'POST', body: JSON.stringify(payload) });
    mostrarNotificacion('✅ Pago guardado');
    document.getElementById('formPago').reset();
    document.getElementById('pago-multiple-wrapper').classList.add('hidden');
    document.querySelector('input[name="pago_multiple"][value="no"]').checked = true;
    
    await cargarPagos(); filtrarPagos(); await cargarJugadoresSelect();
    renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked').value);
  } catch (error) { mostrarNotificacion('Error', 'error'); }
}

// ==========================
// RENDERIZADO (TABLAS Y TARJETAS)
// ==========================
function renderizarResumen(tipo) {
  const tbody = document.getElementById('tabla-resumen'); const vm = document.getElementById('vista-movil-resumen');
  if(!tbody || !vm) return; tbody.innerHTML = ''; vm.innerHTML = '';

  let lista = jugadoresList;
  if (tipo === 'deudores') lista = lista.filter(j => j.mensualidad < 50000);
  if (tipo === 'pagados') lista = lista.filter(j => j.mensualidad >= 50000);
  lista.sort((a, b) => b.mensualidad - a.mensualidad);

  if (lista.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6">No hay datos</td></tr>'; return; }

  lista.forEach(j => {
    const estado = j.mensualidad >= 50000 ? '<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">Al día</span>' : '<span class="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs">Debe</span>';
    const tr = `<tr class="hover:bg-slate-50 border-b"><td class="px-4 py-3 font-medium">${j.nombre}</td><td class="px-4 py-3 text-center">${estado}</td><td class="px-4 py-3 text-center text-slate-500">$${j.mensualidad.toLocaleString()}</td><td class="px-4 py-3 text-right"><button onclick="irAPagar(${j.id})" class="text-blue-600 text-xs font-bold">Pagar</button></td></tr>`;
    tbody.innerHTML += tr;
  });
}

function filtrarPagos() {
  const txt = document.getElementById('buscador').value.toLowerCase();
  const fIni = document.getElementById('filtro-inicio').value; const fFin = document.getElementById('filtro-fin').value;
  const fil = todosLosPagos.filter(p => {
    const f = p.fecha.split('T')[0];
    return p.jugador.toLowerCase().includes(txt) && (!fIni || f >= fIni) && (!fFin || f <= fFin);
  });
  renderPagos(fil);
  document.getElementById('total-filtrado').innerText = '$' + fil.reduce((s,p)=>s+Number(p.monto),0).toLocaleString();
}

function renderPagos(pagos) {
  const tb = document.getElementById('tabla-pagos'); const mv = document.getElementById('vista-movil-historial');
  if(!tb || !mv) return; tb.innerHTML = ''; mv.innerHTML = '';
  if(pagos.length === 0) { tb.innerHTML = '<tr><td colspan="6" class="text-center py-6">Vacio</td></tr>'; return; }
  
  pagos.forEach(p => {
    let det = '';
    if(p.cantidad_meses > 1) det += `<div class="text-[10px] text-emerald-600 font-bold">Pagó ${p.cantidad_meses} meses</div>`;
    if(p.observacion) det += `<div class="text-[10px] text-slate-400 truncate">${p.observacion}</div>`;

    tb.innerHTML += `<tr class="hover:bg-slate-50 border-b"><td class="px-6 py-4 font-medium">${p.jugador}</td><td class="px-6 py-4">${p.fecha.split('T')[0]}</td><td class="px-6 py-4"><span class="bg-slate-100 px-2 py-1 rounded text-xs">${p.tipo}</span></td><td class="px-6 py-4">${det || '-'}</td><td class="px-6 py-4 font-bold">$${p.monto.toLocaleString()}</td><td class="px-6 py-4 text-center"><button onclick="enviarWhatsapp(${p.id})" class="text-green-600 p-2"><i class="ph ph-whatsapp-logo text-xl"></i></button> <button onclick="eliminarPago(${p.id})" class="text-rose-600 p-2"><i class="ph ph-trash text-xl"></i></button></td></tr>`;
    
    mv.innerHTML += `<div class="bg-white p-4 rounded border mb-2"><div class="flex justify-between"><h3 class="font-bold">${p.jugador}</h3><span class="font-bold text-emerald-600">$${p.monto.toLocaleString()}</span></div><p class="text-xs text-slate-500">${p.fecha.split('T')[0]} - ${p.tipo}</p>${det}<div class="flex gap-2 mt-2"><button onclick="enviarWhatsapp(${p.id})" class="flex-1 bg-green-50 text-green-600 py-1 rounded text-xs">WhatsApp</button><button onclick="eliminarPago(${p.id})" class="bg-rose-50 text-rose-600 px-3 py-1 rounded text-xs">Eliminar</button></div></div>`;
  });
}

function irAPagar(id) {
  document.getElementById('jugador_id').value = id;
  document.getElementById('formPago').scrollIntoView({behavior:'smooth'});
}

async function eliminarPago(id) {
  if(!confirm('¿Borrar?')) return;
  await apiFetch(`/pagos?id=${id}`, {method:'DELETE'});
  mostrarNotificacion('Borrado');
  await cargarPagos(); filtrarPagos(); await cargarJugadoresSelect();
}

function mostrarNotificacion(msg) { console.log(msg); } // Toast simple

// Exportar funciones globales para HTML
window.eliminarPago = eliminarPago;
window.irAPagar = irAPagar;
window.limpiarFiltros = () => { document.getElementById('buscador').value=''; filtrarPagos(); };
window.renderizarResumen = renderizarResumen;
window.enviarWhatsapp = enviarWhatsapp;