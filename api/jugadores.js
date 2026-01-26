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
        mensualidad,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre
      } = req.body;

      await pool.query(
        `INSERT INTO jugadores
        (nombre, categoria, mensualidad, nombre_acudiente, telefono, direccion, tipo_sangre, activo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [
          nombre,
          categoria,
          mensualidad,
          nombre_acudiente,
          telefono,
          direccion,
          tipo_sangre
        ]
      );

      return res.status(201).json({ mensaje: 'Jugador creado' });
    }

    // 👉 EDITAR
    if (req.method === 'PUT') {
      const {
        id,
        nombre,
        categoria,
        mensualidad,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
        activo
      } = req.body;

      await pool.query(
        `UPDATE jugadores SET
          nombre=$1,
          categoria=$2,
          mensualidad=$3,
          nombre_acudiente=$4,
          telefono=$5,
          direccion=$6,
          tipo_sangre=$7,
          activo=$8
        WHERE id=$9`,
        [
          nombre,
          categoria,
          mensualidad,
          nombre_acudiente,
          telefono,
          direccion,
          tipo_sangre,
          activo,
          id
        ]
      );

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
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
