import { TransferenciaModel } from "../Models/TransferenciaModel.js";

export class TransferenciaController{

    //Create a movement on transaction acount, openned acount
    static async CuentaAbierta({cuenta}){
        //Fromat date
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.apreturaCuenta(cuenta.id, 'Apertura', 100, fechaHora, 'Apertura de nueva cuenta')
    }

    //Ingress
    static async movimientoIngreso({cuenta}){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.ingreso(cuenta.id, cuenta.saldo, fechaHora, `Ingreso de ${cuenta.saldo} &euro;`)
    }

    //Withdraw (Retiro)
    static async movimientoRetiro({cuenta}){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.retiro(cuenta.id, cuenta.saldo, fechaHora, `Retiro de ${cuenta.saldo} &euro;`)
    }
    
    //Get all movements with acount id
    static async getAllMovimientos(id){
        return await TransferenciaModel.getmovimientos(id);
    }
    
    //Do a transfer
    static async transferencia({cuentaOrigen}, {cuentaDestino}, cantidad, nombre){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.transferencia(cuentaOrigen.id, cuentaDestino.id , 'Transferencia' ,cantidad, fechaHora, `Transferencia realizada a ${nombre} de ${cantidad} &euro;`)
    }
   
}