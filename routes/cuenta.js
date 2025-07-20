import express from 'express'
import { isAuthenticated } from '../Logic/Utils.js';
import CuentaController from '../Controllers/CuentaController.js';

const cuentaRouter = express.Router();

//Routes to ingress and withdraw balance in account
cuentaRouter.post('/Ingresar', isAuthenticated, CuentaController.updateCuentaIngreso)
cuentaRouter.post('/Retirar', isAuthenticated, CuentaController.updateCuentaRetirar)

//Routes to do a transfer
cuentaRouter.get('/Transferencia', isAuthenticated, CuentaController.showTransferenciaFrom)
cuentaRouter.post('/Transferencia', isAuthenticated, CuentaController.transferencia)


export default cuentaRouter;