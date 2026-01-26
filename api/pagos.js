import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {

    // 📌 LISTAR PAGOS
    if (req.method === 'GET') {
      const { jugador_id } = req.query;

      // Si viene jugador_id → historial de un jugador
      if (jugador_id) {
        const result = await pool.query(
          `SELECT *
           FROM pagos
           WHERE jugador_id = $1
           ORDER BY fecha_pago DESC`,
          [jugador_id]
        );
        return res.status(200).json(result.rows);
      }

      // Si no → todos los pagos
      const result = await pool.query(
        `SELECT 
          p.id,
          j.nombre,
          j.categoria,
          p.monto,
          p.fecha_pago
         FROM pagos p
         JOIN jugadores j ON j.id = p.jugador_id
         ORDER BY p.fecha_pago DESC`
      );

      return res.status(200).json(result.rows);
    }

    // 📌 REGISTRAR PAGO
    if (req.method === 'POST') {
      const { jugador_id, monto, fecha_pago } = req.body;

      await pool.query(
        `INSERT INTO pagos (jugador_id, monto, fecha_pago)
         VALUES ($1, $2, COALESCE($3, CURRENT_DATE))`,
        [jugador_id, monto, fecha_pago]
      );

      return res.status(201).json({ mensaje: 'Pago registrado' });
    }

    // 📌 ELIMINAR PAGO
    if (req.method === 'DELETE') {
      const { id } = req.query;

      await pool.query(
        'DELETE FROM pagos WHERE id = $1',
        [id]
      );

      return res.status(200).json({ mensaje: 'Pago eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
