const bcrypt = require('bcryptjs');
const helpers = {};

helpers.encryptPassword = async (password) => { //encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

helpers.matchPassword = async (password, user) => {
    try{
        return await bcrypt.compare(password,user);
    }catch(e){
    }
};


module.exports = helpers;