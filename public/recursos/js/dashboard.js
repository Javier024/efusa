import { apiFetch } from './configuracion.js';

// ==========================
// ESTADO GLOBAL
// ==========================
let jugadoresList = [];
let listaPagos = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 8;
const MENSUALIDAD_OBJETIVO = 50000;

// Referencias DOM
let tabla, buscador, filtroCategoria, infoPaginacion, btnPrev, btnNext;
let containerActividad;

// ==========================
// INICIALIZACIÓN
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM
  tabla = document.getElementById('tabla-jugadores');
  buscador = document.getElementById('buscador');
  filtroCategoria = document.getElementById('filtro-categoria');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');
  containerActividad = document.getElementById('actividad-feed');

  // Event Listeners
  if (buscador) buscador.addEventListener('input', filtrar);
  if (filtroCategoria) filtroCategoria.addEventListener('change', filtrar);

  // Sidebar
  const sidebar = document.getElementById('mobile-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btnOpen = document.getElementById('open-sidebar');
  const btnClose = document.getElementById('close-sidebar');

  if (btnOpen && btnClose) {
    btnOpen.addEventListener('click', () => toggleSidebar(true));
    btnClose.addEventListener('click', () => toggleSidebar(false));
  }
  if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));

  // Carga inicial
  cargarDatos();
});

// ==========================
// LÓGICA DE DATOS
// ==========================
async function cargarDatos() {
  try {
    // Cargamos ambos para KPIs y Tablas
    const [jugadores, pagos] = await Promise.all([
      apiFetch('/jugadores'),
      apiFetch('/pagos')
    ]);

    jugadoresList = Array.isArray(jugadores) ? jugadores : [];
    listaPagos = Array.isArray(pagos) ? pagos : [];

    actualizarEstadisticas();
    renderTabla();
    renderActividad();

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    if (tabla) tabla.innerHTML = `<tr><td colspan="5" class="text-center text-rose-500 p-4">Error de conexión.</td></tr>`;
  }
}

// ==========================
// ESTADÍSTICAS
// ==========================
function actualizarEstadisticas() {
  const total = jugadoresList.length;
  const activos = jugadoresList.filter(j => j.activo).length;
  // Calculamos deudores basados en cuota vs pagado
  const deudores = jugadoresList.filter(j => Number(j.mensualidad) < MENSUALIDAD_OBJETIVO).length;
  
  // Calculamos total recaudado
  const dinero = jugadoresList.reduce((acc, curr) => acc + Number(curr.mensualidad), 0);

  const elTotal = document.getElementById('stat-total');
  const elDinero = document.getElementById('stat-dinero');
  const elActivos = document.getElementById('stat-activos');
  const elDeudores = document.getElementById('stat-deudores');

  if (elTotal) elTotal.innerText = total;
  if (elDinero) elDinero.innerText = '$' + dinero.toLocaleString();
  if (elActivos) elActivos.innerText = activos;
  if (elDeudores) elDeudores.innerText = deudores;
}

// ==========================
// RENDERIZADO TABLA Y FILTROS
// ==========================
function filtrar() {
  // Reiniciar a página 1 al filtrar
  paginaActual = 1;
  renderTabla();
}

function renderTabla() {
  if (!tabla) return;
  tabla.innerHTML = '';

  const texto = buscador ? buscador.value.toLowerCase() : '';
  const cat = filtroCategoria ? filtroCategoria.value : '';

  // 1. Filtrar datos
  const filtrados = jugadoresList.filter(j => {
    const matchNombre = j.nombre.toLowerCase().includes(texto) || (j.apellidos && j.apellidos.toLowerCase().includes(texto));
    const matchCat = cat === '' || j.categoria === cat;
    return matchNombre && matchCat;
  });

  // 2. Calcular paginación
  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;

  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const datosPagina = filtrados.slice(inicio, fin);

  // 3. Renderizar filas
  if (datosPagina.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No se encontraron jugadores.</td></tr>`;
  } else {
    datosPagina.forEach(j => {
      const estado = Number(j.mensualidad) >= MENSUALIDAD_OBJETIVO;
      const estadoHtml = estado 
        ? '<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-200">Al día</span>'
        : '<span class="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold border border-rose-200">Pendiente</span>';

      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 border-b border-slate-100 transition duration-150";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 text-sm md:text-base">${j.nombre}</div>
          ${j.numero_identificacion ? `<div class="text-[10px] text-slate-400">${j.numero_identificacion}</div>` : ''}
        </td>
        <td class="px-4 py-3 text-slate-600 hidden sm:table-cell text-xs md:text-sm">
          ${j.categoria || '-'}
        </td>
        <td class="px-4 py-3 text-slate-600 text-xs md:text-sm">
          ${j.telefono || '-'}
        </td>
        <td class="px-4 py-3 text-center">
          ${estadoHtml}
        </td>
        <td class="px-4 py-3 text-center">
          <a href="jugadores.html" class="text-brand-600 hover:text-brand-800 font-bold text-xs md:text-sm">Ver más</a>
        </td>
      `;
      tabla.appendChild(tr);
    });
  }

  // 4. Actualizar controles de paginación
  if (infoPaginacion) infoPaginacion.innerText = `Página ${paginaActual} de ${totalPaginas} (${totalItems} registros)`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

function cambiarPagina(delta) {
  paginaActual += delta;
  renderTabla();
}

// ==========================
// ACTIVIDAD RECIENTE
// ==========================
function renderActividad() {
  if (!containerActividad) return;
  containerActividad.innerHTML = '';

  if (!listaPagos || listaPagos.length === 0) {
    containerActividad.innerHTML = '<div class="text-center text-xs text-slate-400 py-8 italic">No hay actividad reciente.</div>';
    return;
  }

  const recientes = listaPagos.slice(0, 5);

  recientes.forEach(p => {
    const fechaObj = new Date(p.fecha);
    const hora = fechaObj.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' });
    const fecha = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    const item = document.createElement('div');
    item.className = "activity-item relative pl-8 pb-6"; // pl-8 para dejar espacio a la línea vertical
    item.innerHTML = `
      <div class="absolute left-0 top-0 w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shadow-sm ring-4 ring-white z-10">
        <i class="ph ph-money text-lg"></i>
      </div>
      <p class="text-xs font-bold text-slate-700 pl-2">Pago de <span class="text-brand-600">${p.jugador}</span></p>
      <p class="text-[10px] text-slate-400 pl-2 mt-0.5">${hora} • ${fecha}</p>
    `;
    containerActividad.appendChild(item);
  });
}

// ==========================
// EXPORTACIÓN A EXCEL
// ==========================
function exportarExcel() {
  if (!jugadoresList || jugadoresList.length === 0) {
    alert("No hay datos de jugadores para exportar.");
    return;
  }

  try {
    // Preparar datos limpios
    const datosExportar = [
      { "Nombre Completo": "NOMBRE COMPLETO", "Categoría": "CATEGORÍA", "Teléfono": "TELÉFONO", "Estado": "ESTADO", "Acumulado": "ACUMULADO" }
    ];

    jugadoresList.forEach(j => {
      datosExportar.push({
        "Nombre Completo": `${j.nombre} ${j.apellidos || ''}`,
        "Categoría": j.categoria,
        "Teléfono": j.telefono || '-',
        "Estado": Number(j.mensualidad) >= MENSUALIDAD_OBJETIVO ? 'Pagado' : 'Pendiente',
        "Acumulado": Number(j.mensualidad)
      });
    });

    // Crear hoja de trabajo
    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Jugadores EFUSA");

    // Guardar archivo
    XLSX.writeFile("reporte_jugadores_efusa.xlsx", libro);
    console.log("Excel exportado correctamente");
  } catch (error) {
    console.error("Error en Excel:", error);
    alert("Hubo un error inesperado al generar el Excel.");
  }
}

// ==========================
// EXPORTACIÓN A PDF (USANDO AUTOTABLE)
// ==========================
function exportarPDF() {
  if (!jugadoresList || jugadoresList.length === 0) {
    alert("No hay datos para exportar a PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74); // Verde EFUSA
  doc.text("Reporte de Jugadores - EFUSA", 14, 20);
  
  // Cuerpo de la tabla
  const datosTabla = jugadoresList.map(j => [
    `${j.nombre} ${j.apellidos || ''}`,
    j.categoria || '-',
    j.telefono || '-',
    Number(j.mensualidad) >= MENSUALIDAD_OBJETIVO ? 'Al día' : 'Pendiente',
    `$${Number(j.mensualidad).toLocaleString()}`
  ]);

  doc.autoTable({
    head: [['Nombre', 'Categoría', 'Teléfono', 'Estado', 'Pagado']],
    body: datosTabla,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] }, // Verde tabla header
    styles: { fontSize: 10 },
    margin: { top: 10, right: 10, bottom: 10, left: 10 }
  });

  doc.save("reporte_jugadores_efusa.pdf");
  console.log("PDF exportado correctamente");
}

// ==========================
// UTILIDADES
// ==========================
function toggleSidebar(abrir) {
  const sidebar = document.getElementById('mobile-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (abrir) {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden', 'opacity-0');
  } else {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden', 'opacity-0');
  }
}

// Exportar funciones globales para HTML
window.cambiarPagina = cambiarPagina;
window.exportarExcel = exportarExcel;
window.exportarPDF = exportarPDF;
window.toggleSidebar = () => toggleSidebar(true);