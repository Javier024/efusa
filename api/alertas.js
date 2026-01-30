// api/alertas.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // 1. Obtener todos los jugadores
    const { rows: jugadores } = await pool.query(`
      SELECT id, nombre, telefono, mensualidad, categoria
      FROM jugadores
      WHERE activo = true
      ORDER BY nombre ASC
    `);

    const META_MENSUALIDAD = 50000;

    // 2. Filtrar solo deudores (Acumulado < Meta)
    const deudores = jugadores.filter(j => j.mensualidad < META_MENSUALIDAD).map(j => {
      const deuda = META_MENSUALIDAD - j.mensualidad;
      return {
        id: j.id,
        nombre: j.nombre,
        categoria: j.categoria,
        telefono: j.telefono,
        pagado: j.mensualidad,
        deuda: deuda
      };
    });

    return res.status(200).json(deudores);

  } catch (error) {
    console.error('Error API Alertas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
