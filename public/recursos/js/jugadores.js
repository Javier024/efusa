import { apiFetch } from './configuracion.js';

// CONSTANTES
const MENSUALIDAD_OBJETIVO = 50000;
const FILAS_POR_PAGINA = 5;

// ESTADO GLOBAL
let todosLosJugadores = [];
let paginaActual = 1;

// ELEMENTOS DOM (Se declaran vacíos aquí)
let modal, backdrop, panel, form, tbody, infoPaginacion, btnPrev, btnNext;

document.addEventListener('DOMContentLoaded', () => {
  // INICIALIZACIÓN SEGURA
  modal = document.getElementById('modal-jugador');
  backdrop = document.getElementById('modal-backdrop'); // Fondo oscuro
  panel = document.getElementById('modal-panel'); // Caja blanca del modal
  form = document.getElementById('formJugador');
  tbody = document.getElementById('tabla-jugadores');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');

  // Asignar eventos
  if (form) form.addEventListener('submit', guardarJugador);
  
  // Cerrar modal al hacer click en el fondo oscuro
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
    const data = await apiFetch('/jugadores');
    todosLosJugadores = Array.isArray(data) ? data : [];
    
    actualizarEstadisticas();
    renderTabla();
  } catch (error) {
    console.error('Error cargando:', error);
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error al cargar datos.</td></tr>`;
  }
}

async function guardarJugador(e) {
  e.preventDefault();
  
  const id = document.getElementById('jugador-id').value;
  const esEdicion = !!id;
  
  const payload = {
    nombre: document.getElementById('nombre').value,
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
    } else {
      await apiFetch('/jugadores', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    
    cerrarModal();
    cargarJugadores();
    alert(esEdicion ? '✅ Jugador actualizado' : '✅ Jugador registrado');

  } catch (error) {
    console.error('Error guardando:', error);
    alert('❌ Error: ' + error.message);
  }
}

async function eliminarJugador(id) {
  if (!confirm('¿Estás seguro de eliminar este jugador?')) return;

  try {
    await apiFetch(`/jugadores?id=${id}`, { method: 'DELETE' });
    cargarJugadores();
    alert('🗑️ Jugador eliminado');
  } catch (error) {
    alert('❌ Error al eliminar: ' + error.message);
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No hay jugadores registrados.</td></tr>`;
  } else {
    jugadoresPagina.forEach(j => {
      const estado = calcularEstado(j.mensualidad);
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition duration-150";
      
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="font-medium text-slate-900">${j.nombre}</div>
          <div class="text-xs text-slate-500">ID: ${j.id}</div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">${j.categoria}</span>
        </td>
        <td class="px-6 py-4 text-slate-600">${j.telefono || '-'}</td>
        <td class="px-6 py-4 text-center">
          <div class="flex flex-col items-center gap-1">
            <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${estado.color}">
              ${estado.texto}
            </span>
            <span class="text-xs text-slate-400">Pagado: $${j.mensualidad.toLocaleString()}</span>
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
  const pagados = todosLosJugadores.filter(j => j.mensualidad >= MENSUALIDAD_OBJETIVO).length;
  const pendientes = total - pagados;

  statTotal.innerText = total;
  statPagados.innerText = pagados;
  statPendientes.innerText = pendientes;
}

// ==========================
// CONTROL DEL MODAL (CON ANIMACIÓN)
// ==========================

window.abrirModal = function() {
  if (!form) return;
  form.reset();
  document.getElementById('jugador-id').value = '';
  
  // Cambiar textos de cabecera del modal
  document.getElementById('modal-title').innerText = 'Registrar Jugador';
  document.getElementById('modal-icon').className = 'ph ph-user-plus text-blue-600';

  // Mostrar modal (Flex para centrar)
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Animación de entrada
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    }, 10); // Pequeño delay para permitir la transición CSS
  }
};

window.cerrarModal = function() {
  if (!modal) return;

  // Animación de salida
  if (backdrop) backdrop.classList.add('opacity-0');
  if (panel) {
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
  }

  // Esperar a que termine la animación para ocultar el DOM
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 200);
};

window.editarJugador = function(id) {
  const jugador = todosLosJugadores.find(j => j.id === id);
  if (!jugador) return;

  // Llenar formulario
  document.getElementById('jugador-id').value = jugador.id;
  document.getElementById('nombre').value = jugador.nombre;
  document.getElementById('categoria').value = jugador.categoria;
  document.getElementById('telefono').value = jugador.telefono || '';
  document.getElementById('mensualidad').value = jugador.mensualidad;
  document.getElementById('activo').checked = jugador.activo;
  
  // Cambiar textos de cabecera del modal (Edición)
  document.getElementById('modal-title').innerText = 'Editar Jugador';
  document.getElementById('modal-icon').className = 'ph ph-pencil-simple text-amber-500';

  // Mostrar modal
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Animación de entrada
    setTimeout(() => {
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    }, 10);
  }
};

window.cambiarPagina = function(delta) {
  paginaActual += delta;
  renderTabla();
};