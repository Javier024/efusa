if (req.method === 'POST') {
  const {
    nombre,
    categoria,
    telefono,
    mensualidad,
    fecha_nacimiento
  } = req.body;

  const { rows } = await pool.query(
    `
    INSERT INTO jugadores
    (nombre, categoria, telefono, mensualidad, fecha_nacimiento, activo)
    VALUES ($1, $2, $3, $4, $5, true)
    RETURNING *
    `,
    [
      nombre,
      categoria,
      telefono || null,
      mensualidad || 0,
      fecha_nacimiento || null
    ]
  );

  return res.status(201).json(rows[0]);
}

