import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    // 👉 LISTAR
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM jugadores ORDER BY id DESC'
      );
      return res.status(200).json(result.rows);
    }

    // 👉 CREAR
    if (req.method === 'POST') {
      const {
        nombre,
        categoria,
        fecha_nacimiento,
        identificacion,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
        goles,
        asistencias,
        partidos_jugados,
        tarjetas_amarillas,
        tarjetas_rojas
      } = req.body;

      const query = `
        INSERT INTO jugadores 
        (nombre, categoria, fecha_nacimiento, identificacion, nombre_acudiente, telefono, direccion, tipo_sangre, goles, asistencias, partidos_jugados, tarjetas_amarillas, tarjetas_rojas, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      `;

      const values = [
        nombre,
        categoria,
        fecha_nacimiento,
        identificacion,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
        goles || 0,
        asistencias || 0,
        partidos_jugados || 0,
        tarjetas_amarillas || 0,
        tarjetas_rojas || 0
      ];

      await pool.query(query, values);
      return res.status(201).json({ mensaje: 'Jugador creado' });
    }

    // 👉 EDITAR
    if (req.method === 'PUT') {
      const {
        id,
        nombre,
        categoria,
        fecha_nacimiento,
        identificacion,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
        goles,
        asistencias,
        partidos_jugados,
        tarjetas_amarillas,
        tarjetas_rojas,
        activo
      } = req.body;

      const query = `
        UPDATE jugadores SET
          nombre=$1,
          categoria=$2,
          fecha_nacimiento=$3,
          identificacion=$4,
          nombre_acudiente=$5,
          telefono=$6,
          direccion=$7,
          tipo_sangre=$8,
          goles=$9,
          asistencias=$10,
          partidos_jugados=$11,
          tarjetas_amarillas=$12,
          tarjetas_rojas=$13,
          activo=$14
        WHERE id=$15
      `;

      const values = [
        nombre,
        categoria,
        fecha_nacimiento,
        identificacion,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
        goles || 0,
        asistencias || 0,
        partidos_jugados || 0,
        tarjetas_amarillas || 0,
        tarjetas_rojas || 0,
        activo,
        id
      ];

      await pool.query(query, values);
      return res.status(200).json({ mensaje: 'Jugador actualizado' });
    }

    // 👉 ELIMINAR
    if (req.method === 'DELETE') {
      const { id } = req.query;

      await pool.query(
        'DELETE FROM jugadores WHERE id=$1',
        [id]
      );

      return res.status(200).json({ mensaje: 'Jugador eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error("Error en API Jugadores:", error);
    return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}