const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const result = await pool.query(`
      SELECT
        j.id,
        j.nombre,
        j.mensualidad,
        COALESCE(SUM(p.monto),0) AS pagado,
        j.mensualidad - COALESCE(SUM(p.monto),0) AS deuda
      FROM jugadores j
      LEFT JOIN pagos p ON p.jugador_id = j.id
      GROUP BY j.id
      HAVING j.mensualidad - COALESCE(SUM(p.monto),0) > 0
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error API Alertas:", error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}
