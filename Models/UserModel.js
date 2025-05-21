import { pool } from '../MySQL/conexion.js'

export class UserModel {


    static async getAllUsers() {
        return users
    }

    static FindUser(name) {
        const user = users.find(u => {
            return u.name.toLowerCase() == name.toLowerCase()
        });
        console.log(user);

        return user;
    }

    /* tema de la creación de conexion esta mal, ya que no se tiene que crear en cada funcion que se haga */

    static async getUser(dni) {
        const [row, fields] = await pool.execute(
            'SELECT * FORM Clientes where DNI= ?',
            [dni]
        )
        

    }

    static async register({ user }) {
        const date = new Date();
        const fecha_alta = date.toISOString().split('T')[0];/* create fecha_alta */

        const [row, fields] = await pool.execute(
            'INSERT INTO Clientes (nombre,apellido,fecha_nacimiento,direccion,telefono,email,dni,fecha_alta) VALUES (?,?,?,?,?,?,?,?)',
            [user.nombre, user.apellidos, user.fecha_nacimiento, user.direccion, user.telefono, user.email, user.dni, fecha_alta]
        )/* insert values into clientes */
    }

    static async update() {

    }

    static async remove() {

    }
}