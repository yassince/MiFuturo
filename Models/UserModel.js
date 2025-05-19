import { users } from "../users.js";

export class UserModel {
    static obtenerUsuarios() {
        return users
    }

    static FindUser(name){
        const user = users.find(u => {
            return u.name.toLowerCase() == name.toLowerCase()
        });
        console.log(user);
        
        return user;
    }
}