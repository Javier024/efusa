import { getAlertas } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const alertas = await getAlertas();
  const cont = document.getElementById('alertas');

  cont.innerHTML = alertas.map(a => `
    <div class="p-3 bg-red-100 border-l-4 border-red-600 mb-2">
      ⚠ ${a.nombre} debe $${a.deuda}
    </div>
  `).join('');
});
