import { pool } from '../MySQL/conexion.js';
import { generarNumeroTarjeta, generarCVV, obtenerFechaExpiracion } from '../Logic/TarjetaUtils.js';

const TarjetaDebitoModel = {
    /**
     * Create card for user
     * @param {*} cuenta_id 
     * @returns 
     */
    async crearTarjeta(cuenta_id) {
        try {
            const numero_tarjeta = generarNumeroTarjeta();
            const cvv = generarCVV();
            const fecha_expiracion = obtenerFechaExpiracion();

            const sql = `
            INSERT INTO tarjetas_debito (numero_tarjeta, fecha_expiracion, cvv, activa, cuenta_id)
            VALUES ($1, $2, $3, false, $4) RETURNING id`;

            const result = await pool.query(sql, [numero_tarjeta, fecha_expiracion, cvv, cuenta_id]);
            return result.rows[0].id;
        } catch (error) {
            console.log(error);
            
            throw new Error("No se pudo crear la tarjeta.");
        }
    },

    /**
     * Get card with his account id
     * @param {*} cuenta_id 
     * @returns 
     */
    async obtenerTarjetaPorCuenta(cuenta_id) {
        try {
            const sql = 'SELECT * FROM tarjetas_debito WHERE cuenta_id = $1';
            const result = await pool.query(sql, [cuenta_id]);
            return result.rows[0];
        } catch (error) {
            throw new Error("No se pudo obtener la tarjeta.");
        }
    },

    /**
     * Lock a card
     * @param {*} id 
     */
    async bloquearTarjeta(id) {
        try {
            const sql = 'UPDATE tarjetas_debito SET activa = false WHERE id = $1';
            await pool.query(sql, [id]);
        } catch (error) {
            throw new Error("No se pudo bloquear la tarjeta.");
        }
    },

    /**
     * Activate a card
     * @param {*} id 
     */
    async activarTarjeta(id) {
        try {
            const sql = 'UPDATE tarjetas_debito SET activa = true WHERE id = $1';
            await pool.query(sql, [id]);
        } catch (error) {
            throw new Error("No se pudo activar la tarjeta.");
        }
    }
};

export default TarjetaDebitoModel;