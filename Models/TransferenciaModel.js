import { pool } from '../db/pool.js'

export class TransferenciaModel {
    static async getmovimientos(id) {
        const result = await pool.query(
            `SELECT m.tipo AS tipo_transaccion,
                    ABS(a.importe_centimos) / 100.0 AS monto,
                    a.contabilizado_en AS fecha_hora,
                    CASE WHEN a.importe_centimos >= 0 THEN 'entrada' ELSE 'salida' END AS direccion,
                    CASE m.tipo
                        WHEN 'APERTURA' THEN 'Apertura de cuenta'
                        WHEN 'INGRESO' THEN 'Ingreso'
                        WHEN 'RETIRO' THEN 'Retiro'
                        WHEN 'TRANSFERENCIA' THEN 'Transferencia'
                        ELSE m.tipo
                    END AS descripcion
             FROM apuntes a
             JOIN movimientos m ON m.id = a.movimiento_id
             WHERE a.cuenta_id = $1
             ORDER BY a.contabilizado_en DESC`,
            [id],
        )
        return result.rows
    }
}
