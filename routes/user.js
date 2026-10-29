import express from 'express'
import { UserController } from '../Controllers/UserController.js'
import { isAuthenticated } from '../Logic/Utils.js'
import csrfProtection from '../Logic/csrf.js'

const UserRouter = express.Router()

UserRouter.get('/Registro', csrfProtection, UserController.showRegisterFrom)
UserRouter.post('/Registro', csrfProtection, UserController.registerUser)
UserRouter.get('/Login', csrfProtection, UserController.showLoginFrom)
UserRouter.post('/Login', csrfProtection, UserController.loginUser)

UserRouter.get('/Perfil', [isAuthenticated, csrfProtection], UserController.showPerfil)
UserRouter.get('/Logout', isAuthenticated, UserController.logout)
UserRouter.post('/Remove', [isAuthenticated, csrfProtection], UserController.remove)

UserRouter.get('/Update', [isAuthenticated, csrfProtection], UserController.showUpdateFrom)
UserRouter.post('/Update', [isAuthenticated, csrfProtection], UserController.updateUser)

export default UserRouter
