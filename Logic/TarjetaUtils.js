/**
 * Create numbre (16 digit) if user account
 * @returns 
 */
export function generarNumeroTarjeta() {
    const prefix = '4579';
    let number = prefix;
    while (number.length < 16) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}

/**
 * Generate 3 digit of CVV of card
 * @returns 
 */
export function generarCVV() {
    return String(Math.floor(100 + Math.random() * 900));
}

/**
 * Generate expiration date for card (4 year of time to expiration)
 * @returns 
 */
export function obtenerFechaExpiracion() {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() + 4);
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}
