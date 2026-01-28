import { getAlertas } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cont = document.getElementById('alertas');
  if (!cont) return;

  try {
    const alertas = await getAlertas();

    if (!alertas.length) {
      cont.innerHTML = `
        <div class="p-3 bg-green-100 border-l-4 border-green-600">
          ✅ No hay jugadores con deuda
        </div>
      `;
      return;
    }

    cont.innerHTML = alertas.map(a => `
      <div class="p-3 bg-red-100 border-l-4 border-red-600 mb-2">
        ⚠ ${a.nombre} debe $${a.deuda}
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando alertas:', error);
    cont.innerHTML = `
      <div class="p-3 bg-yellow-100 border-l-4 border-yellow-600">
        ⚠ Error cargando alertas
      </div>
    `;
  }
});

