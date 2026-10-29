import TarjetaDebitoModel from '../Models/TarjetaDebitoModel.js';
import { CuentaModel } from '../Models/CuentaModel.js';
import { puedeGestionarTarjeta } from '../Logic/security/tarjeta.js';

async function exigirTarjetaPropia(req, res) {
    let cuenta
    try {
        cuenta = await CuentaModel.getCuenta(req.session.user.dni)
    } catch {
        res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('Cuenta no encontrada.') + '&success=false')
        return null
    }

    const tarjeta = await TarjetaDebitoModel.obtenerTarjetaPorCuenta(cuenta.id)
    if (!puedeGestionarTarjeta(tarjeta, { cuentaId: cuenta.id, tarjetaId: req.params.id })) {
        res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('No puedes modificar esa tarjeta.') + '&success=false')
        return null
    }

    return tarjeta
}

const TarjetaDebitoController = {
    /**
     * Function for creation of user card
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async crearTarjeta(req, res) {
        const dni = req.session.user.dni;

        const cuenta = await CuentaModel.getCuenta(dni);
        if (!cuenta) return res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('Cuenta no encontrada.') + '&success=false');

        let tarjeta = await TarjetaDebitoModel.obtenerTarjetaPorCuenta(cuenta.id);
        if (!tarjeta) {
            await TarjetaDebitoModel.crearTarjeta(cuenta.id);
            tarjeta = await TarjetaDebitoModel.obtenerTarjetaPorCuenta(cuenta.id);
        }else{
            return res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('Ya tienes una tarjeta asignada.') + '&success=false');    
        }
        res.redirect('/User/Perfil?mensaje=' + encodeURIComponent('Tarjeta creada correctamente.') + '&success=true');
    },

    /**
     * Get the card asociated to
     * @param {*} cuenta_id 
     * @returns 
     */
    async getTarjeta(cuenta_id){
        return await TarjetaDebitoModel.obtenerTarjetaPorCuenta(cuenta_id);
    },

    /**
     * Function to disable the card
     * @param {*} req 
     * @param {*} res 
     */
    async bloquearTarjeta(req, res) {
        const tarjeta = await exigirTarjetaPropia(req, res)
        if (!tarjeta) return
        await TarjetaDebitoModel.bloquearTarjeta(tarjeta.id);
        res.redirect('/User/Perfil');
    },

    /**
     * Activade the card
     * @param {*} req 
     * @param {*} res 
     */
    async activarTarjeta(req, res) {
        const tarjeta = await exigirTarjetaPropia(req, res)
        if (!tarjeta) return
        await TarjetaDebitoModel.activarTarjeta(tarjeta.id);
        res.redirect('/User/Perfil');
    }
};

export default TarjetaDebitoController;