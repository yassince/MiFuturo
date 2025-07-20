import { pool } from '../MySQL/conexion.js'

export class CuentaModel {

    /**
     * Create account
     * @param {object} cuenta object to insert in DB 
     */
    static async crearCuenta({ cuenta }) {
        const sql = `
        INSERT INTO cuentas (dni, numero_cuenta, saldo, fecha_apertura)
        VALUES ($1, $2, $3, CURRENT_DATE) RETURNING cuenta_id
        `;
        try {
            const result = await pool.query(sql, [cuenta.dni, cuenta.numero_cuenta, cuenta.saldo]);
            return result.rows[0].cuenta_id
        } catch (error) {
            console.log(error);
            throw new Error('No se ha podido crear la cuenta', error);
        }
    }

    /**
     * Get account with user's DNI
     * @param {*} dni 
     * @returns 
     */
    static async getCuenta(dni) {
        const sql = 'SELECT * FROM cuentas WHERE dni = $1;'

        try {
            const result = await pool.query(sql, [dni]);

            return {
                id: result.rows[0].cuenta_id,
                dni: result.rows[0].dni,
                numero_cuenta: result.rows[0].numero_cuenta,
                saldo: result.rows[0].saldo,
                fecha_apertura: result.rows[0].fecha_apertura
            }

        } catch (error) {
            throw new Error('No se ha podido encontrar la cuenta')
        }
    }

    /**
     * Get specific account with num_account
     * @param {*} num 
     * @returns 
     */
    static async getCuentaByNum(num) {
        const sql = 'SELECT * FROM cuentas WHERE numero_cuenta = $1'

        try {
            const result = await pool.query(sql, [num]);

            return {
                id: result.rows[0].cuenta_id,
                dni: result.rows[0].dni,
                numero_cuenta: result.rows[0].numero_cuenta,
                saldo: result.rows[0].saldo,
                fecha_apertura: result.rows[0].fecha_apertura
            }

        } catch (error) {
            throw new Error('No se ha podido encontrar la cuenta')
        }

    }

    /**
     * Delete user's account with DNI
     * @param {*} dni 
     * @returns 
     */
    static async eliminarCuenta(dni) {
        const sql = 'DELETE FROM cuentas WHERE dni = $1;'

        try {
            const result = await pool.query(sql, [dni]);
            console.log(result.rowCount);

            if (result.rowCount > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            throw new Error('No se ha podido eliminar la cuenta del usuario')
        }
    }

    /**
     * Update balance account
     * @param {*} saldo 
     * @param {*} dni 
     * @returns 
     */
    static async updateCuenta(saldo, dni) {
        const sql = 'UPDATE cuentas set saldo = $1 WHERE dni = $2 RETURNING saldo'

        try {
            const result = await pool.query(sql, [saldo, dni])
            console.log(result.rows);
            if (result.rows[0].saldo == saldo) return
            else return new Error('Error al actualizar el saldo de usuario')
        } catch (error) {
            throw new Error('Error al actualizar los datos de la cuenta del usuario')
        }
    }

}