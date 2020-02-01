const express = require('express');
const router = express.Router();
const helpers = require("../lib/helpers");
const nodemailer = require('nodemailer');
const pool = require('../database'); //conexion bd
const hbs = require('handlebars');
const path = require('path');
const fs = require('fs-extra');

router.get('/Pacientes', async (req,res)=>{
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS ');
     
    res.render('medicos/Pacientes',{consultados: consulta});
});


router.get('/AgendarCita/:NSS', async (req,res) =>{
    const {NSS} = req.params;
    const consulta = await pool.query('SELECT * from paciente where NSS = ?', [NSS]);
    res.render('medicos/AgendarCita', {consulta: consulta[0]});
});

router.post('/AgendarCita', async (req,res)=>{
    const {idCitas, fecha, Hora, Clinica, Estado, NSS, nuevo} = req.body;
    const newDate = {
        idCitas,
        fecha,
        Hora,
        Clinica,
        Estado,
        NSS
    };
    await pool.query('INSERT INTO citas set ?',[newDate]);
    req.flash('Sucess','Cita Agendada');
    res.redirect('/medicos/Pacientes');
});

router.get('/Citas', async (req,res) => {
    const consulta = await pool.query('SELECT paciente.NSS, NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,idCitas,DATE_FORMAT(citas.fecha, "%d %M %Y") as fecha,Hora from paciente inner join citas on paciente.NSS = citas.NSS WHERE Estado = "Pendiente"');
    res.render('medicos/Citas', {consulta});
});


router.get('/Receta/:NSS', async (req,res)=>{
    const {NSS} = req.params;
    const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,DATE_FORMAT(now(), "%Y/%m/%d") as fecha ,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS = domicilio.NSS WHERE paciente.NSS= ?',[NSS]);
    const enlace2 = await pool.query('Select * from diagnostico where NSS=? order by fechad desc limit 1 ',[NSS]);
    console.log(enlace);
    console.log(enlace2);
    res.render('medicos/Receta', {links: enlace[0],linkss:enlace2[0]});
})

router.post('/Receta/:NSS', async (req,res)=>{ //nueva informacion 
     
    const {NSS,CedulaProfesional,fecha,diagnostico, peso,estatura,observaciones,medicamentos} = req.body;
    const newLink = {
        NSS,
        fecha,
        peso,
        estatura,
        observaciones,
        medicamentos,
        CedulaProfesional,
        diagnostico
    };
    console.log(newLink);
    pool.query('INSERT INTO fichamedica set ?', [newLink]);//petición asincrona y query para insertar usuario
    req.flash('success', 'Operación correcta');
    res.redirect('/medicos/Pacientes');
});

router.get('/atencion/:idCitas', async (req,res)=>{
    const {idCitas} = req.params;
    const enlace = await pool.query('SELECT paciente.NSS,paciente.NombrePaciente, paciente.ApellidoPaternoPaciente, paciente.ApellidoMaternoPaciente,timestampdiff(year,paciente.FechaNacimientoPaciente,now()) as edad,paciente.SexoPaciente, idCitas, DATE_FORMAT(fecha, "%d/%m/%Y") as fechas, Hora, Clinica, fecha from paciente INNER JOIN citas on paciente.NSS = citas.NSS where idCitas = ?', [idCitas]);
    res.render('medicos/atencion', {links: enlace[0]});
});

router.post('/atencion/:idCitas', async (req,res)=>{
    const {idCitas} = req.params;
    const {Observaciones, Estado, Cedula, NSS, nuevo} = req.body;
    const newC = {
        Observaciones,
        Estado,
        Cedula
    };

    await pool.query('UPDATE citas set ? WHERE idCitas = ?',[newC, idCitas]);
    if(nuevo == 'on'){
        req.flash('Sucess','Cita Agendada');
        const consulta = await pool.query('SELECT * from paciente where NSS = ?', [NSS]);
        res.render('medicos/AgendarCita', {consulta: consulta[0]});
        
    }else{
        req.flash('Success','Sesión terminada');
        res.redirect('/medicos/Pacientes');
    }
    
});

const compile = async function(templateName, link){
    const filePath = path.join(process.cwd(), 'src/views/reportes', `${templateName}.hbs`);
    const html = await fs.readFile(filePath,'utf-8');
    return hbs.compile(html)(link);
};

router.get('/Diagnostico', async (req,res)=>{
    console.log('hola');
    const link = await pool.query('SELECT * FROM paciente where SexoPaciente = "Femenino"');
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

    const contentHTML=await compile('RGeneroF',{link})
    console.log(contentHTML);
    const info = await transport.sendMail({ //Aqui se establece de quien lo mando "Nombre de la empresa o persona (SEDPEC) y correo"
    from: "'SEDPEC' <peker518@gmail.com>",
    to: 'peker518@gmail.com',       //A quíen le mando el correo
    subject: 'Recuperación de contraseña',  //el asunto del correo
    html: contentHTML                       //El cuerpo del correo, que viene siendo la variable "ContentHTML"
});

console.log(info);



})

router.get('/diagnosticar/:NSS', async (req,res) =>{
    const {NSS} = req.params;
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
    res.render('medicos/diagnosticar', {consulta: consulta[0]});
})

router.post('/diagnosticar/:NSS', async (req,res) =>{
    const {NSS} = req.params;
    let DificultadParaRespirar="",DolorDePecho="",Mareos="",Taquicardia="",Nausea="",Vomitos="",
    CambiosdeVision="",Fatiga="",Sudoracion="",hinchazondelaspiernasYtobillos="",
    Desmayo="",Palidez="",abdomeninflamado="",HczDAdmenLiq="",SangradoNasal="",DolorDeCabeza="",
    ZumbidoenlosOidos="",somnolencia="",vertigo="";
    const fecha =await pool.query('select curdate() as fechas');
    const fechad = fecha[0].fechas;
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
    const {idSintomas,DificultadParaRespirar1,DolorDePecho1,Mareos1,Taquicardia1,Nausea1,Vomitos1,
        CambiosdeVision1,Fatiga1,Sudoracion1,hinchazondelaspiernasYtobillos1,
        Desmayo1,Palidez1,abdomeninflamado1,HczDAdmenLiq1,SangradoNasal1,DolorDeCabeza1,
        ZumbidoenlosOidos1,somnolencia1,vertigo1} = req.body;
    
        if(DificultadParaRespirar1 =='on') { DificultadParaRespirar= 'DificultadParaRespirar' };
        if(Mareos1 =='on'){ Mareos= 'Mareos'};
        if(Taquicardia1 =='on'){ Taquicardia= 'Taquicardia'};
        if(Nausea1 =='on'){ Nausea= 'Nausea'};
        if(Vomitos1 =='on'){ Vomitos= 'Vomitos'};
        if(DolorDePecho1 =='on'){ DolorDePecho= 'DolorDePecho'};
        if(CambiosdeVision1 =='on'){ CambiosdeVision= 'CambiosdeVision'};
        if(Fatiga1 =='on'){ Fatiga= 'Fatiga'};
        if(Sudoracion1 =='on'){ Sudoracion= 'Sudoracion'};
        if(hinchazondelaspiernasYtobillos1 =='on'){ hinchazondelaspiernasYtobillos= 'hinchazondelaspiernasYtobillos'};
        if(Desmayo1 =='on'){ Desmayo= 'Desmayo'};
        if(Palidez1 =='on'){ Palidez= 'Palidez'};
        if(abdomeninflamado1 =='on'){ abdomeninflamado= 'abdomeninflamado'};
        if(HczDAdmenLiq1 =='on'){ HczDAdmenLiq= 'HczDAdmenLiq'};
        if(SangradoNasal1 =='on'){ SangradoNasal= 'SangradoNasal'};
        if(DolorDeCabeza1 =='on'){ DolorDeCabeza= 'DolorDeCabeza'};
        if(ZumbidoenlosOidos1 =='on'){ ZumbidoenlosOidos= 'ZumbidoenlosOidos'};
        if(somnolencia1 =='on'){ somnolencia= 'somnolencia'};
        if(vertigo1 =='on'){ vertigo= 'vertigo'};
      
        var natural = require('natural');
        var classifier = new natural.BayesClassifier();

        const data = require('./data.json');
        data.forEach(item=>{
        
            classifier.addDocument([item.Sintoma1,item.Sintoma2,item.Sintoma3,item.Sintoma4,item.Sintoma5,item.Sintoma6,item.Sintoma7,item.Sintoma8,item.Sintoma9],item.Enfermedad);
         })
            
         // Train
            classifier.train();
        


            const resultado = classifier.classify([DificultadParaRespirar,Mareos,Taquicardia,Nausea,Vomitos,DolorDePecho,CambiosdeVision,Fatiga,Sudoracion,hinchazondelaspiernasYtobillos,
                                                   Desmayo,Palidez,abdomeninflamado,HczDAdmenLiq,SangradoNasal,DolorDeCabeza,ZumbidoenlosOidos,somnolencia,vertigo]);

                
                                                   console.log(resultado);

            let diagnostico=resultado;

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
                <h1> Buen día Derechoambiente <h1>
                <p> Tienes </p>
                <p> <b> ${resultado} </b> </p>
                <p> te recomendamos <b><u> seguir las instrucciones de tu médico </u></b></p>
                <br><br>
                <h3> Sistema Experto para Determinar la Potencialidad de una Enfermedad Cardiovascular</h3>
                `;

            const info = await transport.sendMail({ //Aqui se establece de quien lo mando "Nombre de la empresa o persona (SEDPEC) y correo"
                from: "'SEDPEC' <peker518@gmail.com>",
                to: 'peker518@gmail.com',       //A quíen le mando el correo
                subject: 'Pre-diagnóstico',  //el asunto del correo
                html: contentHTML                       //El cuerpo del correo, que viene siendo la variable "ContentHTML"
            });


        const sintomas = {
          
            diagnostico,
            idSintomas,
            NSS,
            DificultadParaRespirar,
            DolorDePecho,
            Mareos,
            Taquicardia,
            Nausea,
            Vomitos,
            CambiosdeVision,
            Fatiga,
            Sudoracion,
            hinchazondelaspiernasYtobillos,
            Desmayo,Palidez,abdomeninflamado,
            HczDAdmenLiq,
            SangradoNasal,
            DolorDeCabeza,
            ZumbidoenlosOidos,
            somnolencia,
            vertigo,
            fechad
        }

    
    console.log(sintomas);
    
    pool.query('INSERT INTO sintomas set ?', [sintomas]);//petición asincrona y query para insertar usuario
    req.flash('success','Paciente registrado'); //alerta de medico registrado
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta2 = await pool.query('select diagnostico,idSintomas,NSS, DATE_FORMAT(fechad,"%W,%d de %M de %Y") as fecha from sintomas where NSS = ?',[NSS]);
    res.render('medicos/diagnosticoF', {consulta: consulta[0],links: consulta2});
});

router.get('/diagnosticoF/:NSS', async (req,res) =>{
   res.render('medicos/diagnosticoF');
}) 

router.get('/deleteDiagnostico/:idSintomas/:NSS', async (req,res)  => {
    const {idSintomas} = req.params;
    const {NSS} = req.params; 
    const fecha =await pool.query('select curdate() as fechas');
     
    await pool.query('DELETE from sintomas WHERE idSintomas = ?', [idSintomas]);
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
   
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta2 = await pool.query('select diagnostico,idSintomas,NSS, DATE_FORMAT(fechad,"%W,%d de %M de %Y") as fecha from sintomas where NSS = ?',[NSS]);
    res.render('medicos/diagnosticoF', {consulta: consulta[0],links: consulta2});
    
});

router.get('/confirmarDiagnostico/:idSintomas/:NSS', async (req,res)   => {
    const {idSintomas} = req.params;
    const {NSS} = req.params; 
    const fecha =await pool.query('select curdate() as fechas');
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
   
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta2 = await pool.query('select diagnostico,NSS,idSintomas, DATE_FORMAT(fechad,"%W,%d de %M de %Y") as fecha from sintomas where idSintomas = ?',[idSintomas]);
    console.log(consulta2);
    res.render('medicos/confirmarDiagnostico',{consulta: consulta[0],links: consulta2[0]});
    
});



router.post('/confirmarDiagnostico/:NSS/:CedulaProfesional', async (req,res)  => {
     
    const {NSS} = req.params; 
    const {CedulaProfesional} = req.params;
    const fecha =await pool.query('select curdate() as fechas');
    const fechad = fecha[0].fechas;

    const {diagnostico, Recomendacion } = req.body;
    const diagnosticoF = {
    CedulaProfesional,
    NSS,
    CedulaProfesional,
    fechad,
    diagnostico,
    Recomendacion
    };
    console.log(diagnosticoF);
    await pool.query('SET lc_time_names = "es_ES"');
    pool.query('INSERT INTO diagnostico set ?', [diagnosticoF]);
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS ');
    req.flash('success','Diagnostico confirmado');
    res.render('medicos/Pacientes',{consultados: consulta}); 
});
module.exports = router;