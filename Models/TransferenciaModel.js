import { pool } from '../MySQL/conexion.js';

export class TransferenciaModel {
    //Metodo para la apertura de la cuenta
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

    //Metodo para que el usuario realice un retiro
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

    //Metodo para que usuario haga un retiro
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

    //Metodo para la transferencia al completo
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

    //metodo para obtener todos los movimientos en los que esta involucrado el usuario
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