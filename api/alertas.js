import pool from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    /**
     * 🔍 Lógica:
     * - Obtener jugadores
     * - Obtener último pago por jugador
     * - Si NO pagó este mes → alerta
     */

    const { rows: jugadores } = await pool.query(`
      SELECT 
        j.id,
        j.nombre,
        j.categoria,
        COALESCE(MAX(p.fecha_pago), NULL) AS ultimo_pago
      FROM jugadores j
      LEFT JOIN pagos p ON p.jugador_id = j.id
      GROUP BY j.id
      ORDER BY j.nombre
    `);

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const alertas = jugadores
      .filter(j => {
        if (!j.ultimo_pago) return true;

        const fechaPago = new Date(j.ultimo_pago);
        return (
          fechaPago.getMonth() !== mesActual ||
          fechaPago.getFullYear() !== anioActual
        );
      })
      .map(j => ({
        id: j.id,
        nombre: j.nombre,
        categoria: j.categoria,
        deuda: 60000 // 💰 mensualidad fija (puedes moverla luego a config)
      }));

    return res.status(200).json(alertas);

  } catch (error) {
    console.error('Error API Alertas:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

