const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn,   } = require('../lib/auth');
const pool = require('../database');
const nodemailer = require('nodemailer');
helpers = require('../lib/helpers');
const fs = require('fs');
const fastcsv = require("fast-csv");

router.get('/signup',  (req,res) =>{
    res.render('auth/signup');

})
 
router.post('/signup', passport.authenticate('local.signup', {
      
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureflash: true
}));

router.get('/signin', (req,res)=>{
    res.render('auth/signin');
});

router.post('/signin', (req,res,next)=>{
       
    passport.authenticate('local.signin',{
        successRedirect: '/profile',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});


router.get('/profile',  isLoggedIn,(req,res) => {
    res.render('profile');
});
/*************************MEDICO**********************/
router.get('/signinM', (req,res)=>{
    res.render('auth/signinM');
});

router.post('/signinM', (req,res,next)=>{
    passport.authenticate('local.signinM',{
        successRedirect: '/profileM',
        failureRedirect: '/signinM',
        failureFlash: true
    })(req, res, next);
});

router.get('/profileM',  isLoggedIn,(req,res) => {
        res.render('profileM');
   
});
/*
 const pacientess = [];
 const json_pacientes = fs.readFileSync('src/views/jeson.json','utf-8');
 const pacientessM =JSON.parse(json_pacientes);
router.get('/jeson',function(req,res) {
      
    pool.query('select count(*)  as GeneroF  from paciente where SexoPaciente="Femenino"',function(err,rows,fields)
     {

        if(err) throw err;
        pacientess.push(rows);
        const json_pacientes = JSON.stringify(pacientess)
        fs.writeFileSync('src/views/jeson.json',json_pacientes,'utf-8');
         
    });

    pool.query('select count(*)  as GeneroM  from paciente where SexoPaciente="Masculino"',function(err,rows,fields)
     {

        if(err) throw err;
        pacientessM.push(rows);
        const json_pacientesM = JSON.stringify(pacientessM)
        fs.writeFileSync('src/views/jeson.json',json_pacientesM,'utf-8');
         ;
    });
    res.render('auth/signinM');
});
    
*/

 


    router.get('/jeson', async (req,res) => {
    
        pool.query("SELECT COUNT(*) AS fem FROM paciente WHERE `SexoPaciente` = 'Femenino' UNION SELECT COUNT(*) AS mas FROM paciente WHERE `SexoPaciente` = 'Masculino'", function (error, data, fields) {
        if (error) throw error;
        const jsonData1 = JSON.parse(JSON.stringify(data));
        fastcsv
              .write(jsonData1 , { headers: true })
              .on("finish", function() {
                console.log("Write to bezkoder_mysql_fastcsv.csv successfully!");
              })
              .pipe(ws);

        pool.query("SELECT COUNT(*) AS femE FROM medico WHERE `SexoMedico` = 'MUJER' UNION SELECT COUNT(*) AS masC FROM medico WHERE `SexoMedico` = 'HOMBRE'", function (error, data, fields) {
            if (error) throw error;
           const jsonData = JSON.parse(JSON.stringify(data));
           console.log("jsonData", jsonData);
        
            fastcsv
              .write(jsonData , { headers: true })
              .on("finish", function() {
                console.log("Write to bezkoder_mysql_fastcsv.csv successfully!");
              })
              .pipe(ws1);
    });
});
            res.render('auth/signinM');
    });

 
 

/*************************PACIENTE**********************/
router.get('/signinP', (req,res)=>{
    res.render('auth/signinP');
});

router.post('/signinP', (req,res,next)=>{
    passport.authenticate('local.signinP',{
        successRedirect: '/profileP',
        failureRedirect: '/signinP',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/signin');
  });
router.get('/profileP',  isLoggedIn,(req,res) => {
    res.render('profileP');
});



/***************************CONTRASEÑA*****************/
router.get('/Recuperar', (req,res) =>{
    res.render('auth/Recuperar');
});

router.post('/Recuperar',async (req,res)=>{
    const { Correo, NSS} = req.body; //Obtengo el NSS y el correo para comparar
    const ce = await pool.query('SELECT * from paciente where CorreoElectronicoPaciente = ?',[Correo]); //Comparo si el correo existe
    if(ce.length > 0){ //si existe cambio la contraseña por 123

        const newPass = '123';
        const niu = await helpers.encryptPassword(newPass); //encripto la contraseña de nuevo
        await pool.query('UPDATE paciente set Contra = ? where NSS = ?', [niu, NSS]); //guardo la nueva contraseña

        
    const transport = nodemailer.createTransport({ //la variable transport almacena las credenciales del servicio de correo, el correo a utilizar
                                                    // y la contraseña
        service: 'gmail',
        auth: {
            user: 'peker518@gmail.com',
            pass: 'narayana1l'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    //esta variale "contentHTML" almacenara el cuerpo que llevara el correo, ${newPAss} con esta variable mando la nueva contraseña (123)
    contentHTML= `      
    <h1> Buen día Derechoambiente <h1>
    <p> Nos ha llegado tu deseo por recuperar tu contraseña
    para poder entrar de nuevo a tu cuenta. </p>
    <p> tu nueva contraseña es: <b> ${newPass} </b> </p>
    <p> te recomendamos <b><u> cambiar tu contraseña </u></b> cuando inicies sesión </p>
    <br><br>
    <h3> Sistema Experto para Determinar la Potencialidad de una Enfermedad Cardiovascular</h3>
    `;

    const info = await transport.sendMail({ //Aqui se establece de quien lo mando "Nombre de la empresa o persona (SEDPEC) y correo"
        from: "'SEDPEC' <peker518@gmail.com>",
        to: 'peker518@gmail.com',       //A quíen le mando el correo
        subject: 'Recuperación de contraseña',  //el asunto del correo
        html: contentHTML                       //El cuerpo del correo, que viene siendo la variable "ContentHTML"
    });

    console.log('Enviado'); //Imprimo en consola si se envio
    res.render('auth/signinP'); //Retorno a la vista de iniciar sesión

    }else{ //Si el correo no existe se manda un mensaje de datos invalidos y se retorna a la misma vista
        req.flash('message','Datos invalidos')
        res.render('/Recuperar');
    }
    
});


/*************************contacto**********************/
router.get('/signinC', (req,res)=>{
    res.render('auth/signinC');
});

router.post('/signinC', (req,res,next)=>{
    passport.authenticate('local.signinC',{
        successRedirect: '/profileP',
        failureRedirect: '/signinC',
        failureFlash: true
    })(req, res, next);
});
 
router.get('/profileC',  isLoggedIn,(req,res) => {
    res.render('profileC');
});

module.exports = router;