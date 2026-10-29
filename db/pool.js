import { Pool } from 'pg'

export function opcionesPool(env = process.env) {
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
        throw new Error('DATABASE_URL es obligatorio en producción')
    }

    return {
        connectionString: env.DATABASE_URL || 'postgresql://127.0.0.1:5432/mifuturo',
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
        ssl: sslDelPool(env),
    }
}

function sslDelPool(env) {
    if (env.NODE_ENV === 'test' || env.DB_SSL === 'disable') return false

    const url = env.DATABASE_URL || ''
    if (url.includes('localhost') || url.includes('127.0.0.1')) return false

    return {
        rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
    }
}

export const pool = new Pool(opcionesPool())
