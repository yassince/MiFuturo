import { TransferenciaModel } from "../Models/TransferenciaModel.js";

export class TransferenciaController{
    static async CuentaAbierta({cuenta}){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.apreturaCuenta(cuenta.id, 'Apertura', 100, fechaHora, 'Apertura de nueva cuenta')
    }

    static async movimientoIngreso({cuenta}){
        console.log(cuenta.saldo);
        
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.ingreso(cuenta.id, cuenta.saldo, fechaHora, `Ingreso de ${cuenta.saldo} &euro;`)
    }
    static async movimientoRetiro({cuenta}){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.retiro(cuenta.id, cuenta.saldo, fechaHora, `Retiro de ${cuenta.saldo} &euro;`)
    }

    static async getAllMovimientos(id){
        return await TransferenciaModel.getmovimientos(id);
    }
}