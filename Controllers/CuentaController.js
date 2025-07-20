import { CuentaModel } from "../Models/CuentaModel.js";
import { generarNumeroCuenta } from "../Logic/Utils.js";
import path from 'path'
import { getDirname } from '../Logic/dirname.js';
const __dirname = getDirname(import.meta.url)

import { TransferenciaController } from "./TransferenciaController.js";
import { UserController } from "./UserController.js";


class CuentaController {

    /**
     * Get user account with dni
     * @param {string} dni of user for get acount 
     * @returns account of user
     */
    static async getCuentaByDNI(dni) {
        let cuenta
        try {
            cuenta = await CuentaModel.getCuenta(dni);
            return cuenta
        } catch (error) {
            throw error
        }
    }

    /**
     * Delete a specific account
     * @param {string} dni of user account for his bank account delete 
     */
    static async deleteCuenta(dni) {
        try {
            await CuentaModel.eliminarCuenta(dni)
        } catch (error) {
            throw error
        }
    }

    /**
     * Create account
     * @param {object} user object for creation the account 
     */
    static async createCuenta({ user }) {
        const numCuenta = await generarNumeroCuenta();

        try {
            const idCount = await CuentaModel.crearCuenta({
                cuenta: {
                    dni: user.dni,
                    numero_cuenta: numCuenta,
                    saldo: 100
                }
            })

            await TransferenciaController.CuentaAbierta({
                cuenta: {
                    id: idCount
                }
            })

        } catch (error) {
            throw error
        }

    }

    /**
     * Update account balance (Ingress)
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async updateCuentaIngreso(req, res) {
        const dni = req.session.user.dni;

        // Get the ingress of account
        let saldo = Number(req.body.ingreso)

        //we make sure that the balance is lower than the maximum
        if(Number(saldo) > 5000 ){
            return res.redirect(`/user/Perfil?mensaje=${'El Ingreso no puede exceder los 5.000 &euro'}&success=false`)
        }

        //if balance if lower than 0
        if(Number(saldo) < 0){
           return res.redirect(`/user/Perfil?mensaje=${'El ingreso no puede ser menor de 0 &euro'}&success=false`) 
        }
        
        const cuenta = await CuentaModel.getCuenta(dni)
        if (!cuenta) throw new Error('No se ha encontrado la cuenta')

        //Update the balance
        saldo += Number(cuenta.saldo)

        try {
            //Upate info account
            await CuentaModel.updateCuenta(saldo, dni)

            //Save the transaction
            await TransferenciaController.movimientoIngreso({
                cuenta: {
                    id: cuenta.id,
                    saldo: req.body.ingreso
                }
            })
        } catch (error) {
            throw error;
        }

        res.redirect(`/user/Perfil?mensaje=${'Ingreso hecho correctamente'}&success=true`)
    }
    
    /**
     * Update balance account (withdraw)
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async updateCuentaRetirar(req, res) {
        const dni = req.session.user.dni;

        //Get the balance to withdraw
        let saldo = Number(req.body.retiro)

        const cuenta = await CuentaModel.getCuenta(dni)
        if (!cuenta) throw new Error('No se ha encontrado la cuenta')

        //Update the balance account
        let retiro = cuenta.saldo - saldo

        //if balance is lower than 0
        if (retiro < 0) return res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('Su saldo actual no le permite hacer el retiro, por favor ingrese dinero.') + '&success=false')

        try {
            //Update the info
            await CuentaModel.updateCuenta(retiro, dni)

            await TransferenciaController.movimientoRetiro({
                cuenta: {
                    id: cuenta.id,
                    saldo: req.body.retiro
                }
            })
        } catch (error) {
            throw error;
        }
        res.redirect(`/user/Perfil?mensaje=${'Retiro hecho correctamente'}&success=true`)
    }

    /**
     * Show Transfer form
     * @param {*} req 
     * @param {*} res 
     */
    static async showTransferenciaFrom(req, res) {
        res.sendFile(path.join(__dirname, '..', 'dist', 'Transferencia', 'index.html'))
    }

    /**
     * Do a transfer
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async transferencia(req, res) {
        const datos = req.body

        if(datos.cantidad < 0){
            res.redirect(`/user/Perfil?mensaje=${'La cantidad no es la correccta, por favor introduzca una cantidad valida.'}&success=false`)
        }

        //Get the destination account 
        let cuentaDestino
        try {
            cuentaDestino = await CuentaModel.getCuentaByNum(datos.cuenta)

        } catch (error) {
            res.redirect(`/user/Perfil?mensaje=${'Número de cuenta no existe'}&success=false`)
        }

        //Get the origin account
        let cuentaOrigen
        try {
            cuentaOrigen = await CuentaModel.getCuenta(req.session.user.dni)
        } catch (error) {
            res.redirect(`/user/Perfil?mensaje=${'Error a la hora de realizar la transferencia'}&success=false`)
        }

        //if the user wants to do a transfer himself
        if (cuentaDestino.numero_cuenta == cuentaOrigen.numero_cuenta) return res.redirect(`/user/Perfil?mensaje=${'No puedes hacer una transferencia a ti mismo'}&success=false`)


        //Upate destination account (balance) in variable
        let saldoDestino = Number(cuentaDestino.saldo) + Number(datos.cantidad)
        if (saldoDestino <= 0) return res.redirect(`/user/Perfil?mensaje=${'No tienes fondos suficientes para realizar la transferencia'}&success=false`)

        //Update origin account (balance) in variable
        let saldoOrigen = Number(cuentaOrigen.saldo) - Number(datos.cantidad)

        //Update the balance of both account
        try {
            await CuentaModel.updateCuenta(saldoOrigen, cuentaOrigen.dni)
            await CuentaModel.updateCuenta(saldoDestino, cuentaDestino.dni)
        } catch (error) {
            res.redirect(`/user/Perfil?mensaje=${'Error al realizar la transferencia'}&success=false`)
        }

        //Get beneficiary user of transfer
        const usuarioBeneficiario = await UserController.getUserByDni(cuentaDestino.dni);
        const nombre = usuarioBeneficiario.nombre+' '+usuarioBeneficiario.apellidos

        //Save the movement
        TransferenciaController.transferencia({ cuentaOrigen }, { cuentaDestino }, datos.cantidad, nombre)

        res.redirect(`/user/Perfil?mensaje=${'Transferencia realizada correctamente'}&success=true`)
    }
}

export default CuentaController;