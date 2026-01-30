// api/pagos.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    // ==========================
    // GET → LISTAR PAGOS (CON JOIN DE NOMBRES)
    // ==========================
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

    // ==========================
    // POST → REGISTRAR PAGO
    // ==========================
    if (req.method === 'POST') {
      const { jugador_id, monto, fecha, tipo, observacion } = req.body;

      if (!jugador_id || !monto || !fecha) {
        return res.status(400).json({ error: 'Jugador, monto y fecha son obligatorios' });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO pagos
        (jugador_id, monto, fecha, tipo, observacion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [jugador_id, monto, fecha, tipo || 'abono', observacion || null]
      );

      return res.status(201).json(rows[0]);
    }

    // ==========================
    // DELETE → ELIMINAR PAGO (Corrección manual)
    // ==========================
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID del pago' });

      await pool.query('DELETE FROM pagos WHERE id = $1', [id]);
      return res.status(200).json({ mensaje: 'Pago eliminado correctamente' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('❌ pagos API:', error);
    return res.status(500).json({ error: error.message });
  }
}