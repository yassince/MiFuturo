import { Router } from 'express';
import { AdminController } from '../Controllers/AdminController.js';
import { isAdmin } from '../Logic/Utils.js';

const adminRouter = Router();

//Route to get all users
adminRouter.get('/', isAdmin , AdminController.obtenerUsuarios);

//Route to get all accounts
adminRouter.get('/Cuentas', isAdmin ,AdminController.obtenerCuentas);

//Route to get all cards
adminRouter.get('/Tarjetas', isAdmin ,AdminController.obtenerTarjetas);

export default adminRouter;
