import bcrypt from "bcryptjs";

const hash = '$2b$10$CY9kDh90kPxru/3G./P8NODOpXdX7fiCayOXoW1Hn8OCQqQvv2t6y';
const input = 'admin123';

bcrypt.compare(input, hash).then(result => {
  console.log(result ? '✔ Contraseña correcta' : '✘ Incorrecta');
});