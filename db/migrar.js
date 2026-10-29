import { ibanEspanol } from './iban.js'
import { aplicarEsquema, asegurarCaja, contabilizarEn } from './libro.js'

export async function migrar(db) {
    const client = typeof db.connect === 'function' && typeof db.release !== 'function'
        ? await db.connect()
        : db
    const soltar = client !== db

    let abierta = false
    try {
        const estado = await estadoEsquema(client)
        if (estado === 'nuevo' || estado === 'vacio') {
            if (estado === 'vacio') await aplicarEsquema(client)
            return { estado }
        }

        await client.query('BEGIN')
        abierta = true
        await client.query('ALTER TABLE clientes RENAME TO clientes_legacy')
        await client.query('ALTER TABLE cuentas RENAME TO cuentas_legacy')
        await client.query('ALTER TABLE tarjetas_debito RENAME TO tarjetas_legacy')
        await client.query('ALTER TABLE transacciones RENAME TO transacciones_legacy')
        await aplicarEsquema(client)

        const clientes = await client.query('SELECT * FROM clientes_legacy')
        const idCliente = new Map()
        for (const fila of clientes.rows) {
            const insertado = await client.query(
                `INSERT INTO clientes (
                    tipo_documento, numero_documento, nombre, apellidos, fecha_nacimiento,
                    email, telefono, direccion, password_hash, creado_en
                 ) VALUES ('DNI',$1,$2,$3,$4,$5,$6,$7,$8, COALESCE($9::timestamptz, now()))
                 RETURNING id`,
                [
                    fila.dni, fila.nombre, fila.apellidos, fila.fecha_nacimiento,
                    fila.email, fila.telefono, fila.direccion ?? '', fila.contrasena, fila.fecha_alta,
                ],
            )
            idCliente.set(fila.dni, insertado.rows[0].id)
        }

        const cuentas = await client.query('SELECT * FROM cuentas_legacy')
        const idCuenta = new Map()
        for (const fila of cuentas.rows) {
            const insertada = await client.query(
                `INSERT INTO cuentas (cliente_id, tipo, iban, abierta_en)
                 VALUES ($1, 'CLIENTE', $2, COALESCE($3::timestamptz, now()))
                 RETURNING id`,
                [idCliente.get(fila.dni), ibanEspanol(cccDe(fila.numero_cuenta)), fila.fecha_apertura],
            )
            idCuenta.set(fila.cuenta_id, { id: insertada.rows[0].id, saldo: fila.saldo })
        }

        const caja = await asegurarCaja(client)
        const movimientos = await client.query(
            'SELECT * FROM transacciones_legacy ORDER BY fecha_hora, id',
        )
        for (const fila of movimientos.rows) {
            await reponerMovimiento(client, caja.id, idCuenta, fila)
        }

        for (const fila of cuentas.rows) {
            const nueva = idCuenta.get(fila.cuenta_id)
            const actual = await client.query('SELECT saldo_centimos FROM cuentas WHERE id = $1', [nueva.id])
            const esperado = BigInt(Math.round(Number(fila.saldo) * 100))
            const diferencia = esperado - BigInt(actual.rows[0].saldo_centimos)
            if (diferencia !== 0n) {
                await contabilizarEn(client, {
                    tipo: diferencia > 0n ? 'INGRESO' : 'RETIRO',
                    clave: `legacy-ajuste-${fila.cuenta_id}`,
                    lineas: diferencia > 0n
                        ? [
                            { cuentaId: caja.id, importeCentimos: -diferencia },
                            { cuentaId: nueva.id, importeCentimos: diferencia },
                        ]
                        : [
                            { cuentaId: nueva.id, importeCentimos: diferencia },
                            { cuentaId: caja.id, importeCentimos: -diferencia },
                        ],
                }, { transaccion: false })
            }
        }

        const tarjetas = await client.query('SELECT * FROM tarjetas_legacy')
        for (const fila of tarjetas.rows) {
            const cuenta = idCuenta.get(fila.cuenta_id)
            if (!cuenta) continue
            const [anio, mes] = String(fila.fecha_expiracion).split('-')
            await client.query(
                `INSERT INTO tarjetas (cuenta_id, ultimos4, mes_caducidad, anio_caducidad, estado)
                 VALUES ($1,$2,$3,$4,$5)`,
                [
                    cuenta.id,
                    String(fila.numero_tarjeta).replace(/\D/g, '').slice(-4),
                    Number(mes),
                    Number(anio),
                    fila.activa ? 'ACTIVA' : 'BLOQUEADA',
                ],
            )
        }

        await client.query('COMMIT')
        abierta = false
        return { estado: 'migrado', clientes: clientes.rows.length, cuentas: cuentas.rows.length }
    } catch (error) {
        if (abierta) await client.query('ROLLBACK')
        throw error
    } finally {
        if (soltar) client.release()
    }
}

async function estadoEsquema(client) {
    const tabla = await client.query(`SELECT to_regclass('public.clientes') AS nombre`)
    if (!tabla.rows[0].nombre) return 'vacio'

    const columnas = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes'`,
    )
    const nombres = columnas.rows.map((fila) => fila.column_name)
    if (nombres.includes('dni')) return 'legacy'
    return 'nuevo'
}

function cccDe(numero) {
    const digitos = String(numero ?? '').replace(/\D/g, '')
    if (digitos.length >= 20) return digitos.slice(-20)
    return digitos.padStart(20, '0')
}

async function reponerMovimiento(client, cajaId, idCuenta, fila) {
    const centimos = BigInt(Math.round(Number(fila.monto) * 100))
    if (centimos === 0n) return

    const tipo = String(fila.tipo_transaccion).toUpperCase()
    const clave = `legacy-${fila.id}`
    const origen = idCuenta.get(fila.cuenta_origen_id)?.id
    const destino = idCuenta.get(fila.cuenta_destino_id)?.id

    if (tipo === 'TRANSFERENCIA' && origen && destino) {
        await contabilizarEn(client, {
            tipo: 'TRANSFERENCIA',
            clave,
            lineas: [
                { cuentaId: origen, importeCentimos: -centimos },
                { cuentaId: destino, importeCentimos: centimos },
            ],
        }, { transaccion: false })
        return
    }

    const cuentaId = tipo === 'RETIRO' ? origen : destino
    if (!cuentaId) return

    await contabilizarEn(client, {
        tipo: tipo === 'RETIRO' ? 'RETIRO' : (tipo === 'APERTURA' ? 'APERTURA' : 'INGRESO'),
        clave,
        lineas: tipo === 'RETIRO'
            ? [
                { cuentaId, importeCentimos: -centimos },
                { cuentaId: cajaId, importeCentimos: centimos },
            ]
            : [
                { cuentaId: cajaId, importeCentimos: -centimos },
                { cuentaId, importeCentimos: centimos },
            ],
    }, { transaccion: false })
}
