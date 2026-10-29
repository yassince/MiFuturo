import { PGlite } from '@electric-sql/pglite'
import { escenarioDemo, euros } from '../db/libro.js'
import { ibanEspanol } from '../db/iban.js'

describe('libro del banco', () => {
    it('calcula el IBAN español de un CCC conocido', () => {
        expect(ibanEspanol('21000418450200051332')).toBe('ES9121000418450200051332')
    })

    it('cuadra saldos, ignora el doble envío y no guarda el CVV', async () => {
        const db = new PGlite()
        const informe = await escenarioDemo(db)
        await db.close()

        const porIban = Object.fromEntries(
            informe.cuentas.map((cuenta) => [cuenta.iban.slice(-4), euros(cuenta.saldo_centimos)]),
        )

        expect(porIban['0001']).toBe('-110,50 €')
        expect(porIban['7890']).toBe('85,50 €')
        expect(porIban['5432']).toBe('25,00 €')
        expect(informe.movimientos.map((movimiento) => euros(movimiento.suma))).toEqual([
            '0,00 €',
            '0,00 €',
            '0,00 €',
        ])
        expect(informe.transferenciaRepetida).toBe(true)
        expect(informe.rechazo).toBe('Saldo insuficiente')
        expect(informe.columnasTarjeta).not.toContain('cvv')
        expect(informe.columnasTarjeta).not.toContain('numero_tarjeta')
        expect(informe.columnasTarjeta).toContain('ultimos4')
    }, 30000)
})
