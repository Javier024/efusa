// api/pagos.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    // ==========================
    // GET → LISTAR PAGOS
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
    // POST → REGISTRAR PAGO (Y SUMAR AL JUGADOR)
    // ==========================
    if (req.method === 'POST') {
      const { jugador_id, monto, fecha, tipo, observacion } = req.body;

      if (!jugador_id || !monto || !fecha) {
        return res.status(400).json({ error: 'Jugador, monto y fecha son obligatorios' });
      }

      // 1. Insertar el pago en la tabla de historial
      const { rows } = await pool.query(
        `
        INSERT INTO pagos
        (jugador_id, monto, fecha, tipo, observacion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [jugador_id, monto, fecha, tipo || 'abono', observacion || null]
      );

      // 2. ACTUALIZAR AUTOMÁTICAMENTE EL JUGADOR (Sumar al acumulado)
      await pool.query(
        `UPDATE jugadores 
         SET mensualidad = mensualidad + $1 
         WHERE id = $2`,
        [monto, jugador_id]
      );

      return res.status(201).json(rows[0]);
    }

    // ==========================
    // DELETE → ELIMINAR PAGO (Y RESTAR AL JUGADOR)
    // ==========================
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta ID del pago' });

      // 1. Buscar el pago antes de borrarlo para saber cuánto dinero devolver
      const { rows: pagoData } = await pool.query('SELECT * FROM pagos WHERE id = $1', [id]);
      
      if (pagoData.length === 0) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }
      
      const pago = pagoData[0];

      // 2. Borrar el pago
      await pool.query('DELETE FROM pagos WHERE id = $1', [id]);

      // 3. ACTUALIZAR AUTOMÁTICAMENTE EL JUGADOR (Restar del acumulado)
      await pool.query(
        `UPDATE jugadores 
         SET mensualidad = mensualidad - $1 
         WHERE id = $2`,
        [pago.monto, pago.jugador_id]
      );

      return res.status(200).json({ mensaje: 'Pago eliminado y saldo actualizado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('❌ pagos API:', error);
    return res.status(500).json({ error: error.message });
  }
}