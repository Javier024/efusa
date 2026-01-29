import pool from './db.js';

export default async function handler(req, res) {
  try {
    /* =======================
       📥 GET – LISTAR
    ======================= */
    if (req.method === 'GET') {
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
        ORDER BY nombre ASC
      `);

      return res.status(200).json(rows);
    }

    /* =======================
       ➕ POST – CREAR
    ======================= */
    if (req.method === 'POST') {
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
        return res.status(400).json({
          error: 'Nombre y fecha de nacimiento son obligatorios'
        });
      }

      const { rows } = await pool.query(`
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
      `, [
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
      ]);

      return res.status(201).json(rows[0]);
    }

    /* =======================
       ✏️ PUT – EDITAR
    ======================= */
    if (req.method === 'PUT') {
      const {
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
        direccion
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
      }

      const { rowCount, rows } = await pool.query(`
        UPDATE jugadores SET
          nombre=$1,
          fecha_nacimiento=$2,
          identificacion=$3,
          categoria=$4,
          goles=$5,
          asistencias=$6,
          partidos=$7,
          amarillas=$8,
          rojas=$9,
          sangre=$10,
          acudiente=$11,
          telefono=$12,
          direccion=$13
        WHERE id=$14
        RETURNING *
      `, [
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
        id
      ]);

      if (!rowCount) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      return res.status(200).json(rows[0]);
    }

    /* =======================
       🗑 DELETE – ELIMINAR
    ======================= */
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
      }

      const { rowCount } = await pool.query(
        'DELETE FROM jugadores WHERE id = $1',
        [id]
      );

      if (!rowCount) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      return res.status(200).json({ success: true });
    }

    /* =======================
       ❌ MÉTODO NO PERMITIDO
    ======================= */
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error API Jugadores:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}
