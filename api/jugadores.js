// api/jugadores.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // Verificación de variable de entorno
  if (!process.env.DATABASE_URL) {
    console.error("❌ FATAL: DATABASE_URL no está definida.");
    return res.status(500).json({ 
      error: 'Error de configuración del servidor', 
      detalle: 'Falta conexión a BD' 
    });
  }

  try {
    // ==========================
    // GET → LISTAR JUGADORES
    // ==========================
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT
          id,
          nombre,
          categoria,
          telefono,
          mensualidad,
          activo,
          created_at
        FROM jugadores
        ORDER BY created_at DESC
      `);

      return res.status(200).json(result.rows);
    }

    // ==========================
    // POST → CREAR JUGADOR
    // ==========================
    if (req.method === 'POST') {
      const { nombre, categoria, telefono, mensualidad } = req.body;

      if (!nombre || !categoria) {
        return res.status(400).json({
          error: 'Nombre y categoría son obligatorios'
        });
      }

      // Aseguramos que mensualidad sea un número, ya que en tu BD es INTEGER NOT NULL
      const mensualidadValor = mensualidad ? Number(mensualidad) : 0;

      const query = `
        INSERT INTO jugadores (nombre, categoria, telefono, mensualidad, activo)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
      `;
      
      const values = [
        nombre,
        categoria,
        telefono || null,
        mensualidadValor
      ];

      const result = await pool.query(query, values);
      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('❌ ERROR API JUGADORES:', error.message);
    return res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
}

