import { escapeHtml } from './html.js'

export function enmascararPan(pan) {
    const digits = String(pan ?? '').replace(/\D/g, '')
    const last4 = (digits.slice(-4) || '').padStart(4, '•')
    return `•••• •••• •••• ${last4}`
}

export function presentarTarjeta(tarjeta) {
    return {
        numero: enmascararPan(tarjeta?.numero_tarjeta),
        expiracion: escapeHtml(tarjeta?.fecha_expiracion),
        cvv: '•••',
    }
}

export function puedeGestionarTarjeta(tarjeta, { cuentaId, tarjetaId }) {
    if (!tarjeta || cuentaId == null) return false
    if (String(tarjeta.cuenta_id) !== String(cuentaId)) return false
    if (tarjetaId != null && String(tarjeta.id) !== String(tarjetaId)) return false
    return true
}
