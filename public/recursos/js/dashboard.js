// recursos/js/dashboard.js
import { apiFetch } from './configuracion.js';

// VARIABLES GLOBALES
let jugadoresList = [];
let paginaActual = 1;
const FILAS_POR_PAGINA = 8; // Aumentado un poco para el dashboard

// ELEMENTOS DOM
let tabla, buscador, filtroCategoria, infoPaginacion, btnPrev, btnNext;

document.addEventListener('DOMContentLoaded', () => {
  inicializarFecha();
  cargarDatos();

  // Listeners
  buscador = document.getElementById('buscador');
  filtroCategoria = document.getElementById('filtro-categoria');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');
  tabla = document.getElementById('tabla-jugadores');

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
async function cargarDatos() {
  try {
    const data = await apiFetch('/jugadores');
    jugadoresList = data;
    actualizarEstadisticas();
    renderTabla();
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

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
        : '<span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold">Deuda</span>';

      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors";
      tr.innerHTML = `
        <td class="px-4 py-3">
          <div class="font-bold text-slate-800">${j.nombre}</div>
          ${j.apellidos ? `<div class="text-[10px] text-slate-400">${j.apellidos}</div>` : ''}
        </td>
        <td class="px-4 py-3 text-slate-600">${j.categoria}</td>
        <td class="px-4 py-3 text-slate-600">${j.telefono || '-'}</td>
        <td class="px-4 py-3">${estado}</td>
        <td class="px-4 py-3 text-center">
          <a href="jugadores.html" class="text-brand-600 hover:bg-brand-50 p-1.5 rounded transition inline-block">
            <i class="ph ph-eye text-lg"></i>
          </a>
        </td>
      `;
      tabla.appendChild(tr);
    });
  }

  if (infoPaginacion) infoPaginacion.innerText = `Pág ${paginaActual} de ${totalPages}`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

function cambiarPagina(delta) {
  paginaActual += delta;
  renderTabla();
}

// ==========================
// EXPORTAR EXCEL (LIMPIO Y FUNCIONAL)
// ==========================
function exportarExcel() {
  if (jugadoresList.length === 0) {
    alert('No hay datos para exportar a Excel.');
    return;
  }

  // Preparar datos limpios
  const datosExportar = jugadoresList.map(j => ({
    "Nombre Completo": `${j.nombre} ${j.apellidos || ''}`,
    "Categoría": j.categoria,
    "Teléfono": j.telefono || '-',
    "Estado": Number(j.mensualidad) >= 50000 ? 'Pagado' : 'Pendiente',
    "Acumulado": Number(j.mensualidad)
  }));

  // Crear hoja
  const ws = XLSX.utils.json_to_sheet(datosExportar);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte EFUSA");

  // Descargar
  XLSX.writeFile(wb, "Reporte_Jugadores_Efusa.xlsx");
}

// ==========================
// EXPORTAR PDF (DISEÑO EFUSA VERDE - CORREGIDO)
// ==========================
function exportarPDF() {
  if (jugadoresList.length === 0) {
    alert('No hay datos para exportar a PDF.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // 1. Encabezado Verde Institucional (Corrección: Usar HEX en lugar de Arrays RGB)
  // Usamos Brand 600 (#16a34a - Verde oscuro) para fondo y Blanco para texto, mejor contraste.
  doc.setFillColor(22, 163, 74); // #16a34a
  doc.rect(0, 0, 210, 45, 'F');

  // Texto EFUSA y Balón
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("EFUSA", 105, 25, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Escuela de Fútbol", 105, 33, { align: "center" });

  // Balón de fútbol
  doc.setFontSize(24);
  doc.text("⚽", 105, 18, { align: "center" });

  // Línea separadora
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.line(20, 40, 190, 40);

  // 2. Contenido del reporte
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Directorio de Jugadores", 14, 60);

  // Preparar tabla de datos
  const datosTabla = jugadoresList.map(j => [
    `${j.nombre} ${j.apellidos || ''}`,
    j.categoria,
    j.telefono || '-',
    Number(j.mensualidad) >= 50000 ? 'Pagado' : 'Pendiente',
    `$${Number(j.mensualidad).toLocaleString()}`
  ]);

  // Estilos CORREGIDOS (Usando HEX para evitar el error de arrays)
  // fillColor: '#dcfce7' (Brand 50 - Verde claro para filas)
  // headStyles: Usamos HEX directo para asegurar compatibilidad
  doc.autoTable({
    html: `<table style="width:100%; text-align:left; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #16a34a; color: white;">
                <th style="padding:8px;">Jugador</th>
                <th style="padding:8px;">Categoría</th>
                <th style="padding:8px;">Contacto</th>
                <th style="padding:8px;">Estado</th>
                <th style="padding:8px;">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              ${datosTabla.map(row => `
                <tr>
                  ${row.map(cell => `<td style="padding:6px; border-bottom: 1px solid #e2e8f0;">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>`,
    startY: 70,
    theme: 'grid',
    headStyles: { 
      fillColor: '#16a34a', 
      textColor: '#ffffff', 
      fontStyle: 'bold', 
      halign: 'center' 
    },
    styles: {
      fontSize: 10,
      overflow: 'linebreak',
      cellPadding: 3
    },
    margin: { top: 10, right: 10, bottom: 10, left: 10 }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 280, { align: "right" });

  doc.save("Reporte_Efusa.pdf");
}

// Exportar funciones
window.toggleSidebar = toggleSidebar;
window.cambiarPagina = cambiarPagina;
window.exportarExcel = exportarExcel;
window.exportarPDF = exportarPDF;