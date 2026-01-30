// recursos/js/pagos.js
import { apiFetch } from './configuracion.js';

// VARIABLES GLOBALES
let todosLosPagos = [];
let jugadoresDisponibles = [];

document.addEventListener('DOMContentLoaded', () => {
  // Cargar datos iniciales
  Promise.all([cargarPagos(), cargarJugadoresSelect()])
    .then(() => {
      // Renderizar todo por primera vez
      filtrarPagos();
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
    todosLosPagos = data; // Guardamos todos los pagos en memoria
  } catch (error) {
    console.error('Error cargando pagos:', error);
    mostrarError('No se pudieron cargar los pagos.');
  }
}

// ESTA ES LA FUNCIÓN QUE FALTABA: Llenar el select de jugadores
async function cargarJugadoresSelect() {
  try {
    // Llamamos a la API de Jugadores que ya existe
    const data = await apiFetch('/jugadores');
    const selectJugador = document.getElementById('jugador_id');
    
    if (selectJugador) {
      selectJugador.innerHTML = '<option value="">Seleccione jugador...</option>';
      // Solo mostramos jugadores activos (opcional, aquí mostramos todos)
      data.forEach(j => {
        selectJugador.innerHTML += `<option value="${j.id}">${j.nombre} (${j.categoria})</option>`;
      });
    }
  } catch (error) {
    console.error('Error cargando lista de jugadores:', error);
  }
}

// ==========================
// LÓGICA DE FILTRADO Y RENDERIZADO
// ==========================

function filtrarPagos() {
  const textoBusqueda = document.getElementById('buscador').value.toLowerCase();
  const inicio = document.getElementById('filtro-inicio').value;
  const fin = document.getElementById('filtro-fin').value;

  // Filtramos el array global
  const pagosFiltrados = todosLosPagos.filter(p => {
    // 1. Filtro por texto (Nombre Jugador o Tipo)
    const cumpleTexto = 
      p.jugador.toLowerCase().includes(textoBusqueda) || 
      p.tipo.toLowerCase().includes(textoBusqueda);
    
    // 2. Filtro por fechas
    let cumpleFechas = true;
    const fechaPago = p.fecha.split('T')[0]; // Formato YYYY-MM-DD

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
    filtrarPagos(); // Re-renderizar

  } catch (error) {
    console.error('Error guardando:', error);
    alert('❌ Error al guardar pago');
  }
}

// Función para eliminar pago (Exportada a window)
async function eliminarPago(id) {
  if (!confirm('¿Estás seguro de eliminar este registro de pago?')) return;

  try {
    await apiFetch(`/pagos?id=${id}`, { method: 'DELETE' });
    alert('🗑️ Pago eliminado');
    await cargarPagos();
    filtrarPagos();
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

// ==========================
// RENDERIZADO
// ==========================

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
    
    // Color del badge según tipo
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

// Exportar función para el onclick del HTML
window.eliminarPago = eliminarPago;
window.limpiarFiltros = limpiarFiltros;
