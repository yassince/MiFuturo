import express from 'express'
import { isAuthenticated } from '../Logic/Utils.js'
import csrfProtection from '../Logic/csrf.js'
import CuentaController from '../Controllers/CuentaController.js'

const cuentaRouter = express.Router()

cuentaRouter.post('/Ingresar', [isAuthenticated, csrfProtection], CuentaController.updateCuentaIngreso)
cuentaRouter.post('/Retirar', [isAuthenticated, csrfProtection], CuentaController.updateCuentaRetirar)
cuentaRouter.get('/Transferencia', [isAuthenticated, csrfProtection], CuentaController.showTransferenciaFrom)
cuentaRouter.post('/Transferencia', [isAuthenticated, csrfProtection], CuentaController.transferencia)

export default cuentaRouter
