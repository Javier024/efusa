/* recursos/jugadores.js */

const form = document.getElementById('formJugador');
const tabla = document.getElementById('tabla');
const buscadorInput = document.getElementById('buscador');

let jugadoresData = []; 
let filteredData = []; 
let editando = false;

const itemsPorPagina = 10;
let paginaActual = 1;

// --- LÓGICA PRINCIPAL (CONEXIÓN API) ---

async function cargar() {
  try {
    // Llamamos a tu API real
    const res = await fetch('/api/jugadores');
    
    if (!res.ok) {
      throw new Error('Error de red al cargar');
    }

    const data = await res.json();
    jugadoresData = data; // La API devuelve un array directamente (result.rows)
    
    filtrarYRenderizar(); 
  } catch (error) {
    console.error(error);
    tabla.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-red-500">Error cargando datos del servidor.</td></tr>`;
  }
}

buscadorInput.addEventListener('input', (e) => {
  paginaActual = 1;
  filtrarYRenderizar();
});

function filtrarYRenderizar() {
  const termino = buscadorInput.value.toLowerCase();
  filteredData = jugadoresData.filter(j => 
    j.nombre.toLowerCase().includes(termino) || 
    (j.identificacion && j.identificacion.toString().includes(termino))
  );
  renderTable();
  updatePaginationControls();
}

function renderTable() {
  tabla.innerHTML = '';
  if (filteredData.length === 0) {
    tabla.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-gray-400">No se encontraron jugadores.</td></tr>`;
    return;
  }

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const paginaDatos = filteredData.slice(inicio, fin);

  paginaDatos.forEach(j => {
    // Aseguramos que existan las propiedades de estadísticas
    const goles = j.goles || 0;
    const asistencias = j.asistencias || 0;
    const pj = j.partidos_jugados || 0;
    const amarillas = j.tarjetas_amarillas || 0;
    const rojas = j.tarjetas_rojas || 0;

    const tarjetaHTML = (amarillas > 0 ? `<span class="inline-block w-2 h-2 rounded-full bg-yellow-400" title="Amarillas"></span>` : '') + 
                          (rojas > 0 ? `<span class="inline-block w-2 h-2 rounded-full bg-red-600 ml-1" title="Rojas"></span>` : '') +
                          (amarillas === 0 && rojas === 0 ? '-' : '');

    tabla.innerHTML += `
      <tr class="hover:bg-gray-50 group">
        <td class="p-3 text-gray-500 font-mono text-xs">${j.identificacion || '-'}</td>
        
        <td class="p-3">
          <div class="font-bold text-gray-800">${j.nombre}</div>
        </td>
        
        <td class="p-3 text-gray-500 text-xs">${j.telefono || '-'}</td>

        <td class="p-3"><span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">${j.tipo_sangre || '-'}</span></td>

        <td class="p-3"><span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">${j.categoria}</span></td>
        
        <td class="p-3 text-center font-bold text-green-700 compact-cell">${goles}</td>
        <td class="p-3 text-center text-gray-600 compact-cell">${asistencias}</td>
        <td class="p-3 text-center text-gray-600 compact-cell">${pj}</td>
        
        <td class="p-3 text-center text-sm">${tarjetaHTML}</td>
        
        <td class="p-3 text-right">
          <div class="flex justify-end gap-1">
            <button onclick='editar(${JSON.stringify(j)})' class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><i class="ph ph-pencil-simple text-lg"></i></button>
            <button onclick='eliminarJugador(${j.id})' class="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><i class="ph ph-trash text-lg"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
}

function changePage(delta) {
  const maxPagina = Math.ceil(filteredData.length / itemsPorPagina);
  const nuevaPag = paginaActual + delta;
  if (nuevaPag >= 1 && nuevaPag <= maxPagina) {
    paginaActual = nuevaPag;
    renderTable();
    updatePaginationControls();
  }
}

function updatePaginationControls() {
  const maxPagina = Math.ceil(filteredData.length / itemsPorPagina) || 1;
  const inicio = (paginaActual - 1) * itemsPorPagina + 1;
  const fin = Math.min(paginaActual * itemsPorPagina, filteredData.length);
  document.getElementById('pagina-actual').innerText = `${paginaActual} / ${maxPagina}`;
  document.getElementById('info-paginacion').innerText = `Mostrando ${filteredData.length > 0 ? inicio : 0}-${fin} de ${filteredData.length}`;
  document.getElementById('btn-prev').disabled = paginaActual === 1;
  document.getElementById('btn-next').disabled = paginaActual === maxPagina;
}

// --- CRUD (API) ---

window.editar = function (j) {
  editando = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  document.getElementById('id').value = j.id;
  document.getElementById('nombre').value = j.nombre;
  // Asegurar formato de fecha YYYY-MM-DD para el input type="date"
  document.getElementById('fecha_nacimiento').value = j.fecha_nacimiento ? j.fecha_nacimiento.split('T')[0] : '';
  document.getElementById('identificacion').value = j.identificacion || '';
  document.getElementById('categoria').value = j.categoria || '';
  document.getElementById('acudiente').value = j.nombre_acudiente || '';
  document.getElementById('telefono').value = j.telefono || '';
  document.getElementById('direccion').value = j.direccion || '';
  document.getElementById('sangre').value = j.tipo_sangre || '';
  
  document.getElementById('goles').value = j.goles || 0;
  document.getElementById('asistencias').value = j.asistencias || 0;
  document.getElementById('partidos').value = j.partidos_jugados || 0;
  document.getElementById('amarillas').value = j.tarjetas_amarillas || 0;
  document.getElementById('rojas').value = j.tarjetas_rojas || 0;

  document.getElementById('form-title').innerText = "Editar Jugador";
  document.getElementById('form-title').classList.add('text-blue-600');
  document.getElementById('btn-submit').innerHTML = `<i class="ph ph-arrows-clockwise text-lg"></i> <span>Actualizar</span>`;
  document.getElementById('btn-submit').classList.replace('bg-green-600', 'bg-blue-600');
  document.getElementById('btn-cancelar').classList.remove('hidden');
};

window.resetForm = function () {
  editando = false;
  form.reset();
  document.getElementById('id').value = '';
  document.getElementById('goles').value = 0;
  document.getElementById('asistencias').value = 0;
  document.getElementById('partidos').value = 0;
  document.getElementById('amarillas').value = 0;
  document.getElementById('rojas').value = 0;
  
  document.getElementById('form-title').innerText = "Nuevo Jugador";
  document.getElementById('btn-submit').innerHTML = `<i class="ph ph-floppy-disk text-lg"></i> <span>Guardar</span>`;
  document.getElementById('btn-submit').classList.replace('bg-blue-600', 'bg-green-600');
  document.getElementById('btn-cancelar').classList.add('hidden');
};

window.eliminarJugador = async function (id) {
  if (!confirm('¿Eliminar este jugador?')) return;
  
  try {
    await fetch(`/api/jugadores?id=${id}`, { method: 'DELETE' });
    cargar();
  } catch (error) {
    alert('Error al eliminar');
  }
};

// --- FORMULARIO (API) ---
form.onsubmit = async e => {
  e.preventDefault();
  const btn = document.getElementById('btn-submit');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i>`;

  const idValue = document.getElementById('id').value;

  const data = {
    nombre: document.getElementById('nombre').value,
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    identificacion: document.getElementById('identificacion').value,
    categoria: document.getElementById('categoria').value, // Campo importante que faltaba en algunos ejemplos
    nombre_acudiente: document.getElementById('acudiente').value,
    telefono: document.getElementById('telefono').value,
    direccion: document.getElementById('direccion').value,
    tipo_sangre: document.getElementById('sangre').value,
    goles: parseInt(document.getElementById('goles').value) || 0,
    asistencias: parseInt(document.getElementById('asistencias').value) || 0,
    partidos_jugados: parseInt(document.getElementById('partidos').value) || 0,
    tarjetas_amarillas: parseInt(document.getElementById('amarillas').value) || 0,
    tarjetas_rojas: parseInt(document.getElementById('rojas').value) || 0,
    activo: true
  };

  try {
    const response = await fetch('/api/jugadores', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorInfo = await response.json();
      throw new Error(errorInfo.detalle || errorInfo.error || 'Error en el servidor');
    }

    resetForm();
    cargar();
    
  } catch (error) {
    console.error("Error:", error);
    alert('Hubo un problema: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};

window.exportToExcel = function() {
  if (filteredData.length === 0) return alert("No hay datos para exportar");
  
  const dataToExport = filteredData.map(j => ({
    ID: j.identificacion,
    Nombre: j.nombre,
    Telefono: j.telefono,
    Sangre: j.tipo_sangre,
    Categoria: j.categoria,
    Goles: j.goles,
    Asistencias: j.asistencias,
    Partidos: j.partidos_jugados,
    Amarillas: j.tarjetas_amarillas,
    Rojas: j.tarjetas_rojas,
    Acudiente: j.nombre_acudiente,
    Direccion: j.direccion
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jugadores");
  XLSX.writeFile(wb, "Jugadores_EFUSA_Completo.xlsx");
}

document.addEventListener('DOMContentLoaded', cargar);