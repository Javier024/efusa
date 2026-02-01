// recursos/js/dashboard.js
import { apiFetch } from './configuracion.js';

// VARIABLES GLOBALES
let jugadoresList = [];
let listaPagos = []; // Para la actividad reciente
let paginaActual = 1;
const FILAS_POR_PAGINA = 8;

// ELEMENTOS DOM
let tabla, buscador, filtroCategoria, infoPaginacion, btnPrev, btnNext, containerActividad;

document.addEventListener('DOMContentLoaded', () => {
  inicializarFecha();
  // Cargamos ambos datos: Jugadores y Pagos
  Promise.all([cargarJugadores(), cargarPagos()])
    .then(() => {
      actualizarEstadisticas();
      renderTabla();
      renderActividad();
    });

  // Listeners
  buscador = document.getElementById('buscador');
  filtroCategoria = document.getElementById('filtro-categoria');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');
  tabla = document.getElementById('tabla-jugadores');
  containerActividad = document.getElementById('actividad-feed');

  if (buscador) buscador.addEventListener('input', renderTabla);
  if (filtroCategoria) filtroCategoria.addEventListener('change', renderTabla);

  // Sidebar Móvil
  const sidebar = document.getElementById('mobile-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btnOpen = document.getElementById('open-sidebar');
  const btnClose = document.getElementById('close-sidebar');

  if (btnOpen && btnClose) {
    btnOpen.addEventListener('click', () => toggleSidebar(true));
    btnClose.addEventListener('click', () => toggleSidebar(false));
    if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));
  }
});

function inicializarFecha() {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaEl = document.getElementById('fecha-actual');
  if (fechaEl) fechaEl.innerText = new Date().toLocaleDateString('es-CO', opciones);
}

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

// ==========================
// CARGA DE DATOS
// ==========================
async function cargarJugadores() {
  try {
    const data = await apiFetch('/jugadores');
    jugadoresList = data;
  } catch (error) {
    console.error('Error cargando jugadores:', error);
  }
}

async function cargarPagos() {
  try {
    const data = await apiFetch('/pagos');
    listaPagos = data;
  } catch (error) {
    console.error('Error cargando pagos:', error);
  }
}

// ==========================
// ESTADÍSTICAS
// ==========================
function actualizarEstadisticas() {
  const total = jugadoresList.length;
  const activos = jugadoresList.filter(j => j.activo).length;
  const deudores = jugadoresList.filter(j => j.mensualidad < 50000).length;
  const dinero = jugadoresList.reduce((acc, j) => acc + Number(j.mensualidad), 0);

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-activos').innerText = activos;
  document.getElementById('stat-deudores').innerText = deudores;
  document.getElementById('stat-dinero').innerText = `$${dinero.toLocaleString()}`;
}

// ==========================
// ACTIVIDAD RECIENTE (IMPLEMENTADA)
// ==========================
function renderActividad() {
  if (!containerActividad) return;
  containerActividad.innerHTML = '';

  if (!listaPagos || listaPagos.length === 0) {
    containerActividad.innerHTML = '<div class="text-center text-xs text-slate-400 py-8 italic">Sin actividad registrada aún.</div>';
    return;
  }

  // Tomamos los últimos 5 pagos
  const recientes = listaPagos.slice(0, 5);

  recientes.forEach(p => {
    const fechaObj = new Date(p.fecha);
    const hora = fechaObj.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
    const fecha = fechaObj.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

    const item = document.createElement('div');
    item.className = "activity-item flex gap-3 relative pb-4";
    item.innerHTML = `
      <div class="relative flex-shrink-0">
        <div class="h-8 w-8 rounded-full bg-brand-100 border-2 border-white text-brand-600 flex items-center justify-center z-10 shadow-sm">
          <i class="ph ph-money text-xs font-bold"></i>
        </div>
      </div>
      <div class="flex-1 min-w-0 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
        <div class="flex justify-between items-start mb-1">
          <p class="text-xs font-bold text-slate-900">Pago de <span class="text-brand-600">${p.jugador}</span></p>
          <span class="text-[10px] text-slate-400 font-medium">${hora} • ${fecha}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">${p.tipo}</span>
          <span class="text-xs font-bold text-emerald-600">$${Number(p.monto).toLocaleString()}</span>
        </div>
      </div>
    `;
    containerActividad.appendChild(item);
  });
}

// ==========================
// RENDERIZADO DE TABLA
// ==========================
function renderTabla() {
  if (!tabla) return;
  tabla.innerHTML = '';

  const texto = buscador ? buscador.value.toLowerCase() : '';
  const cat = filtroCategoria ? filtroCategoria.value : '';

  const filtrados = jugadoresList.filter(j => {
    const coincideNombre = j.nombre.toLowerCase().includes(texto) || (j.apellidos && j.apellidos.toLowerCase().includes(texto));
    const coincideCat = cat === '' || j.categoria === cat;
    return coincideNombre && coincideCat;
  });

  // Paginación
  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const datosPagina = filtrados.slice(inicio, fin);

  if (datosPagina.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No se encontraron jugadores.</td></tr>`;
  } else {
    datosPagina.forEach(j => {
      const estado = Number(j.mensualidad) >= 50000 
        ? '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">Al día</span>'
        : '<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold">Pendiente</span>';

      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="font-bold text-slate-800">${j.nombre}</div>
          ${j.apellidos ? `<div class="text-[10px] text-slate-400">${j.apellidos}</div>` : ''}
        </td>
        <td class="px-4 py-3 text-slate-600 text-xs uppercase">${j.categoria}</td>
        <td class="px-4 py-3 text-slate-600 text-xs">${j.telefono || '-'}</td>
        <td class="px-4 py-3">${estado}</td>
        <td class="px-4 py-3 text-center">
          <a href="jugadores.html" class="text-brand-600 hover:text-brand-800 p-1.5 rounded transition inline-block">
            <i class="ph ph-eye text-lg"></i>
          </a>
        </td>
      `;
      tabla.appendChild(tr);
    });
  }

  if (infoPaginacion) infoPaginacion.innerText = `Pág ${paginaActual} de ${totalPages} (${totalItems} registros)`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

function cambiarPagina(delta) {
  paginaActual += delta;
  renderTabla();
}

// ==========================
// EXPORTAR A EXCEL (ROBUSTO)
// ==========================
function exportarExcel() {
  if (!jugadoresList || jugadoresList.length === 0) {
    alert("No hay datos de jugadores para exportar.");
    return;
  }

  try {
    // 1. Preparar datos limpios
    const datosExportar = [
      { "Nombre Completo": "NOMBRE COMPLETO", "Categoría": "CATEGORÍA", "Teléfono": "TELÉFONO", "Estado": "ESTADO", "Acumulado": "ACUMULADO" }
    ];

    jugadoresList.forEach(j => {
      datosExportar.push({
        "Nombre Completo": `${j.nombre} ${j.apellidos || ''}`,
        "Categoría": j.categoria,
        "Teléfono": j.telefono || '-',
        "Estado": Number(j.mensualidad) >= 50000 ? 'Pagado' : 'Pendiente',
        "Acumulado": Number(j.mensualidad)
      });
    });

    // 2. Crear hoja de trabajo
    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Jugadores EFUSA");

    // 3. Guardar archivo
    XLSX.writeFile(libro, "Reporte_Jugadores_Efusa.xlsx");
    console.log("Excel exportado correctamente");
  } catch (error) {
    console.error("Error en Excel:", error);
    alert("Hubo un error inesperado al generar el Excel.");
  }
}

// ==========================
// EXPORTAR A PDF (MÉTODO ARRAY - CORREGIDO)
// ==========================
function exportarPDF() {
  if (!jugadoresList || jugadoresList.length === 0) {
    alert("No hay datos para exportar a PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // 1. Encabezado Verde Institucional
  doc.setFillColor(22, 163, 74); // #16a34a
  doc.rect(0, 0, 210, 45, 'F');

  // Textos
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("EFUSA", 105, 25, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Escuela de Fútbol", 105, 33, { align: "center" });

  doc.setFontSize(24);
  doc.text("⚽", 105, 18, { align: "center" });

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.line(20, 40, 190, 40);

  // 2. Preparar datos para la tabla (Array de Arrays para mayor estabilidad)
  // El primer elemento son los encabezados
  const cuerpoTabla = jugadoresList.map(j => [
    `${j.nombre} ${j.apellidos || ''}`,
    j.categoria,
    j.telefono || '-',
    Number(j.mensualidad) >= 50000 ? 'Pagado' : 'Pendiente',
    `$${Number(j.mensualidad).toLocaleString()}`
  ]);

  const encabezados = [['Jugador', 'Categoría', 'Teléfono', 'Estado', 'Acumulado']];

  // 3. Generar Tabla usando Arrays
  doc.autoTable({
    head: encabezados,
    body: cuerpoTabla,
    startY: 70,
    theme: 'striped', // 'grid' también funciona, pero 'striped' se ve mejor
    headStyles: { 
      fillColor: [22, 163, 74], 
      textColor: 255, 
      fontStyle: 'bold', 
      halign: 'center' 
    },
    styles: {
      fontSize: 10,
      overflow: 'linebreak',
      cellPadding: 4,
      lineWidth: 0.1,
      lineColor: [220, 220, 220]
    },
    margin: { top: 10, right: 10, bottom: 10, left: 10 }
  });

  // 4. Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 280, { align: "right" });

  // 5. Descargar (Este método fuerza la descarga en la mayoría de navegadores)
  try {
    doc.save("Reporte_Efusa.pdf");
    console.log("PDF exportado correctamente");
  } catch (error) {
    console.error("Error al guardar PDF:", error);
    alert("El navegador bloqueó la descarga automática. Por favor permite las descargas.");
  }
}

// ==========================
// EXPORTAR FUNCIONES
// ==========================
window.toggleSidebar = toggleSidebar;
window.cambiarPagina = cambiarPagina;
window.exportarExcel = exportarExcel;
window.exportarPDF = exportarPDF;