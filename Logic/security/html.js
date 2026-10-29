import fs from 'fs'

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

function escapeRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function rellenar(html, valores, crudos = new Set()) {
    const tokens = Object.keys(valores).sort((a, b) => b.length - a.length)
    if (tokens.length === 0) return html

    const pattern = new RegExp(tokens.map(escapeRegex).join('|'), 'g')
    return html.replace(pattern, (token) => {
        const valor = valores[token]
        return crudos.has(token) ? String(valor ?? '') : escapeHtml(valor)
    })
}

export function inyectarCsrf(html, token) {
    const safe = escapeHtml(token)
    const withToken = html.replaceAll('__CSRF__', safe)

    return withToken.replace(/<form\b([^>]*)>/gi, (full, attrs, offset) => {
        if (!/\bmethod\s*=\s*["']post["']/i.test(attrs)) return full

        const slice = withToken.slice(offset, offset + 500)
        if (/name\s*=\s*["']_csrf["']/i.test(slice)) return full

        return `<form${attrs}><input type="hidden" name="_csrf" value="${safe}">`
    })
}

export function enviarPaginaConCsrf(req, res, filePath) {
    const html = fs.readFileSync(filePath, 'utf-8')
    res.type('html').send(inyectarCsrf(html, req.csrfToken()))
}
