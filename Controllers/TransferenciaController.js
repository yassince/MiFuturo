import { TransferenciaModel } from '../Models/TransferenciaModel.js'

export class TransferenciaController {
    static async getAllMovimientos(id) {
        return TransferenciaModel.getmovimientos(id)
    }
}
