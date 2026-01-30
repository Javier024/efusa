import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  try {
    // 🔎 Validación clave
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        error: "DATABASE_URL no está definida en Vercel"
      });
    }

    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT * FROM jugadores ORDER BY id DESC"
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { nombre, documento, categoria } = req.body;

      if (!nombre || !documento) {
        return res.status(400).json({
          error: "Nombre y documento son obligatorios"
        });
      }

      const result = await pool.query(
        `INSERT INTO jugadores (nombre, documento, categoria)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [nombre, documento, categoria || null]
      );

      return res.status(201).json(result.rows[0]);
    }

    res.status(405).json({ error: "Método no permitido" });

  } catch (error) {
    console.error("ERROR API JUGADORES:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
}

