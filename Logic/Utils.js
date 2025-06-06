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

export function isAdmin(req, res, next) {
    // Verifica si hay sesión activa y el usuario es admin
    if (req.session && req.session.user && req.session.user.email === 'admin@mifuturo.com') {
        return next();
    }

    // Si no es admin, redirigir o bloquear
    return res.redirect('/');
}

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
        .trim()
        .transform((fecha) => {
            const parsed = new Date(fecha);
            return parsed;
        })
        .refine((date) => {
            if (!(date instanceof Date) || isNaN(date.getTime())) return false;

            const hoy = new Date();

            const cumple18 = new Date(date);
            cumple18.setFullYear(cumple18.getFullYear() + 18);

            const hoyStartOfDay = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            const cumple18StartOfDay = new Date(cumple18.getFullYear(), cumple18.getMonth(), cumple18.getDate());

            return hoyStartOfDay >= cumple18StartOfDay;
        }, {
            message: "Debe tener al menos 18 años para registrarse.",
        }),



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
        .trim()
        .transform((fecha) => {
            const parsed = new Date(fecha);
            return parsed;
        })
        .refine((date) => {
            if (!(date instanceof Date) || isNaN(date.getTime())) return false;

            const hoy = new Date();

            const cumple18 = new Date(date);
            cumple18.setFullYear(cumple18.getFullYear() + 18);

            const hoyStartOfDay = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            const cumple18StartOfDay = new Date(cumple18.getFullYear(), cumple18.getMonth(), cumple18.getDate());

            return hoyStartOfDay >= cumple18StartOfDay;
        }, {
            message: "Debe tener al menos 18 años para registrarse.",
        }),



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

export const plantillaTarjetaPerfil = `
<h1 class="text-center text-3xl text-blue-800 font-bold mt-4">
    Productos
</h1>
<div class="bg-gradient-to-br from-zinc-800 to-zinc-900 text-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-auto mt-6 border border-gray-700">
  <h2 class="text-lg font-bold mb-4">💳 Tarjeta de Débito</h2>

  <div class="text-2xl font-mono tracking-widest mb-6">
    __NUMERO_TARJETA__
  </div>

  <div class="flex justify-between items-center text-sm font-semibold mb-4">
    <div>
      <p class="text-gray-400">Válida hasta</p>
      <p class="text-white text-base">__FECHA_EXPIRACION__</p>
    </div>
    <div class="text-right">
      <p class="text-gray-400">CVV</p>
      <p class="text-white text-base">__CVV__</p>
    </div>
  </div>

  <div class="mt-4 flex justify-end">
    __BOTON_BLOQUEAR_ACTIVAR__
  </div>
</div>
`;
export const plantillaTarjeta = `
<h1 class="text-center text-3xl text-blue-800 font-bold mt-4">
    Tarjeta
</h1>
<div class="bg-gradient-to-br from-zinc-800 to-zinc-900 text-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-auto mt-6 border border-gray-700">
  <h2 class="text-lg font-bold mb-4">💳 Tarjeta de Débito</h2>

  <div class="text-2xl font-mono tracking-widest mb-6">
    __NUMERO_TARJETA__
  </div>

  <div class="flex justify-between items-center text-sm font-semibold mb-4">
    <div>
      <p class="text-gray-400">Válida hasta</p>
      <p class="text-white text-base">__FECHA_EXPIRACION__</p>
    </div>
    <div class="text-right">
      <p class="text-gray-400">CVV</p>
      <p class="text-white text-base">__CVV__</p>
    </div>
  </div>
</div>
`;

export const bloqueUsuario = `
<div class="bg-white rounded-xl shadow-md p-4 mb-4">
  <h3 class="text-lg font-bold text-gray-800 mb-1">__NOMBRE__ __APELLIDOS__</h3>
  <p class="text-sm text-gray-600"><span class="font-medium">Email:</span> __EMAIL__</p>
  <p class="text-sm text-gray-600"><span class="font-medium">DNI:</span> __DNI__</p>
  <p class="text-sm text-gray-600"><span class="font-medium">Teléfono:</span> __TELEFONO__</p>
  <p class="text-sm text-gray-600"><span class="font-medium">Dirección:</span> __DIRECCION__</p>
  <p class="text-sm text-gray-600"><span class="font-medium">Fecha de Nacimiento:</span> __FECHA_NAC__</p>
  <p class="text-sm text-gray-600"><span class="font-medium">Fecha de Alta:</span> __FECHA_ALTA__</p>
</div>
`;

export const plantillaCuenta = `
<div class="bg-white shadow-md rounded-xl p-5 mb-4 border border-gray-200">
  <div class="flex justify-between items-center mb-3">
    <div>
      <p class="text-sm text-gray-600 font-medium">Número de cuenta</p>
      <p class="text-lg font-mono text-blue-700">__NUMERO_CUENTA__</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-600 font-medium">Saldo</p>
      <p class="text-lg font-semibold text-green-600">__SALDO__ €</p>
    </div>
  </div>
  <p class="text-sm text-gray-500">Fecha de apertura: <span class="font-medium text-gray-700">__FECHA_APERTURA__</span></p>
</div>
`;




