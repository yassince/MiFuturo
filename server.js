import express from 'express'
import path from 'path'
import session from 'express-session';
import { fileURLToPath } from 'url';

//Importamos los routers
import ProductoRouter from './routes/Productos.js';
import UserRouter from './routes/user.js';
import cuentaRouter from './routes/cuenta.js';
import adminRouter from './routes/admin.js';

export const app = express();
const PORT = process.env.PORT ?? 443;

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename)

//Midelware para parsear los datos
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


//Configuración de session
app.use(session({
    secret: process.env.SESSION_PASS,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

//Ubicación del la carpeta dist
const distPath = path.join(__dirname, 'dist');

/* Carpetas necesarias para el funcionamiento del FrontEnd */
app.use('/_astro', express.static(path.join(distPath, '_astro')));
app.use('/img', express.static(path.join(distPath, 'img')));
app.use('/Fonts', express.static(path.join(distPath, 'Fonts')));
app.use('/Assets', express.static(path.join(distPath, 'assets')));

//Rutas principales
app.use('/User', UserRouter)
app.use('/Cuenta', cuentaRouter)
app.use('/Productos', ProductoRouter)
app.use('/admin', adminRouter)

//Rutas estaticas
app.get('/', (_, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
})
app.get('/ayuda', (_, res) => {
    res.sendFile(path.join(distPath, 'PreguntasFrecuentes', 'index.html'))
})
app.get('/info', (_, res) => {
    res.sendFile(path.join(distPath, 'Info', 'index.html'))
})
app.get('/terminosCondiciones', (_, res) => {
    res.sendFile(path.join(distPath, 'TerminosCondiciones', 'index.html'))
})
app.get('/Ubicacion', (_, res) => {
    res.sendFile(path.join(distPath, 'Ubicacion', 'index.html'))
})


/* Pagina de Error */
app.use((_, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'dist', 'Error', 'index.html'))
})


app.listen(PORT, 'localhost', () => {
    console.log(`Servidor esta funcionando en http://localhost:${PORT}`)
    console.log(`Aplicacion funcionando correctamente`)
});


/* Probar el funcionamiento del proyecto, antes de actualizar el repo y subirlo a onreder */