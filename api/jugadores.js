import { Pool } from "pg";

export default async function handler(req, res) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT * FROM jugadores ORDER BY creado_en DESC"
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const {
        nombre,
        categoria,
        mensualidad,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO jugadores
        (nombre, categoria, mensualidad, nombre_acudiente, telefono, direccion, tipo_sangre, activo, fecha_inscripcion)
        VALUES ($1,$2,$3,$4,$5,$6,$7,true,CURRENT_DATE)
        RETURNING *`,
        [
          nombre,
          categoria,
          mensualidad,
          nombre_acudiente,
          telefono,
          direccion,
          tipo_sangre,
        ]
      );

      return res.status(201).json(result.rows[0]);
    }

    res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error("ERROR NEON:", error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
