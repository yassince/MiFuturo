import { pool } from '../db/pool.js'

export const AdminModel = {
    async obtenerTodosLosUsuarios() {
        const result = await pool.query(
            `SELECT numero_documento AS dni, nombre, apellidos, email, telefono,
                    direccion, fecha_nacimiento, creado_en AS fecha_alta
             FROM clientes
             ORDER BY creado_en`,
        )
        return result.rows
    },

    async obtenerTodasLasCuentas() {
        const result = await pool.query(
            `SELECT iban AS numero_cuenta,
                    saldo_centimos / 100.0 AS saldo,
                    abierta_en AS fecha_apertura
             FROM cuentas
             WHERE tipo = 'CLIENTE'
             ORDER BY abierta_en`,
        )
        return result.rows
    },

    async obtenerTodasLasTarjetas() {
        const result = await pool.query(
            `SELECT ultimos4 AS numero_tarjeta,
                    lpad(mes_caducidad::text, 2, '0') AS mes,
                    anio_caducidad::text AS anio,
                    '•••' AS cvv,
                    cuenta_id,
                    estado = 'ACTIVA' AS activa
             FROM tarjetas`,
        )
        return result.rows.map((fila) => ({
            ...fila,
            fecha_expiracion: `${fila.anio}-${fila.mes}`,
        }))
    },
}
