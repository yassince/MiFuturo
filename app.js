import express from 'express'
import path from 'path'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'

import ProductoRouter from './routes/Productos.js'
import UserRouter from './routes/user.js'
import cuentaRouter from './routes/cuenta.js'
import adminRouter from './routes/admin.js'
import { opcionesCookie } from './Logic/security/cookie.js'
import { pool } from './db/pool.js'

let ephemeralSecret

function resolveSessionSecret() {
    if (process.env.SESSION_PASS) return process.env.SESSION_PASS
    if (process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_PASS es obligatorio en producción')
    }
    if (!ephemeralSecret) ephemeralSecret = randomBytes(32).toString('hex')
    return ephemeralSecret
}

function buildSessionStore() {
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL es obligatorio en producción')
    }

    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
        return new session.MemoryStore()
    }

    const PgSession = connectPgSimple(session)

    return new PgSession({
        pool,
        tablename: 'session',
    })
}

export function createApp(options = {}) {
    const app = express()
    const distPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
    const loginRateLimit = options.loginRateLimit ?? Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10)

    if (process.env.NODE_ENV === 'production') {
        app.set('trust proxy', 1)
    }

    app.disable('x-powered-by')
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                upgradeInsecureRequests: null,
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: process.env.NODE_ENV === 'production',
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'no-referrer' },
    }))

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: loginRateLimit,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
        skip: (req) => {
            if (req.method !== 'POST') return true
            const url = req.path.toLowerCase()
            return url !== '/user/login' && url !== '/user/registro'
        },
    })
    app.use(loginLimiter)

    app.use(express.json({ limit: '100kb' }))
    app.use(express.urlencoded({ extended: true, limit: '100kb' }))

    app.use(session({
        store: options.sessionStore ?? buildSessionStore(),
        secret: resolveSessionSecret(),
        resave: false,
        saveUninitialized: false,
        cookie: opcionesCookie(),
    }))

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' })
    })

    app.use('/_astro', express.static(path.join(distPath, '_astro')))
    app.use('/img', express.static(path.join(distPath, 'img')))
    app.use('/Fonts', express.static(path.join(distPath, 'Fonts')))
    app.use('/Assets', express.static(path.join(distPath, 'assets')))

    app.use('/User', UserRouter)
    app.use('/Cuenta', cuentaRouter)
    app.use('/Productos', ProductoRouter)
    app.use('/admin', adminRouter)

    const paginas = [
        ['/', 'index.html'],
        ['/ayuda', 'PreguntasFrecuentes/index.html'],
        ['/info', 'Info/index.html'],
        ['/terminosCondiciones', 'TerminosCondiciones/index.html'],
        ['/Ubicacion', 'Ubicacion/index.html'],
    ]

    for (const [ruta, archivo] of paginas) {
        app.get(ruta, (_req, res) => {
            res.sendFile(path.join(distPath, archivo))
        })
    }

    app.use((_req, res) => {
        res.status(404).sendFile(path.join(distPath, 'Error', 'index.html'))
    })

    app.use((err, _req, res, next) => {
        if (res.headersSent) return next(err)

        if (err.code === 'EBADCSRFTOKEN') {
            return res.status(403).type('html').send('La solicitud no es válida. Recarga la página e inténtalo de nuevo.')
        }

        if (err.type === 'entity.too.large' || err.status === 413) {
            return res.status(413).send('La solicitud es demasiado grande.')
        }

        console.error(err.message)
        return res.status(err.status || 500).send('Ha ocurrido un error. Inténtalo más tarde.')
    })

    return app
}

export const app = createApp()
