import express from 'express'
import path from 'path'
import { isAuthenticated } from '../Logic/Utils.js'
import csrfProtection from '../Logic/csrf.js'
import { getDirname } from '../Logic/dirname.js'
import { enviarPaginaConCsrf } from '../Logic/security/html.js'
import TarjetaDebitoController from '../Controllers/TarjetaDebitoController.js'

const __dirname = getDirname(import.meta.url)
const ProductoRouter = express.Router()

ProductoRouter.get('/Productos', csrfProtection, (req, res) => {
    enviarPaginaConCsrf(req, res, path.join(__dirname, '..', 'dist', 'Productos', 'index.html'))
})
ProductoRouter.post('/Tarjeta', [isAuthenticated, csrfProtection], TarjetaDebitoController.crearTarjeta)
ProductoRouter.post('/Tarjeta/Bloquear/:id', [isAuthenticated, csrfProtection], TarjetaDebitoController.bloquearTarjeta)
ProductoRouter.post('/Tarjeta/Activar/:id', [isAuthenticated, csrfProtection], TarjetaDebitoController.activarTarjeta)

export default ProductoRouter
