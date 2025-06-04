// Genera un número de tarjeta válido con 16 dígitos aleatorios
export function generarNumeroTarjeta() {
    const prefix = '4579';
    let number = prefix;
    while (number.length < 16) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}

// Genera un CVV de 3 dígitos aleatorio
export function generarCVV() {
    return String(Math.floor(100 + Math.random() * 900));
}

// Genera una fecha de expiración a 4 años desde hoy (formato YYYY-MM)
export function obtenerFechaExpiracion() {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() + 4);
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}
