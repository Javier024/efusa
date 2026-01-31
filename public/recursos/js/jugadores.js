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

// ==========================================
// NUEVAS FUNCIONES DE FECHA (CORREGIDAS)
// ==========================================

/**
 * 1. Para la TABLA: Devuelve formato "12/07/1999"
 * Parseamos la fecha manualmente para evitar errores de zona horaria (UTC vs Local).
 */
function formatearFechaTabla(fechaIso) {
  if (!fechaIso) return '-';

  try {
    // 1. Cortar la hora (si viene: 1999-07-12T00:00:00Z -> 1999-07-12)
    const fechaLimpia = fechaIso.split('T')[0];
    
    // 2. Separar año, mes, día
    const partes = fechaLimpia.split('-');
    if (partes.length !== 3) return fechaIso;

    // 3. Crear objeto Fecha asegurando que sea hora local (no UTC)
    // Restamos 1 al mes porque en JS Enero es 0
    const fechaObjeto = new Date(partes[0], partes[1] - 1, partes[2]);

    // 4. Formatear usando localización de Colombia
    return fechaObjeto.toLocaleDateString('es-CO');
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return fechaIso; // Retorna original si falla
  }
}

/**
 * 2. Para el INPUT de edición: Devuelve formato "1999-07-12"
 * El calendario HTML <input type="date"> REQUIERE este formato obligatoriamente.
 * Si intentas poner "12/07/1999" aquí, el calendario se vaciará.
 */
function formatearFechaInput(fechaIso) {
  if (!fechaIso) return '';
  // Solo necesitamos la parte de la fecha, ignoramos la hora Z
  return fechaIso.split('T')[0];
}

// ==========================
// CONSTANTES
// ==========================
const MENSUALIDAD_OBJETIVO = 50000;
const FILAS_POR_PAGINA = 5;

// ==========================
// ESTADO GLOBAL
// ==========================
let todosLosJugadores = [];
let paginaActual = 1;

// ELEMENTOS DOM
let modal, backdrop, panel, form, tbody, infoPaginacion, btnPrev, btnNext;

document.addEventListener('DOMContentLoaded', () => {
  modal = document.getElementById('modal-jugador');
  backdrop = document.getElementById('modal-backdrop'); 
  panel = document.getElementById('modal-panel'); 
  form = document.getElementById('formJugador');
  tbody = document.getElementById('tabla-jugadores');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');

  if (form) form.addEventListener('submit', guardarJugador);
  
  if (modal && backdrop) {
    backdrop.addEventListener('click', cerrarModal);
  }

  cargarJugadores();
});

// ==========================
// LÓGICA DE DATOS
// ==========================

async function cargarJugadores() {
  try {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400"><i class="ph ph-spinner animate-spin text-2xl"></i> Cargando...</td></tr>';
    const data = await apiFetch('/jugadores');
    todosLosJugadores = Array.isArray(data) ? data : [];
    actualizarEstadisticas();
    renderTabla();
  } catch (error) {
    console.error('Error cargando:', error);
    mostrarNotificacion('Error al cargar los jugadores', 'error');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error de conexión con el servidor.</td></tr>`;
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
      await apiFetch(`/jugadores?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...payload, id })
      });
      mostrarNotificacion('Jugador actualizado correctamente');
    } else {
      await apiFetch('/jugadores', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      mostrarNotificacion('Jugador registrado correctamente');
    }
    
    cerrarModal();
    cargarJugadores();

  } catch (error) {
    console.error('Error guardando:', error);
    const msgError = error.message || 'Ocurrió un error inesperado';
    mostrarNotificacion('Error: ' + msgError, 'error');
  }
}

async function eliminarJugador(id) {
  const confirmar = confirm("¿Estás seguro de eliminar este jugador? Esta acción no se puede deshacer.");
  if (!confirmar) return;

  try {
    await apiFetch(`/jugadores?id=${id}`, { method: 'DELETE' });
    mostrarNotificacion('Jugador eliminado', 'info');
    cargarJugadores();
  } catch (error) {
    mostrarNotificacion('Error al eliminar: ' + error.message, 'error');
  }
}

// ==========================
// LÓGICA DE PRESENTACIÓN
// ==========================

function calcularEstado(pagado) {
  if (pagado >= MENSUALIDAD_OBJETIVO) {
    return { texto: 'Pagado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  } else if (pagado > 0) {
    const faltante = MENSUALIDAD_OBJETIVO - pagado;
    return { texto: `Abono ($${faltante})`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
  } else {
    return { texto: 'Pendiente', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
}

function renderTabla() {
  if (!tbody) return;

  tbody.innerHTML = '';
  
  const totalItems = todosLosJugadores.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;
  
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const jugadoresPagina = todosLosJugadores.slice(inicio, fin);

  if (jugadoresPagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">No hay jugadores registrados.</td></tr>`;
  } else {
    jugadoresPagina.forEach(j => {
      const estado = calcularEstado(j.mensualidad);
      
      // --- USAMOS LA NUEVA FUNCIÓN PARA MOSTRAR 12/07/1999 ---
      const fechaVisual = formatearFechaTabla(j.fecha_nacimiento);

      const nombreCompleto = `${j.apellidos || ''} ${j.nombre || ''}`.trim();
      
      let idInfo = '';
      if (j.tipo_identificacion || j.numero_identificacion) {
        const tipoShort = j.tipo_identificacion ? j.tipo_identificacion.split(' ')[0] : '';
        idInfo = `<span class="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 w-fit"><i class="ph ph-identification-card"></i> ${tipoShort} ${j.numero_identificacion || ''}</span>`;
      }

      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition duration-150";
      
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900 text-base">${nombreCompleto}</div>
          <div class="mt-1">${idInfo}</div>
        </td>
        <td class="px-6 py-4 text-slate-600">
          ${fechaVisual}
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">${j.categoria}</span>
        </td>
        <td class="px-6 py-4 text-slate-600">
          <div class="flex items-center gap-1">
            <i class="ph ph-phone text-slate-400"></i>
            ${j.telefono || '-'}
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex flex-col items-center gap-1">
            <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${estado.color}">
              ${estado.texto}
            </span>
            <span class="text-[10px] text-slate-400">Pagado: $${Number(j.mensualidad).toLocaleString()}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-2">
            <button onclick="editarJugador(${j.id})" class="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition" title="Editar">
              <i class="ph ph-pencil-simple text-lg"></i>
            </button>
            <button onclick="eliminarJugador(${j.id})" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition" title="Eliminar">
              <i class="ph ph-trash text-lg"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (infoPaginacion) infoPaginacion.innerText = `Página ${paginaActual} de ${totalPages} (${totalItems} registros)`;
  if (btnPrev) btnPrev.disabled = paginaActual === 1;
  if (btnNext) btnNext.disabled = paginaActual === totalPages;
}

function actualizarEstadisticas() {
  const statTotal = document.getElementById('stat-total');
  const statPagados = document.getElementById('stat-pagados');
  const statPendientes = document.getElementById('stat-pendientes');
  
  if (!statTotal) return;

  const total = todosLosJugadores.length;
  const pagados = todosLosJugadores.filter(j => Number(j.mensualidad) >= MENSUALIDAD_OBJETIVO).length;
  const pendientes = total - pagados;

  statTotal.innerText = total;
  statPagados.innerText = pagados;
  statPendientes.innerText = pendientes;
}

// ==========================
// CONTROL DEL MODAL
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
};

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
};

function editarJugador(id) {
  const jugador = todosLosJugadores.find(j => j.id === id);
  if (!jugador) return;

  document.getElementById('jugador-id').value = jugador.id;
  document.getElementById('nombre').value = jugador.nombre || '';
  document.getElementById('apellidos').value = jugador.apellidos || '';
  
  // --- USAMOS LA FUNCIÓN PARA EL INPUT (1999-07-12) ---
  // Recordatorio: El input type="date" SIEMPRE mostrará esto.
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
    modal.classList.add('flex');
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    }, 10);
  }
};

function cambiarPagina(delta) {
  paginaActual += delta;
  renderTabla();
};

// ==========================
// EXPORTAR FUNCIONES A WINDOW
// ==========================
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.editarJugador = editarJugador;
window.eliminarJugador = eliminarJugador;
window.cambiarPagina = cambiarPagina;