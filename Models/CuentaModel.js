import { sl } from 'zod/v4/locales';
import { pool } from '../MySQL/conexion.js'

/* Función para generar el número de cuenta del usuario */


export class CuentaModel {

    /**
     * 
     * @param {object} cuenta object to insert in DB 
     */
    static async crearCuenta({ cuenta }) {
        const sql = `
      INSERT INTO cuentas (dni, numero_cuenta, saldo, fecha_apertura)
      VALUES (?, ?, ?, CURDATE())
    `;

        try {
            const [rows] = await pool.query(sql, [cuenta.dni, cuenta.numero_cuenta, cuenta.saldo]);
            
            return rows.insertId
        } catch (error) {
            console.log(error);
            
            throw new Error('No se ha podido crear la cuenta', error);
        }
    }

    static async getCuenta(dni) {
        const sql = 'SELECT * FROM cuentas WHERE dni = ?;'

        try {
            const [rows] = await pool.query(sql, [dni]);
            
            return {
                id: rows[0].cuenta_id,
                numero_cuenta: rows[0].numero_cuenta,
                saldo: rows[0].saldo,
                fecha_apertura: rows[0].fecha_apertura
            }

        } catch (error) {
            throw new Error('No se ha podido encontrar la cuenta')
        }
    }

    static async eliminarCuenta(dni) {
        const sql = 'DELETE FROM cuentas WHERE dni = ?;'
        
        try {
            const [rows] = await pool.query(sql, [dni]);
            
            if (rows.affectedRows > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error);
            
            throw new Error('No se ha podido eliminar la cuenta del usuario')
        }
    }

    static async updateCuenta(saldo, dni) {
        const sql = 'UPDATE cuentas set saldo = ? WHERE dni = ?'
        
        try {
            const [rows] = await pool.execute(sql, [saldo, dni])
            return
        } catch (error) {
            console.log(error);
            
            throw new Error('Error al actualizar los datos de la cuenta del usuario')
        }
    }

}