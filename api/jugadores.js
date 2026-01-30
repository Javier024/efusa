import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  try {
    // =========================
    // GET → LISTAR JUGADORES
    // =========================
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT
          id,
          nombre,
          categoria,
          telefono,
          mensualidad,
          fecha_nacimiento,
          activo,
          created_at
        FROM jugadores
        ORDER BY id DESC
      `);

      return res.status(200).json(result.rows);
    }

    // =========================
    // POST → CREAR JUGADOR
    // =========================
    if (req.method === 'POST') {
      const {
        nombre,
        categoria,
        telefono,
        mensualidad,
        fecha_nacimiento
      } = req.body;

      if (!nombre || !categoria) {
        return res.status(400).json({
          error: 'Nombre y categoría son obligatorios'
        });
      }

      const result = await pool.query(
        `
        INSERT INTO jugadores (
          nombre,
          categoria,
          telefono,
          mensualidad,
          fecha_nacimiento,
          activo
        ) VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *
        `,
        [
          nombre,
          categoria,
          telefono || null,
          mensualidad || 0,
          fecha_nacimiento || null
        ]
      );

      return res.status(201).json(result.rows[0]);
    }

    // =========================
    // MÉTODO NO PERMITIDO
    // =========================
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('❌ Error API jugadores:', error);
    return res.status(500).json({
      error: error.message || 'Error interno del servidor'
    });
  }
}

