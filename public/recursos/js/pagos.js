import { getPagos, getJugadores } from './api.js';
import { enviarWhatsApp, mensajePago } from './whatsapp.js';

// ======================================================
// 1. VARIABLES GLOBALES
// ======================================================
let todosLosPagos = [];
let pagosFiltrados = [];
let jugadoresMap = new Map();
let paginaActual = 1;

const itemsPorPagina = 10;

// ======================================================
// 2. ELEMENTOS DOM
// ======================================================
const form = document.getElementById('formPago');
const tabla = document.getElementById('tabla-pagos');
const selectJugador = document.getElementById('jugador_id');
const inputBuscador = document.getElementById('buscador');
const inputInicio = document.getElementById('filtro-inicio');
const inputFin = document.getElementById('filtro-fin');
const totalFiltrado = document.getElementById('total-filtrado');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const infoPaginacion = document.getElementById('info-paginacion');
const paginaTxt = document.getElementById('pagina-actual');
const alerta = document.getElementById('alerta');

// ======================================================
// 3. ALERTAS
// ======================================================
function mostrarAlerta(msg, tipo = 'error') {
  if (!alerta) return;

  alerta.className = 'p-4 border rounded mb-4';
  alerta.classList.add(
    tipo === 'success'
      ? 'bg-green-50 text-green-700 border-green-400'
      : 'bg-red-50 text-red-700 border-red-400'
  );

  alerta.innerHTML = msg;
  alerta.classList.remove('hidden');

  setTimeout(() => alerta.classList.add('hidden'), 3000);
}

// ======================================================
// 4. CÁLCULOS Y PAGINACIÓN
// ======================================================
function calcularTotal() {
  const total = pagosFiltrados.reduce((acc, p) => acc + Number(p.monto), 0);
  if (totalFiltrado) {
    totalFiltrado.innerText = `$${total.toLocaleString('es-CO')}`;
  }
}

function actualizarPaginacion() {
  const totalPaginas = Math.ceil(pagosFiltrados.length / itemsPorPagina) || 1;

  paginaTxt.innerText = `${paginaActual} / ${totalPaginas}`;
  infoPaginacion.innerText = `Mostrando ${pagosFiltrados.length} registros`;

  btnPrev.disabled = paginaActual === 1;
  btnNext.disabled = paginaActual === totalPaginas;
}

// ======================================================
// 5. FILTROS
// ======================================================
function aplicarFiltros() {
  const texto = inputBuscador.value.toLowerCase();
  const inicio = inputInicio.value ? new Date(inputInicio.value) : null;
  const fin = inputFin.value ? new Date(inputFin.value) : null;
  if (fin) fin.setHours(23, 59, 59, 999);

  pagosFiltrados = todosLosPagos.filter(p => {
    const nombre = jugadoresMap.get(p.jugador_id)?.toLowerCase() || '';
    const fecha = new Date(p.fecha_pago);

    if (texto && !nombre.includes(texto)) return false;
    if (inicio && fecha < inicio) return false;
    if (fin && fecha > fin) return false;

    return true;
  });

  paginaActual = 1;
  calcularTotal();
  renderTabla();
}

// ======================================================
// 6. TABLA
// ======================================================
function renderTabla() {
  tabla.innerHTML = '';

  if (!pagosFiltrados.length) {
    tabla.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-gray-400 p-6">
          No hay pagos registrados
        </td>
      </tr>`;
    actualizarPaginacion();
    return;
  }

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const pagina = pagosFiltrados.slice(inicio, inicio + itemsPorPagina);

  pagina.forEach(p => {
    const nombre = jugadoresMap.get(p.jugador_id) || 'Desconocido';

    tabla.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-2">${nombre}</td>
        <td class="px-4 py-2">${new Date(p.fecha_pago).toLocaleDateString('es-CO')}</td>
        <td class="px-4 py-2 uppercase text-xs">${p.tipo || 'Abono'}</td>
        <td class="px-4 py-2 italic text-xs">${p.observacion || '-'}</td>
        <td class="px-4 py-2 font-bold text-green-600">
          $${Number(p.monto).toLocaleString('es-CO')}
        </td>
        <td class="px-4 py-2 text-right">
          <button onclick="enviarPagoWhatsApp('${p.jugador_id}', ${p.monto}, '${p.tipo}')"
            class="text-green-600 hover:text-green-800">
            📲
          </button>
        </td>
        <td class="px-4 py-2 text-right">
          <button onclick="eliminarPago(${p.id})" class="text-red-600">🗑</button>
        </td>
      </tr>
    `;
  });

  actualizarPaginacion();
}

// ======================================================
// 7. CARGA DE DATOS
// ======================================================
async function cargarJugadores() {
  const jugadores = await getJugadores();
  selectJugador.innerHTML =
    '<option value="">Seleccione jugador</option>' +
    jugadores.map(j => `<option value="${j.id}">${j.nombre}</option>`).join('');

  jugadores.forEach(j => jugadoresMap.set(j.id, j));
}

async function cargarPagos() {
  todosLosPagos = await getPagos();
  todosLosPagos.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
  aplicarFiltros();
}

// ======================================================
// 8. WHATSAPP
// ======================================================
window.enviarPagoWhatsApp = (jugadorId, monto, tipo) => {
  const jugador = jugadoresMap.get(Number(jugadorId));
  if (!jugador || !jugador.telefono) {
    return alert('El jugador no tiene teléfono registrado');
  }

  const texto = mensajePago(jugador.nombre, monto, tipo);
  enviarWhatsApp(jugador.telefono, texto);
};

// ======================================================
// 9. GUARDAR PAGO
// ======================================================
form?.addEventListener('submit', async e => {
  e.preventDefault();

  const data = {
    jugador_id: Number(selectJugador.value),
    monto: Number(document.getElementById('monto').value),
    fecha_pago: document.getElementById('fecha').value,
    tipo: document.getElementById('tipo').value,
    observacion: document.getElementById('observacion').value
  };

  await fetch('/api/pagos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  mostrarAlerta('Pago registrado y listo para enviar por WhatsApp', 'success');
  form.reset();
  document.getElementById('fecha').valueAsDate = new Date();
  cargarPagos();
});

// ======================================================
// 10. ELIMINAR
// ======================================================
window.eliminarPago = async id => {
  if (!confirm('¿Eliminar este pago?')) return;

  await fetch(`/api/pagos?id=${id}`, { method: 'DELETE' });
  cargarPagos();
};

// ======================================================
// 11. EVENTOS
// ======================================================
inputBuscador?.addEventListener('input', aplicarFiltros);
inputInicio?.addEventListener('change', aplicarFiltros);
inputFin?.addEventListener('change', aplicarFiltros);

btnPrev?.addEventListener('click', () => {
  if (paginaActual > 1) {
    paginaActual--;
    renderTabla();
  }
});

btnNext?.addEventListener('click', () => {
  const totalPaginas = Math.ceil(pagosFiltrados.length / itemsPorPagina);
  if (paginaActual < totalPaginas) {
    paginaActual++;
    renderTabla();
  }
});

// ======================================================
// 12. INIT
// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('fecha').valueAsDate = new Date();
  await cargarJugadores();
  await cargarPagos();
});
