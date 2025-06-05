import { AdminModel } from "../Models/AdminModel.js";
import path from 'path'
import { bloqueUsuario, plantillaTarjeta, plantillaCuenta } from "../Logic/Utils.js";
import { fileURLToPath } from 'url';
import fs from 'fs'

//path del archivo admin home
const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename)

export const AdminController = {
  //Obtener el bashborad con los datos de estadistica
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

  async obtenerUsuarios(req, res) {
    try {
      const usuarios = await AdminModel.obtenerTodosLosUsuarios();

      const template = await AdminController.verDashboard();

      const bloquesHtml = usuarios.map((usuario) => {
        return bloqueUsuario
          .replace(/__NOMBRE__/g, usuario.nombre)
          .replace(/__APELLIDOS__/g, usuario.apellidos)
          .replace(/__EMAIL__/g, usuario.email)
          .replace(/__DNI__/g, usuario.dni)
          .replace(/__TELEFONO__/g, usuario.telefono)
          .replace(/__DIRECCION__/g, usuario.direccion)
          .replace(/__FECHA_NAC__/g, usuario.fecha_nacimiento)
          .replace(/__FECHA_ALTA__/g, usuario.fecha_alta);
      }).join('\n');

      const finalHtml = template.replace('__TABLA_USUARIOS__', bloquesHtml);
      res.send(finalHtml)

    } catch (error) {
      console.log(error);

      res.status(404)
    }
  },

  async obtenerCuentas(req, res) {
    try {
      const cuentas = await AdminModel.obtenerTodasLasCuentas();

      const template = await AdminController.verDashboard();

      let bloqueCuentas = cuentas.map(cuenta =>
        plantillaCuenta
          .replace(/__NUMERO_CUENTA__/g, cuenta.numero_cuenta)
          .replace(/__SALDO__/g, cuenta.saldo)
          .replace(/__FECHA_APERTURA__/g, new Date(cuenta.fecha_apertura).toLocaleDateString())
      ).join('\n');

      const finalHtml = template.replace('__TABLA_USUARIOS__', bloqueCuentas);
      res.send(finalHtml)
    } catch (error) {
      res.status(500).send('Error al obtener cuentas');
    }
  },

  async obtenerTarjetas(req, res) {
    try {
      const tarjetas = await AdminModel.obtenerTodasLasTarjetas();

      const template = await AdminController.verDashboard();

      let bloqueTarjetas = '';
      for (const tarjeta of tarjetas) {
        const estado = tarjeta.activa ? 'Activa' : 'Bloqueada';

        const bloque = plantillaTarjeta
          .replace(/__NUMERO_TARJETA__/g, tarjeta.numero_tarjeta)
          .replace(/__FECHA_EXPIRACION__/g, tarjeta.fecha_expiracion)
          .replace(/__CVV__/g, tarjeta.cvv)
          .replace(/__CUENTA_ID__/g, tarjeta.cuenta_id)
          .replace(/__ESTADO__/g, estado);

        bloqueTarjetas += bloque;
      }

      const finalHtml = template.replace('__TABLA_USUARIOS__', bloqueTarjetas);
      res.send(finalHtml)
    } catch (error) {
      res.status(500).send('Error al obtener tarjetas');
    }
  }
};
