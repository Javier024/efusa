import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM jugadores ORDER BY id DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("ERROR NEON:", error);
    res.status(500).json({ error: "Error al consultar jugadores" });
  }
}
