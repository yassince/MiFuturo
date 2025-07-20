import { pool } from '../MySQL/conexion.js';

export class TransferenciaModel {
    /**
     * Opening movement
     * @param {*} origen 
     * @param {*} tipo 
     * @param {*} monto 
     * @param {*} fecha_hora 
     * @param {*} descripcion 
     */
    static async apreturaCuenta(origen, tipo, monto, fecha_hora, descripcion) {
        const sql = 'INSERT INTO transacciones (cuenta_origen_id, tipo_transaccion, monto, fecha_hora ,descripcion) VALUES($1, $2, $3, $4, $5);'

        try {
            await pool.query(sql, [
                origen,
                tipo,
                monto,
                fecha_hora,
                descripcion
            ])

        } catch (error) {
            throw new Error('Error al insertar transacción: ', error)
        }
    }

    /**
     * Ingress movement
     * @param {*} destino 
     * @param {*} saldo 
     * @param {*} fecha_hora 
     * @param {*} descripcion 
     */
    static async ingreso(destino, saldo, fecha_hora, descripcion) {
        const sql = 'INSERT INTO transacciones (cuenta_destino_id, tipo_transaccion, monto, fecha_hora ,descripcion) VALUES ($1, $2, $3, $4, $5);'

        try {
            await pool.query(sql, [
                destino,
                'Ingreso',
                saldo,
                fecha_hora,
                descripcion
            ])
        } catch (error) {
            throw new Error('Error al insertar transacción: ', error)
        }
    }

    /**
     * Withdraw movement
     * @param {*} origen 
     * @param {*} monto 
     * @param {*} fecha_hora 
     * @param {*} descripcion 
     */
    static async retiro(origen, monto, fecha_hora, descripcion) {
        const sql = 'INSERT INTO transacciones (cuenta_origen_id,tipo_transaccion,monto,fecha_hora,descripcion) VALUES($1, $2, $3, $4, $5);'

        try {
            await pool.query(sql, [
                origen,
                'Retiro',
                monto,
                fecha_hora,
                descripcion
            ])
        } catch (error) {
            throw new Error('Error al insertar transacción: ', error)
        }
    }

    /**
     * Function for transfer between accounts
     * @param {*} origen 
     * @param {*} destino 
     * @param {*} tipo 
     * @param {*} monto 
     * @param {*} fecha_hora 
     * @param {*} descripcion 
     */
    static async transferencia(origen, destino, tipo, monto, fecha_hora, descripcion) {
        const sql = 'INSERT INTO transacciones (cuenta_origen_id, cuenta_destino_id, tipo_transaccion, monto, fecha_hora ,descripcion) VALUES($1, $2, $3, $4, $5, $6);'

        try {
            await pool.query(sql, [
                origen,
                destino,
                tipo,
                monto,
                fecha_hora,
                descripcion
            ])

        } catch (error) {
            throw new Error('Error al insertar transacción: ', error)
        }
    }

    /**
     * Get all movement of specific user
     * @param {*} id 
     * @returns 
     */
    static async getmovimientos(id) {
        const sql = "SELECT *, CASE WHEN cuenta_origen_id = $1 THEN 'salida' WHEN cuenta_destino_id = $2 THEN 'entrada' ELSE 'desconocido' END AS direccion FROM transacciones WHERE cuenta_origen_id = $3 OR cuenta_destino_id = $4 ORDER BY fecha_hora DESC;"

        try {
            const resutl = await pool.query(sql, [id, id, id, id])

            return resutl.rows
        } catch (error) {
            throw new Error('Error al insertar transacción: ', error)
        }
    }
}