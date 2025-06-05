import express from 'express'
import { UserController } from '../Controllers/UserController.js';
import CuentaController from '../Controllers/CuentaController.js';
import { isAuthenticated, plantillaMovimiento, plantillaTarjeta, plantillaTarjetaPerfil } from '../Logic/Utils.js';
import path from 'path';
import fs from 'fs'
import { getDirname } from '../Logic/dirname.js';
import { TransferenciaController } from '../Controllers/TransferenciaController.js';

/* protección contra actaque de formularios */
import csrfProtection from '../Logic/csrf.js';
import TarjetaDebitoController from '../Controllers/TarjetaDebitoController.js';
const __dirname = getDirname(import.meta.url)

const UserRouter = express.Router();

/* Rutas para el usuario */
UserRouter.get('/Registro', UserController.showRegisterFrom)/* mostrar la vista */
UserRouter.post('/Registro', UserController.registerUser)/* para registrar el usuario */
UserRouter.get('/Login', UserController.showLoginFrom)/* mostrar la vista */
UserRouter.post('/Login', UserController.loginUser)/* para login del usuario */

/* Mostrar perfil del usuario */
UserRouter.get('/Perfil', [isAuthenticated, csrfProtection], async (req, res) => {
    let user;
    try {
        user = await UserController.getUserByDni(req.session.user.dni);
    } catch (error) {
        throw new Error('Error al cargar el usuario')
    }

    

    if (!user) res.redirect('/login?mensaje=' + encodeURIComponent('Por favor, inicia sesión para acceder.') + '&success=false');

    //Fromateando las fechas del usuario
    const fechaNacimientoUser = new Date(user.fecha_nacimiento).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
    const fechaAltaUser = new Date(user.fecha_alta).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    //Obtenemos la cuenta del usuario
    let cuenta
    try {
        cuenta = await CuentaController.getCuentaByDNI(user.dni)
    } catch (error) {
        console.log(error);

    }
    //Fromateando fecha de apretura de la cuenta
    let fecha_apertura = new Date(cuenta.fecha_apertura).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    //Obtenemos los movimientos del usuario
    const movimientos = await TransferenciaController.getAllMovimientos(cuenta.id)
    const bloqueMovimientos = movimientos.map(plantillaMovimiento).join('');

    //obtenemos tarjeta en caso de que el usuario lo tenga
    const tarjetaDebito = await TarjetaDebitoController.getTarjeta(cuenta.id)

    let bloqueTarjeta
    if (tarjetaDebito) {
        bloqueTarjeta = plantillaTarjetaPerfil
            .replace(/__NUMERO_TARJETA__/g, tarjetaDebito.numero_tarjeta)
            .replace(/__FECHA_EXPIRACION__/g, tarjetaDebito.fecha_expiracion)
            .replace(/__CVV__/g, tarjetaDebito.cvv)
            .replace(/__BOTON_BLOQUEAR_ACTIVAR__/g,
                tarjetaDebito.activa
                    ? `<form method="POST" action="/Productos/Tarjeta/Bloquear/${tarjetaDebito.id}">
             <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">Bloquear</button>
           </form>`
                    : `<form method="POST" action="/Productos/Tarjeta/Activar/${tarjetaDebito.id}">
             <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">Activar</button>
           </form>`
            );
    }

    const htmlPath = path.join(__dirname, '..', 'dist', 'Perfil', 'index.html');
    const csrfToken = req.csrfToken();
    const template = fs.readFileSync(htmlPath, 'utf-8')
        .replace('__CSRF__', csrfToken)
        .replace(/__NOMBRE__/g, user.nombre)
        .replace(/__APELLIDOS__/g, user.apellidos)
        .replace(/__EMAIL__/g, user.email)
        .replace(/__DNI__/g, user.dni)
        .replace(/__NAC__/g, fechaNacimientoUser)
        .replace(/__DIR__/g, user.direccion)
        .replace(/__TEL__/g, user.telefono)
        .replace(/__ALTA__/g, fechaAltaUser)
        .replace(/__INICIAL__/g, user.nombre[0])
        .replace(/__NUM-CUENTA__/g, cuenta.numero_cuenta)
        .replace(/__SALDO__/g, cuenta.saldo)
        .replace(/__FECHA-APERTURA__/g, fecha_apertura)
        .replace(/__MOVIMIENTOS__/g, bloqueMovimientos)
        .replace(/__PRODUCTOS__/g, bloqueTarjeta ?? '');

    res.send(template)
})

/* Cerrar sesión del usuario */
UserRouter.get('/Logout', isAuthenticated, (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error al destruir la sesión:', err);
                return res.status(500).send('No se pudo cerrar la sesión correctamente.');
            } else {
                res.clearCookie('connect.sid');
                res.redirect('/');
            }
        });
    } else {
        res.redirect('/user/login');
    }
})

/* Borrar cuenta de usuario */
UserRouter.post('/Remove', isAuthenticated, UserController.remove)

/* Actualizar perfil del usuario logueado */
UserRouter.get('/Update', [isAuthenticated, csrfProtection], UserController.showUpdateFrom)
UserRouter.post('/Update', [isAuthenticated, csrfProtection], UserController.updateUser)

export default UserRouter;