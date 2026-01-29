import pool from './db.js';

export default async function handler(req, res) {
  try {

    /* =======================
       📥 GET – LISTAR PAGOS
    ======================= */
    if (req.method === 'GET') {
      const { jugador_id } = req.query;

      // 👉 Pagos por jugador
      if (jugador_id) {
        const { rows } = await pool.query(`
          SELECT
            p.id,
            p.jugador_id,
            p.monto,
            p.fecha_pago,
            p.tipo,
            p.observacion,
            p.created_at
          FROM pagos p
          WHERE p.jugador_id = $1
          ORDER BY p.fecha_pago DESC
        `, [jugador_id]);

        return res.status(200).json(rows);
      }

      // 👉 Todos los pagos (con nombre del jugador)
      const { rows } = await pool.query(`
        SELECT
          p.id,
          p.jugador_id,
          p.monto,
          p.fecha_pago,
          p.tipo,
          p.observacion,
          p.created_at,
          j.nombre AS jugador_nombre
        FROM pagos p
        JOIN jugadores j ON j.id = p.jugador_id
        ORDER BY p.fecha_pago DESC
      `);

      return res.status(200).json(rows);
    }

    /* =======================
       ➕ POST – REGISTRAR PAGO
    ======================= */
    if (req.method === 'POST') {
      const {
        jugador_id,
        monto,
        fecha_pago,
        tipo = 'abono',
        observacion = null
      } = req.body;

      if (!jugador_id || !monto || !fecha_pago) {
        return res.status(400).json({
          error: 'Jugador, monto y fecha son obligatorios'
        });
      }

      const { rows } = await pool.query(`
        INSERT INTO pagos (
          jugador_id,
          monto,
          fecha_pago,
          tipo,
          observacion
        ) VALUES ($1,$2,$3,$4,$5)
        RETURNING *
      `, [
        jugador_id,
        monto,
        fecha_pago,
        tipo,
        observacion
      ]);

      return res.status(201).json(rows[0]);
    }

    /* =======================
       🗑 DELETE – ELIMINAR
    ======================= */
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID del pago requerido' });
      }

      const { rowCount } = await pool.query(
        'DELETE FROM pagos WHERE id = $1',
        [id]
      );

      if (!rowCount) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      return res.status(200).json({ success: true });
    }

    /* =======================
       ❌ MÉTODO NO PERMITIDO
    ======================= */
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error API Pagos:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
