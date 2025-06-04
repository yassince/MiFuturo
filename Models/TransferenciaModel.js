import { pool } from '../MySQL/conexion.js';

export class TransferenciaModel {

    static async apreturaCuenta(origen, tipo, monto, fecha_hora, descripcion) {
        const sql = 'INSERT INTO transacciones (cuenta_origen_id, tipo_transaccion, monto, fecha_hora ,descripcion) VALUES(?, ?, ?, ?, ?);'

        try {
            await pool.execute(sql, [
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
     * 
     * @param {id} destino 
     * @param {number} saldo 
     * @param {Date} fecha_hora 
     * @param {string} descripcion 
     */
    static async ingreso(destino, saldo, fecha_hora, descripcion) {

        const sql = 'INSERT INTO transacciones (cuenta_destino_id, tipo_transaccion, monto, fecha_hora ,descripcion) VALUES(?, ?, ?, ?, ?);'

        try {
            await pool.execute(sql, [
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
     * 
     * @param {id} destino 
     * @param {number} saldo 
     * @param {Date} fecha_hora 
     * @param {string} descripcion 
     */
    static async retiro(origen, monto, fecha_hora, descripcion) {
        const sql = 'INSERT INTO transacciones (cuenta_origen_id,tipo_transaccion,monto,fecha_hora,descripcion) VALUES(?, ?, ?, ?, ? );'

        try {
            await pool.execute(sql, [
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

    static async transferencia(origen, destino, tipo, monto, fecha_hora, descripcion) {
        const sql = 'INSERT INTO transacciones (cuenta_origen_id, cuenta_destino_id, tipo_transaccion, monto, fecha_hora ,descripcion) VALUES(?, ?, ?, ?, ?, ?);'

        try {
            await pool.execute(sql, [
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

    static async getmovimientos(id) {
        const sql = "SELECT *, CASE WHEN cuenta_origen_id = ? THEN 'salida' WHEN cuenta_destino_id = ? THEN 'entrada' ELSE 'desconocido' END AS direccion FROM transacciones WHERE cuenta_origen_id = ? OR cuenta_destino_id = ? ORDER BY fecha_hora DESC;"

        try {
            const resutl = await pool.execute(sql, [id, id, id, id])
            
            return resutl[0]
        } catch (error) {
            throw new Error('Error al insertar transacción: ', error)
        }
    }
}