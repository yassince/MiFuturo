// Models/TarjetaDebitoModel.js
import { pool } from '../MySQL/conexion.js';
import { generarNumeroTarjeta, generarCVV, obtenerFechaExpiracion } from '../Logic/TarjetaUtils.js';

const TarjetaDebitoModel = {
    async crearTarjeta(cuenta_id) {
        try {
            const numero_tarjeta = generarNumeroTarjeta();
            const cvv = generarCVV();
            const fecha_expiracion = obtenerFechaExpiracion();

            const sql = `
            INSERT INTO tarjetas_debito (numero_tarjeta, fecha_expiracion, cvv, activa, cuenta_id)
            VALUES (?, ?, ?, 1, ?)`;

            const [result] = await pool.execute(sql, [numero_tarjeta, fecha_expiracion, cvv, cuenta_id]);
            return result.insertId;
        } catch (error) {
            console.error("Error al crear la tarjeta:", error);
            throw new Error("No se pudo crear la tarjeta.");
        }
    },

    async obtenerTarjetaPorCuenta(cuenta_id) {
        try {
            const sql = 'SELECT * FROM tarjetas_debito WHERE cuenta_id = ?';
            const [rows] = await pool.execute(sql, [cuenta_id]);
            return rows[0];
        } catch (error) {
            console.error("Error al obtener la tarjeta:", error);
            throw new Error("No se pudo obtener la tarjeta.");
        }
    },

    async bloquearTarjeta(id) {
        try {
            const sql = 'UPDATE tarjetas_debito SET activa = 0 WHERE id = ?';
            await pool.execute(sql, [id]);
        } catch (error) {
            console.error("Error al bloquear la tarjeta:", error);
            throw new Error("No se pudo bloquear la tarjeta.");
        }
    },

    async activarTarjeta(id) {
        try {
            const sql = 'UPDATE tarjetas_debito SET activa = 1 WHERE id = ?';
            await pool.execute(sql, [id]);
        } catch (error) {
            console.error("Error al activar la tarjeta:", error);
            throw new Error("No se pudo activar la tarjeta.");
        }
    }
};

export default TarjetaDebitoModel;