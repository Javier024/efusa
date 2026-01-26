import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Solo usar SSL en producción o si la BD lo requiere (común en Heroku/AWS)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  try {
    // ======================================================
    // 📌 LISTAR PAGOS (GET)
    // ======================================================
    if (req.method === 'GET') {
      const { jugador_id } = req.query;

      // Definimos la consulta base unificada para siempre tener los nombres de los jugadores
      let query = `
        SELECT 
          p.id,
          p.jugador_id,
          p.monto,
          p.fecha_pago,
          j.nombre as jugador_nombre,
          j.categoria
        FROM pagos p
        JOIN jugadores j ON j.id = p.jugador_id
      `;
      
      let params = [];

      // Si se filtra por jugador, agregamos el WHERE
      if (jugador_id) {
        query += ` WHERE p.jugador_id = $1`;
        params.push(jugador_id);
      }

      query += ` ORDER BY p.fecha_pago DESC`;

      const result = await pool.query(query, params);
      return res.status(200).json(result.rows);
    }

    // ======================================================
    // 📌 REGISTRAR PAGO (POST)
    // ======================================================
    if (req.method === 'POST') {
      const { jugador_id, monto, fecha_pago } = req.body;

      // 1. Validaciones esenciales
      if (!jugador_id || !monto) {
        return res.status(400).json({ error: 'Faltan datos: jugador_id y monto son obligatorios' });
      }

      // 2. Validar que el monto sea un número positivo
      const montoNumerico = parseFloat(monto);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        return res.status(400).json({ error: 'El monto debe ser un número válido y mayor a 0' });
      }

      // 3. Insertar en la base de datos
      // Usamos TO_DATE si viene string, o dejamos que Postgres maneje el objeto fecha
      const queryText = `
        INSERT INTO pagos (jugador_id, monto, fecha_pago)
        VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE))
        RETURNING *;
      `;

      const result = await pool.query(queryText, [jugador_id, montoNumerico, fecha_pago]);

      return res.status(201).json({ 
        mensaje: 'Pago registrado exitosamente', 
        pago: result.rows[0] 
      });
    }

    // ======================================================
    // 📌 ELIMINAR PAGO (DELETE)
    // ======================================================
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID del pago a eliminar' });
      }

      // Verificar si el pago existe antes de borrar (opcional, pero buena práctica)
      const checkExist = await pool.query('SELECT id FROM pagos WHERE id = $1', [id]);
      
      if (checkExist.rows.length === 0) {
        return res.status(404).json({ error: 'El pago no existe' });
      }

      await pool.query('DELETE FROM pagos WHERE id = $1', [id]);

      return res.status(200).json({ mensaje: 'Pago eliminado correctamente' });
    }

    // Si el método no es ninguno de los anteriores
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error("Error en API de Pagos:", error);
    
    // Manejo específico de errores de base de datos
    if (error.code === '23503') { // Foreign Key Violation
      return res.status(400).json({ error: 'El jugador_id no existe en la base de datos' });
    }
    
    if (error.code === '23502') { // Not Null Violation
      return res.status(400).json({ error: 'Faltan campos obligatorios en la base de datos' });
    }

    return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}