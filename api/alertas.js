import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

export default async function handler(req, res) {

  const result = await pool.query(`
    SELECT
      j.id,
      j.nombre,
      j.mensualidad,
      COALESCE(SUM(p.monto),0) AS pagado,
      j.mensualidad - COALESCE(SUM(p.monto),0) AS deuda
    FROM jugadores j
    LEFT JOIN pagos p ON p.jugador_id = j.id
    GROUP BY j.id
    HAVING j.mensualidad - COALESCE(SUM(p.monto),0) > 0
  `);

  res.json(result.rows);
}
