import express from 'express'
import { isAuthenticated } from '../Logic/Utils.js';
import { getDirname } from '../Logic/dirname.js';
import ProductoController from '../Controllers/ProductoController.js'
import TarjetaDebitoController from '../Controllers/TarjetaDebitoController.js';

/* protección contra actaque de formularios */
import csrfProtection from '../Logic/csrf.js';
const __dirname = getDirname(import.meta.url)

const ProductoRouter = express.Router();

ProductoRouter.get('/Productos', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'Productos', 'index.html'))
})

ProductoRouter.post('/Tarjeta', TarjetaDebitoController.crearTarjeta)
ProductoRouter.post('/Tarjeta/Bloquear/:id', TarjetaDebitoController.bloquearTarjeta)
ProductoRouter.post('/Tarjeta/Activar/:id', TarjetaDebitoController.activarTarjeta)

export default ProductoRouter;