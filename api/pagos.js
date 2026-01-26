import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {

    // 👉 LISTAR PAGOS
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT p.id, p.monto, p.fecha, j.nombre
        FROM pagos p
        JOIN jugadores j ON j.id = p.jugador_id
        ORDER BY p.fecha DESC
      `);
      return res.status(200).json(result.rows);
    }

    // 👉 REGISTRAR PAGO
    if (req.method === 'POST') {
      const { jugador_id, monto } = req.body;

      await pool.query(
        `INSERT INTO pagos (jugador_id, monto)
         VALUES ($1, $2)`,
        [jugador_id, monto]
      );

      return res.status(201).json({ mensaje: 'Pago registrado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
