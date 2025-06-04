import path from 'path'
import { getDirname } from "../Logic/dirname.js"
const __dirname = getDirname(import.meta.url)

class ProductoController{

    //Mostrar pagina de productos
    static showProducts(req, res){
        res.sendFile(path.join(__dirname, '..', 'dist', 'Productos', 'index.html'))
    }

    static createTarjeta(req, res){
        
    }
}

export default ProductoController