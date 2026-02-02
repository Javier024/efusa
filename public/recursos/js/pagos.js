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

  const buscador = document.getElementById('buscador');
  const fechaInicio = document.getElementById('filtro-inicio');
  const fechaFin = document.getElementById('filtro-fin');
  if (buscador) buscador.addEventListener('input', filtrarPagos);
  if (fechaInicio) fechaInicio.addEventListener('change', filtrarPagos);
  if (fechaFin) fechaFin.addEventListener('change', filtrarPagos);

  const form = document.getElementById('formPago');
  if (form) form.addEventListener('submit', guardarPago);
});

function inicializarFormulario() {
  const selectMes = document.getElementById('mes_inicio_select');
  selectMes.innerHTML = MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('');
  selectMes.value = new Date().getMonth();

  const fechaInicioInput = document.getElementById('periodo_inicio');
  if(!fechaInicioInput.value) fechaInicioInput.valueAsDate = new Date();
}

// --- LÓGICA PAGO MÚLTIPLE (WINDOW PARA ACCESO HTML) ---
window.toggleMultiplePayment = function() {
  const esMultiple = document.querySelector('input[name="pago_multiple"]:checked').value === 'si';
  const wrapper = document.getElementById('pago-multiple-wrapper');
  if (esMultiple) { wrapper.classList.remove('hidden'); calcularPeriodo(); } 
  else { wrapper.classList.add('hidden'); }
};

// --- CÁLCULO DE PERIODOS MEJORADO ---
window.calcularPeriodo = function() {
  const cantidad = parseInt(document.getElementById('cantidad_meses').value) || 1;
  const mesInicioIdx = parseInt(document.getElementById('mes_inicio_select').value);
  const fechaInicioVal = document.getElementById('periodo_inicio').value;
  if(!fechaInicioVal) return;

  // 1. Fecha Inicio Segura
  const fechaInicio = new Date(fechaInicioVal + 'T12:00:00'); 

  // 2. Calcular Lista de Meses (Texto)
  let lista = [];
  for(let i=0; i<cantidad; i++) {
    // (Año actual + offset de meses) para detectar cambio de año en el nombre si fuera necesario,
    // pero para la lista simple usamos solo los nombres rotativos.
    let idx = (mesInicioIdx + i) % 12; 
    lista.push(MESES[idx]);
  }
  const textoLista = lista.join(', ');
  document.getElementById('resumen-meses-texto').innerText = textoLista;

  // 3. Calcular FECHA FIN CORRECTA (Último día del último mes pagado)
  const fechaFin = new Date(fechaInicio);
  // Sumamos la cantidad de meses. Si es 15 Enero y pagamos 2 meses -> Marzo 15.
  fechaFin.setMonth(fechaFin.getMonth() + cantidad);
  // Restamos 1 día para quedar en el último día del mes anterior (Febrero 28).
  fechaFin.setDate(fechaFin.getDate() - 1);
  
  // Formatear fecha fin
  const y = fechaFin.getFullYear();
  const m = String(fechaFin.getMonth() + 1).padStart(2, '0');
  const d = String(fechaFin.getDate()).padStart(2, '0');
  document.getElementById('periodo_fin').value = `${y}-${m}-${d}`;

  // 4. Calcular PRÓXIMO PAGO (Día 1 del mes siguiente al fin)
  const proximo = new Date(fechaFin);
  proximo.setDate(proximo.getDate() + 1); // Pasamos al primer día del siguiente mes
  
  const diaProx = String(proximo.getDate()).padStart(2,'0');
  const mesProx = MESES[proximo.getMonth()];
  const anioProx = proximo.getFullYear();
  
  document.getElementById('next_payment_preview').value = `${diaProx} de ${mesProx} de ${anioProx}`;
  
  // Guardamos el mes inicial para el registro
  document.getElementById('mes_pago').value = MESES[mesInicioIdx];
  document.getElementById('mes_pago').dataset.listaMeses = textoLista;
};

// --- DATOS ---
async function cargarPagos() {
  try { const data = await apiFetch('/pagos'); todosLosPagos = data; } catch (e) { console.error(e); }
}
async function cargarJugadoresSelect() {
  try { 
    const data = await apiFetch('/jugadores'); 
    jugadoresList = data; 
    const select = document.getElementById('jugador_id'); 
    if(select) { 
      select.innerHTML = '<option value="">Seleccione...</option>'; 
      data.forEach(j => { 
        select.innerHTML += `<option value="${j.id}">${j.nombre} (${j.categoria})</option>`; 
      }); 
    } 
  } catch(e) {}
}

// --- WHATSAPP INTELIGENTE ---
function enviarWhatsapp(idPago) {
  const pago = todosLosPagos.find(p => p.id === idPago);
  if(!pago) return alert('Pago no encontrado');
  if(!pago.jugador_telefono) return alert('Sin teléfono');

  const saludo = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches";
  const monto = Number(pago.monto).toLocaleString();
  const obs = pago.observacion ? `📝 ${pago.observacion}` : '';
  let mensaje = '';

  if(pago.cantidad_meses > 1 && pago.periodo_fin) {
    const fFin = new Date(pago.periodo_fin);
    const proximo = new Date(fFin); proximo.setDate(proximo.getDate() + 1);
    
    mensaje = `${saludo} ${pago.jugador}, gracias por tu pago adelantado. 🚀%0A%0A`;
    mensaje += `💰 *Monto:* $${monto}%0A`;
    mensaje += `📆 *Periodo:* ${pago.observacion ? pago.observacion.split('Meses pagados: ')[1] : 'Varios meses'}%0A`;
    mensaje += `📢 *Próximo pago:* ${proximo.getDate()} de ${MESES[proximo.getMonth()]} de ${proximo.getFullYear()}.%0A`;
    mensaje += `${obs}%0A¡Gracias!`;
  } else {
    let prox = "próximo mes";
    if(pago.mes_pago) { const idx = MESES.indexOf(pago.mes_pago); if(idx!==-1) prox = MESES[(idx+1)%12]; }
    mensaje = `${saludo} ${pago.jugador}, pago recibido.%0A%0A💰 *Valor:* $${monto}%0A📢 *Próximo:* ${prox}.%0A${obs}`;
  }
  window.open(`https://wa.me/57${pago.jugador_telefono}?text=${mensaje}`, '_blank');
}

// --- GUARDAR ---
async function guardarPago(e) {
  e.preventDefault();
  const esMultiple = document.querySelector('input[name="pago_multiple"]:checked').value === 'si';
  const payload = {
    jugador_id: document.getElementById('jugador_id').value, monto: Number(document.getElementById('monto').value),
    fecha: document.getElementById('fecha').value, tipo: document.getElementById('tipo').value,
    observacion: document.getElementById('observacion').value, mes_pago: document.getElementById('mes_pago').value,
    cantidad_meses: 1, periodo_inicio: null, periodo_fin: null
  };
  if(!payload.jugador_id) return mostrarNotificacion('Seleccione jugador', 'error');

  if(esMultiple) {
    payload.cantidad_meses = Number(document.getElementById('cantidad_meses').value);
    payload.periodo_inicio = document.getElementById('periodo_inicio').value;
    payload.periodo_fin = document.getElementById('periodo_fin').value;
    if(!payload.observacion) payload.observacion = `Meses pagados: ${document.getElementById('resumen-meses-texto').innerText}`;
  } else { payload.periodo_inicio = payload.fecha; }

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

// --- RENDERIZADO RESUMEN (ESTADO DE CUENTAS MEJORADO) ---
function renderizarResumen(tipo) {
  const tbody = document.getElementById('tabla-resumen'), vm = document.getElementById('vista-movil-resumen');
  if(!tbody || !vm) return; tbody.innerHTML = ''; vm.innerHTML = '';
  
  let lista = jugadoresList;
  
  // Lógica de filtros
  if(tipo === 'deudores') {
    // Filtra a quienes deben dinero: (0 pagado) o (Parcial < 50000)
    lista = lista.filter(j => j.mensualidad < 50000);
  }
  if(tipo === 'pagados') {
    // Filtra a quienes están al día
    lista = lista.filter(j => j.mensualidad >= 50000);
  }
  
  lista.sort((a, b) => b.mensualidad - a.mensualidad); // Ordenar de mayor a menor saldo
  
  if(lista.length === 0) { 
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400">No hay registros en esta vista</td></tr>'; 
    return; 
  }

  lista.forEach(j => {
    let estadoBadge = '';
    let estadoTexto = '';

    // Lógica Visual Detallada
    if (j.mensualidad === 0) {
      // No ha pagado nada
      estadoBadge = '<span class="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">No Pagado ($0)</span>';
      estadoTexto = 'No ha pagado';
    } else if (j.mensualidad >= 50000) {
      // Pagado completo (o más)
      estadoBadge = '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">Al día</span>';
      estadoTexto = 'Al día';
    } else {
      // Pagó pero le falta (Deudor Parcial)
      estadoBadge = `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">Parcial ($${j.mensualidad.toLocaleString()})</span>`;
      estadoTexto = 'Debe';
    }

    // Render Tabla
    const tr = `
      <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
        <td class="px-4 py-3">
          <div class="font-medium text-slate-900">${j.nombre}</div>
          <div class="text-[10px] text-slate-400">${j.categoria}</div>
        </td>
        <td class="px-4 py-3 text-center">${estadoBadge}</td>
        <td class="px-4 py-3 text-center">
          <div class="text-xs font-bold text-slate-700">$${j.mensualidad.toLocaleString()}</div>
          ${j.mensualidad > 0 && j.mensualidad < 50000 ? `<div class="text-[10px] text-rose-500">Faltan $${(50000 - j.mensualidad).toLocaleString()}</div>` : ''}
        </td>
        <td class="px-4 py-3 text-right">
          <button onclick="window.irAPagar(${j.id})" class="text-blue-600 hover:text-blue-800 text-xs font-bold underline decoration-blue-200 hover:decoration-blue-600 underline-offset-4 transition-all">
            Pagar
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += tr;

    // Render Móvil
    vm.innerHTML += `
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-between items-center">
        <div>
          <h4 class="font-bold text-slate-900">${j.nombre}</h4>
          <div class="mt-1">${estadoBadge}</div>
        </div>
        <div class="text-right">
          <div class="font-bold text-lg ${j.mensualidad >= 50000 ? 'text-emerald-600' : (j.mensualidad === 0 ? 'text-rose-600' : 'text-amber-600')}">
            $${j.mensualidad.toLocaleString()}
          </div>
          <button onclick="window.irAPagar(${j.id})" class="mt-2 text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-medium">Pagar</button>
        </div>
      </div>
    `;
  });
}

function filtrarPagos() {
  const txt = document.getElementById('buscador').value.toLowerCase(); const fIni = document.getElementById('filtro-inicio').value; const fFin = document.getElementById('filtro-fin').value;
  const fil = todosLosPagos.filter(p => {
    const f = p.fecha.split('T')[0]; return p.jugador.toLowerCase().includes(txt) && (!fIni || f >= fIni) && (!fFin || f <= fFin);
  });
  renderPagos(fil);
  document.getElementById('total-filtrado').innerText = '$' + fil.reduce((s,p)=>s+Number(p.monto),0).toLocaleString();
}

function renderPagos(pagos) {
  const tb = document.getElementById('tabla-pagos'), mv = document.getElementById('vista-movil-historial');
  if(!tb || !mv) return; tb.innerHTML = ''; mv.innerHTML = '';
  if(pagos.length === 0) { tb.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-slate-400">Vacio</td></tr>'; return; }
  pagos.forEach(p => {
    let det = ''; 
    if(p.cantidad_meses > 1) det += `<div class="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><i class="ph ph-calendar"></i> Pagó ${p.cantidad_meses} meses</div>`; 
    if(p.observacion) det += `<div class="text-[10px] text-slate-400 truncate" title="${p.observacion}">${p.observacion}</div>`;
    
    tb.innerHTML += `
      <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
        <td class="px-6 py-4 font-medium text-slate-900">${p.jugador}</td>
        <td class="px-6 py-4 text-slate-600">${p.fecha.split('T')[0]}</td>
        <td class="px-6 py-4"><span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200 capitalize">${p.tipo}</span></td>
        <td class="px-6 py-4 text-slate-500">${det||'-'}</td>
        <td class="px-6 py-4 font-bold text-slate-900">$${p.monto.toLocaleString()}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.enviarWhatsapp(${p.id})" class="text-green-600 p-1 hover:bg-green-50 rounded transition"><i class="ph ph-whatsapp-logo text-xl"></i></button> 
          <button onclick="window.eliminarPago(${p.id})" class="text-rose-600 p-1 hover:bg-rose-50 rounded transition"><i class="ph ph-trash text-xl"></i></button>
        </td>
      </tr>
    `;
    
    mv.innerHTML += `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="font-bold text-slate-900">${p.jugador}</h3>
            <p class="text-xs text-slate-500">${p.fecha.split('T')[0]} · ${p.tipo}</p>
          </div>
          <span class="font-bold text-emerald-600 text-lg">$${p.monto.toLocaleString()}</span>
        </div>
        ${det ? `<div class="bg-slate-50 p-2 rounded text-xs text-slate-600 mb-3">${det}</div>` : ''}
        <div class="flex gap-2 mt-2">
          <button onclick="window.enviarWhatsapp(${p.id})" class="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-xs font-bold hover:bg-green-100 transition flex justify-center items-center gap-1"><i class="ph ph-whatsapp-logo"></i> WhatsApp</button>
          <button onclick="window.eliminarPago(${p.id})" class="bg-rose-50 text-rose-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 transition">Eliminar</button>
        </div>
      </div>
    `;
  });
}

async function eliminarPago(id) {
  if(!confirm('¿Seguro que deseas borrar este pago? Esto disminuirá el saldo del jugador.')) return;
  await apiFetch(`/pagos?id=${id}`, {method:'DELETE'});
  mostrarNotificacion('Pago eliminado');
  await cargarPagos(); filtrarPagos(); await cargarJugadoresSelect();
}

window.irAPagar = (id) => { document.getElementById('jugador_id').value = id; document.getElementById('formPago').scrollIntoView({behavior:'smooth'}); };
window.eliminarPago = eliminarPago;
window.enviarWhatsapp = enviarWhatsapp;
window.renderizarResumen = renderizarResumen;
window.limpiarFiltros = () => { document.getElementById('buscador').value=''; document.getElementById('filtro-inicio').value=''; document.getElementById('filtro-fin').value=''; filtrarPagos(); };
function mostrarNotificacion(m) { console.log(m); }