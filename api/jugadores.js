// api/jugadores.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Falta conexión a BD' });
  }

  try {
    // ==========================
    // GET → LISTAR
    // ==========================
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT id, nombre, categoria, telefono, mensualidad, activo, created_at
        FROM jugadores
        ORDER BY created_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // ==========================
    // POST → CREAR
    // ==========================
    if (req.method === 'POST') {
      const { nombre, categoria, telefono, mensualidad } = req.body;

      if (!nombre || !categoria) return res.status(400).json({ error: 'Nombre y categoría obligatorios' });

      const mensualidadValor = mensualidad ? Number(mensualidad) : 0;

      const result = await pool.query(
        `INSERT INTO jugadores (nombre, categoria, telefono, mensualidad, activo)
         VALUES ($1, $2, $3, $4, true) RETURNING *`,
        [nombre, categoria, telefono || null, mensualidadValor]
      );
      return res.status(201).json(result.rows[0]);
    }

    // ==========================
    // PUT → EDITAR
    // ==========================
    if (req.method === 'PUT') {
      const { id, nombre, categoria, telefono, mensualidad, activo } = req.body;

      if (!id || !nombre || !categoria) return res.status(400).json({ error: 'Datos incompletos' });

      const result = await pool.query(
        `UPDATE jugadores
         SET nombre = $1, categoria = $2, telefono = $3, mensualidad = $4, activo = $5
         WHERE id = $6
         RETURNING *`,
        [nombre, categoria, telefono, Number(mensualidad), activo, id]
      );

      return res.status(200).json(result.rows[0]);
    }

    // ==========================
    // DELETE → ELIMINAR
    // ==========================
    if (req.method === 'DELETE') {
      const { id } = req.query; // El ID viene por query param ?id=123

      if (!id) return res.status(400).json({ error: 'Falta ID' });

      await pool.query('DELETE FROM jugadores WHERE id = $1', [id]);
      return res.status(200).json({ mensaje: 'Jugador eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('❌ ERROR API:', error.message);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
}
