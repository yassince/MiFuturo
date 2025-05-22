import { pool } from '../MySQL/conexion.js'

export class UserModel {

    /**
     * 
     * @param {String} dni primary key of each user
     * @returns the user object
     */
    static async getUser(dni) {
        if (!dni) {
            throw new Error('DNI es requerido para obtener la información del usuario.');
        }
        try {
            const [rows, fields] = await pool.execute(
                'SELECT * FROM Clientes WHERE DNI = ?',
                [dni]
            );

            if (rows.length > 0) {
                return rows[0];
            } else {
                return null;
            }

        } catch (error) {
            console.error('Error al obtener usuario por DNI');
            throw new Error('Error de base de datos al intentar obtener el usuario.');
        }
    }

    /**
     * 
     * @param {object} object user for registration in database 
     * @returns true or false depending of affected rows on database
     */
    static async register({ user }) {
        if (!user) return new Error('Es necesario los datos del usuario para poder registrarlo correctamente')

        const date = new Date();
        const fecha_alta = date.toISOString().split('T')[0];

        const [row, fields] = await pool.execute(
            'INSERT INTO Clientes (nombre,apellido,fecha_nacimiento,direccion,telefono,email,dni,fecha_alta) VALUES (?,?,?,?,?,?,?,?)',
            [user.nombre, user.apellidos, user.fecha_nacimiento, user.direccion, user.telefono, user.email, user.dni, fecha_alta]
        )

        if (row.affectedRows > 0) {
            return true
        } else {
            return false
        }
    }

    /**
     * 
     * @param {object} user for update his info 
     * @returns true or false depending of affected rows on database
     */
    static async update({ user }) {
        if(!user) return new Error('Es necesario el usuario para la actualización')

        /* Falta validar la información */
        const userData = this.getUser(user.dni)

        if (!userData) {
            throw new Error(`Usuario con DNI ${user.dni} no encontrado.`);
        }

        const updateUser = {
            nombre: user.nombre ?? userData.nombre,
            apellido: user.apellidos ?? userData.apellido,
            fecha_nacimiento: user.fecha_nacimiento ?? userData.fecha_nacimiento,
            direccion: user.direccion ?? userData.direccion,
            telefono: user.telefono ?? userData.telefono,
            email: user.email ?? userData.email,
            dni: user.dni ?? userData.dni,
        }

        const [row, fields] = await pool.execute(
            'UPDATE Clientes SET nombre = ?, apellido = ?, fecha_nacimiento = ?, direccion = ?, telefono = ?, email = ? WHERE dni = ?',
            [
                updateUser.nombre,
                updateUser.apellido,
                updateUser.fecha_nacimiento,
                updateUser.direccion,
                updateUser.telefono,
                updateUser.email,
                user.dni,
            ]
        );

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
        if (!dni) {
            throw new Error('DNI is required to remove a user.');
        }

        try {
            const [rows, fields] = await pool.execute(
                'DELETE FROM usuarios WHERE dni = ?',
                [dni]
            );

            if(rows.affectedRows > 0){
                return true
            }else{
                return false
            }

        } catch (error) {
            throw new Error('Database error during user removal.');
        }
    }
}