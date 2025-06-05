import { pool } from "../MySQL/conexion.js";


export const AdminModel = {
    //Obtener todos los usuarios
  async obtenerTodosLosUsuarios() {
    try {
      const [rows] = await pool.query('SELECT * FROM clientes');
      return rows;
    } catch (error) {
      throw new Error('Error al obtener los usuarios');
    }
  },

  //Obtener todas la cuentas
  async obtenerTodasLasCuentas() {
    try {
      const [rows] = await pool.query('SELECT * FROM cuentas');
      return rows;
    } catch (error) {
      throw new Error('Error al obtener las cuentas');
    }
  },

  //Obtener todas las tarjetas
  async obtenerTodasLasTarjetas() {
    try {
      const [rows] = await pool.query('SELECT * FROM tarjetas_debito');
      return rows;
    } catch (error) {
      throw new Error('Error al obtener las tarjetas');
    }
  }
};
