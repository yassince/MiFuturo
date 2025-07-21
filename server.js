import express from 'express'
import path from 'path'
import session from 'express-session';
import { fileURLToPath } from 'url';
import connectPgSimple from 'connect-pg-simple';

//Import the routers
import ProductoRouter from './routes/Productos.js';
import UserRouter from './routes/user.js';
import cuentaRouter from './routes/cuenta.js';
import adminRouter from './routes/admin.js';
import { Pool } from 'pg';
import { pool } from './MySQL/conexion.js';

export const app = express();
const PORT = process.env.PORT ?? 443;

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename)

//Midelware for parse info of request
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


//Create de adapter with express-session
const pgSession = connectPgSimple(session)

//Configuration for table session in our DB
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
            rejectUnauthorized: false
    }
})


//Session configuration
app.use(session({
    store: new pgSession({
        pool: pgPool,
        tablename: 'session'
    }),
    secret: process.env.SESSION_PASS,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

//Dist folder ubication
const distPath = path.join(__dirname, 'dist');

/* Carpetas necesarias para el funcionamiento del FrontEnd */
//Folders for proper functioning 
app.use('/_astro', express.static(path.join(distPath, '_astro')));
app.use('/img', express.static(path.join(distPath, 'img')));
app.use('/Fonts', express.static(path.join(distPath, 'Fonts')));
app.use('/Assets', express.static(path.join(distPath, 'assets')));

//Main routes
app.use('/User', UserRouter)
app.use('/Cuenta', cuentaRouter)
app.use('/Productos', ProductoRouter)
app.use('/admin', adminRouter)

//Static Routes
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


//Error Static page
app.use((_, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'dist', 'Error', 'index.html'))
})

//Listen port of website
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor esta funcionando en http://0.0.0.0:${PORT}`)
    console.log(`Aplicacion funcionando correctamente`)
});