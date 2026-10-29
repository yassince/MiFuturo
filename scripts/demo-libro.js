import { PGlite } from '@electric-sql/pglite'
import { escenarioDemo, euros } from '../db/libro.js'

const db = new PGlite()
const informe = await escenarioDemo(db)

console.log('CUENTAS')
for (const cuenta of informe.cuentas) {
    console.log(`${cuenta.tipo.padEnd(8)} ${cuenta.iban}  ${euros(cuenta.saldo_centimos)}`)
}

console.log('\nMOVIMIENTOS')
for (const movimiento of informe.movimientos) {
    console.log(`${movimiento.tipo.padEnd(14)} suma ${euros(movimiento.suma)}  ${movimiento.clave_idempotencia}`)
}

console.log('\nTARJETA')
console.log(informe.columnasTarjeta.join(', '))
console.log(`transferencia repetida ignorada: ${informe.transferenciaRepetida}`)
console.log(`retiro rechazado: ${informe.rechazo}`)

await db.close()
