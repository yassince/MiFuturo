import { CuentaModel } from "../Models/CuentaModel.js";
import { generarNumeroCuenta } from "../Logic/Utils.js";
import path from 'path'
import { getDirname } from '../Logic/dirname.js';
const __dirname = getDirname(import.meta.url)

import { TransferenciaController } from "./TransferenciaController.js";
import { UserController } from "./UserController.js";
import { parseMonto } from "../Logic/security/montos.js";
import fs from 'fs';
import { inyectarCsrf } from "../Logic/security/html.js";


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
        const monto = parseMonto(req.body?.ingreso, { max: 5000 })
        if (!monto.ok) {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent(monto.error)}&success=false`)
        }

        let cuenta
        try {
            cuenta = await CuentaModel.getCuenta(dni)
        } catch {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('No se ha encontrado la cuenta')}&success=false`)
        }

        const saldo = Number(cuenta.saldo) + monto.value

        try {
            await CuentaModel.updateCuenta(saldo, dni)
            await TransferenciaController.movimientoIngreso({
                cuenta: {
                    id: cuenta.id,
                    saldo: monto.value
                }
            })
        } catch {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('No se ha podido registrar el ingreso.')}&success=false`)
        }

        return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Ingreso hecho correctamente')}&success=true`)
    }
    
    /**
     * Update balance account (withdraw)
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async updateCuentaRetirar(req, res) {
        const dni = req.session.user.dni;
        const monto = parseMonto(req.body?.retiro)
        if (!monto.ok) {
            return res.redirect(`/User/Perfil?mensaje=${encodeURIComponent(monto.error)}&success=false`)
        }

        let cuenta
        try {
            cuenta = await CuentaModel.getCuenta(dni)
        } catch {
            return res.redirect(`/User/Perfil?mensaje=${encodeURIComponent('No se ha encontrado la cuenta')}&success=false`)
        }

        const retiro = Number(cuenta.saldo) - monto.value
        if (retiro < 0) {
            return res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('Su saldo actual no le permite hacer el retiro, por favor ingrese dinero.') + '&success=false')
        }

        try {
            await CuentaModel.updateCuenta(retiro, dni)
            await TransferenciaController.movimientoRetiro({
                cuenta: {
                    id: cuenta.id,
                    saldo: monto.value
                }
            })
        } catch {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('No se ha podido registrar el retiro.')}&success=false`)
        }

        return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Retiro hecho correctamente')}&success=true`)
    }

    /**
     * Show Transfer form
     * @param {*} req 
     * @param {*} res 
     */
    static async showTransferenciaFrom(req, res) {
        const htmlPath = path.join(__dirname, '..', 'dist', 'Transferencia', 'index.html')
        const html = fs.readFileSync(htmlPath, 'utf-8')
        res.type('html').send(inyectarCsrf(html, req.csrfToken()))
    }

    /**
     * Do a transfer
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async transferencia(req, res) {
        const datos = req.body ?? {}
        const monto = parseMonto(datos.cantidad)
        if (!monto.ok) {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent(monto.error)}&success=false`)
        }

        let cuentaDestino
        try {
            cuentaDestino = await CuentaModel.getCuentaByNum(datos.cuenta)
        } catch {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Número de cuenta no existe')}&success=false`)
        }

        let cuentaOrigen
        try {
            cuentaOrigen = await CuentaModel.getCuenta(req.session.user.dni)
        } catch {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Error a la hora de realizar la transferencia')}&success=false`)
        }

        if (String(cuentaDestino.numero_cuenta) === String(cuentaOrigen.numero_cuenta)) {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('No puedes hacer una transferencia a ti mismo')}&success=false`)
        }

        const saldoOrigen = Number(cuentaOrigen.saldo) - monto.value
        if (saldoOrigen < 0) {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('No tienes fondos suficientes para realizar la transferencia')}&success=false`)
        }

        const saldoDestino = Number(cuentaDestino.saldo) + monto.value

        try {
            await CuentaModel.updateCuenta(saldoOrigen, cuentaOrigen.dni)
            await CuentaModel.updateCuenta(saldoDestino, cuentaDestino.dni)
        } catch {
            return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Error al realizar la transferencia')}&success=false`)
        }

        const usuarioBeneficiario = await UserController.getUserByDni(cuentaDestino.dni);
        const nombre = `${usuarioBeneficiario?.nombre ?? ''} ${usuarioBeneficiario?.apellidos ?? ''}`.trim()

        await TransferenciaController.transferencia({ cuentaOrigen }, { cuentaDestino }, monto.value, nombre)

        return res.redirect(`/user/Perfil?mensaje=${encodeURIComponent('Transferencia realizada correctamente')}&success=true`)
    }
}

export default CuentaController;