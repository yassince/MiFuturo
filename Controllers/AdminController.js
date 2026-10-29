import { AdminModel } from "../Models/AdminModel.js";
import path from 'path'
import { bloqueUsuario, plantillaTarjeta, plantillaCuenta } from "../Logic/Utils.js";
import { fileURLToPath } from 'url';
import fs from 'fs'
import { escapeHtml } from "../Logic/security/html.js";
import { presentarTarjeta } from "../Logic/security/tarjeta.js";

//path del archivo admin home
const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename)

export const AdminController = {
  /**
   * Get the dashboard of admin, show proyect info
   * @returns 
   */
  async verDashboard() {
    const totalUsuarios = await AdminModel.obtenerTodosLosUsuarios();
    const totalCuentas = await AdminModel.obtenerTodasLasCuentas();
    const totalTarjetas = await AdminModel.obtenerTodasLasTarjetas();

    const htmlPath = path.join(__dirname, '..', 'dist', 'HomeAdmin', 'index.html');
    const template = fs.readFileSync(htmlPath, 'utf-8');

    const html = template
      .replace(/__TOTAL_USUARIOS__/g, totalUsuarios.length)
      .replace(/__TOTAL_CUENTAS__/g, totalCuentas.length)
      .replace(/__TOTAL_TARJETAS__/g, totalTarjetas.length);

    return html;
  },

  /**
   * Get Users
   * @param {*} req 
   * @param {*} res 
   */
  async obtenerUsuarios(_, res) {
    try {
      const usuarios = await AdminModel.obtenerTodosLosUsuarios();

      const template = await AdminController.verDashboard();

      const bloquesHtml = usuarios.map((usuario) => {
        return bloqueUsuario
          .replace(/__NOMBRE__/g, escapeHtml(usuario.nombre))
          .replace(/__APELLIDOS__/g, escapeHtml(usuario.apellidos))
          .replace(/__EMAIL__/g, escapeHtml(usuario.email))
          .replace(/__DNI__/g, escapeHtml(usuario.dni))
          .replace(/__TELEFONO__/g, escapeHtml(usuario.telefono))
          .replace(/__DIRECCION__/g, escapeHtml(usuario.direccion))
          .replace(/__FECHA_NAC__/g, escapeHtml(usuario.fecha_nacimiento))
          .replace(/__FECHA_ALTA__/g, escapeHtml(usuario.fecha_alta));
      }).join('\n');

      const finalHtml = template.replace('__TABLA_USUARIOS__', bloquesHtml);
      res.send(finalHtml)

    } catch (error) {
      res.status(404).send('Error al obtener los datos el los usuarios');
    }
  },

  /**
   * Get Acounts
   * @param {*} req 
   * @param {*} res 
   */
  async obtenerCuentas(_, res) {
    try {
      const cuentas = await AdminModel.obtenerTodasLasCuentas();

      const template = await AdminController.verDashboard();

      let bloqueCuentas = cuentas.map(cuenta =>
        plantillaCuenta
          .replace(/__NUMERO_CUENTA__/g, escapeHtml(cuenta.numero_cuenta))
          .replace(/__SALDO__/g, escapeHtml(cuenta.saldo))
          .replace(/__FECHA_APERTURA__/g, escapeHtml(new Date(cuenta.fecha_apertura).toLocaleDateString()))
      ).join('\n');

      const finalHtml = template.replace('__TABLA_USUARIOS__', bloqueCuentas);
      res.send(finalHtml)
    } catch (error) {
      res.status(500).send('Error al obtener cuentas');
    }
  },

  /**
   * Get cards
   * @param {*} req 
   * @param {*} res 
   */
  async obtenerTarjetas(_, res) {
    try {
      const tarjetas = await AdminModel.obtenerTodasLasTarjetas();

      const template = await AdminController.verDashboard();

      let bloqueTarjetas = '';
      for (const tarjeta of tarjetas) {
        const estado = tarjeta.activa ? 'Activa' : 'Bloqueada';
        const vista = presentarTarjeta(tarjeta)

        const bloque = plantillaTarjeta
          .replace(/__NUMERO_TARJETA__/g, vista.numero)
          .replace(/__FECHA_EXPIRACION__/g, vista.expiracion)
          .replace(/__CVV__/g, vista.cvv)
          .replace(/__CUENTA_ID__/g, escapeHtml(tarjeta.cuenta_id))
          .replace(/__ESTADO__/g, escapeHtml(estado));

        bloqueTarjetas += bloque;
      }

      const finalHtml = template.replace('__TABLA_USUARIOS__', bloqueTarjetas);
      res.send(finalHtml)
    } catch (error) {
      res.status(500).send('Error al obtener tarjetas');
    }
  }
};
