import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Verificación de seguridad vital
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ 
      error: 'Configuración faltante', 
      detalle: 'No se encontró DATABASE_URL en Vercel' 
    });
  }

  try {
    // -------------------------------------------------
    // 1. LISTAR (GET)
    // -------------------------------------------------
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM jugadores ORDER BY id DESC');
      return res.status(200).json(result.rows);
    }

    // -------------------------------------------------
    // 2. CREAR (POST) - Versión Segura
    // -------------------------------------------------
    if (req.method === 'POST') {
      const { nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre } = req.body;

      // Usamos una consulta simple con los campos originales
      // Esto evita el error de "columna no existe" si tu BD es antigua
      const query = `
        INSERT INTO jugadores 
        (nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre, activo)
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `;

      const values = [
        nombre,
        categoria,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre
      ];

      await pool.query(query, values);
      return res.status(201).json({ mensaje: 'Jugador creado correctamente' });
    }

    // -------------------------------------------------
    // 3. EDITAR (PUT) - Versión Segura
    // -------------------------------------------------
    if (req.method === 'PUT') {
      const { id, nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre, activo } = req.body;

      const query = `
        UPDATE jugadores SET
          nombre = $1,
          categoria = $2,
          nombre_acudiente = $3,
          telefono = $4,
          direccion = $5,
          tipo_sangre = $6,
          activo = $7
        WHERE id = $8
      `;

      const values = [
        nombre,
        categoria,
        nombre_acudiente,
        telefono,
        direccion,
        tipo_sangre,
        activo,
        id
      ];

      await pool.query(query, values);
      return res.status(200).json({ mensaje: 'Jugador actualizado correctamente' });
    }

    // -------------------------------------------------
    // 4. ELIMINAR (DELETE)
    // -------------------------------------------------
    if (req.method === 'DELETE') {
      const { id } = req.query;

      await pool.query('DELETE FROM jugadores WHERE id = $1', [id]);
      return res.status(200).json({ mensaje: 'Jugador eliminado correctamente' });
    }

    // Método no soportado
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    // Imprime el error en la consola de Vercel
    console.error("Error en API:", error);
    
    // Devuelve el error real al navegador
    return res.status(500).json({ 
      error: 'Error del servidor', 
      detalle: error.message 
    });
  }
}