import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {

    // 📌 ALERTAS DE MORA
    if (req.method === 'GET') {

      const result = await pool.query(`
        SELECT 
          j.id,
          j.nombre,
          j.categoria,
          j.telefono,
          j.mensualidad,
          MAX(p.fecha_pago) AS ultimo_pago
        FROM jugadores j
        LEFT JOIN pagos p ON p.jugador_id = j.id
        WHERE j.activo = true
        GROUP BY j.id
        HAVING 
          MAX(p.fecha_pago) IS NULL 
          OR MAX(p.fecha_pago) < date_trunc('month', CURRENT_DATE)
        ORDER BY j.nombre
      `);

      return res.status(200).json(result.rows);
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
