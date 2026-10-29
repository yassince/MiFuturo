import { UserModel } from "../Models/UserModel.js"
import CuentaController from "./CuentaController.js"
import path from 'path'
import { getDirname } from '../Logic/dirname.js'
import fs from 'fs'
import { CuentaModel } from "../Models/CuentaModel.js"
import { TransferenciaController } from "./TransferenciaController.js"
import TarjetaDebitoController from "./TarjetaDebitoController.js"
import { plantillaMovimiento, plantillaTarjetaPerfil } from "../Logic/Utils.js"
import { ADMIN_EMAIL } from "../Logic/roles.js"
import { opcionesBorradoCookie } from "../Logic/security/cookie.js"
import { enviarPaginaConCsrf, escapeHtml, inyectarCsrf, rellenar } from "../Logic/security/html.js"
import { presentarTarjeta } from "../Logic/security/tarjeta.js"

const __dirname = getDirname(import.meta.url)

function fechaLarga(valor) {
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) return ''
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

function redirigirError(res, ruta, error) {
    const mensaje = error?.message || 'No se ha podido completar la operación.'
    return res.redirect(`${ruta}?mensaje=${encodeURIComponent(mensaje)}&success=false`)
}

export class UserController {

    static showRegisterFrom(req, res) {
        enviarPaginaConCsrf(req, res, path.join(__dirname, '..', 'dist', 'Registro', 'index.html'))
    }

    static showLoginFrom(req, res) {
        enviarPaginaConCsrf(req, res, path.join(__dirname, '..', 'dist', 'Login', 'index.html'))
    }

    static getUserByDni(dni) {
        return UserModel.getUserByDni(dni)
    }

    static async showPerfil(req, res) {
        let user
        try {
            user = await UserController.getUserByDni(req.session.user.dni)
        } catch {
            return redirigirError(res, '/user/login', new Error('No se ha podido cargar el perfil.'))
        }

        if (!user) {
            return redirigirError(res, '/user/login', new Error('Por favor, inicia sesión para acceder.'))
        }

        let cuenta
        try {
            cuenta = await CuentaController.getCuentaByDNI(user.dni)
        } catch {
            return redirigirError(res, '/user/login', new Error('No se ha podido cargar la cuenta.'))
        }

        const movimientos = await TransferenciaController.getAllMovimientos(cuenta.id)
        const bloqueMovimientos = movimientos.map(plantillaMovimiento).join('')
        const tarjetaDebito = await TarjetaDebitoController.getTarjeta(cuenta.id)

        let bloqueTarjeta = ''
        if (tarjetaDebito) {
            const vista = presentarTarjeta(tarjetaDebito)
            const accion = tarjetaDebito.activa ? 'Bloquear' : 'Activar'
            const color = tarjetaDebito.activa ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            const boton = `<form method="POST" action="/Productos/Tarjeta/${accion}/${escapeHtml(tarjetaDebito.id)}">
             <button class="${color} text-white px-4 py-2 rounded-xl text-sm font-medium transition">${accion}</button>
           </form>`

            bloqueTarjeta = plantillaTarjetaPerfil
                .replaceAll('__NUMERO_TARJETA__', vista.numero)
                .replaceAll('__FECHA_EXPIRACION__', vista.expiracion)
                .replaceAll('__CVV__', vista.cvv)
                .replaceAll('__BOTON_BLOQUEAR_ACTIVAR__', boton)
        }

        const htmlPath = path.join(__dirname, '..', 'dist', 'Perfil', 'index.html')
        const template = fs.readFileSync(htmlPath, 'utf-8')
        const html = rellenar(template, {
            __NOMBRE__: user.nombre,
            __APELLIDOS__: user.apellidos,
            __EMAIL__: user.email,
            __DNI__: user.dni,
            __NAC__: fechaLarga(user.fecha_nacimiento),
            __DIR__: user.direccion,
            __TEL__: user.telefono,
            __ALTA__: fechaLarga(user.fecha_alta),
            __INICIAL__: String(user.nombre ?? '').slice(0, 1),
            '__NUM-CUENTA__': cuenta.numero_cuenta,
            __SALDO__: cuenta.saldo,
            '__FECHA-APERTURA__': fechaLarga(cuenta.fecha_apertura),
            __MOVIMIENTOS__: bloqueMovimientos,
            __PRODUCTOS__: bloqueTarjeta,
        }, new Set(['__MOVIMIENTOS__', '__PRODUCTOS__']))

        res.type('html').send(inyectarCsrf(html, req.csrfToken()))
    }

    static async showUpdateFrom(req, res) {
        const user = await UserModel.getUserByDni(req.session.user.dni)
        if (!user) return redirigirError(res, '/user/login', new Error('No se ha podido encontrar el usuario'))

        const fechaNacimiento = new Date(user.fecha_nacimiento).toISOString().split('T')[0]
        const htmlPath = path.join(__dirname, '..', 'dist', 'Update', 'index.html')
        let template = fs.readFileSync(htmlPath, 'utf-8')
            .replace(
                'name="contraseña" id="contraseña" required value="__CONTRASEÑA__"',
                'name="contraseña" id="contraseña" value="" autocomplete="new-password" placeholder="Déjala vacía para no cambiarla"'
            )

        template = rellenar(template, {
            __DNI__: user.dni,
            __NOMBRE__: user.nombre,
            __APELLIDOS__: user.apellidos,
            __EMAIL__: user.email,
            '__FECHA-NACIMIENTO__': fechaNacimiento,
            __DIRECCION__: user.direccion,
            __TELEFONO__: user.telefono,
            __CONTRASEÑA__: '',
        })

        res.type('html').send(inyectarCsrf(template, req.csrfToken()))
    }

    static async registerUser(req, res) {
        const user = req.body ?? {}

        if (!user.dni) {
            return redirigirError(res, '/registro', new Error('Error en el registro, por favor introduzca sus datos'))
        }

        if (String(user.email ?? '').toLowerCase() === ADMIN_EMAIL) {
            return redirigirError(res, '/user/Registro', new Error('Ese correo no está disponible.'))
        }

        try {
            await UserModel.register({ user })
            await CuentaController.createCuenta({ user })
            return res.redirect(`/user/Login?mensaje=${encodeURIComponent('Usuario registrado correctamene. Inicia sesión')}&success=true`)
        } catch (error) {
            return redirigirError(res, '/user/Registro', error)
        }
    }

    static async loginUser(req, res) {
        const user = req.body ?? {}

        if (!user.dni || !user.contraseña) {
            return redirigirError(res, '/user/Login', new Error('Introduce el DNI y la contraseña.'))
        }

        try {
            const userData = await UserModel.login({ user })
            req.session.regenerate((err) => {
                if (err) {
                    return redirigirError(res, '/user/Login', new Error('No se ha podido iniciar sesión. Inténtalo más tarde.'))
                }

                req.session.user = userData
                req.session.save((saveErr) => {
                    if (saveErr) {
                        return redirigirError(res, '/user/Login', new Error('No se ha podido iniciar sesión. Inténtalo más tarde.'))
                    }
                    if (userData.email === ADMIN_EMAIL) return res.redirect('/Admin/')
                    return res.redirect('/user/perfil')
                })
            })
        } catch (error) {
            const mensaje = error?.code === 'AUTH'
                ? 'Credenciales incorrectas'
                : 'No se ha podido iniciar sesión. Inténtalo más tarde.'
            return redirigirError(res, '/user/login', new Error(mensaje))
        }
    }

    static async updateUser(req, res) {
        const user = {
            ...req.body,
            dni: req.session.user.dni,
        }

        if (String(user.email ?? '').toLowerCase() === ADMIN_EMAIL && req.session.user.email !== ADMIN_EMAIL) {
            return redirigirError(res, '/user/Update', new Error('No puedes usar ese correo.'))
        }

        try {
            await UserModel.update({ user })
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Usuario actualizado correctamente')}&success=true`)
        } catch (error) {
            return redirigirError(res, '/user/Update', error)
        }
    }

    static async remove(req, res) {
        let user
        try {
            user = await UserModel.getUserByDni(req.session.user.dni)
        } catch {
            return res.status(500).send('No se ha podido eliminar la cuenta.')
        }

        if (!user) return res.redirect('/user/login')

        try {
            const resultCuenta = await CuentaModel.eliminarCuenta(user.dni)
            if (!resultCuenta) return res.status(500).send('No se ha podido eliminar la cuenta.')

            const resultUser = await UserModel.remove(user.dni)
            if (!resultUser) return res.status(500).send('No se ha podido eliminar el usuario.')
        } catch {
            return res.status(500).send('No se ha podido eliminar la cuenta.')
        }

        return UserController.logout(req, res)
    }

    static logout(req, res) {
        if (!req.session) return res.redirect('/user/login')

        req.session.destroy(err => {
            if (err) {
                console.error('Error al destruir la sesión')
                return res.status(500).send('No se pudo cerrar la sesión correctamente.')
            }

            res.clearCookie('connect.sid', opcionesBorradoCookie())
            return res.redirect('/')
        })
    }
}
