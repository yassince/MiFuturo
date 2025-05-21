import { UserModel } from "../Models/UserModel.js"

export class UserController {

    /* static async getAll(req, res) {
        res.send(UserModel.obtenerUsuarios())
    } */

    static async getUser(req, res) {
        const { name } = req.params
        const userFind = UserModel.FindUser(name)
        if (!userFind) return res.status(400).send("No se ha encontrado ningun usuario")

        res.json(userFind)

    }

    static async registerUser(req, res) {
        const user = req.body
        const fields = UserModel.register({ user })

        if (fields <= 0) return res.status(400).send('Error al registrar usuario')

        res.send('usuario registrado correctamente')
    }
}