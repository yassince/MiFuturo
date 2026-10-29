
import { userRegistrationSchema, userUpdateSchema } from '../Logic/Utils.js';
import { pool } from '../MySQL/conexion.js';
import bcrypt from 'bcryptjs'

let hashFicticioPromesa

function hashFicticio() {
    hashFicticioPromesa ??= bcrypt.hash('timing-equalization', 10)
    return hashFicticioPromesa
}

export class UserModel {
    /**
     * Get specific user
     * @param {String} dni primary key of each user
     * @returns the user object
     */
    static async getUserByDni(dni) {
        if (!dni) {
            throw new Error('DNI es requerido para obtener la información del usuario.');
        }
        try {
            const result = await pool.query(
                'SELECT * FROM clientes WHERE DNI = $1',
                [dni]
            );

            //if users exist, we give back it
            if (result.rows.length > 0) {
                return result.rows[0];
            } else {
                return null;
            }

        } catch (error) {
            console.error(error);
            throw new Error('Error de base de datos al intentar obtener el usuario.');
        }
    }

    /**
     * Register user
     * @param {object} object user for registration in database 
     */
    static async register({ user }) {
        if (!user) throw new Error('Es necesario los datos del usuario para poder registrarlo correctamente')

        const existUser = await this.getUserByDni(user.dni)
        if (existUser) throw new Error('El usuario ya existe')

        //Validate user info
        const validation = userRegistrationSchema.safeParse(user)

        //if some info of user is not allowed
        if (!validation.success) {
            const errors = {};
            validation.error.errors.forEach(err => {
                errors[err.path.join('.')] = err.message;
            });
            let errores = Object.values(errors).join(' ')

            throw new Error(errores)
        }


        //Formate Sing up date
        const date = new Date();
        const fecha_alta = date.toISOString().split('T')[0];

        //Encripted pass
        const salt = await bcrypt.genSalt(10)
        const contraseña = await bcrypt.hash(user.contraseña, salt)

        try {
            await pool.query(
                'INSERT INTO clientes (dni,nombre,apellidos,fecha_nacimiento,direccion,telefono,contrasena,email,fecha_alta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
                [user.dni, user.nombre, user.apellidos, user.fecha_nacimiento, user.direccion, user.telefono, contraseña, user.email, fecha_alta]
            )
        } catch (error) {
            throw new Error('Error al registrar el usuario');
        }
    }

    /**
     * Login user
     * @param {object} user obtject for login 
     * @returns 
     */
    static async login({ user }) {
        if (!user.contraseña || !user.dni) {
            const error = new Error('Credenciales incorrectas')
            error.code = 'AUTH'
            throw error
        }

        let userData
        try {
            userData = await this.getUserByDni(user.dni);
        } catch (error) {
            throw error
        }

        if (!userData) {
            await bcrypt.compare(user.contraseña, await hashFicticio())
            const error = new Error('Credenciales incorrectas')
            error.code = 'AUTH'
            throw error
        }

        const isMatch = await bcrypt.compare(user.contraseña, userData.contrasena)

        if (isMatch) {
            return {
                dni: userData.dni,
                email: userData.email
            }
        }

        const error = new Error('Credenciales incorrectas')
        error.code = 'AUTH'
        throw error
    }
    /**
     * Update user
     * @param {object} user for update his info 
     * @returns true or false depending of affected rows on database
     */
    static async update({ user }) {
        if (!user) throw new Error('Es necesario el usuario para la actualización')

        const current = await this.getUserByDni(user.dni)
        if (!current) throw new Error(`Usuario con DNI ${user.dni} no encontrado.`)

        const cambiaPassword = typeof user.contraseña === 'string' && user.contraseña.length > 0
        const validation = cambiaPassword
            ? userRegistrationSchema.safeParse(user)
            : userUpdateSchema.safeParse(user)

        if (!validation.success) {
            const errores = validation.error.errors.map(err => err.message).join(' ')
            throw new Error(errores)
        }

        const pass = cambiaPassword
            ? await bcrypt.hash(user.contraseña, 10)
            : current.contrasena

        const result = await pool.query(
            'UPDATE Clientes SET nombre = $1, apellidos = $2, fecha_nacimiento = $3, direccion = $4, telefono = $5, email = $6, contrasena=$7 WHERE dni = $8',
            [
                user.nombre,
                user.apellidos,
                user.fecha_nacimiento,
                user.direccion,
                user.telefono,
                user.email,
                pass,
                user.dni,
            ]
        );

        return result.rowCount > 0
    }

    /**
     * Remove the user
     * @param {String} dni of user for remove he in the database 
     * @returns true or false depending of affected rows on database
     */
    static async remove(dni) {
        try {
            const result = await pool.query(
                'DELETE FROM clientes WHERE dni = $1',
                [dni]
            );
            if (result.rowCount > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error);

            throw new Error('Error al eliminar el usuario.', error);
        }
    }
}