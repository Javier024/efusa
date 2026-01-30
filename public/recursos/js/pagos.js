// recursos/js/pagos.js
import { apiFetch } from './configuracion.js';

// VARIABLES GLOBALES
let todosLosPagos = [];
let jugadoresList = []; // <--- Guardamos la lista de jugadores para usarla en el resumen

document.addEventListener('DOMContentLoaded', () => {
  Promise.all([cargarPagos(), cargarJugadoresSelect()])
    .then(() => {
      filtrarPagos();
      renderizarResumen('todos'); // Renderizamos el estado de cuentas al inicio
    });

  // Listeners de búsqueda
  const buscador = document.getElementById('buscador');
  const fechaInicio = document.getElementById('filtro-inicio');
  const fechaFin = document.getElementById('filtro-fin');

  if (buscador) buscador.addEventListener('input', filtrarPagos);
  if (fechaInicio) fechaInicio.addEventListener('change', filtrarPagos);
  if (fechaFin) fechaFin.addEventListener('change', filtrarPagos);

  // Listener del Formulario
  const form = document.getElementById('formPago');
  if (form) form.addEventListener('submit', guardarPago);
});

// ==========================
// FUNCIONES DE CARGA DE DATOS
// ==========================

async function cargarPagos() {
  try {
    const data = await apiFetch('/pagos');
    todosLosPagos = data;
  } catch (error) {
    console.error('Error cargando pagos:', error);
    mostrarError('No se pudieron cargar los pagos.');
  }
}

async function cargarJugadoresSelect() {
  try {
    const data = await apiFetch('/jugadores');
    jugadoresList = data; // Guardamos globalmente para el resumen
    
    const selectJugador = document.getElementById('jugador_id');
    if (selectJugador) {
      selectJugador.innerHTML = '<option value="">Seleccione jugador...</option>';
      data.forEach(j => {
        selectJugador.innerHTML += `<option value="${j.id}">${j.nombre} (${j.categoria})</option>`;
      });
    }
  } catch (error) {
    console.error('Error cargando lista de jugadores:', error);
  }
}

// ==========================
// NUEVA: RENDERIZAR RESUMEN DE DEUDAS
// ==========================
function renderizarResumen(tipo) {
  const tbody = document.getElementById('tabla-resumen');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  // Filtramos la lista de jugadores
  let listaFiltrada = jugadoresList;
  
  if (tipo === 'deudores') {
    listaFiltrada = jugadoresList.filter(j => j.mensualidad < 50000);
  }

  // Ordenamos: Primero los que más deben, luego los deudos, luego pagados
  listaFiltrada.sort((a, b) => {
    const deudaA = 50000 - a.mensualidad;
    const deudaB = 50000 - b.mensualidad;
    return deudaB - deudaA; // Descendente por deuda
  });

  if (listaFiltrada.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-400 text-sm">No hay jugadores en este filtro.</td></tr>`;
    return;
  }

  listaFiltrada.forEach(j => {
    const pagado = j.mensualidad;
    const debe = 50000 - pagado;
    
    // Calcular estado visual
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
        <button onclick="irAPagar(${j.id})" class="text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3 py-1.5 rounded-md transition flex items-center gap-1">
          <i class="ph ph-plus-circle"></i> Pagar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Función para pre-seleccionar el jugador en el formulario
function irAPagar(id) {
  const select = document.getElementById('jugador_id');
  const formContainer = document.getElementById('formPago').closest('section');
  
  if (select) {
    select.value = id;
    // Scroll suave hacia el formulario
    formContainer.scrollIntoView({ behavior: 'smooth' });
    // Enfocar el monto
    setTimeout(() => document.getElementById('monto').focus(), 500);
  }
}

// ==========================
// LÓGICA DE FILTRADO Y RENDERIZADO (HISTORIAL)
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
  
  const payload = {
    jugador_id: document.getElementById('jugador_id').value,
    monto: Number(document.getElementById('monto').value),
    fecha: document.getElementById('fecha').value,
    tipo: document.getElementById('tipo').value,
    observacion: document.getElementById('observacion').value
  };

  if (!payload.jugador_id) {
    alert('Por favor seleccione un jugador');
    return;
  }

  try {
    await apiFetch('/pagos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    alert('✅ Pago registrado correctamente');
    document.getElementById('formPago').reset();
    // Recargar datos
    await cargarPagos();
    filtrarPagos();
    await cargarJugadoresSelect(); // Importante: recargar jugadores para actualizar saldos en el resumen
    renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked').value);

  } catch (error) {
    console.error('Error guardando:', error);
    alert('❌ Error al guardar pago');
  }
}

async function eliminarPago(id) {
  if (!confirm('¿Estás seguro de eliminar este registro de pago?')) return;

  try {
    await apiFetch(`/pagos?id=${id}`, { method: 'DELETE' });
    alert('🗑️ Pago eliminado');
    await cargarPagos();
    filtrarPagos();
    await cargarJugadoresSelect(); // Recargar saldos
    renderizarResumen(document.querySelector('input[name="filtro-resumen"]:checked').value);
  } catch (error) {
    alert('❌ Error al eliminar');
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
  if (!tbody) return;
  
  tbody.innerHTML = '';

  if (pagos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-400">No se encontraron pagos con los filtros actuales.</td></tr>`;
    return;
  }

  pagos.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition";
    
    let badgeColor = 'bg-gray-100 text-gray-700';
    if(p.tipo === 'abono') badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
    if(p.tipo === 'inscripcion') badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200';
    if(p.tipo === 'uniforme') badgeColor = 'bg-orange-50 text-orange-700 border border-orange-200';

    tr.innerHTML = `
      <td class="px-6 py-4 font-medium text-slate-900">${p.jugador}</td>
      <td class="px-6 py-4 text-slate-600">${p.fecha.split('T')[0]}</td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badgeColor}">
          ${p.tipo}
        </span>
      </td>
      <td class="px-6 py-4 text-slate-500 text-xs italic max-w-xs truncate" title="${p.observacion || ''}">
        ${p.observacion || '-'}
      </td>
      <td class="px-6 py-4 font-bold text-slate-900">$${p.monto.toLocaleString()}</td>
      <td class="px-6 py-4 text-center">
        <button onclick="eliminarPago(${p.id})" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition" title="Eliminar">
          <i class="ph ph-trash text-lg"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function mostrarError(msg) {
  const alerta = document.getElementById('alerta');
  alerta.innerText = msg;
  alerta.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'border-red-400');
  alerta.classList.add('bg-red-100', 'text-red-800', 'border-red-400');
}

// ==========================
// EXPORTAR FUNCIONES A WINDOW (CORRECCIÓN AQUÍ)
// ==========================
window.eliminarPago = eliminarPago;
window.limpiarFiltros = limpiarFiltros;
window.irAPagar = irAPagar;
window.renderizarResumen = renderizarResumen; // <--- ESTO SOLUCIONA TU ERROR