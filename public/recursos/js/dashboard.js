import { apiFetch } from './configuracion.js';

// CONFIGURACIÓN
const META_MENSUALIDAD = 50000;
const FILAS_POR_PAGINA = 8;

// ESTADO
let todosLosJugadores = [];
let jugadoresFiltrados = [];
let paginaActual = 1;

// ELEMENTOS
const tbody = document.getElementById('tabla-jugadores');
const infoPaginacion = document.getElementById('info-paginacion');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const buscador = document.getElementById('buscador');
const filtroCat = document.getElementById('filtro-categoria');
const filtroEst = document.getElementById('filtro-estado');

// INICIO
document.addEventListener('DOMContentLoaded', async () => {
  // Poner fecha actual
  const hoy = new Date();
  document.getElementById('fecha-actual').innerText = hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Listeners
  if (buscador) buscador.addEventListener('input', aplicarFiltros);
  if (filtroCat) filtroCat.addEventListener('change', aplicarFiltros);
  if (filtroEst) filtroEst.addEventListener('change', aplicarFiltros);

  // Cargar Datos
  await cargarDatos();
});

async function cargarDatos() {
  try {
    const data = await apiFetch('/jugadores');
    todosLosJugadores = Array.isArray(data) ? data : [];
    aplicarFiltros();
    actualizarKPIs();
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-red-500">Error cargando datos.</td></tr>`;
  }
}

// LÓGICA DE FILTROS
function aplicarFiltros() {
  const texto = buscador ? buscador.value.toLowerCase() : '';
  const cat = filtroCat ? filtroCat.value : '';
  const est = filtroEst ? filtroEst.value : '';

  jugadoresFiltrados = todosLosJugadores.filter(j => {
    const cumpleTexto = j.nombre.toLowerCase().includes(texto) || (j.telefono && j.telefono.includes(texto));
    const cumpleCat = cat === '' || j.categoria === cat;
    
    let cumpleEst = true;
    if (est === 'pagado') cumpleEst = j.mensualidad >= META_MENSUALIDAD;
    if (est === 'pendiente') cumpleEst = j.mensualidad === 0;
    if (est === 'abono') cumpleEst = j.mensualidad > 0 && j.mensualidad < META_MENSUALIDAD;

    return cumpleTexto && cumpleCat && cumpleEst;
  });

  paginaActual = 1;
  renderizarTabla();
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

function calcularEstado(pagado) {
  if (pagado >= META_MENSUALIDAD) return { texto: 'Al Día', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  if (pagado > 0) return { texto: 'Abono', color: 'bg-amber-50 text-amber-700 border border-amber-200' };
  return { texto: 'Pendiente', color: 'bg-rose-50 text-rose-700 border border-rose-200' };
}

function renderizarTabla() {
  if (!tbody) return;
  tbody.innerHTML = '';

  const total = jugadoresFiltrados.length;
  const totalPages = Math.ceil(total / FILAS_POR_PAGINA) || 1;
  
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const datosPagina = jugadoresFiltrados.slice(inicio, fin);

  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 italic">No se encontraron jugadores.</td></tr>`;
  } else {
    datosPagina.forEach(j => {
      const estado = calcularEstado(j.mensualidad);
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition duration-150 border-b border-slate-100 last:border-0";
      
      tr.innerHTML = `
        <td class="px-6 py-3">
          <div class="font-bold text-slate-900">${j.nombre}</div>
          <div class="text-[10px] text-slate-500">ID: ${j.id}</div>
        </td>
        <td class="px-6 py-3">
          <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
            ${j.categoria}
          </span>
        </td>
        <td class="px-6 py-3 text-slate-600 text-xs">${j.telefono || '-'}</td>
        <td class="px-6 py-3 text-center">
          <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${estado.color}">
            ${estado.texto}
          </span>
          <div class="text-[10px] text-slate-400 mt-0.5">$${j.mensualidad.toLocaleString()}</div>
        </td>
        <td class="px-6 py-3 text-center">
          <a href="jugadores.html?edit=${j.id}" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition" title="Editar">
            <i class="ph ph-pencil-simple text-sm"></i>
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (infoPaginacion) infoPaginacion.innerText = `Mostrando ${inicio + 1}-${Math.min(fin, total)} de ${total}`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

// ==========================
// EXPORTAR A EXCEL
// ==========================
window.exportarExcel = function() {
  // Preparar datos limpios para Excel
  const dataExcel = jugadoresFiltrados.map(j => ({
    ID: j.id,
    Nombre: j.nombre,
    Categoría: j.categoria,
    Teléfono: j.telefono || '',
    Estado: calcularEstado(j.mensualidad).texto,
    Pagado: j.mensualidad,
    Deuda: Math.max(0, META_MENSUALIDAD - j.mensualidad),
    Activo: j.activo ? 'Sí' : 'No'
  }));

  const ws = XLSX.utils.json_to_sheet(dataExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jugadores");
  XLSX.writeFile(wb, "Reporte_EFUSA_Jugadores.xlsx");
};

// ==========================
// EXPORTAR A PDF
// ==========================
window.exportarPDF = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // Brand Blue
  doc.text("Reporte de Jugadores - EFUSA", 14, 20);
  
  // Fecha
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);

  // Preparar cuerpo de la tabla
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
    headStyles: { fillColor: [37, 99, 235] }, // Azul de marca
    styles: { fontSize: 9, cellPadding: 3 }
  });

  doc.save("Reporte_EFUSA_Jugadores.pdf");
};

window.cambiarPagina = function(delta) {
  paginaActual += delta;
  renderizarTabla();
};