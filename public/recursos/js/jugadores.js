import { apiFetch } from './configuracion.js';

// CONSTANTES
const MENSUALIDAD_OBJETIVO = 50000;
const FILAS_POR_PAGINA = 5;

// ESTADO GLOBAL
let todosLosJugadores = [];
let paginaActual = 1;

// ELEMENTOS DOM (Se declaran vacíos aquí para que sean globales)
let modal, form, tbody, infoPaginacion, btnPrev, btnNext;

document.addEventListener('DOMContentLoaded', () => {
  // INICIALIZACIÓN SEGURA (Solo busca elementos cuando el HTML está listo)
  modal = document.getElementById('modal-jugador');
  form = document.getElementById('formJugador');
  tbody = document.getElementById('tabla-jugadores');
  infoPaginacion = document.getElementById('info-paginacion');
  btnPrev = document.getElementById('btn-prev');
  btnNext = document.getElementById('btn-next');

  // Verificar que existan antes de agregar eventos
  if (form) form.addEventListener('submit', guardarJugador);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarModal();
    });
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
    return { texto: 'Pagado', color: 'bg-green-100 text-green-700 border-green-200' };
  } else if (pagado > 0) {
    const faltante = MENSUALIDAD_OBJETIVO - pagado;
    return { texto: `Abono ($${faltante})`, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  } else {
    return { texto: 'Pendiente', color: 'bg-red-100 text-red-700 border-red-200' };
  }
}

function renderTabla() {
  if (!tbody) return; // Seguridad

  tbody.innerHTML = '';
  
  const totalItems = todosLosJugadores.length;
  const totalPages = Math.ceil(totalItems / FILAS_POR_PAGINA) || 1;
  
  if (paginaActual > totalPages) paginaActual = totalPages;
  if (paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = inicio + FILAS_POR_PAGINA;
  const jugadoresPagina = todosLosJugadores.slice(inicio, fin);

  if (jugadoresPagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">No hay jugadores registrados.</td></tr>`;
  } else {
    jugadoresPagina.forEach(j => {
      const estado = calcularEstado(j.mensualidad);
      const tr = document.createElement('tr');
      tr.className = "hover:bg-gray-50 transition";
      
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="font-medium text-gray-900">${j.nombre}</div>
          <div class="text-xs text-gray-500">ID: ${j.id}</div>
        </td>
        <td class="px-6 py-4">
          <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">${j.categoria}</span>
        </td>
        <td class="px-6 py-4 text-gray-600">${j.telefono || '-'}</td>
        <td class="px-6 py-4 text-center">
          <div class="flex flex-col items-center gap-1">
            <span class="px-2 py-1 rounded-full text-xs font-bold border ${estado.color}">
              ${estado.texto}
            </span>
            <span class="text-xs text-gray-400">Pagado: $${j.mensualidad.toLocaleString()}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-2">
            <button onclick="editarJugador(${j.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
              <i class="ph ph-pencil-simple text-lg"></i>
            </button>
            <button onclick="eliminarJugador(${j.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
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
  // Usamos getElementById aquí porque las variables globales podrían no estar listas si se llama antes de DOMContentLoaded
  const statTotal = document.getElementById('stat-total');
  const statPagados = document.getElementById('stat-pagados');
  const statPendientes = document.getElementById('stat-pendientes');

  if (!statTotal) return; // Si no existen los elementos en HTML, salimos sin error

  const total = todosLosJugadores.length;
  const pagados = todosLosJugadores.filter(j => j.mensualidad >= MENSUALIDAD_OBJETIVO).length;
  const pendientes = total - pagados;

  statTotal.innerText = total;
  statPagados.innerText = pagados;
  statPendientes.innerText = pendientes;
}

// ==========================
// MODAL Y PAGINACIÓN
// ==========================

window.abrirModal = function() {
  if (!form) return;
  form.reset();
  document.getElementById('jugador-id').value = '';
  document.getElementById('modal-title').innerText = 'Registrar Jugador';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.cerrarModal = function() {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

window.editarJugador = function(id) {
  const jugador = todosLosJugadores.find(j => j.id === id);
  if (!jugador) return;

  document.getElementById('jugador-id').value = jugador.id;
  document.getElementById('nombre').value = jugador.nombre;
  document.getElementById('categoria').value = jugador.categoria;
  document.getElementById('telefono').value = jugador.telefono || '';
  document.getElementById('mensualidad').value = jugador.mensualidad;
  document.getElementById('activo').checked = jugador.activo;
  
  document.getElementById('modal-title').innerText = 'Editar Jugador';
  
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.cambiarPagina = function(delta) {
  paginaActual += delta;
  renderTabla();
};