
import { userRegistrationSchema, userUpdateSchema } from '../Logic/Utils.js';
import CuentaController from '../Controllers/CuentaController.js';
import { pool } from '../MySQL/conexion.js';
import bcrypt from 'bcryptjs'

export class UserModel {
    /**
     * 
     * @param {String} dni primary key of each user
     * @returns the user object
     */
    static async getUserByDni(dni) {
        if (!dni) {
            throw new Error('DNI es requerido para obtener la información del usuario.');
        }
        try {
            const [rows, fields] = await pool.execute(
                'SELECT * FROM Clientes WHERE DNI = ?',
                [dni]
            );

            //en caso de que obtengamos algo lo devovemos
            if (rows.length > 0) {
                return rows[0];
            } else {
                //En caso contrario retornamos null
                return null;
            }

        } catch (error) {
            console.error(error);
            throw new Error('Error de base de datos al intentar obtener el usuario.');
        }
    }

    /**
     * Lo mismo no hace falta este metodo
     * @param {String} dni primary key of each user
     * @returns the user object
     */
    static async getUserByEmail(email) {
        if (!email) {
            throw new Error('email es requerido para obtener la información del usuario.');
        }
        try {
            const [rows, fields] = await pool.execute(
                'SELECT * FROM Clientes WHERE email = ?',
                [email]
            );

            if (rows.length > 0) {
                return rows[0];
            } else {
                return new Error('No se ha encontrado ningun usuario');
            }

        } catch (error) {
            console.error('Error al obtener usuario por DNI');
            throw new Error('Error de base de datos al intentar obtener el usuario.');
        }
    }

    /**
     * FALTA VALIDAR LOS DATOS, SI EXISTEN
     * @param {object} object user for registration in database 
     * @returns true or false depending of affected rows on database
     */
    static async register({ user }) {
        if (!user) return new Error('Es necesario los datos del usuario para poder registrarlo correctamente')
        console.log(user.dni);
            
        const existUser = await this.getUserByDni(user.dni)

        //En caso de que el usuario exista
        if (existUser) throw new Error('El usuario ya existe')

        //Validamos la información obtenida del registro
        const validation = userRegistrationSchema.safeParse(user)

        //En caso de que se produzca un error a la hora de la validación de datos
        if (!validation.success) {
            const errors = {};
            validation.error.errors.forEach(err => {
                errors[err.path.join('.')] = err.message;
            });
            let errores = Object.values(errors).join(' ')
            console.log(errores);
            
            throw new Error(errores)
        }


        /* fecha de alta */
        const date = new Date();
        const fecha_alta = date.toISOString().split('T')[0];

        /* contraseña encriptada */
        const salt = await bcrypt.genSalt(10)
        const contraseña = await bcrypt.hash(user.contraseña, salt)

        let row, fields;
        try {
            [row, fields] = await pool.execute(
                'INSERT INTO clientes (nombre,apellidos,fecha_nacimiento,direccion,telefono,contraseña,email,dni,fecha_alta) VALUES (?,?,?,?,?,?,?,?,?)',
                [user.nombre, user.apellidos, user.fecha_nacimiento, user.direccion, user.telefono, contraseña, user.email, user.dni, fecha_alta]
            )
        } catch (error) {
            throw new error('Error al registrar el usuario');
        }
    }

    /**
     * 
     * @param {object} user obtject for login 
     * @returns 
     */
    static async login({ user }) {
        if (!user.contraseña || !user.dni) return new Error('No se ha podido a podido inicar sesión correctamente')

        let userData
        try {
            //Obtenemos el usuario que tenemos en la base de datos
            userData = await this.getUserByDni(user.dni);
        } catch (error) {
            throw error
        }

        //En caso de que no exista el usuario obtenido
        if (!userData) throw new Error("Usuario no existe");

        //Comprobamos la contraseña obtenido en el login
        const isMatch = await bcrypt.compare(user.contraseña, userData.contraseña)

        //En caso de que la contraseña esa correcta, devolvemos el dni y el email de usuario
        if (isMatch) {
            return {
                dni: userData.dni,
                email: userData.email
            }
        } else {
            //En caso de que la contraseña no sea correcta
            throw new Error('Contraseña Incorrecta')
        }
    }

    /**
     * 
     * @param {object} user for update his info 
     * @returns true or false depending of affected rows on database
     */
    static async update({ user }) {
        
        if (!user) return new Error('Es necesario el usuario para la actualización')
        
        let validation;
        let pass;
        //En caso de que la contraseña que ha enviado el usuario sea el hash que tenemos en la base de datos
        if(user.contraseña.length > 30){
            validation = userUpdateSchema.safeParse(user)
        }else{
            //Si el usuario a enviado una nueva contraseña
            const salt = await bcrypt.genSalt(10)
            pass = await bcrypt.hash(user.contraseña, salt)
            validation = userRegistrationSchema.safeParse(user)

        }

        
        //Comprobación de la validación de datos en Zod
        if (!validation.success) {
            const errors = {};
            validation.error.errors.forEach(err => {
                errors[err.path.join('.')] = err.message;
            });
            let errores = Object.values(errors).join(' ')
            throw new Error(errores)
        }

        //Obtenemos el usuario a actualizar
        const userData = this.getUserByDni(user.dni)

        if (!userData) {
            throw new Error(`Usuario con DNI ${user.dni} no encontrado.`);
        }

        //Actualizamos la info del usuario
        const [row, fields] = await pool.execute(
            'UPDATE Clientes SET nombre = ?, apellidos = ?, fecha_nacimiento = ?, direccion = ?, telefono = ?, email = ?, contraseña=? WHERE dni = ?',
            [
                user.nombre,
                user.apellidos,
                user.fecha_nacimiento,
                user.direccion,
                user.telefono,
                user.email,
                pass ?? user.contraseña,
                user.dni,
            ]
        );

        //En caso de que la actualización se haya hecho
        if (row.affectedRows > 1) {
            console.log('Usuario actualizado');
            true
        } else {
            return false
        }
    }

    /**
     * 
     * @param {String} dni of user for remove he in the database 
     * @returns true or false depending of affected rows on database
     */
    static async remove(dni) {
        try {
            const [rows, fields] = await pool.execute(
                'DELETE FROM clientes WHERE dni = ?',
                [dni]
            );

            if (rows.affectedRows > 0) {
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