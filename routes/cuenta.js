import express from 'express'
import { isAuthenticated } from '../Logic/Utils.js';
import CuentaController from '../Controllers/CuentaController.js';

const cuentaRouter = express.Router();


cuentaRouter.post('/Ingresar', isAuthenticated, CuentaController.updateCuentaIngreso)
cuentaRouter.post('/Retirar', isAuthenticated, CuentaController.updateCuentaRetirar)


export default cuentaRouter;