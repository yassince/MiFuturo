import express from 'express'
export const app = express();
import path from 'path'
import session from 'express-session';
import UserRouter from './routes/user.js';
import cuentaRouter from './routes/cuenta.js';
import { fileURLToPath } from 'url';
import ProductoRouter from './routes/Productos.js';
import fs from 'fs'
import https from 'https'
const PORT = process.env.PORT ?? 443;

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename)

//configuración de los formatos recibidos de los datos
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

//configuración de certificado
const options = {
    key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
}

//Configuración de session
app.use(session({
    secret: process.env.SESSION_PASS,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
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

//Rutas de enrutadores
app.use('/User', UserRouter)
app.use('/Cuenta', cuentaRouter)
app.use('/Productos', ProductoRouter)

//Rutas estaticas
app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
})

app.get('/ayuda', (req, res) => {
    res.sendFile(path.join(distPath, 'PreguntasFrecuentes', 'index.html'))
})
app.get('/info', (req, res) => {
    res.sendFile(path.join(distPath, 'Info', 'index.html'))
})
app.get('/terminosCondiciones', (req, res) => {
    res.sendFile(path.join(distPath, 'TerminosCondiciones', 'index.html'))
})
app.get('/Ubicacion', (req, res) => {
    res.sendFile(path.join(distPath, 'Ubicacion', 'index.html'))
})


/* Pagina de Error */
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'dist', 'Error', 'index.html'))
})

/* Puerto donde escucha el servidor */
https.createServer(options, app).listen(PORT, () => {
    console.log(`Servidor esta funcionando, en https://localhost:443`);
    
})