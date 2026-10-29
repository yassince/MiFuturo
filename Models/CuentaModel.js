import { randomUUID } from 'node:crypto'
import { pool } from '../db/pool.js'
import { aCentimos, abrirConSaldo, ingresar, retirar, transferir } from '../db/libro.js'
import { ibanEspanol } from '../db/iban.js'

const SALDO_APERTURA_CENTIMOS = 10000

function cuentaVisible(fila) {
    return {
        id: fila.id,
        dni: fila.dni,
        numero_cuenta: fila.numero_cuenta,
        saldo: Number(fila.saldo_centimos) / 100,
        fecha_apertura: fila.fecha_apertura,
    }
}

const SELECT_CUENTA = `
    SELECT c.id,
           cl.numero_documento AS dni,
           c.iban AS numero_cuenta,
           c.saldo_centimos,
           c.abierta_en AS fecha_apertura
    FROM cuentas c
    JOIN clientes cl ON cl.id = c.cliente_id
`

export class CuentaModel {
    static async crearCuenta({ cuenta }) {
        const cliente = await pool.query(
            `SELECT id FROM clientes WHERE numero_documento = $1`,
            [cuenta.dni],
        )
        if (!cliente.rows[0]) throw new Error('No se ha podido crear la cuenta')

        const creada = await pool.query(
            `INSERT INTO cuentas (cliente_id, tipo, iban)
             VALUES ($1, 'CLIENTE', $2)
             RETURNING id`,
            [cliente.rows[0].id, ibanEspanol(cuenta.numero_cuenta)],
        )
        await abrirConSaldo(pool, {
            cuentaId: creada.rows[0].id,
            centimos: SALDO_APERTURA_CENTIMOS,
            clave: `apertura-${creada.rows[0].id}`,
        })
        return creada.rows[0].id
    }

    static async getCuenta(dni) {
        const result = await pool.query(
            `${SELECT_CUENTA}
             WHERE cl.numero_documento = $1 AND c.tipo = 'CLIENTE' AND c.estado = 'ACTIVA'`,
            [dni],
        )
        if (!result.rows[0]) throw new Error('No se ha podido encontrar la cuenta')
        return cuentaVisible(result.rows[0])
    }

    static async getCuentaByNum(num) {
        const iban = /^\d{20}$/.test(String(num)) ? ibanEspanol(String(num)) : String(num)
        const result = await pool.query(
            `${SELECT_CUENTA} WHERE c.iban = $1 AND c.estado = 'ACTIVA'`,
            [iban],
        )
        if (!result.rows[0]) throw new Error('No se ha podido encontrar la cuenta')
        return cuentaVisible(result.rows[0])
    }

    static async eliminarCuenta(dni) {
        const result = await pool.query(
            `UPDATE cuentas SET estado = 'CERRADA'
             WHERE cliente_id = (SELECT id FROM clientes WHERE numero_documento = $1)
               AND estado <> 'CERRADA'`,
            [dni],
        )
        return result.rowCount > 0
    }

    static async ingresar(cuentaId, euros) {
        await ingresar(pool, { cuentaId, centimos: aCentimos(euros), clave: randomUUID() })
    }

    static async retirar(cuentaId, euros) {
        await retirar(pool, { cuentaId, centimos: aCentimos(euros), clave: randomUUID() })
    }

    static async transferir(origenId, destinoId, euros) {
        await transferir(pool, {
            origenId,
            destinoId,
            centimos: aCentimos(euros),
            clave: randomUUID(),
        })
    }
}
