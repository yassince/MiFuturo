export function parseMonto(raw, { max } = {}) {
    const text = String(raw ?? '').trim().replace(',', '.')

    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
        return {
            ok: false,
            error: 'Introduce un importe válido, mayor que 0 y con dos decimales como máximo.',
        }
    }

    const value = Number(text)
    if (!Number.isFinite(value) || value <= 0) {
        return { ok: false, error: 'El importe debe ser mayor que 0.' }
    }

    if (max != null && value > max) {
        return { ok: false, error: `El importe no puede exceder ${max} €.` }
    }

    return { ok: true, value }
}
