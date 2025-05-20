import { users } from "../users.js";
import { conexion } from '../MySQL/conexion.js'

export class UserModel {


    static obtenerUsuarios() {
        return users
    }

    static FindUser(name) {
        const user = users.find(u => {
            return u.name.toLowerCase() == name.toLowerCase()
        });
        console.log(user);

        return user;
    }

    static async register({ user }) {
        console.log(user);
        

        let conex = await conexion.createConexion();
        const date = new Date();
        const fecha_alta = date.toISOString().split('T')[0];

        const [row, fields] = await conex.execute(
            'INSERT INTO Clientes (nombre,apellido,fecha_nacimiento,direccion,telefono,email,dni,fecha_alta) VALUES (?,?,?,?,?,?,?,?)',
            [user.nombre, user.apellidos, user.fecha_nacimiento, user.direccion, user.telefono, user.email, user.dni, fecha_alta]
        )
    }
}