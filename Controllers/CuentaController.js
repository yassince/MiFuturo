import { CuentaModel } from "../Models/CuentaModel.js";
import { generarNumeroCuenta } from "../Logic/Utils.js";
import path from 'path'
import { getDirname } from '../Logic/dirname.js';
const __dirname = getDirname(import.meta.url)

import { TransferenciaController } from "./TransferenciaController.js";
import { UserController } from "./UserController.js";


class CuentaController {

    /**
     * 
     * @param {string} dni of user for get acount 
     * @returns acount of user
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
     * 
     * @param {string} dni of user account for his bank acount delete 
     */
    static async deleteCuenta(dni) {
        try {
            await CuentaModel.eliminarCuenta(dni)
        } catch (error) {
            throw error
        }
    }

    /**
     * 
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

    //Accion de ingresar dinero
    static async updateCuentaIngreso(req, res) {
        const dni = req.session.user.dni;

        //Falta obtener el numeor a ingresar
        let saldo = Number(req.body.ingreso)

        //Obtenemos la cuenta para actualizar info
        const cuenta = await CuentaModel.getCuenta(dni)


        if (!cuenta) throw new Error('No se ha encontrado la cuenta')

        //Actualizamos el saldo
        saldo += Number(cuenta.saldo)

        try {
            //Actualizamos los datos
            await CuentaModel.updateCuenta(saldo, dni)

            //Añadimos la transacción
            await TransferenciaController.movimientoIngreso({
                cuenta: {
                    id: cuenta.id,
                    saldo: req.body.ingreso
                }
            })
        } catch (error) {
            throw error;
        }

        //redireccionamos al perfil para que el usuario vea los cambios
        res.redirect(`/user/Perfil?mensaje=${'Ingreso hecho correctamente'}&success=true`)
    }
    
    //Accion del usuario de retiro
    static async updateCuentaRetirar(req, res) {
        const dni = req.session.user.dni;

        //Falta obtener el numero a retirar
        let saldo = Number(req.body.retiro)

        //Obtenemos la cuenta para actualizar info
        const cuenta = await CuentaModel.getCuenta(dni)


        if (!cuenta) throw new Error('No se ha encontrado la cuenta')

        //Actualizamos el saldo
        let retiro = cuenta.saldo - saldo

        if (retiro < 0) return res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('Su saldo actual no le permite hacer retirar, por favor ingrese dinero.') + '&success=false')

        try {
            //Actualizamos los datos
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

        //redireccionamos al perfil para que el usuario vea los cambios
        res.redirect(`/user/Perfil?mensaje=${'Retiro hecho correctamente'}&success=true`)
    }

    //Mostramos el formulario de transferencia
    static async showTransferenciaFrom(req, res) {
        res.sendFile(path.join(__dirname, '..', 'dist', 'Transferencia', 'index.html'))
    }

    //Realizar la transferencia del usuario
    static async transferencia(req, res) {
        const datos = req.body

        //Obtenemos la cuenta de destino
        let cuentaDestino
        try {
            cuentaDestino = await CuentaModel.getCuentaByNum(datos.cuenta)
            console.log(cuentaDestino);

        } catch (error) {
            res.redirect(`/user/Perfil?mensaje=${'Número de cuenta no existe'}&success=false`)
        }

        //obtenenos la cuenta de origen
        let cuentaOrigen
        try {
            cuentaOrigen = await CuentaModel.getCuenta(req.session.user.dni)
            console.log(cuentaOrigen);
        } catch (error) {
            res.redirect(`/user/Perfil?mensaje=${'Error a la hora de realizar la transferencia'}&success=false`)
        }

        //Caso que el usuario quiera hacer una transferencia a si mismo
        if (cuentaDestino.numero_cuenta == cuentaOrigen.numero_cuenta) return res.redirect(`/user/Perfil?mensaje=${'No puedes hacer una transferencia a ti mismo'}&success=false`)


        //Actualizamos la cuenta destino
        let saldoDestino = Number(cuentaDestino.saldo) + Number(datos.cantidad)
        if (saldoDestino <= 0) return res.redirect(`/user/Perfil?mensaje=${'No tienes fondos suficientes para realizar la transferencia'}&success=false`)

        //Actualizamos la cuenta de origen
        let saldoOrigen = Number(cuentaOrigen.saldo) - Number(datos.cantidad)

        //Actualizamos el saldo de las cuentas
        try {
            await CuentaModel.updateCuenta(saldoOrigen, cuentaOrigen.dni)
            await CuentaModel.updateCuenta(saldoDestino, cuentaDestino.dni)
        } catch (error) {
            res.redirect(`/user/Perfil?mensaje=${'Error al realizar la transferencia'}&success=false`)
        }

        //obtenemos el usuario beneficiario de la transferencia
        const usuarioBeneficiario = await UserController.getUserByDni(cuentaDestino.dni);
        const nombre = usuarioBeneficiario.nombre+' '+usuarioBeneficiario.apellidos

        console.log(nombre);
        
        //Realizamos el movimiento para el los dos usuarios sepan que ha pasado
        TransferenciaController.transferencia({ cuentaOrigen }, { cuentaDestino }, datos.cantidad, nombre)


        //Redireccionamos al perfil y mostramos mensaje de feedback
        res.redirect(`/user/Perfil?mensaje=${'Transferencia realizada correctamente'}&success=true`)
    }
}

export default CuentaController;