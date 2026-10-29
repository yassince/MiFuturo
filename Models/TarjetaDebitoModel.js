import { pool } from '../db/pool.js'
import { generarNumeroTarjeta, obtenerFechaExpiracion } from '../Logic/TarjetaUtils.js'

function vista(fila) {
    if (!fila) return fila
    const mes = String(fila.mes_caducidad).padStart(2, '0')
    return {
        id: fila.id,
        cuenta_id: fila.cuenta_id,
        numero_tarjeta: fila.ultimos4,
        fecha_expiracion: `${fila.anio_caducidad}-${mes}`,
        activa: fila.estado === 'ACTIVA',
    }
}

const TarjetaDebitoModel = {
    async crearTarjeta(cuenta_id) {
        const ultimos4 = generarNumeroTarjeta().slice(-4)
        const [anio, mes] = obtenerFechaExpiracion().split('-')
        const result = await pool.query(
            `INSERT INTO tarjetas (cuenta_id, ultimos4, mes_caducidad, anio_caducidad)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [cuenta_id, ultimos4, Number(mes), Number(anio)],
        )
        return result.rows[0].id
    },

    async obtenerTarjetaPorCuenta(cuenta_id) {
        const result = await pool.query(
            `SELECT id, cuenta_id, ultimos4, mes_caducidad, anio_caducidad, estado
             FROM tarjetas WHERE cuenta_id = $1`,
            [cuenta_id],
        )
        return vista(result.rows[0])
    },

    async bloquearTarjeta(id) {
        await pool.query(`UPDATE tarjetas SET estado = 'BLOQUEADA' WHERE id = $1`, [id])
    },

    async activarTarjeta(id) {
        await pool.query(`UPDATE tarjetas SET estado = 'ACTIVA' WHERE id = $1`, [id])
    },
}

export default TarjetaDebitoModel
