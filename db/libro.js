import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ibanEspanol } from './iban.js'

const schemaSql = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql'),
    'utf8',
)

export async function aplicarEsquema(db) {
    const partes = schemaSql.split(';').map((parte) => parte.trim()).filter(Boolean)
    for (const parte of partes) await db.query(parte)
}

export async function crearCliente(db, datos) {
    const result = await db.query(
        `INSERT INTO clientes (
            tipo_documento, numero_documento, nombre, apellidos,
            fecha_nacimiento, email, telefono, direccion, password_hash, rol
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING id, numero_documento, nombre`,
        [
            datos.tipoDocumento ?? 'DNI',
            datos.numeroDocumento,
            datos.nombre,
            datos.apellidos,
            datos.fechaNacimiento,
            datos.email,
            datos.telefono,
            datos.direccion ?? '',
            datos.passwordHash,
            datos.rol ?? 'CLIENTE',
        ],
    )
    return result.rows[0]
}

export async function crearCuenta(db, { clienteId = null, tipo = 'CLIENTE', ccc }) {
    const result = await db.query(
        `INSERT INTO cuentas (cliente_id, tipo, iban)
         VALUES ($1, $2, $3)
         RETURNING id, iban, tipo, saldo_centimos`,
        [clienteId, tipo, ibanEspanol(ccc)],
    )
    return result.rows[0]
}

export async function crearTarjeta(db, { cuentaId, ultimos4, mes, anio }) {
    const result = await db.query(
        `INSERT INTO tarjetas (cuenta_id, ultimos4, mes_caducidad, anio_caducidad)
         VALUES ($1, $2, $3, $4)
         RETURNING ultimos4, mes_caducidad, anio_caducidad, estado`,
        [cuentaId, ultimos4, mes, anio],
    )
    return result.rows[0]
}

export const CCC_CAJA = '00000000000000000001'

export function aCentimos(euros) {
    return Math.round(Number(euros) * 100)
}

function esPool(db) {
    return typeof db.connect === 'function' && typeof db.release !== 'function'
}

async function enConexion(db, fn) {
    if (!esPool(db)) return fn(db)
    const client = await db.connect()
    try {
        return await fn(client)
    } finally {
        client.release()
    }
}

export async function asegurarCaja(db) {
    return enConexion(db, asegurarCajaEn)
}

async function asegurarCajaEn(client) {
    const iban = ibanEspanol(CCC_CAJA)
    const existe = await client.query('SELECT id, iban FROM cuentas WHERE iban = $1', [iban])
    if (existe.rows[0]) return existe.rows[0]

    const creada = await client.query(
        `INSERT INTO cuentas (cliente_id, tipo, iban)
         VALUES (NULL, 'INTERNA', $1)
         RETURNING id, iban`,
        [iban],
    )
    return creada.rows[0]
}

export async function ingresar(db, { cuentaId, centimos, clave }) {
    return enConexion(db, async (client) => {
        const caja = await asegurarCajaEn(client)
        return contabilizarEn(client, {
            tipo: 'INGRESO',
            clave,
            lineas: [
                { cuentaId: caja.id, importeCentimos: -centimos },
                { cuentaId, importeCentimos: centimos },
            ],
        })
    })
}

export async function retirar(db, { cuentaId, centimos, clave }) {
    return enConexion(db, async (client) => {
        const caja = await asegurarCajaEn(client)
        return contabilizarEn(client, {
            tipo: 'RETIRO',
            clave,
            lineas: [
                { cuentaId, importeCentimos: -centimos },
                { cuentaId: caja.id, importeCentimos: centimos },
            ],
        })
    })
}

export async function transferir(db, { origenId, destinoId, centimos, clave }) {
    return enConexion(db, (client) => contabilizarEn(client, {
        tipo: 'TRANSFERENCIA',
        clave,
        lineas: [
            { cuentaId: origenId, importeCentimos: -centimos },
            { cuentaId: destinoId, importeCentimos: centimos },
        ],
    }))
}

export async function abrirConSaldo(db, { cuentaId, centimos, clave }) {
    return enConexion(db, async (client) => {
        const caja = await asegurarCajaEn(client)
        return contabilizarEn(client, {
            tipo: 'APERTURA',
            clave,
            lineas: [
                { cuentaId: caja.id, importeCentimos: -centimos },
                { cuentaId, importeCentimos: centimos },
            ],
        })
    })
}

export async function contabilizar(db, args) {
    return enConexion(db, (client) => contabilizarEn(client, args))
}

export async function contabilizarEn(client, { tipo, clave, lineas }, { transaccion = true } = {}) {
    const suma = lineas.reduce((total, linea) => total + BigInt(linea.importeCentimos), 0n)
    if (suma !== 0n) throw new Error('El movimiento no cuadra')
    if (lineas.length < 2) throw new Error('Hacen falta dos apuntes')

    if (transaccion) await client.query('BEGIN')
    try {
        const yaExiste = await client.query(
            'SELECT id FROM movimientos WHERE clave_idempotencia = $1',
            [clave],
        )
        if (yaExiste.rows.length > 0) {
            if (transaccion) await client.query('COMMIT')
            return { id: yaExiste.rows[0].id, repetido: true }
        }

        const ids = [...new Set(lineas.map((linea) => linea.cuentaId))].sort()
        for (const id of ids) {
            await client.query('SELECT id FROM cuentas WHERE id = $1 FOR UPDATE', [id])
        }

        const movimiento = await client.query(
            `INSERT INTO movimientos (tipo, clave_idempotencia)
             VALUES ($1, $2)
             RETURNING id`,
            [tipo, clave],
        )
        const movimientoId = movimiento.rows[0].id

        for (const linea of [...lineas].sort((a, b) => String(a.cuentaId).localeCompare(String(b.cuentaId)))) {
            const actualizada = await client.query(
                `UPDATE cuentas
                 SET saldo_centimos = saldo_centimos + $1
                 WHERE id = $2
                   AND (tipo = 'INTERNA' OR saldo_centimos + $1 >= 0)
                 RETURNING id`,
                [linea.importeCentimos, linea.cuentaId],
            )
            if (actualizada.rows.length === 0) {
                throw new Error('Saldo insuficiente')
            }
            await client.query(
                `INSERT INTO apuntes (movimiento_id, cuenta_id, importe_centimos)
                 VALUES ($1, $2, $3)`,
                [movimientoId, linea.cuentaId, linea.importeCentimos],
            )
        }

        if (transaccion) await client.query('COMMIT')
        return { id: movimientoId, repetido: false }
    } catch (error) {
        if (transaccion) await client.query('ROLLBACK')
        throw error
    }
}

export async function resumen(db) {
    const cuentas = await db.query(
        `SELECT iban, tipo, saldo_centimos
         FROM cuentas
         ORDER BY tipo DESC, iban`,
    )
    const movimientos = await db.query(
        `SELECT m.tipo, m.clave_idempotencia, SUM(a.importe_centimos) AS suma
         FROM movimientos m
         JOIN apuntes a ON a.movimiento_id = m.id
         GROUP BY m.id
         ORDER BY MIN(a.contabilizado_en), m.tipo`,
    )
    const columnasTarjeta = await db.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'tarjetas'
         ORDER BY column_name`,
    )
    return {
        cuentas: cuentas.rows,
        movimientos: movimientos.rows,
        columnasTarjeta: columnasTarjeta.rows.map((fila) => fila.column_name),
    }
}

export function euros(centimos) {
    const valor = BigInt(centimos)
    const negativo = valor < 0n
    const absoluto = negativo ? -valor : valor
    const enteros = absoluto / 100n
    const decimales = String(absoluto % 100n).padStart(2, '0')
    return `${negativo ? '-' : ''}${enteros},${decimales} €`
}

export async function escenarioDemo(db) {
    await aplicarEsquema(db)

    const caja = await crearCuenta(db, { tipo: 'INTERNA', ccc: '00000000000000000001' })
    const ana = await crearCliente(db, {
        numeroDocumento: '12345678Z',
        nombre: 'Ana',
        apellidos: 'López',
        fechaNacimiento: '1994-04-12',
        email: 'ana@mifuturo.test',
        telefono: '600111222',
        passwordHash: 'hash-demo',
    })
    const luis = await crearCliente(db, {
        numeroDocumento: '87654321X',
        nombre: 'Luis',
        apellidos: 'García',
        fechaNacimiento: '1990-01-20',
        email: 'luis@mifuturo.test',
        telefono: '600333444',
        passwordHash: 'hash-demo',
    })
    const cuentaAna = await crearCuenta(db, { clienteId: ana.id, ccc: '12345678901234567890' })
    const cuentaLuis = await crearCuenta(db, { clienteId: luis.id, ccc: '10987654321098765432' })
    await crearTarjeta(db, { cuentaId: cuentaAna.id, ultimos4: '1234', mes: 8, anio: 2030 })

    await contabilizar(db, {
        tipo: 'APERTURA',
        clave: 'apertura-ana',
        lineas: [
            { cuentaId: caja.id, importeCentimos: -10000 },
            { cuentaId: cuentaAna.id, importeCentimos: 10000 },
        ],
    })
    await contabilizar(db, {
        tipo: 'INGRESO',
        clave: 'ingreso-ana-1',
        lineas: [
            { cuentaId: caja.id, importeCentimos: -1050 },
            { cuentaId: cuentaAna.id, importeCentimos: 1050 },
        ],
    })
    const transferencia = await contabilizar(db, {
        tipo: 'TRANSFERENCIA',
        clave: 'transfer-ana-luis-1',
        lineas: [
            { cuentaId: cuentaAna.id, importeCentimos: -2500 },
            { cuentaId: cuentaLuis.id, importeCentimos: 2500 },
        ],
    })
    const repetida = await contabilizar(db, {
        tipo: 'TRANSFERENCIA',
        clave: 'transfer-ana-luis-1',
        lineas: [
            { cuentaId: cuentaAna.id, importeCentimos: -2500 },
            { cuentaId: cuentaLuis.id, importeCentimos: 2500 },
        ],
    })

    let rechazo = null
    try {
        await contabilizar(db, {
            tipo: 'RETIRO',
            clave: 'retiro-ana-grande',
            lineas: [
                { cuentaId: cuentaAna.id, importeCentimos: -999999 },
                { cuentaId: caja.id, importeCentimos: 999999 },
            ],
        })
    } catch (error) {
        rechazo = error.message
    }

    return {
        transferenciaRepetida: repetida.repetido === true && repetida.id === transferencia.id,
        rechazo,
        ...(await resumen(db)),
    }
}
