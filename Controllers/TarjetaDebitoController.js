import TarjetaDebitoModel from '../Models/TarjetaDebitoModel.js';
import { CuentaModel } from '../Models/CuentaModel.js';

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
        const id = req.params.id;
        await TarjetaDebitoModel.bloquearTarjeta(id);
        res.redirect('/User/Perfil');
    },

    /**
     * Activade the card
     * @param {*} req 
     * @param {*} res 
     */
    async activarTarjeta(req, res) {
        const id = req.params.id;
        await TarjetaDebitoModel.activarTarjeta(id);
        res.redirect('/User/Perfil');
    }
};

export default TarjetaDebitoController;