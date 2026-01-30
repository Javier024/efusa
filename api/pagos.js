import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query(`
        SELECT
          p.id,
          p.jugador_id,
          j.nombre AS jugador,
          p.monto,
          p.fecha,
          p.tipo,
          p.observacion
        FROM pagos p
        JOIN jugadores j ON j.id = p.jugador_id
        ORDER BY p.fecha DESC
      `);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { jugador_id, monto, fecha, tipo, observacion } = req.body;

      const { rows } = await pool.query(
        `
        INSERT INTO pagos
        (jugador_id, monto, fecha, tipo, observacion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [jugador_id, monto, fecha, tipo, observacion || null]
      );

      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('❌ pagos API:', error);
    return res.status(500).json({ error: error.message });
  }
}
