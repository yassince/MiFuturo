import express from 'express'
import path from 'path';
import { isAuthenticated } from '../Logic/Utils.js';
import { getDirname } from '../Logic/dirname.js';
import TarjetaDebitoController from '../Controllers/TarjetaDebitoController.js';

const __dirname = getDirname(import.meta.url)
const ProductoRouter = express.Router();

//Routes to get products and create, lock and activate cards
ProductoRouter.get('/Productos', (_, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'Productos', 'index.html'))
})
ProductoRouter.post('/Tarjeta', isAuthenticated, TarjetaDebitoController.crearTarjeta)
ProductoRouter.post('/Tarjeta/Bloquear/:id',isAuthenticated, TarjetaDebitoController.bloquearTarjeta)
ProductoRouter.post('/Tarjeta/Activar/:id', isAuthenticated, TarjetaDebitoController.activarTarjeta)

export default ProductoRouter;