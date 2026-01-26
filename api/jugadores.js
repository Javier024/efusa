import { Pool } from "pg";

export default async function handler(req, res) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        categoria,
        mensualidad,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
        activo,
        fecha_inscripcion
      FROM jugadores
      ORDER BY creado_en DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("ERROR NEON:", error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
