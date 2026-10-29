export function cookieSecure(env = process.env) {
    if (env.COOKIE_SECURE === 'true') return true
    if (env.COOKIE_SECURE === 'false') return false
    return env.NODE_ENV === 'production'
}

export function opcionesCookie(env = process.env) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: cookieSecure(env),
        maxAge: 1000 * 60 * 60 * 24,
    }
}

export function opcionesBorradoCookie(env = process.env) {
    const { maxAge, ...resto } = opcionesCookie(env)
    return resto
}
