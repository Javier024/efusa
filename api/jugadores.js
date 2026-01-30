import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(`
        SELECT
          id,
          nombre,
          fecha_nacimiento,
          identificacion,
          categoria,
          goles,
          asistencias,
          partidos,
          amarillas,
          rojas,
          sangre,
          acudiente,
          telefono,
          direccion,
          created_at
        FROM jugadores
        ORDER BY id DESC
      `);

      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const {
        nombre,
        fecha_nacimiento,
        identificacion,
        categoria,
        goles = 0,
        asistencias = 0,
        partidos = 0,
        amarillas = 0,
        rojas = 0,
        sangre,
        acudiente,
        telefono,
        direccion
      } = req.body;

      if (!nombre || !fecha_nacimiento) {
        return res.status(400).json({ message: "Nombre y fecha requeridos" });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO jugadores (
          nombre,
          fecha_nacimiento,
          identificacion,
          categoria,
          goles,
          asistencias,
          partidos,
          amarillas,
          rojas,
          sangre,
          acudiente,
          telefono,
          direccion
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        )
        RETURNING *
        `,
        [
          nombre,
          fecha_nacimiento,
          identificacion,
          categoria,
          goles,
          asistencias,
          partidos,
          amarillas,
          rojas,
          sangre,
          acudiente,
          telefono,
          direccion
        ]
      );

      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ message: "Método no permitido" });
  } catch (error) {
    console.error("ERROR API JUGADORES:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

