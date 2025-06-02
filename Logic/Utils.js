import { pool } from '../MySQL/conexion.js';

/*
 * Funcion para comprobar si el usuario esta autenticado
 */
export function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/user/login?mensaje=' + encodeURIComponent('Por favor, inicia sesión para acceder.') + '&success=false');
    }
}

import { z } from 'zod';
//funcion para validar el dni, el usuario que quiera registrarse
const validateDniLetter = (dni) => {

    if (typeof dni !== 'string' || !/^\d{8}[A-Z]$/i.test(dni)) return false;
    
    const numero = parseInt(dni.substring(0, 8), 10);
    const letra = dni.substring(8, 9).toUpperCase();
    const letrasValidas = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const letraCalculada = letrasValidas.charAt(numero % 23);
    
    return letraCalculada === letra;
};

//Función para crear el numero de cuenta del usuario
export async function generarNumeroCuenta() {
    const banco = '1234';
    const sucursal = '5678';
    const dc = '00';

    while (true) {
        const cuenta = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
        const numeroCompleto = `${banco}${sucursal}${dc}${cuenta}`;

        try {
            const [result] = await pool.query(
                'SELECT numero_cuenta FROM cuentas WHERE numero_cuenta = ?',
                [numeroCompleto]
            );

            if (result.length === 0) {
                return numeroCompleto;
            }

            // Si ya existe, se repite el bucle
        } catch (error) {
            console.error('Error en consulta:', error);
            throw new Error('Error al generar número de cuenta');
        }
    }
}

//Validación de datos a la hora del registro Contraseña includida
export const userRegistrationSchema = z.object({
    dni: z.string()
        .min(9, { message: "El DNI debe tener 9 caracteres." })
        .max(9, { message: "El DNI debe tener 9 caracteres." })
        .regex(/^[0-9]{8}[TRWAGMYFPDXBNJZSQUVHLCKE]$/i, { message: "El DNI no tiene un formato válido (8 números y 1 letra)." })
        .refine(validateDniLetter, { message: "La letra del DNI no es correcta." }),

    email: z.string()
        .email({ message: "El email no tiene un formato válido." })
        .min(1, { message: "El email es obligatorio." }),

    contraseña: z.string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
        .max(30, { message: "La contraseña no puede tener más de 30 caracteres." })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/, {
            message: "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial."
        }),

    fecha_nacimiento: z.string({
        required_error: "La fecha de nacimiento es obligatoria.",
    })
        .trim() //quita los espacios
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .transform((fecha) => new Date(fecha))
        .refine((date) => {
            if (isNaN(date.getTime())) {
                return false;
            }
            const hoy = new Date();
            let edad = hoy.getFullYear() - date.getFullYear();
            const m = hoy.getMonth() - date.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < date.getDate())) {
                edad--;
            }
            return edad >= 18;
        }, { message: "Debe tener al menos 18 años para registrarse." }),


    nombre: z.string({
        required_error: "El nombre es obligatorio.",
        invalid_type_error: "El nombre debe ser una cadena de texto."
    }),
    apellidos: z.string({
        required_error: "Los apellidos son obligatorios.",
        invalid_type_error: "Los apellidos deben ser una cadena de texto."
    })
        .trim()
        .min(2, { message: "Los apellidos deben tener al menos 2 caracteres." })
        .max(100, { message: "Los apellidos no pueden exceder los 100 caracteres." }),
    direccion: z.string()
        .trim()
        .max(255, { message: "La dirección no puede exceder los 255 caracteres." })
        .optional()
        .or(z.literal("")),

    telefono: z.string({
        required_error: "El teléfono es obligatorio.",
        invalid_type_error: "El teléfono debe ser una cadena de texto."
    })
        .trim()
        .min(9, { message: "El teléfono debe tener exactamente 9 dígitos." })
        .max(9, { message: "El teléfono debe tener exactamente 9 dígitos." })
        .regex(/^[0-9]{9}$/, { message: "El teléfono debe contener solo 9 números." }),
});

//Validación de datos a la hora del actualizar usuario, Contraseña no includida
export const userUpdateSchema = z.object({
    dni: z.string()
        .min(9, { message: "El DNI debe tener 9 caracteres." })
        .max(9, { message: "El DNI debe tener 9 caracteres." })
        .regex(/^[0-9]{8}[TRWAGMYFPDXBNJZSQUVHLCKE]$/i, { message: "El DNI no tiene un formato válido (8 números y 1 letra)." })
        .refine(validateDniLetter, { message: "La letra del DNI no es correcta." }),

    email: z.string()
        .email({ message: "El email no tiene un formato válido." })
        .min(1, { message: "El email es obligatorio." }),

    fecha_nacimiento: z.string({
        required_error: "La fecha de nacimiento es obligatoria.",
    })
        .trim() //quita los espacios
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .transform((fecha) => new Date(fecha))
        .refine((date) => {
            if (isNaN(date.getTime())) {
                return false;
            }
            const hoy = new Date();
            let edad = hoy.getFullYear() - date.getFullYear();
            const m = hoy.getMonth() - date.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < date.getDate())) {
                edad--;
            }
            return edad >= 18;
        }, { message: "Debe tener al menos 18 años para registrarse." }),


    nombre: z.string({
        required_error: "El nombre es obligatorio.",
        invalid_type_error: "El nombre debe ser una cadena de texto."
    }),
    apellidos: z.string({
        required_error: "Los apellidos son obligatorios.",
        invalid_type_error: "Los apellidos deben ser una cadena de texto."
    })
        .trim()
        .min(2, { message: "Los apellidos deben tener al menos 2 caracteres." })
        .max(100, { message: "Los apellidos no pueden exceder los 100 caracteres." }),
    direccion: z.string()
        .trim()
        .max(255, { message: "La dirección no puede exceder los 255 caracteres." })
        .optional()
        .or(z.literal("")),

    telefono: z.string({
        required_error: "El teléfono es obligatorio.",
        invalid_type_error: "El teléfono debe ser una cadena de texto."
    })
        .trim()
        .min(9, { message: "El teléfono debe tener exactamente 9 dígitos." })
        .max(9, { message: "El teléfono debe tener exactamente 9 dígitos." })
        .regex(/^[0-9]{9}$/, { message: "El teléfono debe contener solo 9 números." }),
});

//Para mostar los movimientos del usuario en el perfil
export function plantillaMovimiento(mov) {
  const fecha = new Date(mov.fecha_hora);
  const fechaFormateada = `${fecha.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })}, ${fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}`;

  const tipoRaw = mov.tipo_transaccion.toLowerCase();
  const esApertura = tipoRaw === 'apertura';
  const esEntrada = esApertura || mov.direccion === 'entrada';
  const tipo = tipoRaw.charAt(0).toUpperCase() + tipoRaw.slice(1);
  const color = esEntrada ? 'text-green-700' : 'text-red-700';
  const signo = esEntrada ? '+' : '-';

  return `
    <div class="movimiento border-b-2 border-gray-800 pb-4 mb-4">
      <div class="tituloDinerof flex justify-between text-3xl">
        <span class="${color}">${tipo}</span>
        <span class="text-blue-700 font-bold">
          ${signo}${Number(mov.monto).toFixed(2).replace('.', ',')} &euro;
        </span>
      </div>
      <p class="text-2xl">${mov.descripcion}</p>
      <p class="text-2xl text-blue-500">${fechaFormateada}</p>
    </div>
  `;
}

