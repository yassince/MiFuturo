import { CuentaModel } from "../Models/CuentaModel.js";
import { generarNumeroCuenta } from "../Logic/Utils.js";

import { TransferenciaController } from "./TransferenciaController.js";


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

    /**
     * 
     * @param {number} saldo money of his acount 
     * @param {string} dni foreing key reference of user acount
     */
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
    /**
     * 
     * @param {number} saldo money of his acount 
     * @param {string} dni foreing key reference of user acount
     */
    static async updateCuentaRetirar(req, res) {
        const dni = req.session.user.dni;

        //Falta obtener el numero a retirar
        let saldo = Number(req.body.retiro)

        //Obtenemos la cuenta para actualizar info
        const cuenta = await CuentaModel.getCuenta(dni)


        if (!cuenta) throw new Error('No se ha encontrado la cuenta')

        //Actualizamos el saldo
        let retiro = cuenta.saldo - saldo

        console.log(retiro);

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

    //Realizar la transferencia del usuario
    static async transferencia() {

    }
}

export default CuentaController;