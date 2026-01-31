import { apiFetch } from './configuracion.js';

const META_MENSUALIDAD = 50000;
const FILAS_POR_PAGINA = 8;
let todosLosJugadores = [];
let jugadoresFiltrados = [];
let actividadCombinada = [];

const tbody = document.getElementById('tabla-jugadores');
const feedEl = document.getElementById('actividad-feed');
const infoPaginacion = document.getElementById('info-paginacion');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const buscador = document.getElementById('buscador');
const filtroCat = document.getElementById('filtro-categoria');

document.addEventListener('DOMContentLoaded', async () => {
  // Configurar Saludo Animado
  configurarSaludo();

  // Configurar Fecha
  const hoy = new Date();
  document.getElementById('fecha-actual').innerText = hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  if (buscador) buscador.addEventListener('input', aplicarFiltros);
  if (filtroCat) filtroCat.addEventListener('change', aplicarFiltros);

  await cargarDatos();
});

// ==========================
// LÓGICA DEL SALUDO ANIMADO
// ==========================
function configurarSaludo() {
  const hora = new Date().getHours();
  const saludoEl = document.getElementById('saludo-dinamico');
  
  let textoSaludo = "Buenas noches";
  
  if (hora >= 6 && hora < 12) {
    textoSaludo = "Buenos días";
  } else if (hora >= 12 && hora < 18) {
    textoSaludo = "Buenas tardes";
  }
  
  // Cambiar el texto
  if (saludoEl) {
    saludoEl.innerText = `${textoSaludo}, Admin`;
    
    // Resetear y agregar la clase para reiniciar la animación
    saludoEl.classList.remove('animar-saludo');
    void saludoEl.offsetWidth; // Hack para forzar el reflow del navegador
    saludoEl.classList.add('animar-saludo');
  }
}

// ==========================
// CARGA DE DATOS
// ==========================
async function cargarDatos() {
  try {
    const [jugadoresData, pagosData] = await Promise.all([
      apiFetch('/jugadores'),
      apiFetch('/pagos')
    ]);

    todosLosJugadores = Array.isArray(jugadoresData) ? jugadoresData : [];
    todosLosPagos = Array.isArray(pagosData) ? pagosData : [];
    
    generarActividadFeed();
    actualizarKPIs();
    aplicarFiltros();

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500 text-xs">Error de conexión.</td></tr>`;
  }
}

// ==========================
// FILTROS
// ==========================
function aplicarFiltros() {
  const texto = buscador ? buscador.value.toLowerCase() : '';
  const cat = filtroCat ? filtroCat.value : '';

  jugadoresFiltrados = todosLosJugadores.filter(j => {
    const cumpleTexto = j.nombre.toLowerCase().includes(texto) || (j.telefono && j.telefono.includes(texto));
    const cumpleCat = cat === '' || j.categoria === cat;
    return cumpleTexto && cumpleCat;
  });

  paginaActual = 1;
  renderizarTabla();
}

// ==========================
// EXPORTACIÓN
// ==========================
window.exportarExcel = function() {
  if (jugadoresFiltrados.length === 0) {
    alert("No hay datos para exportar con los filtros actuales.");
    return;
  }

  const data = jugadoresFiltrados.map(j => ({ 
    Nombre: j.nombre, 
    Categoria: j.categoria, 
    Telefono: j.telefono || '-', 
    Estado: calcularEstado(j.mensualidad).texto,
    Pagado: j.mensualidad,
    Deuda: Math.max(0, META_MENSUALIDAD - j.mensualidad),
    Activo: j.activo ? 'Sí' : 'No'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jugadores");
  XLSX.writeFile(wb, "Reporte_EFUSA_Jugadores.xlsx");
};

window.exportarPDF = function() {
  if (jugadoresFiltrados.length === 0) {
    alert("No hay datos para exportar con los filtros actuales.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text("Reporte de Jugadores - EFUSA", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);

  const body = jugadoresFiltrados.map(j => [
    j.nombre,
    j.categoria,
    j.telefono || '-',
    `$${j.mensualidad.toLocaleString()}`,
    calcularEstado(j.mensualidad).texto
  ]);

  doc.autoTable({
    head: [['Nombre', 'Categoría', 'Teléfono', 'Pagado', 'Estado']],
    body: body,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  doc.save("Reporte_EFUSA_Jugadores.pdf");
};

// ==========================
// KPIs, FEED Y TABLA
// ==========================

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

function generarActividadFeed() {
  if (!feedEl) return;
  feedEl.innerHTML = '';

  const eventosJugadores = todosLosJugadores.map(j => ({
    tipo: 'jugador',
    fecha: j.created_at,
    nombre: j.nombre,
    detalle: `Nuevo jugador en ${j.categoria}`,
    icono: 'ph-user-plus',
    color: 'text-brand-600',
    bgIcono: 'bg-brand-100'
  }));

  const eventosPagos = todosLosPagos.map(p => ({
    tipo: 'pago',
    fecha: p.fecha,
    nombre: p.jugador,
    detalle: `Pago de $${p.monto.toLocaleString()}`,
    icono: 'ph-money',
    color: 'text-emerald-600',
    bgIcono: 'bg-emerald-100'
  }));

  actividadCombinada = [...eventosJugadores, ...eventosPagos]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

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

let paginaActual = 1;

function renderizarTabla() {
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const totalPages = Math.ceil(jugadoresFiltrados.length / FILAS_POR_PAGINA) || 1;
  if (paginaActual > totalPages) paginaActual = totalPages;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const datosPagina = jugadoresFiltrados.slice(inicio, fin);

  if (jugadoresFiltrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-400 text-xs">No hay resultados.</td></tr>`;
  } else {
    datosPagina.forEach(j => {
      const estado = calcularEstado(j.mensualidad);
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 border-b border-slate-100 last:border-0";
      
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 text-xs">${j.nombre}</div>
        </td>
        <td class="px-4 py-3 text-[10px] text-slate-500">${j.categoria}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${estado.color}">
            ${estado.texto}
          </span>
        </td>
        <td class="px-4 py-3 text-right">
           <a href="jugadores.html?edit=${j.id}" class="text-brand-600 hover:text-brand-800 text-[10px] font-bold">VER</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (infoPaginacion) infoPaginacion.innerText = `${jugadoresFiltrados.length} total`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

function calcularEstado(pagado) {
  if (pagado >= META_MENSUALIDAD) return { texto: 'Al Día', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  if (pagado > 0) return { texto: 'Abono', color: 'bg-amber-50 text-amber-700 border border-amber-200' };
  return { texto: 'Pendiente', color: 'bg-rose-50 text-rose-700 border border-rose-200' };
}

window.cambiarPagina = function(delta) {
  paginaActual += delta;
  aplicarFiltros();
};