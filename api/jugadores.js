import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM jugadores ORDER BY id DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre } = req.body;

      // Consulta SEGURA: Solo guardamos lo que seguro existe en tu tabla actual
      const query = `
        INSERT INTO jugadores 
        (nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre, activo)
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `;
      
      const values = [nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre];

      await pool.query(query, values);
      return res.status(201).json({ mensaje: 'Jugador creado (Modo Simple)' });
    }

    if (req.method === 'PUT') {
      const { id, nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre, activo } = req.body;

      const query = `
        UPDATE jugadores SET
          nombre=$1, categoria=$2, nombre_acudiente=$3, telefono=$4, direccion=$5, tipo_sangre=$6, activo=$7
        WHERE id=$8
      `;
      
      const values = [nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre, activo, id];

      await pool.query(query, values);
      return res.status(200).json({ mensaje: 'Jugador actualizado' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await pool.query('DELETE FROM jugadores WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Jugador eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error("Error Detallado API:", error); // Esto imprimirá el error real en la consola de Vercel
    return res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
}