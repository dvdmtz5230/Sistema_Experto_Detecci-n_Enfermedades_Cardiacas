const passport = require('passport');
const passportM = require('passport');
const passportP = require('passport');
const passportC = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');//cpnexion ala base de
const helpers = require("../lib/helpers");//sirve poder incriptar la contraseña
const fs = require('fs');
const fastcsv = require("fast-csv");
var cron = require('node-cron');
const nodemailer = require('nodemailer');


passport.use('local.signin', new LocalStrategy({
    usernameField: 'Correo',
    passwordField: 'Contra',
    passReqToCallback: true
}, async (req,Correo,Contra,done)=>{
   const rows = await pool.query('SELECT * FROM admin WHERE Correo = ?', [Correo]);
    if(rows.length > 0){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(Contra, user.Contra);
        if (validPassword) {
            done(null, user, req.flash('success','Bienvenido '+ user.Correo));
        } else {
            done(null, false,req.flash('message','Contraseña incorrecta'));
        }
    } else {
        return done(null, false, req.flash('message', 'Correo electronico incorrecto'));
    }

}));

 
passport.use('local.signup', new LocalStrategy({
    usernameField: 'Correo',
    passwordField: 'Contra',
    passReqToCallback: true
}, async (req, Correo, Contra, done)=>{
    const {idAdmin,Nombre } = req.body;
    const newUser={
        idAdmin,
        Correo,
        Contra,
        Nombre, 
    };
    newUser.Contra = await helpers.encryptPassword(Contra);
    const result = await pool.query('INSERT INTO admin set ?', [newUser]);//petición asincrona
    newUser.idAdmin = result.insertId;
    return done(null, newUser);
}));


passport.serializeUser((user, done)=>{
    const ws = fs.createWriteStream("../ESTADIA full/src/public/GraficasPaciente.csv");  
    const ws1 = fs.createWriteStream("../ESTADIA full/src/public/GraficasMedico.csv");  
    const ws6 = fs.createWriteStream("../ESTADIA full/src/public/Enfermedades.csv"); 
    
    pool.query("select SexoPaciente, count(*) from paciente group by SexoPaciente", function (error, data, fields) {
        if (error) throw error;
        const jsonData1 = JSON.parse(JSON.stringify(data));
        fastcsv
              .write(jsonData1 , { headers: true })
              .on("finish", function() {
                console.log("Write to bezkoder_mysql_fastcsv.csv successfully!");
              })
              .pipe(ws);

        pool.query("select SexoMedico, count(*) from medico group by SexoMedico", function (error, data, fields) {
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


pool.query("select diagnostico, count(*) from diagnostico group by diagnostico", function (error, data, fields) {
    if (error) throw error;
   const jsonData6 = JSON.parse(JSON.stringify(data));
   console.log("jsonData", jsonData6);

    fastcsv
      .write(jsonData6 , { headers: true })
      .on("finish", function() {
        console.log("Write to bezkoder_mysql_fastcsv.csv successfully!");
      })
      .pipe(ws6);
})

});
    done(null, user.idAdmin);
});

passport.deserializeUser(async (idAdmin, done) =>{
    const rows = await pool.query('SELECT * FROM admin WHERE idAdmin = ?', [idAdmin]);
    done(null, rows[0]);
});


/**********************MEDICO*********************** */
passportM.use('local.signinM', new LocalStrategy({
    usernameField: 'CedulaProfesional',
    passwordField: 'Contra',
    passReqToCallback: true
}, async (req,CedulaProfesional,Contra,done)=>{
   const rows = await pool.query('SELECT * FROM medico WHERE CedulaProfesional = ?', [CedulaProfesional]);
    if(rows.length > 0){
        const userM = rows[0];
        const validPassword = await helpers.matchPassword(Contra, userM.Contra);
        if (validPassword) {
            done(null, userM, req.flash('success','Bienvenido '+ userM.CedulaProfesional));
        } else {
            done(null, false,req.flash('message','Contraseña incorrecta'));
        }
    } else {
        return done(null, false, req.flash('message', 'Correo Incorrecto'));
    }

}));


passportM.serializeUser((userM, done)=>{
    
    cron.schedule ( " 0 0 0 * * * *" , ( ) => {   
        pool.query('SET lc_time_names = "es_ES"');
        pool.query("SELECT  paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,CorreoElectronicoPaciente, DATE_FORMAT(fecha,'%W,%d de %M de %Y') as fecha,Hora,TIMESTAMPDIFF(HOUR,NOW(), fecha) AS horas_transcurridas from paciente INNER JOIN citas on paciente.NSS = citas.NSS;", function (error, data, fields) {
            if (error) throw error;
            
            var i;
            for( i=0; i<data.length;i++ ){

                if(data[i].horas_transcurridas <= 24){
                    
                    const transport = nodemailer.createTransport({ //la variable transport almacena las credenciales del servicio de correo, el correo a utilizar y la contraseña
                        service: 'gmail',
                        auth: {
                            user: 'peker518@gmail.com',
                            pass: 'narayana1l'
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });
                    contentHTML= `      
                        <h1> Estimado ${data[i].NombrePaciente} ${data[i].ApellidoPaternoPaciente}<h1>
                        <h2> El motivo de este correo es </h2>
                        <h2> para recordarle que tiene la </h2>
                        <h2> cita para cardiología el día ${data[i].fecha} a las ${data[i].Hora}. </h2>
                        <h2><u>Tome sus precauciones para llegar a tiempo a la cita. </u></h2>
                        <br>
                        <h3> Sistema Experto para Determinar la Potencialidad de una Enfermedad Cardiovascular</h3>
                        `;
        
                    const info = transport.sendMail({ //Aqui se establece de quien lo mando "Nombre de la empresa o persona (SEDPEC) y correo"
                        from: "'SEDPEC' <peker518@gmail.com>",
                        to: data[i].CorreoElectronicoPaciente,       //A quíen le mando el correo
                        subject: 'Recordatorio de Cita',  //el asunto del correo
                        html: contentHTML                       //El cuerpo del correo, que viene siendo la variable "ContentHTML"
                    });
                 
                }
            }

           
     
    });
     
       
    } ) ;




    done(null, userM.CedulaProfesional);
});

passportM.deserializeUser(async (CedulaProfesional, done) =>{
    const rows = await pool.query('SELECT * FROM medico WHERE CedulaProfesional = ?', [CedulaProfesional]);
    done(null, rows[0]);
});

/**********************PACIENTE*********************** */

passportP.use('local.signinP', new LocalStrategy({
    usernameField: 'NSS',
    passwordField: 'Contra',
    passReqToCallback: true
}, async (req,NSS,Contra,done)=>{
   const rows = await pool.query('SELECT * FROM paciente WHERE NSS = ?', [NSS]);
    if(rows.length > 0){
        const userP = rows[0];
        const validPassword = await helpers.matchPassword(Contra, userP.Contra);
        if (validPassword) {
            done(null, userP, req.flash('success','Bienvenido '+ userP.NombrePaciente,''+ userP.ApellidoPaternoPaciente ,''+ userP.ApellidoMaternoPaciente));
        } else {
            done(null, false,req.flash('message','Contraseña incorrecta'));
        }
    } else {
        return done(null, false, req.flash('message', 'NSS incorrecto'));
    }

}));


passportP.serializeUser((userP, done)=>{
    done(null, userP.NSS);
});

passportP.deserializeUser(async (NSS, done) =>{
    const rows = await pool.query('SELECT * FROM paciente WHERE NSS = ?', [NSS]);
    done(null, rows[0]);
});

/**********************contacto*********************** */

passportP.use('local.signinC', new LocalStrategy({
    usernameField: 'CorreoC',
    passwordField: 'Contra',
    passReqToCallback: true
}, async (req,CorreoC,Contra,done)=>{
   const rows = await pool.query('SELECT * FROM contacto WHERE CorreoC = ?', [CorreoC]);
    if(rows.length > 0){
        const userC = rows[0];
        const validPassword = await helpers.matchPassword(Contra, userC.Contra);
        if (validPassword) {
            done(null, userC, req.flash('success','Bienvenido '+ userC.CorreoC));
        } else {
            done(null, false,req.flash('message','Invalid password'));
        }
    } else {
        return done(null, false, req.flash('message', 'Invalid email'));
    }

}));


passportC.serializeUser((userC, done)=>{
    done(null, userC.CorreoC);
});

passportC.deserializeUser(async (CorreoC, done) =>{
    const rows = await pool.query('SELECT * FROM contacto WHERE Correo = ?', [CorreoC]);
    done(null, rows[0]);
});





