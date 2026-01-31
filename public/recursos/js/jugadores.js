// public/recursos/js/jugadores.js
import { apiFetch } from './configuracion.js';

// ==========================
// UTILIDADES
// ==========================
function mostrarNotificacion(mensaje, tipo = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) {
    if(tipo === 'error') alert('❌ ' + mensaje);
    else alert('✅ ' + mensaje);
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
  toast.innerHTML = `
    ${iconos[tipo]}
    <span class="font-medium text-sm">${mensaje}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Funciones de Fecha
function formatearFechaTabla(fechaIso) {
  if (!fechaIso) return '-';
  try {
    const fechaLimpia = fechaIso.split('T')[0];
    const partes = fechaLimpia.split('-');
    if (partes.length !== 3) return fechaIso;
    const fechaObjeto = new Date(partes[0], partes[1] - 1, partes[2]);
    return fechaObjeto.toLocaleDateString('es-CO');
  } catch (error) {
    return fechaIso;
  }
}

function formatearFechaInput(fechaIso) {
  if (!fechaIso) return '';
  return fechaIso.split('T')[0];
}

// ==========================
// CONSTANTES & ESTADO
// ==========================
const MENSUALIDAD_OBJETIVO = 50000;
const FILAS_POR_PAGINA = 5;
let todosLosJugadores = [];
let paginaActual = 1;

// ELEMENTOS DOM
let modal, backdrop, panel, form, tbody, containerMovil, infoPaginacion, infoPaginacionMovil, btnPrev, btnNext, btnPrevMovil, btnNextMovil;

document.addEventListener('DOMContentLoaded', () => {
  modal = document.getElementById('modal-jugador');
  backdrop = document.getElementById('modal-backdrop'); 
  panel = document.getElementById('modal-panel'); 
  form = document.getElementById('formJugador');
  tbody = document.getElementById('tabla-jugadores');
  containerMovil = document.getElementById('vista-movil');
  infoPaginacion = document.getElementById('info-paginacion');
  infoPaginacionMovil = document.getElementById('info-paginacion-mobile');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');
  btnPrevMovil = document.getElementById('btn-prev-mobile');
  btnNextMovil = document.getElementById('btn-next-mobile');

  if (form) form.addEventListener('submit', guardarJugador);
  if (modal && backdrop) backdrop.addEventListener('click', cerrarModal);
  cargarJugadores();
});

// ==========================
// DATOS
// ==========================
async function cargarJugadores() {
  try {
    const data = await apiFetch('/jugadores');
    todosLosJugadores = Array.isArray(data) ? data : [];
    actualizarEstadisticas();
    renderTabla();
  } catch (error) {
    console.error('Error cargando:', error);
    mostrarNotificacion('Error al cargar jugadores', 'error');
  }
}

async function guardarJugador(e) {
  e.preventDefault();
  const id = document.getElementById('jugador-id').value;
  const esEdicion = !!id;
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
      await apiFetch(`/jugadores?id=${id}`, { method: 'PUT', body: JSON.stringify({ ...payload, id }) });
      mostrarNotificacion('Jugador actualizado');
    } else {
      await apiFetch('/jugadores', { method: 'POST', body: JSON.stringify(payload) });
      mostrarNotificacion('Jugador registrado');
    }
    cerrarModal();
    cargarJugadores();
  } catch (error) {
    mostrarNotificacion('Error: ' + error.message, 'error');
  }
}

async function eliminarJugador(id) {
  if (!confirm("¿Eliminar jugador? No se puede deshacer.")) return;
  try {
    await apiFetch(`/jugadores?id=${id}`, { method: 'DELETE' });
    mostrarNotificacion('Jugador eliminado', 'info');
    cargarJugadores();
  } catch (error) {
    mostrarNotificacion('Error al eliminar', 'error');
  }
}

// ==========================
// RENDERIZADO RESPONSIVO
// ==========================
function calcularEstado(pagado) {
  if (pagado >= MENSUALIDAD_OBJETIVO) return { texto: 'Pagado', color: 'bg-emerald-100 text-emerald-700' };
  else if (pagado > 0) return { texto: 'Abono', color: 'bg-amber-100 text-amber-700' };
  else return { texto: 'Pendiente', color: 'bg-rose-100 text-rose-700' };
}

function renderTabla() {
  if (!tbody || !containerMovil) return;

  // Limpiar ambas vistas
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
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">No hay registros.</td></tr>`;
    containerMovil.innerHTML = `<div class="text-center py-8 text-slate-400">No hay registros.</div>`;
  } else {
    // RENDERIZAR ESCRITORIO
    datosPagina.forEach(j => {
      const estado = calcularEstado(j.mensualidad);
      const fechaVisual = formatearFechaTabla(j.fecha_nacimiento);
      const nombreCompleto = `${j.apellidos || ''} ${j.nombre || ''}`.trim();
      
      // Info ID simplificada
      let idInfo = j.numero_identificacion 
        ? `<div class="mt-1 text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded inline-block border border-slate-100">${j.numero_identificacion}</div>` 
        : '';

      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition duration-150";
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900 text-base">${nombreCompleto}</div>
          ${idInfo}
        </td>
        <td class="px-6 py-4 text-slate-600">${fechaVisual}</td>
        <td class="px-6 py-4"><span class="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">${j.categoria}</span></td>
        <td class="px-6 py-4 text-slate-600">${j.telefono || '-'}</td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${estado.color}">${estado.texto}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-2">
            <button onclick="editarJugador(${j.id})" class="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><i class="ph ph-pencil-simple text-lg"></i></button>
            <button onclick="eliminarJugador(${j.id})" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg"><i class="ph ph-trash text-lg"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // RENDERIZAR MÓVIL (TARJETAS)
    datosPagina.forEach(j => {
      const estado = calcularEstado(j.mensualidad);
      const fechaVisual = formatearFechaTabla(j.fecha_nacimiento);
      const nombreCompleto = `${j.apellidos || ''} ${j.nombre || ''}`.trim();
      
      const card = document.createElement('div');
      card.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative";
      card.innerHTML = `
        <!-- Header Tarjeta -->
        <div class="flex justify-between items-start mb-4">
          <div class="pr-2">
            <h3 class="font-bold text-slate-900 text-lg leading-tight">${nombreCompleto}</h3>
            <p class="text-xs text-slate-500 mt-1"><i class="ph ph-tag"></i> ${j.categoria}</p>
          </div>
          <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${estado.color} shrink-0">
            ${estado.texto}
          </span>
        </div>
        
        <!-- Detalles Grid -->
        <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mb-4">
          <div class="flex flex-col">
            <span class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Teléfono</span>
            <span class="font-medium text-slate-700"><i class="ph ph-phone text-blue-500"></i> ${j.telefono}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Nacimiento</span>
            <span class="font-medium text-slate-700"><i class="ph ph-calendar text-blue-500"></i> ${fechaVisual}</span>
          </div>
          ${j.numero_identificacion ? `
          <div class="col-span-2 flex flex-col">
             <span class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Identificación</span>
             <span class="font-medium text-slate-700 truncate">${j.tipo_identificacion} - ${j.numero_identificacion}</span>
          </div>` : ''}
        </div>

        <!-- Botones Acción -->
        <div class="flex gap-3 pt-3 border-t border-slate-50">
          <button onclick="editarJugador(${j.id})" class="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100 transition">
            <i class="ph ph-pencil-simple text-lg"></i> Editar
          </button>
          <button onclick="eliminarJugador(${j.id})" class="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-50 text-rose-600 font-medium text-sm hover:bg-rose-100 transition">
            <i class="ph ph-trash text-lg"></i> Eliminar
          </button>
        </div>
      `;
      containerMovil.appendChild(card);
    });
  }

  // Actualizar textos y botones de paginación (ambas vistas)
  const info = `Pág ${paginaActual}/${totalPages}`;
  if (infoPaginacion) infoPaginacion.innerText = info;
  if (infoPaginacionMovil) infoPaginacionMovil.innerText = info;

  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
  if (btnPrevMovil) btnPrevMovil.disabled = paginaActual === 1;
  if (btnNextMovil) btnNextMovil.disabled = paginaActual === totalPages;
}

function actualizarEstadisticas() {
  const total = todosLosJugadores.length;
  const pagados = todosLosJugadores.filter(j => Number(j.mensualidad) >= MENSUALIDAD_OBJETIVO).length;
  const pendientes = total - pagados;

  const elTotal = document.getElementById('stat-total');
  if (elTotal) elTotal.innerText = total;
  const elPagados = document.getElementById('stat-pagados');
  if (elPagados) elPagados.innerText = pagados;
  const elPend = document.getElementById('stat-pendientes');
  if (elPend) elPend.innerText = pendientes;
}

// ==========================
// MODAL
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
    // Animación de entrada diferente para móvil vs escritorio
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('opacity-0', 'translate-y-full', 'sm:translate-y-4', 'scale-95');
        panel.classList.add('opacity-100', 'translate-y-0', 'sm:translate-y-0', 'scale-100');
      }
    }, 10); 
  }
};

function cerrarModal() {
  if (!modal) return;
  if (backdrop) backdrop.classList.add('opacity-0');
  if (panel) {
    panel.classList.add('opacity-0', 'translate-y-full', 'sm:translate-y-4', 'scale-95');
    panel.classList.remove('opacity-100', 'translate-y-0', 'sm:translate-y-0', 'scale-100');
  }
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
};

function editarJugador(id) {
  const jugador = todosLosJugadores.find(j => j.id === id);
  if (!jugador) return;

  document.getElementById('jugador-id').value = jugador.id;
  document.getElementById('nombre').value = jugador.nombre || '';
  document.getElementById('apellidos').value = jugador.apellidos || '';
  document.getElementById('fecha_nacimiento').value = formatearFechaInput(jugador.fecha_nacimiento) || '';
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
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('opacity-0', 'translate-y-full', 'sm:translate-y-4', 'scale-95');
        panel.classList.add('opacity-100', 'translate-y-0', 'sm:translate-y-0', 'scale-100');
      }
    }, 10);
  }
};

function cambiarPagina(delta) {
  paginaActual += delta;
  renderTabla();
  // En móvil, hacemos scroll al inicio de la lista al cambiar página
  if (window.innerWidth < 768) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.editarJugador = editarJugador;
window.eliminarJugador = eliminarJugador;
window.cambiarPagina = cambiarPagina;