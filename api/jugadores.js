import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM jugadores ORDER BY id DESC'
      );
      return res.status(200).json(result.rows);
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('ERROR API jugadores:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
