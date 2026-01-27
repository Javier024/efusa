import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    // 👉 LISTAR
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM jugadores ORDER BY id DESC');
      return res.status(200).json(result.rows);
    }

    // 👉 CREAR (Con inteligencia de seguridad)
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

      try {
        // INTENTO 1: Intentamos guardar TODOS los campos (Base de datos actualizada)
        const queryFull = `
          INSERT INTO jugadores 
          (nombre, categoria, fecha_nacimiento, identificacion, nombre_acudiente, telefono, direccion, tipo_sangre, goles, asistencias, partidos_jugados, tarjetas_amarillas, tarjetas_rojas, activo)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
        `;

        await pool.query(queryFull, [
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
        ]);

      } catch (err) {
        // INTENTO 2: Si falla (columnas faltantes en BD), guardamos solo lo básico
        console.log("Nota: Base de datos antigua detectada, guardando solo campos básicos...");
        
        const queryBasic = `
          INSERT INTO jugadores 
          (nombre, categoria, nombre_acudiente, telefono, direccion, tipo_sangre, activo)
          VALUES ($1, $2, $3, $4, $5, $6, true)
        `;

        await pool.query(queryBasic, [
          nombre,
          categoria,
          nombre_acudiente,
          telefono,
          direccion,
          tipo_sangre
        ]);
      }

      return res.status(201).json({ mensaje: 'Jugador creado exitosamente' });
    }

    // 👉 EDITAR (Con inteligencia de seguridad)
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

      try {
        // INTENTO 1: Actualizar todo
        const queryFull = `
          UPDATE jugadores SET
            nombre=$1, categoria=$2, fecha_nacimiento=$3, identificacion=$4,
            nombre_acudiente=$5, telefono=$6, direccion=$7, tipo_sangre=$8,
            goles=$9, asistencias=$10, partidos_jugados=$11,
            tarjetas_amarillas=$12, tarjetas_rojas=$13, activo=$14
          WHERE id=$15
        `;

        await pool.query(queryFull, [
          nombre, categoria, fecha_nacimiento, identificacion,
          nombre_acudiente, telefono, direccion, tipo_sangre,
          goles || 0, asistencias || 0, partidos_jugados || 0,
          tarjetas_amarillas || 0, tarjetas_rojas || 0, activo, id
        ]);

      } catch (err) {
        // INTENTO 2: Actualizar solo básico
        console.log("Nota: Base de datos antigua detectada, actualizando solo campos básicos...");

        const queryBasic = `
          UPDATE jugadores SET
            nombre=$1, categoria=$2, nombre_acudiente=$3,
            telefono=$4, direccion=$5, tipo_sangre=$6, activo=$7
          WHERE id=$8
        `;

        await pool.query(queryBasic, [
          nombre, categoria, nombre_acudiente,
          telefono, direccion, tipo_sangre, activo, id
        ]);
      }

      return res.status(200).json({ mensaje: 'Jugador actualizado' });
    }

    // 👉 ELIMINAR
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await pool.query('DELETE FROM jugadores WHERE id=$1', [id]);
      return res.status(200).json({ mensaje: 'Jugador eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error("Error Fatal API:", error);
    return res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
}