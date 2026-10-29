import { parseMonto } from '../Logic/security/montos.js'
import { presentarTarjeta, puedeGestionarTarjeta } from '../Logic/security/tarjeta.js'
import { escapeHtml, inyectarCsrf } from '../Logic/security/html.js'
import { cookieSecure } from '../Logic/security/cookie.js'
import { opcionesPool } from '../db/pool.js'

describe('pool', () => {
    const remota = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:secret@db.example:5432/mifuturo',
        DB_SSL_REJECT_UNAUTHORIZED: 'true',
    }

    it('usa un solo juego de opciones de pg', () => {
        expect(opcionesPool(remota)).toEqual({
            connectionString: remota.DATABASE_URL,
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
            ssl: { rejectUnauthorized: true },
        })
    })

    it('no fuerza ssl en test ni en localhost', () => {
        expect(opcionesPool({ NODE_ENV: 'test' }).ssl).toBe(false)
        expect(opcionesPool({
            NODE_ENV: 'development',
            DATABASE_URL: 'postgresql://user:secret@127.0.0.1:5432/mifuturo',
        }).ssl).toBe(false)
    })

    it('en produccion exige DATABASE_URL', () => {
        expect(() => opcionesPool({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/)
    })
})

describe('importes', () => {
    it('acepta un decimal positivo de dos cifras', () => {
        expect(parseMonto('10,50')).toEqual({ ok: true, value: 10.5 })
    })

    it('rechaza negativos, basura y mas de dos decimales', () => {
        expect(parseMonto('-1').ok).toBe(false)
        expect(parseMonto('abc').ok).toBe(false)
        expect(parseMonto('10.999').ok).toBe(false)
        expect(parseMonto('6000', { max: 5000 }).ok).toBe(false)
    })
})

describe('tarjetas', () => {
    it('no devuelve el pan completo ni el cvv', () => {
        const vista = presentarTarjeta({
            numero_tarjeta: '4579123412341234',
            fecha_expiracion: '2030-01',
            cvv: '123',
        })

        expect(vista.cvv).toBe('•••')
        expect(vista.numero).not.toContain('4579123412341234')
        expect(vista.numero).toContain('1234')
    })

    it('solo permite la tarjeta de la propia cuenta', () => {
        const tarjeta = { id: 4, cuenta_id: 9 }
        expect(puedeGestionarTarjeta(tarjeta, { cuentaId: 9, tarjetaId: 4 })).toBe(true)
        expect(puedeGestionarTarjeta(tarjeta, { cuentaId: 9, tarjetaId: 5 })).toBe(false)
        expect(puedeGestionarTarjeta(tarjeta, { cuentaId: 1, tarjetaId: 4 })).toBe(false)
    })
})

describe('html y cookie', () => {
    it('escapa el texto que viene del usuario', () => {
        expect(escapeHtml('<b>"x"</b>')).toBe('&lt;b&gt;&quot;x&quot;&lt;/b&gt;')
    })

    it('no duplica el token si el formulario ya lo trae', () => {
        const html = '<form method="post"><input type="hidden" name="_csrf" value="__CSRF__">'
        const out = inyectarCsrf(html, 'abc')
        expect(out.match(/name="_csrf"/g)).toHaveLength(1)
        expect(out).toContain('value="abc"')
    })

    it('la cookie solo es secure en produccion, salvo override', () => {
        expect(cookieSecure({ NODE_ENV: 'production' })).toBe(true)
        expect(cookieSecure({ NODE_ENV: 'development' })).toBe(false)
        expect(cookieSecure({ NODE_ENV: 'development', COOKIE_SECURE: 'true' })).toBe(true)
    })
})
