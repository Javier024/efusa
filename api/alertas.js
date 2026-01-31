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

    const META_MENSUALIDAD = 50000;

    // 1. Obtener jugadores con deudas y el último mes que pagaron
    const { rows: deudoresData } = await pool.query(`
      SELECT
        j.id,
        j.nombre,
        j.categoria,
        j.telefono,
        j.mensualidad,
        p.mes_pago AS mes_abono
      FROM jugadores j
      LEFT JOIN (
        -- Subconsulta para obtener solo el ÚLTIMO pago de cada jugador
        SELECT DISTINCT ON (jugador_id) 
          jugador_id, 
          mes_pago
        FROM pagos
        ORDER BY jugador_id, fecha DESC
      ) p ON j.id = p.jugador_id
      WHERE j.activo = true AND j.mensualidad < $1
      ORDER BY j.mensualidad ASC
    `, [META_MENSUALIDAD]);

    // 2. Calcular la deuda para cada uno
    const deudores = deudoresData.map(j => {
      return {
        id: j.id,
        nombre: j.nombre,
        categoria: j.categoria,
        telefono: j.telefono,
        pagado: j.mensualidad,
        deuda: META_MENSUALIDAD - j.mensualidad,
        mes_abono: j.mes_abono // Nuevo campo: En qué mes pagó
      };
    });

    return res.status(200).json(deudores);

  } catch (error) {
    console.error('Error API Alertas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}