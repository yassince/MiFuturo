import { Router } from 'express';
import { AdminController } from '../Controllers/AdminController.js';
import { isAdmin } from '../Logic/Utils.js';

const adminRouter = Router();

// Ruta para obtener todos los usuarios
adminRouter.get('/', isAdmin , AdminController.obtenerUsuarios);

// Ruta para obtener todas las cuentas
adminRouter.get('/Cuentas', isAdmin ,AdminController.obtenerCuentas);

// Ruta para obtener todas las tarjetas
adminRouter.get('/Tarjetas', isAdmin ,AdminController.obtenerTarjetas);

export default adminRouter;
