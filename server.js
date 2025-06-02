import express from 'express'
export const app = express();
import path from 'path'
import session from 'express-session';
import UserRouter from './routes/user.js';
import cuentaRouter from './routes/cuenta.js';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT ?? 1234;

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_PASS,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true en producción (HTTPS), false en desarrollo (HTTP)
        httpOnly: true, // La cookie solo es accesible por el servidor web
        maxAge: 1000 * 60 * 60 * 24 // 1 día (en milisegundos)
    }
}));

const distPath = path.join(__dirname, 'dist');


app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
});

/* Carpetas necesarias para el funcionamiento del FrontEnd */
app.use('/_astro', express.static(path.join(distPath, '_astro')));
app.use('/img', express.static(path.join(distPath, 'img')));
app.use('/Fonts', express.static(path.join(distPath, 'Fonts')));
app.use('/Assets', express.static(path.join(distPath, 'assets')));

app.use('/User', UserRouter)
app.use('/Cuenta', cuentaRouter)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist' ,'index.html'))
})

app.get('/ayuda', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'PreguntasFrecuentes', 'index.html'))
})
app.get('/info', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'Info', 'index.html'))
})
app.get('/terminosCondiciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'TerminosCondiciones', 'index.html'))
})


/* Pagina de Error */
app.use((req, res, next)=>{
    res.status(404).sendFile(path.join(__dirname, 'dist', 'Error', 'index.html'))
})

/* Puerto donde escucha el servidor */
app.listen(PORT, () => {
    console.log(`The server is running in http://localhost:${PORT}`);
})