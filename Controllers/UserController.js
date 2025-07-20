import { UserModel } from "../Models/UserModel.js"
import CuentaController from "./CuentaController.js";
import path from 'path'
import { getDirname } from '../Logic/dirname.js';
import fs from 'fs'
import { CuentaModel } from "../Models/CuentaModel.js";

const __dirname = getDirname(import.meta.url)

export class UserController {

    /**
     * Show Form to user for registation
     * @param {*} req 
     * @param {*} res 
     */
    static showRegisterFrom(_, res) {
        res.sendFile(path.join(__dirname, '..', 'dist', 'Registro', 'index.html'))
    }

    /**
     * Show Login form to user
     * @param {*} req 
     * @param {*} res 
     */
    static showLoginFrom(_, res) {
        res.sendFile(path.join(__dirname, '..', 'dist', 'Login', 'index.html'))
    }

    /**
     * Get specific user
     * @param {*} dni 
     * @returns 
     */
    static getUserByDni(dni) {
        return UserModel.getUserByDni(dni)
    }

    /**
     * Show Form to user for update user's information 
     * @param {*} req 
     * @param {*} res 
     */
    static async showUpdateFrom(req, res) {
        const user = await UserModel.getUserByDni(req.session.user.dni);

        if (!user) throw new Error('No se ha podido encontrar el usuario')

        //Format user's date to show
        const fechaNacimiento = new Date(user.fecha_nacimiento).toISOString().split('T')[0];

        //Update form path
        const htmlPath = path.join(__dirname, '..', 'dist', 'Update', 'index.html');
        const csrfToken = req.csrfToken();//Create a csrf token for form
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

    /**
     * Fuction for register a user
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async registerUser(req, res) {
        const user = req.body

        if (!user.dni) return res.redirect(`/registro?mensaje=${encodeURIComponent('Error en el registro, por favor introduzca sus datos')}&success=false`)

        try {
            //Register User 
            await UserModel.register({ user })
            //Register Acount of user
            await CuentaController.createCuenta({ user })

            res.redirect(`/user/Login?mensaje=${encodeURIComponent('Usuario registrado correctamene. Inicia sesión')}&success=true`)
        } catch (error) {
            res.redirect(`/user/Registro?mensaje=${encodeURIComponent(error)}&success=false`)//Send error feedback for user
        }
    }

    /**
     * Function for login a user
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async loginUser(req, res) {
        const user = req.body

        if (!user.dni || !user.contraseña) return res.redirect(`/user/Login?mensaje=${encodeURIComponent('Error en el login, por favor introduzca sus datos')}&success=false`)

        try {
            const userData = await UserModel.login({ user })
            req.session.user = userData; /* Save the user login */
            
            //if the user is admin redirect to dasboard
            if (req.session.user.email === 'admin@mifuturo.com') {
                return res.redirect('/Admin/');
            }
            //if not redirect to profile
            res.redirect(`/user/perfil`)
        } catch (error) {
            res.redirect(`/user/login?mensaje=${encodeURIComponent(error)}&success=false`)
        }
    }

    /**
     * Function for user update
     * @param {*} req 
     * @param {*} res 
     */
    static async updateUser(req, res) {
        const user = req.body
        try {
            await UserModel.update({ user })
            res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Usuario actualizado correctamente')}&success=true`)
        } catch (error) {
            res.redirect(`/user/Update?mensaje=${encodeURIComponent(error)}&success=false`)
        }
    }

    /**
     * Function for user remove
     * @param {*} req 
     * @param {*} res 
     */
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


        //After remove the user and his acount and card, remove the session
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