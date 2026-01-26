import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

export default async function handler(req, res) {
  try {

    // ================== LISTAR PAGOS ==================
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT
          p.id,
          p.jugador_id,
          p.monto,
          p.fecha_pago,
          j.nombre AS jugador
        FROM pagos p
        JOIN jugadores j ON j.id = p.jugador_id
        ORDER BY p.fecha_pago DESC
      `);
      return res.status(200).json(result.rows);
    }

    // ================== REGISTRAR PAGO ==================
    if (req.method === 'POST') {
      const { jugador_id, monto, fecha_pago } = req.body;

      if (!jugador_id || !monto) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      await pool.query(
        `INSERT INTO pagos (jugador_id, monto, fecha_pago)
         VALUES ($1,$2,COALESCE($3, CURRENT_DATE))`,
        [jugador_id, monto, fecha_pago]
      );

      return res.status(201).json({ mensaje: 'Pago registrado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
