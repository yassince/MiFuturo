import { PGlite } from '@electric-sql/pglite'
import { migrar } from '../db/migrar.js'
import { ibanEspanol } from '../db/iban.js'

const ESQUEMA_VIEJO = `
CREATE TABLE clientes (
    dni TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    direccion TEXT,
    telefono TEXT,
    contrasena TEXT NOT NULL,
    email TEXT NOT NULL,
    fecha_alta DATE
);
CREATE TABLE cuentas (
    cuenta_id SERIAL PRIMARY KEY,
    dni TEXT NOT NULL,
    numero_cuenta TEXT NOT NULL,
    saldo NUMERIC NOT NULL,
    fecha_apertura DATE
);
CREATE TABLE tarjetas_debito (
    id SERIAL PRIMARY KEY,
    numero_tarjeta TEXT NOT NULL,
    fecha_expiracion TEXT NOT NULL,
    cvv TEXT NOT NULL,
    activa BOOLEAN NOT NULL,
    cuenta_id INT NOT NULL
);
CREATE TABLE transacciones (
    id SERIAL PRIMARY KEY,
    cuenta_origen_id INT,
    cuenta_destino_id INT,
    tipo_transaccion TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    descripcion TEXT
);
`

describe('migración del libro', () => {
    it('copia el saldo viejo, tira el CVV y no repite el trabajo', async () => {
        const db = new PGlite()
        await db.exec(ESQUEMA_VIEJO)
        await db.query(
            `INSERT INTO clientes (dni, nombre, apellidos, fecha_nacimiento, telefono, contrasena, email, fecha_alta)
             VALUES ('12345678Z', 'Ana', 'López', '1994-04-12', '600111222', 'hash', 'ana@mifuturo.test', '2024-01-01')`,
        )
        const cuenta = await db.query(
            `INSERT INTO cuentas (dni, numero_cuenta, saldo, fecha_apertura)
             VALUES ('12345678Z', '12345678901234567890', 150.50, '2024-01-01')
             RETURNING cuenta_id`,
        )
        const cuentaId = cuenta.rows[0].cuenta_id
        await db.query(
            `INSERT INTO transacciones (cuenta_destino_id, tipo_transaccion, monto, descripcion)
             VALUES ($1, 'Apertura', 100, 'apertura'), ($1, 'Ingreso', 50.50, 'ingreso')`,
            [cuentaId],
        )
        await db.query(
            `INSERT INTO tarjetas_debito (numero_tarjeta, fecha_expiracion, cvv, activa, cuenta_id)
             VALUES ('4111111111111234', '2030-08', '123', true, $1)`,
            [cuentaId],
        )

        const primera = await migrar(db)
        const saldo = await db.query(`SELECT iban, saldo_centimos FROM cuentas WHERE tipo = 'CLIENTE'`)
        const suma = await db.query(`SELECT COALESCE(SUM(importe_centimos), 0) AS suma FROM apuntes`)
        const columnas = await db.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'tarjetas'`,
        )
        const tarjeta = await db.query(`SELECT ultimos4, estado FROM tarjetas`)
        const segunda = await migrar(db)
        const clientes = await db.query(`SELECT COUNT(*)::int AS total FROM clientes`)
        await db.close()

        expect(primera.estado).toBe('migrado')
        expect(saldo.rows[0].iban).toBe(ibanEspanol('12345678901234567890'))
        expect(BigInt(saldo.rows[0].saldo_centimos)).toBe(15050n)
        expect(BigInt(suma.rows[0].suma)).toBe(0n)
        expect(columnas.rows.map((fila) => fila.column_name)).not.toContain('cvv')
        expect(tarjeta.rows[0]).toMatchObject({ ultimos4: '1234', estado: 'ACTIVA' })
        expect(segunda.estado).toBe('nuevo')
        expect(clientes.rows[0].total).toBe(1)
    }, 30000)

    it('crea el esquema si la base está vacía', async () => {
        const db = new PGlite()
        const primera = await migrar(db)
        const segunda = await migrar(db)
        const columnas = await db.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes'`,
        )
        await db.close()

        expect(primera.estado).toBe('vacio')
        expect(segunda.estado).toBe('nuevo')
        expect(columnas.rows.map((fila) => fila.column_name)).toContain('numero_documento')
    }, 30000)
})
