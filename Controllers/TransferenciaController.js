import { TransferenciaModel } from "../Models/TransferenciaModel.js";

export class TransferenciaController{

    //Crear movimiento de cuenta abierta
    static async CuentaAbierta({cuenta}){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.apreturaCuenta(cuenta.id, 'Apertura', 100, fechaHora, 'Apertura de nueva cuenta')
    }

    //Ingreso
    static async movimientoIngreso({cuenta}){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.ingreso(cuenta.id, cuenta.saldo, fechaHora, `Ingreso de ${cuenta.saldo} &euro;`)
    }

    //Retiro
    static async movimientoRetiro({cuenta}){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.retiro(cuenta.id, cuenta.saldo, fechaHora, `Retiro de ${cuenta.saldo} &euro;`)
    }
    
    //Obtener todos los movimientod con el id del usuario
    static async getAllMovimientos(id){
        return await TransferenciaModel.getmovimientos(id);
    }
    
    //Realizar transferencia
    static async transferencia({cuentaOrigen}, {cuentaDestino}, cantidad, nombre){
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await TransferenciaModel.transferencia(cuentaOrigen.id, cuentaDestino.id , 'Transferencia' ,cantidad, fechaHora, `Transferencia realizada a ${nombre} de ${cantidad} &euro;`)
    }
   
}