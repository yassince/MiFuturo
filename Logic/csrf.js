import { randomBytes, timingSafeEqual } from 'node:crypto'

export default function csrfProtection(req, res, next) {
    if (!req.session) {
        const error = new Error('CSRF requiere sesión')
        error.status = 500
        return next(error)
    }

    if (!req.session.csrfSecret) {
        req.session.csrfSecret = randomBytes(32).toString('hex')
    }

    req.csrfToken = () => req.session.csrfSecret

    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next()
    }

    const sent = req.body?._csrf || req.get('x-csrf-token')
    if (!tokensMatch(sent, req.session.csrfSecret)) {
        const error = new Error('Token CSRF inválido')
        error.code = 'EBADCSRFTOKEN'
        error.status = 403
        return next(error)
    }

    return next()
}

function tokensMatch(sent, expected) {
    if (typeof sent !== 'string' || typeof expected !== 'string') return false

    const received = Buffer.from(sent)
    const stored = Buffer.from(expected)
    if (received.length !== stored.length) return false

    return timingSafeEqual(received, stored)
}
