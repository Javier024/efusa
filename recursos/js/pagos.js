// --- CONFIGURACIÓN Y VARIABLES GLOBALES ---
let todosLosPagos = [];
let pagosFiltrados = [];
let jugadoresMap = new Map(); // Mapa para buscar nombres por ID
let paginaActual = 1;
const itemsPorPagina = 10;

// Elementos del DOM
const form = document.getElementById('formPago');
const tabla = document.getElementById('tabla-pagos');
const select = document.getElementById('jugador_id');
const inputBuscador = document.getElementById('buscador');
const inputFiltroInicio = document.getElementById('filtro-inicio');
const inputFiltroFin = document.getElementById('filtro-fin');
const elTotalFiltrado = document.getElementById('total-filtrado');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const elInfoPaginacion = document.getElementById('info-paginacion');
const elPaginaActual = document.getElementById('pagina-actual');
const divAlerta = document.getElementById('alerta');

// --- FUNCIONES DE PAGINACIÓN Y RENDERIZADO (Movidas arriba para evitar errores) ---

function aplicarFiltros() {
  const textoBusqueda = inputBuscador.value.toLowerCase();
  const fechaInicio = inputFiltroInicio.value ? new Date(inputFiltroInicio.value) : null;
  const fechaFin = inputFiltroFin.value ? new Date(inputFiltroFin.value) : null;

  if (fechaFin) fechaFin.setHours(23, 59, 59, 999);

  pagosFiltrados = todosLosPagos.filter(pago => {
    const nombreJugador = jugadoresMap.get(pago.jugador_id)?.toLowerCase() || '';
    const coincideTexto = nombreJugador.includes(textoBusqueda);

    const fechaPago = new Date(pago.fecha_pago);
    let coincideFecha = true;
    if (fechaInicio && fechaPago < fechaInicio) coincideFecha = false;
    if (fechaFin && fechaPago > fechaFin) coincideFecha = false;

    return coincideTexto && coincideFecha;
  });

  calcularTotal();
  renderTabla();
}

function renderTable() {
  tabla.innerHTML = '';

  if (pagosFiltrados.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400">No se encontraron pagos.</td></tr>`;
    actualizarControles(0);
    return;
  }

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const paginaDatos = pagosFiltrados.slice(inicio, fin);

  paginaDatos.forEach(p => {
    const nombreJugador = jugadoresMap.get(p.jugador_id) || 'Desconocido';
    
    const obsDisplay = p.observacion 
      ? `<div class="text-[10px] text-gray-400 italic mt-0.5 truncate max-w-[200px]" title="${p.observacion}">Obs: ${p.observacion}</div>` 
      : '';

    const row = document.createElement('tr');
    row.className = "hover:bg-gray-50 transition-colors";
    row.innerHTML = `
      <td class="px-6 py-4 font-medium text-gray-900">${nombreJugador}</td>
      <td class="px-6 py-4 text-gray-500">${new Date(p.fecha_pago + 'T00:00:00').toLocaleDateString('es-CO')}</td>
      <td class="px-6 py-4"><span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs uppercase font-bold">${p.tipo || 'Abono'}</span></td>
      <td class="px-6 py-4 text-gray-500 text-xs italic">${obsDisplay}</td>
      <td class="px-6 py-4 font-bold text-green-600">$${parseFloat(p.monto).toLocaleString('es-CO')}</td>
      <td class="px-6 py-4 text-right">
        <button onclick="eliminarPago(${p.id}, '${nombreJugador}')" class="text-red-500 hover:text-red-700 transition" title="Eliminar">
          <i class="ph ph-trash text-lg"></i>
        </button>
      </td>
    `;
    tabla.appendChild(row);
  });

  actualizarControles(pagosFiltrados.length);
}

function actualizarControles(totalItems) {
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
  const inicio = totalItems > 0 ? (paginaActual - 1) * itemsPorPagina + 1 : 0;
  const fin = Math.min(paginaActual * itemsPorPagina, totalItems);

  elPaginaActual.innerText = `${paginaActual} / ${totalPaginas}`;
  elInfoPaginacion.innerText = `Mostrando ${inicio}-${fin} de ${totalItems}`;

  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas;
}

function calcularTotal() {
  const total = pagosFiltrados.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
  elTotalFiltrado.innerText = `$${total.toLocaleString('es-CO')}`;
}

// --- INICIALIZACIÓN Y EVENTOS ---
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('fecha').valueAsDate = new Date();
  await init();
});

async function init() {
  await cargarJugadores();
  await cargarPagos();
}

// --- CARGA DE DATOS ---

async function cargarJugadores() {
  try {
    // Hacemos fetch directo para evitar errores de importación
    const res = await fetch('/api/jugadores');
    const jugadores = await res.json();
    
    select.innerHTML = '<option value="">Seleccione jugador...</option>' + 
      jugadores.map(j => `<option value="${j.id}">${j.nombre}</option>`).join('');
    
    // Crear Mapa para búsqueda rápida
    jugadores.forEach(j => jugadoresMap.set(j.id, j.nombre));
  } catch (error) {
    console.error("Error cargando jugadores", error);
    mostrarAlerta("Error cargando jugadores", "error");
  }
}

async function cargarPagos() {
  try {
    const res = await fetch('/api/pagos');
    todosLosPagos = await res.json();
    
    // Ordenar por fecha descendente
    todosLosPagos.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
    
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando pagos", error);
    mostrarAlerta("Error cargando pagos", "error");
  }
}

// --- CONTROLES DE PAGINACIÓN Y FILTROS ---
window.cambiarPagina = (delta) => {
  const totalPaginas = Math.ceil(pagosFiltrados.length / itemsPorPagina);
  const nuevaPag = paginaActual + delta;
  if (nuevaPag >= 1 && nuevaPag <= totalPaginas) {
    paginaActual = nuevaPag;
    renderTabla();
  }
};

window.limpiarFiltros = () => {
  inputBuscador.value = '';
  inputFiltroInicio.value = '';
  inputFiltroFin.value = '';
  paginaActual = 1;
  aplicarFiltros();
};

// Agregar listeners
inputBuscador.addEventListener('input', () => { paginaActual = 1; aplicarFiltros(); });
inputFiltroInicio.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
inputFiltroFin.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });

// --- GUARDAR PAGO ---
form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!select.value) {
    mostrarAlerta("Seleccione un jugador", "error");
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Procesando...`;

  const data = {
    jugador_id: Number(select.value),
    monto: Number(document.getElementById('monto').value),
    fecha_pago: document.getElementById('fecha').value,
    tipo: document.getElementById('tipo').value,
    observacion: document.getElementById('observacion').value
  };

  try {
    await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    mostrarAlerta("Pago registrado correctamente", "success");
    form.reset();
    document.getElementById('fecha').valueAsDate = new Date();
    await cargarPagos();
  } catch (error) {
    console.error(error);
    mostrarAlerta("Error al guardar pago", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

// --- ELIMINAR PAGO ---
window.eliminarPago = async (id, nombre) => {
  if (!confirm(`¿Estás seguro de eliminar el pago de ${nombre}?`)) return;

  try {
    await fetch(`/api/pagos?id=${id}`, { method: 'DELETE' });
    mostrarAlerta("Pago eliminado", "success");
    await cargarPagos();
  } catch (error) {
    console.error(error);
    mostrarAlerta("Error al eliminar", "error");
  }
};

// --- EXPORTAR A EXCEL ---
window.exportarExcel = () => {
  if (pagosFiltrados.length === 0) return alert("No hay datos para exportar");

  const datos = pagosFiltrados.map(p => ({
    Fecha: new Date(p.fecha_pago).toLocaleDateString(),
    Jugador: jugadoresMap.get(p.jugador_id) || 'Desconocido',
    Tipo: p.tipo || 'Abono',
    Observación: p.observacion || '',
    Monto: parseFloat(p.monto)
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pagos");
  XLSX.writeFile(wb, "Reporte_Pagos.xlsx");
};

// --- UTILIDAD DE ALERTAS ---
function mostrarAlerta(mensaje, tipo) {
  divAlerta.classList.remove('hidden', 'bg-green-50', 'text-green-700', 'border-green-500', 'bg-red-50', 'text-red-700', 'border-red-500');
  
  if (tipo === 'success') {
    divAlerta.classList.add('bg-green-50', 'text-green-700', 'border-green-500');
    divAlerta.innerHTML = `<i class="ph ph-check-circle"></i> ${mensaje}`;
  } else {
    divAlerta.classList.add('bg-red-50', 'text-red-700', 'border-red-500');
    divAlerta.innerHTML = `<i class="ph ph-warning-circle"></i> ${mensaje}`;
  }
  
  divAlerta.classList.remove('hidden');
  setTimeout(() => divAlerta.classList.add('hidden'), 3000);
}