import { UserModel } from "../Models/UserModel.js"
import CuentaController from "./CuentaController.js";
import path from 'path'
import { getDirname } from '../Logic/dirname.js';
import fs from 'fs'
import { CuentaModel } from "../Models/CuentaModel.js";

const __dirname = getDirname(import.meta.url)

export class UserController {

    static showRegisterFrom(req, res) {
        res.sendFile(path.join(__dirname, '..', 'dist', 'Registro', 'index.html'))
    }

    static showLoginFrom(req, res) {
        res.sendFile(path.join(__dirname, '..', 'dist', 'Login', 'index.html'))
    }

    static getUserByDni(dni) {
        return UserModel.getUserByDni(dni)
    }

    static async showUpdateFrom(req, res) {

        const user = await UserModel.getUserByDni(req.session.user.dni);
        console.log(user);

        if (!user) throw new Error('No se ha podido encontrar el usuario')


        const fechaNacimiento = new Date(user.fecha_nacimiento).toISOString().split('T')[0];

        const htmlPath = path.join(__dirname, '..', 'dist', 'Update', 'index.html');
        const csrfToken = req.csrfToken();
        const template = fs.readFileSync(htmlPath, 'utf-8')
            .replace('__CSRF__', csrfToken)
            .replace(/__DNI__/g, user.dni)
            .replace(/__NOMBRE__/g, user.nombre)
            .replace(/__APELLIDOS__/g, user.apellidos)
            .replace(/__EMAIL__/g, user.email)
            .replace(/__FECHA-NACIMIENTO__/g, fechaNacimiento)
            .replace(/__DIRECCION__/g, user.direccion)
            .replace(/__TELEFONO__/g, user.telefono)
            .replace(/__CONTRASEÑA__/g, user.contraseña)


        res.send(template)
    }

    static async registerUser(req, res) {
        const user = req.body

        if (!user.dni) return res.redirect(`/registro?mensaje=${encodeURIComponent('Error en el registro, por favor introduzca sus datos')}&success=false`)

        try {
            //Registramos el usuario
            await UserModel.register({ user })
            //Registramos la cuenta
            await CuentaController.createCuenta({ user })

            res.redirect(`/user/Registro?mensaje=${encodeURIComponent('Usuario registrado correctamene')}&success=true`)
        } catch (error) {
            res.redirect(`/user/Registro?mensaje=${encodeURIComponent(error)}&success=false`)
        }
    }

    static async loginUser(req, res) {
        const user = req.body

        if (!user.dni || !user.contraseña) return res.redirect(`/user/Login?mensaje=${encodeURIComponent('Error en el login, por favor introduzca sus datos')}&success=false`)

        try {
            const userData = await UserModel.login({ user })
            req.session.user = userData; /* Guardamos el login del usuario */

            if (req.session.user.email === 'admin@mifuturo.com') {
                return res.redirect('/Admin/');
            }
            res.redirect(`/user/perfil`)
        } catch (error) {
            res.redirect(`/user/login?mensaje=${encodeURIComponent(error)}&success=false`)
        }
    }

    static async updateUser(req, res) {
        const user = req.body

        try {
            const update = await UserModel.update({ user })
            res.redirect(`/user/Update?mensaje=${encodeURIComponent('Usuario actualizado correctamente')}&success=true`)
        } catch (error) {
            res.redirect(`/user/Update?mensaje=${encodeURIComponent(error)}&success=false`)
        }
    }

    static async remove(req, res) {
        let user;
        try {
            user = await UserModel.getUserByDni(req.session.user.dni);
        } catch (error) {
            throw new Error('Error al cargar el usuario')
        }

        const resultCuenta = CuentaModel.eliminarCuenta(user.dni)
        if (!resultCuenta) throw new Error('Error al eliminar cuenta de usuario')

        const resultUser = UserModel.remove(user.dni)
        if (!resultUser) throw new Error('No se ha encontrado el usuario a eliminar')



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

    }
}