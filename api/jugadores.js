import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {

    // 👉 OBTENER JUGADORES
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM jugadores ORDER BY id DESC'
      );
      return res.status(200).json(result.rows);
    }

    // 👉 REGISTRAR JUGADOR
    if (req.method === 'POST') {
      const {
        nombre,
        categoria,
        mensualidad,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre
      } = req.body;

      await pool.query(
        `INSERT INTO jugadores
        (nombre, categoria, mensualidad, nombre_acudiente, telefono, direccion, tipo_sangre, activo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [
          nombre,
          categoria,
          mensualidad,
          nombre_acudiente,
          telefono,
          direccion,
          tipo_sangre
        ]
      );

      return res.status(201).json({ mensaje: 'Jugador registrado correctamente' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('ERROR API jugadores:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
