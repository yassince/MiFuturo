export const ADMIN_EMAIL = 'admin@mifuturo.com'

export function esAdmin(user) {
    return user?.email === ADMIN_EMAIL
}
