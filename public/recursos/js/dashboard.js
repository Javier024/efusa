import { apiFetch } from './configuracion.js';

const META_MENSUALIDAD = 50000;
const FILAS_POR_PAGINA = 8;
let todosLosJugadores = [];
let todosLosPagos = [];
let actividadCombinada = []; // <--- NUEVO

// DOM Elements
const tbody = document.getElementById('tabla-jugadores');
const feedEl = document.getElementById('actividad-feed');
const infoPaginacion = document.getElementById('info-paginacion');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const buscador = document.getElementById('buscador');
const filtroCat = document.getElementById('filtro-categoria');

document.addEventListener('DOMContentLoaded', async () => {
  const hoy = new Date();
  document.getElementById('fecha-actual').innerText = hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  if (buscador) buscador.addEventListener('input', aplicarFiltros);
  if (filtroCat) filtroCat.addEventListener('change', aplicarFiltros);

  await cargarDatos();
});

async function cargarDatos() {
  try {
    // Cargar ambos simultáneamente
    const [jugadoresData, pagosData] = await Promise.all([
      apiFetch('/jugadores'),
      apiFetch('/pagos')
    ]);

    todosLosJugadores = Array.isArray(jugadoresData) ? jugadoresData : [];
    todosLosPagos = Array.isArray(pagosData) ? pagosData : [];
    
    // Generar Feed de Actividad
    generarActividadFeed();
    
    // Actualizar vista
    actualizarKPIs();
    aplicarFiltros(); // Esto llama a renderizarTabla

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500 text-xs">Error de conexión.</td></tr>`;
  }
}

// ==========================
// NUEVO: GENERAR ACTIVIDAD
// ==========================
function generarActividadFeed() {
  if (!feedEl) return;
  feedEl.innerHTML = '';

  // 1. Crear array de eventos de jugadores (Creación)
  const eventosJugadores = todosLosJugadores.map(j => ({
    tipo: 'jugador',
    fecha: j.created_at,
    nombre: j.nombre,
    detalle: `Nuevo jugador en ${j.categoria}`,
    icono: 'ph-user-plus',
    color: 'text-brand-600',
    bgIcono: 'bg-brand-100'
  }));

  // 2. Crear array de eventos de pagos
  const eventosPagos = todosLosPagos.map(p => ({
    tipo: 'pago',
    fecha: p.fecha,
    nombre: p.jugador,
    detalle: `Pago de $${p.monto.toLocaleString()}`,
    icono: 'ph-money',
    color: 'text-emerald-600',
    bgIcono: 'bg-emerald-100'
  }));

  // 3. Unir y ordenar (Más reciente primero)
  actividadCombinada = [...eventosJugadores, ...eventosPagos]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5); // Solo los 5 últimos

  if (actividadCombinada.length === 0) {
    feedEl.innerHTML = `<div class="text-center text-xs text-slate-400 py-6 italic">Sin actividad reciente.</div>`;
    return;
  }

  actividadCombinada.forEach((act, index) => {
    const fecha = new Date(act.fecha);
    const tiempoRelativo = obtenerTiempoRelativo(fecha);

    const item = document.createElement('div');
    item.className = `activity-item relative pl-8 ${index !== actividadCombinada.length - 1 ? 'activity-line' : ''}`;
    
    item.innerHTML = `
      <div class="absolute left-0 top-0 w-8 h-8 rounded-full ${act.bgIcono} ${act.color} flex items-center justify-center ring-4 ring-white">
        <i class="ph ${act.icono} text-sm"></i>
      </div>
      <div class="mb-1">
        <span class="font-bold text-slate-900 text-xs">${act.nombre}</span>
        <span class="text-[10px] text-slate-400 ml-2">${tiempoRelativo}</span>
      </div>
      <p class="text-xs text-slate-600 leading-tight">${act.detalle}</p>
    `;
    feedEl.appendChild(item);
  });
}

function obtenerTiempoRelativo(fecha) {
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHoras = Math.floor(diffMins / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ==========================
// LÓGICA EXISTENTE
// ==========================

function aplicarFiltros() {
  const texto = buscador ? buscador.value.toLowerCase() : '';
  const cat = filtroCat ? filtroCat.value : '';

  const jugadoresFiltrados = todosLosJugadores.filter(j => {
    const cumpleTexto = j.nombre.toLowerCase().includes(texto) || (j.telefono && j.telefono.includes(texto));
    const cumpleCat = cat === '' || j.categoria === cat;
    return cumpleTexto && cumpleCat;
  });

  renderizarTabla(jugadoresFiltrados);
}

function actualizarKPIs() {
  const total = todosLosJugadores.length;
  const activos = todosLosJugadores.filter(j => j.activo).length;
  const totalDinero = todosLosJugadores.reduce((sum, j) => sum + j.mensualidad, 0);
  const deudores = todosLosJugadores.filter(j => j.mensualidad < META_MENSUALIDAD).length;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-activos').innerText = activos;
  document.getElementById('stat-dinero').innerText = '$' + totalDinero.toLocaleString();
  document.getElementById('stat-deudores').innerText = deudores;
}

let paginaActual = 1;
function renderizarTabla(lista) {
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const totalPages = Math.ceil(lista.length / FILAS_POR_PAGINA) || 1;
  if (paginaActual > totalPages) paginaActual = totalPages;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const datosPagina = lista.slice(inicio, fin);

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-400 text-xs">No hay resultados.</td></tr>`;
  } else {
    datosPagina.forEach(j => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 border-b border-slate-100 last:border-0";
      
      const estado = j.mensualidad >= META_MENSUALIDAD 
        ? '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Al día</span>'
        : '<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Debe</span>';

      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 text-xs">${j.nombre}</div>
        </td>
        <td class="px-4 py-3 text-[10px] text-slate-500">${j.categoria}</td>
        <td class="px-4 py-3">${estado}</td>
        <td class="px-4 py-3 text-right">
           <a href="jugadores.html?edit=${j.id}" class="text-brand-600 hover:text-brand-800 text-[10px] font-bold">VER</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (infoPaginacion) infoPaginacion.innerText = `${lista.length} total`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

// Exportaciones
window.exportarExcel = function() {
  const data = todosLosJugadores.map(j => ({ 
    Nombre: j.nombre, Categoria: j.categoria, Telefono: j.telefono, Pagado: j.mensualidad 
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jugadores");
  XLSX.writeFile(wb, "EFUSA_Dashboard.xlsx");
};

window.exportarPDF = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Reporte EFUSA", 14, 20);
  const body = todosLosJugadores.map(j => [j.nombre, j.categoria, `$${j.mensualidad}`]);
  doc.autoTable({ head: [['Nombre', 'Categoria', 'Pagado']], body: body, startY: 30 });
  doc.save("Reporte_EFUSA.pdf");
};

window.cambiarPagina = function(delta) {
  paginaActual += delta;
  aplicarFiltros(); // Re-aplica filtros para re-renderizar
};