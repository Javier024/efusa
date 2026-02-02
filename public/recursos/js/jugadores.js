import { apiFetch } from './configuracion.js';

// ==========================
// CONSTANTES & ESTADO
// ==========================
const MENSUALIDAD_OBJETIVO = 50000;
const FILAS_POR_PAGINA = 5;
let todosLosJugadores = [];
let paginaActual = 1;

// Elementos DOM
let modal, backdrop, panel, form, tbody, containerMovil, infoPaginacion, btnPrev, btnNext;

// ==========================
// INICIALIZACIÓN
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  modal = document.getElementById('modal-jugador');
  backdrop = document.getElementById('modal-backdrop'); 
  panel = document.getElementById('modal-panel'); 
  form = document.getElementById('formJugador');
  tbody = document.getElementById('tabla-jugadores');
  containerMovil = document.getElementById('vista-movil');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');

  if (form) form.addEventListener('submit', guardarJugador);
  if (modal && backdrop) backdrop.addEventListener('click', cerrarModal);

  cargarJugadores();
});

// ==========================
// DATOS (CRUD)
// ==========================
async function cargarJugadores() {
  try {
    // Estado de carga visual (opcional)
    // tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Cargando...</td></tr>';
    
    const data = await apiFetch('/jugadores');
    todosLosJugadores = Array.isArray(data) ? data : [];
    
    actualizarEstadisticas();
    renderTabla();
  } catch (error) {
    mostrarNotificacion('Error al cargar jugadores: ' + error.message, 'error');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 p-4">Error de conexión.</td></tr>`;
  }
}

async function guardarJugador(e) {
  e.preventDefault();
  
  const id = document.getElementById('jugador-id').value;
  const esEdicion = !!id;

  // Recopilamos datos
  const payload = {
    nombre: document.getElementById('nombre').value,
    apellidos: document.getElementById('apellidos').value,
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    tipo_identificacion: document.getElementById('tipo_identificacion').value,
    numero_identificacion: document.getElementById('numero_identificacion').value,
    categoria: document.getElementById('categoria').value,
    telefono: document.getElementById('telefono').value,
    mensualidad: Number(document.getElementById('mensualidad').value) || 0,
    activo: document.getElementById('activo').checked
  };

  try {
    if (esEdicion) {
      await apiFetch(`/jugadores?id=${id}`, { method: 'PUT', body: payload });
      mostrarNotificacion('✅ Jugador actualizado correctamente');
    } else {
      // CREACIÓN (Aquí ocurría el error 400 si faltaban headers)
      await apiFetch('/jugadores', { method: 'POST', body: payload });
      mostrarNotificacion('✅ Jugador registrado correctamente');
    }
    
    cerrarModal();
    cargarJugadores(); // Recargar lista
  } catch (error) {
    mostrarNotificacion('❌ Error: ' + error.message, 'error');
  }
}

async function eliminarJugador(id) {
  if (!confirm("¿Estás seguro de eliminar este jugador?")) return;
  
  try {
    await apiFetch(`/jugadores?id=${id}`, { method: 'DELETE' });
    mostrarNotificacion('🗑️ Jugador eliminado', 'info');
    cargarJugadores();
  } catch (error) {
    mostrarNotificacion('❌ Error al eliminar: ' + error.message, 'error');
  }
}

// ==========================
// RENDERIZADO & UTILIDADES
// ==========================
function calcularEstado(pagado) {
  if (pagado >= MENSUALIDAD_OBJETIVO) return { texto: 'Pagado', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' };
  else if (pagado > 0) return { texto: `Abono ($${MENSUALIDAD_OBJETIVO - pagado})`, color: 'bg-amber-100 text-amber-700 border border-amber-200' };
  else return { texto: 'Pendiente', color: 'bg-rose-100 text-rose-700 border border-rose-200' };
}

function renderTabla() {
  if (!tbody || !containerMovil) return;

  tbody.innerHTML = '';
  containerMovil.innerHTML = '';
  
  const totalItems = todosLosJugadores.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;
  
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const datosPagina = todosLosJugadores.slice(inicio, fin);

  if (datosPagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">No hay jugadores registrados.</td></tr>`;
    containerMovil.innerHTML = `<div class="text-center py-8 text-slate-400">No hay registros.</div>`;
    return;
  }

  // Render Desktop
  datosPagina.forEach(j => {
    const estado = calcularEstado(j.mensualidad);
    const nombreCompleto = `${j.apellidos || ''} ${j.nombre || ''}`.trim();
    const fechaVisual = j.fecha_nacimiento ? j.fecha_nacimiento.split('-').reverse().join('/') : '-';
    
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition duration-150 border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-4 md:px-6 py-3 md:py-4">
        <div class="font-bold text-slate-900 text-sm md:text-base">${nombreCompleto}</div>
        <div class="mt-1 text-xs text-slate-500">${j.numero_identificacion || 'Sin ID'}</div>
      </td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-slate-600 hidden sm:table-cell">${fechaVisual}</td>
      <td class="px-4 md:px-6 py-3 md:py-4"><span class="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">${j.categoria}</span></td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-slate-600">${j.telefono || '-'}</td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-center">
        <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${estado.color}">${estado.texto}</span>
      </td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-center">
        <div class="flex justify-center gap-2">
          <button onclick="editarJugador(${j.id})" class="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition" title="Editar"><i class="ph ph-pencil-simple text-lg"></i></button>
          <button onclick="eliminarJugador(${j.id})" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition" title="Eliminar"><i class="ph ph-trash text-lg"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Actualizar Paginación
  if (infoPaginacion) infoPaginacion.innerText = `Página ${paginaActual} de ${totalPages} (${totalItems} registros)`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

function actualizarEstadisticas() {
  const total = todosLosJugadores.length;
  const pagados = todosLosJugadores.filter(j => Number(j.mensualidad) >= MENSUALIDAD_OBJETIVO).length;
  
  const elTotal = document.getElementById('stat-total');
  const elPagados = document.getElementById('stat-pagados');
  const elPend = document.getElementById('stat-pendientes');

  if(elTotal) elTotal.innerText = total;
  if(elPagados) elPagados.innerText = pagados;
  if(elPend) elPend.innerText = total - pagados;
}

// ==========================
// MODAL & ACCIONES
// ==========================
function abrirModal() {
  if (!form) return;
  form.reset();
  document.getElementById('jugador-id').value = '';
  document.getElementById('modal-title').innerText = 'Registrar Jugador';
  document.getElementById('modal-icon').className = 'ph ph-user-plus text-blue-600';
  document.getElementById('activo').checked = true;

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    }, 10);
  }
}

function cerrarModal() {
  if (!modal) return;
  if (backdrop) backdrop.classList.add('opacity-0');
  if (panel) {
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
  }
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 200);
}

function editarJugador(id) {
  const jugador = todosLosJugadores.find(j => j.id === id);
  if (!jugador) return;

  document.getElementById('jugador-id').value = jugador.id;
  document.getElementById('nombre').value = jugador.nombre || '';
  document.getElementById('apellidos').value = jugador.apellidos || '';
  document.getElementById('fecha_nacimiento').value = jugador.fecha_nacimiento || '';
  document.getElementById('tipo_identificacion').value = jugador.tipo_identificacion || '';
  document.getElementById('numero_identificacion').value = jugador.numero_identificacion || '';
  document.getElementById('categoria').value = jugador.categoria;
  document.getElementById('telefono').value = jugador.telefono || '';
  document.getElementById('mensualidad').value = jugador.mensualidad;
  document.getElementById('activo').checked = jugador.activo;
  
  document.getElementById('modal-title').innerText = 'Editar Jugador';
  document.getElementById('modal-icon').className = 'ph ph-pencil-simple text-amber-500';

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    }, 10);
  }
}

function mostrarNotificacion(mensaje, tipo = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(mensaje); // Fallback si no existe el contenedor
    return;
  }
  const toast = document.createElement('div');
  
  const estilos = {
    success: 'bg-emerald-500 text-white shadow-emerald-200',
    error: 'bg-rose-500 text-white shadow-rose-200',
    info: 'bg-blue-500 text-white shadow-blue-200'
  };
  const iconos = {
    success: '<i class="ph ph-check-circle text-xl"></i>',
    error: '<i class="ph ph-warning-circle text-xl"></i>',
    info: '<i class="ph ph-info text-xl"></i>'
  };

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 toast-enter ${estilos[tipo]}`;
  toast.innerHTML = `${iconos[tipo]}<span class="font-medium text-sm">${mensaje}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function cambiarPagina(delta) {
  paginaActual += delta;
  renderTabla();
}

// Exportar funciones globales para HTML
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.editarJugador = editarJugador;
window.eliminarJugador = eliminarJugador;
window.cambiarPagina = cambiarPagina;
window.toggleMenu = () => { // Función simple para menú si no se usa otro js
  const menu = document.querySelector('.sidebar-menu');
  const backdrop = document.getElementById('nav-backdrop');
  if(menu && backdrop) {
    menu.classList.toggle('active');
    backdrop.classList.toggle('active');
  }
};