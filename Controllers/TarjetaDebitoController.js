import TarjetaDebitoModel from '../Models/TarjetaDebitoModel.js';
import { CuentaModel } from '../Models/CuentaModel.js';

const TarjetaDebitoController = {
    //Crear la tarjeta
    async crearTarjeta(req, res) {
        const dni = req.session.user?.dni;
        if (!dni) return res.redirect('/User/login?mensaje=' + encodeURIComponent('Inicia sesión, por favor.') + '&success=false');

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

    async getTarjeta(cuenta_id){
        return await TarjetaDebitoModel.obtenerTarjetaPorCuenta(cuenta_id);
    },

    //Desactivar tarjeta del usuario
    async bloquearTarjeta(req, res) {
        const id = req.params.id;
        await TarjetaDebitoModel.bloquearTarjeta(id);
        res.redirect('/User/Perfil');
    },

    //Activar la tarjeta del usuario
    async activarTarjeta(req, res) {
        const id = req.params.id;
        await TarjetaDebitoModel.activarTarjeta(id);
        res.redirect('/User/Perfil');
    }
};

export default TarjetaDebitoController;