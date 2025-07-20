import { pool } from "../MySQL/conexion.js";

export const AdminModel = {

  /**
   * Get All users
   * @returns 
   */
  async obtenerTodosLosUsuarios() {
    try {
      const result = await pool.query('SELECT * FROM clientes');
      return result.rows;
    } catch (error) {
      throw new Error('Error al obtener los usuarios');
    }
  },

  /**
   * Get all account
   * @returns 
   */
  async obtenerTodasLasCuentas() {
    try {
      const result = await pool.query('SELECT * FROM cuentas');
      return result.rows;
    } catch (error) {
      throw new Error('Error al obtener las cuentas');
    }
  },

  /**
   * Get all cards
   * @returns 
   */
  async obtenerTodasLasTarjetas() {
    try {
      const result = await pool.query('SELECT * FROM tarjetas_debito');
      return result.rows;
    } catch (error) {
      throw new Error('Error al obtener las tarjetas');
    }
  }
}
