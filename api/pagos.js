import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  try {
    // ======================================================
    // 📌 LISTAR PAGOS (GET)
    // ======================================================
    if (req.method === 'GET') {
      const { jugador_id } = req.query;

      let result;
      if (jugador_id) {
        result = await pool.query(
          `SELECT * FROM pagos WHERE jugador_id = $1 ORDER BY fecha_pago DESC`,
          [jugador_id]
        );
      } else {
        // Trae pagos con el nombre del jugador
        result = await pool.query(
          `SELECT 
             p.id,
             p.jugador_id,
             p.monto,
             p.fecha_pago,
             p.tipo,
             p.observacion,
             p.creado_en,
             j.nombre as jugador_nombre
           FROM pagos p
           JOIN jugadores j ON j.id = p.jugador_id
           ORDER BY p.fecha_pago DESC`
        );
      }
      return res.status(200).json(result.rows);
    }

    // ======================================================
    // 📌 REGISTRAR PAGO (POST) - FECHA Y OBSERVACIÓN INCLUIDAS
    // ======================================================
    if (req.method === 'POST') {
      const { 
        jugador_id, 
        monto, 
        fecha_pago, 
        tipo, 
        observacion 
      } = req.body;

      if (!jugador_id || !monto) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }

      // El orden debe coincidir con los valores de abajo ($1, $2, $3, $4, $5)
      const queryText = `
        INSERT INTO pagos (jugador_id, monto, fecha_pago, tipo, observacion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;

      const values = [
        jugador_id, 
        monto, 
        fecha_pago || null, // Si el input viene vacío, guarda NULL en la BD (o usa el default)
        tipo || 'abono',
        observacion || null
      ];

      const result = await pool.query(queryText, values);
      
      return res.status(201).json({ 
        mensaje: 'Pago registrado con fecha y observación', 
        pago: result.rows[0] 
      });
    }

    // ======================================================
    // 📌 ELIMINAR PAGO (DELETE)
    // ======================================================
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID del pago requerido' });
      }

      await pool.query('DELETE FROM pagos WHERE id = $1', [id]);
      
      return res.status(200).json({ mensaje: 'Pago eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error("Error API Pagos:", error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}