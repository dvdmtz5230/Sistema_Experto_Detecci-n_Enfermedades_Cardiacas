const express = require('express');
const router = express.Router();
const helpers = require("../lib/helpers");
const mysqldump = require('mysqldump');
const mysql_import = require('mysql-import');

const pool = require('../database'); //conexion bd


router.get('/add', (req, res) => { //enviar a ruta
    
    pool.query('SELECT CedulaProfesional,NombreMedico,ApellidoPaternoMedico,ApellidoMaternoMedico,DATE_FORMAT(FechaNacimientoMedico,"%d de %M de %Y") as FechaNacimientoMedico ,SexoMedico FROM medico ORDER BY CedulaProfesional DESC LIMIT 1');
   
    res.render('links/add');
});

router.post('/add', async(req,res) =>{ //registrar médico
    const {CedulaProfesional,NombreMedico,ApellidoPaternoMedico,ApellidoMaternoMedico,SexoMedico,CorreoElectronicoMedico,Contra,
    FechaNacimientoMedico} = req.body;
     
    const NewM = {
        CedulaProfesional,
        NombreMedico,
        ApellidoPaternoMedico,
        ApellidoMaternoMedico,
        SexoMedico,
        CorreoElectronicoMedico,
        Contra,
        FechaNacimientoMedico,
    }
    console.log(NewM);
    NewM.Contra = await helpers.encryptPassword(Contra); //encriptar contraseña
    pool.query('INSERT INTO medico set ?', [NewM]);//petición asincrona y query para insertar usuario
    const IDUsuario=CedulaProfesional;
    res.render('links/Dom',{IDUsuario}); //redireccionamiento a links donde se visualizan los medicos 
})

router.get('/addP',(req,res)=>{
    pool.query('SELECT NSS FROM paciente order by NSS DESC LIMIT 1');
    res.render('links/addP');
});

router.post('/addP', async (req,res)=>{ //Registrar paciente
    const {NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,
        CorreoElectronicoPaciente,Contra} = req.body;
        const NewM = {
            NSS,
            NombrePaciente,
            ApellidoPaternoPaciente,
            ApellidoMaternoPaciente,
            SexoPaciente,
            FechaNacimientoPaciente,
            CorreoElectronicoPaciente,
            Contra,
        }
    console.log(NewM);
    NewM.Contra = await helpers.encryptPassword(Contra); //encriptar contraseña
    pool.query('INSERT INTO paciente set ?', [NewM]);//petición asincrona y query para insertar usuario
    const IDUsuario = NSS;
    res.render('links/Dom',{IDUsuario}); //redireccionamiento a links donde se visualizan los medicos 
});

router.get('/Dom/:IDUsuario', (req,res)=>{
    const {IDUsuario}= req.params;
    pool.query('SELECT IdDomicilio FROM domicilio ORDER BY idDomicilio DESC LIMIT 1');
    res.render('links/Dom',{IDUsuario});
})

router.post('/Dom', async (req,res)=>{
    const {IdDomicilio, Calle, Colonia, Municipio, NumeroExt, 
        NumeroInter, Estado, Ciudad, IDUsuario} = req.body;
    const pac = await pool.query('SELECT * FROM paciente where NSS = ?', [IDUsuario]);
    const med = await pool.query('SELECT * FROM medico where CedulaProfesional = ?', [IDUsuario]);
    console.log(IDUsuario);
     
        if(pac.length > 0){
        const NSS = IDUsuario;
        const NewC = {
            IdDomicilio, 
            Calle,
            Colonia,
            Municipio,
            NumeroExt, 
            NumeroInter,
            Estado,
            Ciudad,
            NSS
        }
        pool.query('INSERT INTO domicilio set ?',[NewC]);
        req.flash('succes','Domicilio registrado');
        res.redirect('/links/Pacientes');
    }if(med.length > 0){
        const Cedula = IDUsuario;
        const newD = {
            IdDomicilio, 
            Calle,
            Colonia,
            Municipio,
            NumeroExt, 
            NumeroInter,
            Estado,
            Ciudad,
            Cedula
        }
        pool.query('INSERT INTO domicilio set ?',[newD]);
        req.flash('succes','Domicilio registrado');
        res.redirect('/links');
    }else{
        
    }
});

router.post('/DomEditP/:idDomicilio', async (req,res)=>{
    const {idDomicilio} = req.params;
    const {Calle, Colonia, Municipio, NumeroExt, 
        NumeroInter, Estado, Ciudad} = req.body;

        const newD = {
            Calle,
            Colonia,
            Municipio,
            NumeroExt, 
            NumeroInter,
            Estado,
            Ciudad,
            idDomicilio,
        }
        await pool.query('UPDATE domicilio set ? WHERE idDomicilio = ?', [newD, idDomicilio]);
        res.redirect('/links/Pacientes');
        req.flash('succes','Domicilio registrado');

   
  console.log(newD);
   
  
});

router.post('/DomEditM/:idDomicilio', async (req,res)=>{
    const {idDomicilio} = req.params;
    const {Calle, Colonia, Municipio, NumeroExt, 
        NumeroInter, Estado, Ciudad} = req.body;

        const newD = {
            Calle,
            Colonia,
            Municipio,
            NumeroExt, 
            NumeroInter,
            Estado,
            Ciudad,
            idDomicilio,
        }
        await pool.query('UPDATE domicilio set ? WHERE idDomicilio = ?', [newD, idDomicilio]);
        res.redirect('/links');
        req.flash('succes','Domicilio registrado');

   
  console.log(newD);
   
  
});

router.post('/editContraP/:NSS', async (req,res)=>{ //nueva informacion 
    const { NSS } = req.params;
    const {Contra,} = req.body;
    const newContra = {
        Contra,   
    };
    newContra.Contra = await helpers.encryptPassword(Contra); //encriptar contraseña
    await pool.query('UPDATE paciente set ? WHERE NSS = ?', [newContra, NSS]);
    req.flash('success', 'Contraseña cambiada correctamente ');
    res.redirect('/links/Pacientes');
    
});

router.post('/editContraM/:CedulaProfesional', async (req,res)=>{ //nueva informacion 
    const { CedulaProfesional } = req.params;
    const {Contra,} = req.body;
    const newContra = {
        Contra,   
    };
    newContra.Contra = await helpers.encryptPassword(Contra); //encriptar contraseña
    await pool.query('UPDATE medico set ? WHERE CedulaProfesional = ?', [newContra, CedulaProfesional]);
    req.flash('success', 'Contraseña cambiada correctamente ');
    res.redirect('/links');
    
});


router.post('/editP/:NSS', async (req,res)=>{ //nueva informacion 
    const { NSS } = req.params;
    const {NombrePaciente, CorreoElectronicoPaciente, ApellidoPaternoPaciente, ApellidoMaternoPaciente,SexoPaciente,} = req.body;
    const newLink = {
        NombrePaciente,
        ApellidoPaternoPaciente,
        ApellidoMaternoPaciente,
        CorreoElectronicoPaciente,
        SexoPaciente,
         
    };
    await pool.query('UPDATE paciente set ? WHERE NSS = ?', [newLink, NSS]);
    req.flash('success', 'Modificación correcta');
    res.redirect('/links/Pacientes');
    
});


router.get('/', async (req, res)=>{
    await pool.query('SET lc_time_names = "es_ES"'); 
    const consulta = await pool.query('SELECT medico.CedulaProfesional,NombreMedico,Ciudad,Estado,idDomicilio,ApellidoPaternoMedico,ApellidoMaternoMedico,SexoMedico,CorreoElectronicoMedico, DATE_FORMAT(FechaNacimientoMedico,"%d de %M de %Y") as FechaNacimientoMedico,Calle,Colonia,Municipio,NumeroInter,NumeroExt from medico inner join domicilio on medico.CedulaProfesional = domicilio.Cedula');
   
    //const consultados = {consulta, con}
    res.render('links/perfil', {consultados: consulta}); //consulta se utiliza para jalar los datos.
});

router.get('/Pacientes', async (req,res)=>{
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS ');
     
    res.render('links/Pacientes',{consultados: consulta });
});

router.get('/editP/:NSS', async (req,res)=>{
    const {NSS} = req.params;
    const enlace = await pool.query('SELECT * FROM paciente WHERE NSS = ?', [NSS]);
    console.log(enlace);
    res.render('links/editP', {links: enlace[0]});
})


router.get('/deleteP/:NSS', async (req,res)=>{
    const {NSS} = req.params;
    await pool.query('DELETE from paciente where NSS = ?',[NSS]);
    res.redirect("/links/Pacientes");
});

router.get('/delete/:CedulaProfesional', async (req,res)  => {
    const { CedulaProfesional } = req.params;
    await pool.query('DELETE from medico WHERE CedulaProfesional = ?', [CedulaProfesional]);
    res.redirect("/links");
});

router.get('/edit/:CedulaProfesional', async (req,res) =>{ //seleccionar la información a modificar
    const { CedulaProfesional } = req.params;
    const enlace = await pool.query('SELECT * FROM medico where CedulaProfesional = ?', [CedulaProfesional]);
    req.flash('success','Medico Eliminado Correctamente'); //alerta de medico registrado
    res.render('links/edit', {link: enlace[0]});
});

router.post('/edit/:CedulaProfesional', async (req,res)=>{ //nueva informacion 
    const { CedulaProfesional } = req.params;
    const {NombreMedico, CorreoElectronicoMedico, ApellidoPaternoMedico, ApellidoMaternoMedico} = req.body;
    const newLink = {
        NombreMedico,
        ApellidoPaternoMedico,
        ApellidoMaternoMedico,
        CorreoElectronicoMedico,
    };
    await pool.query('UPDATE medico set ? WHERE CedulaProfesional = ?', [newLink, CedulaProfesional]);
    req.flash('success', 'Modificación correcta');
    res.redirect('/links');
});

router.post('/editt/:CedulaProfesional', async (req,res)=>{ //nueva informacion 
    const { CedulaProfesional } = req.params;
    const {NombreMedico, CorreoElectronicoMedico, ApellidoPaternoMedico, ApellidoMaternoMedico} = req.body;
    const newLink = {
        NombreMedico,
        ApellidoPaternoMedico,
        ApellidoMaternoMedico,
        CorreoElectronicoMedico,
    };
    await pool.query('UPDATE medico set ? WHERE CedulaProfesional = ?', [newLink, CedulaProfesional]);
    const enlace = await pool.query('SELECT medico.CedulaProfesional,NombreMedico,Ciudad,Estado,idDomicilio,ApellidoPaternoMedico,ApellidoMaternoMedico,SexoMedico,CorreoElectronicoMedico,timestampdiff(year,FechaNacimientoMedico,now()) as edad,Calle,Colonia,Municipio,NumeroInter,NumeroExt from medico inner join domicilio on medico.CedulaProfesional = domicilio.Cedula');
    req.flash('success', 'Modificación correcta');
    res.render('links/verMedico2',{linkss: enlace[0]});
});
router.get('/verPerfilP/:NSS', async (req,res)=>{
    const {NSS} = req.params;
   // const enlace = await pool.query('SELECT * FROM paciente WHERE NSS = ?', [NSS]);
   await pool.query('SET lc_time_names = "es_ES"');
   const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
     
       
   await pool.query('SET lc_time_names = "es_ES"');
    const enlace2 = await pool.query('SELECT  NSS,IDAF,NombreAF,ApellidoAPAF,GeneroAF,Parentesco,Padecimiento,ApellidoAMAF,DATE_FORMAT(FechaNAF,"%d de %M de %Y") as FechaNAF from AntecedentesF WHERE NSS = ?',[NSS]);
    await pool.query('SET lc_time_names = "es_ES"');
    const enlace3 = await pool.query('SELECT DATE_FORMAT(fecha,"%d de %M de %Y") as fecha,Clinica,Hora,Estado,Observaciones,NombreMedico,ApellidoPaternoMedico,ApellidoMaternoMedico FROM citas inner join medico on medico.CedulaProfesional= citas.Cedula WHERE NSS = ?',[NSS]);
    const enlace4 = await pool.query('Select * from diagnostico where NSS=? order by fechad desc limit 1 ',[NSS]);
    console.log(enlace3);
    res.render('links/verPerfilP', {links: enlace[0],link: enlace2,linkss: enlace3,ABC: enlace4[0]});
});


router.get('/FichaMEdica/:NSS', async (req,res)=>{
    const {NSS} = req.params;
   // const enlace = await pool.query('SELECT * FROM paciente WHERE NSS = ?', [NSS]);
   await pool.query('SET lc_time_names = "es_ES"');
   const enlace = await pool.query('SELECT paciente.NSS,NombreMedico,FichaMedica.FichaMedica,ApellidoPaternoMedico,ApellidoMaternoMedico,medico.CedulaProfesional,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente, DATE_FORMAT(fichamedica.fecha,"%d de %M de %Y")  as fecha,peso,estatura,medicamentos,observaciones from medico inner join fichamedica on medico.CedulaProfesional= fichamedica.CedulaProfesional inner join  paciente on paciente.NSS= fichamedica.NSS where paciente.NSS = ?',[NSS]);
    const enlace2 = await pool.query('Select * from paciente where NSS=?',[NSS] );
    console.log(enlace2);
    res.render('links/FichaMEdica', {links: enlace,linkss:enlace2[0]});
});

router.get('/verFicha/:FichaMedica', async (req,res)=>{
    const {FichaMedica} = req.params;
   // const enlace = await pool.query('SELECT * FROM paciente WHERE NSS = ?', [NSS]);
   await pool.query('SET lc_time_names = "es_ES"');
   const enlace = await pool.query('SELECT paciente.NSS,NombreMedico,FichaMedica.FichaMedica,diagnostico,ApellidoPaternoMedico,ApellidoMaternoMedico,medico.CedulaProfesional,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente, DATE_FORMAT(fichamedica.fecha,"%d de %M de %Y")  as fecha,peso,estatura,medicamentos,observaciones from medico inner join fichamedica on medico.CedulaProfesional= fichamedica.CedulaProfesional inner join  paciente on paciente.NSS= fichamedica.NSS where FichaMedica.FichaMedica = ?',[FichaMedica]);
     //const enlace = await pool.query('select * from FichaMedica where FichaMedica = ?',[FichaMedica])  
  
  
    res.render('links/verFicha', {links: enlace[0]});
});

router.post('/editFicha/:FichaMedica', async (req,res)=>{ //nueva informacion 
    const { FichaMedica } = req.params;
    
    const {NSS,CedulaProfesional,diagnostico,fecha, peso,estatura,observaciones,medicamentos} = req.body;
   
     
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
    await pool.query('UPDATE FichaMedica set ? WHERE FichaMedica = ?', [newLink, FichaMedica]);
     
    req.flash('success', 'Modificación correcta');
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS ');
     
    res.render('medicos/Pacientes',{consultados: consulta });

});

router.get('/deleteFicha/:FichaMedica', async (req,res)=>{
    const {FichaMedica} = req.params;
    await pool.query('DELETE from FichaMedica where FichaMedica = ?',[FichaMedica]);
    req.flash('success', 'Eliminación  correcta');
    res.redirect("/medicos/Pacientes");
});


router.get('/verPerfilPC/:NSS', async (req,res)=>{
    const {NSS} = req.params;
    await pool.query('SET lc_time_names = "es_ES"');
   // const enlace = await pool.query('SELECT * FROM paciente WHERE NSS = ?', [NSS]);
    const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
    const enlace4 = await pool.query('Select * from diagnostico where NSS=? order by fechad desc limit 1 ',[NSS]);
    
    const enlace2 = await pool.query('SELECT  NombreAF,ApellidoAPAF,GeneroAF,Parentesco,Padecimiento,ApellidoAMAF,DATE_FORMAT(FechaNAF,"%d de %M de %Y") as FechaNAF from AntecedentesF WHERE NSS = ?',[NSS]);
    const enlace3 = await pool.query('SELECT *FROM citas WHERE NSS = ?',[NSS]);
     
    res.render('links/verPerfilPC', {links: enlace[0],link: enlace2,linkss: enlace3,ABC: enlace4[0]});
});

router.get('/verMedico/:CedulaProfesional', async (req,res)=>{
    const {CedulaProfesional} = req.params;
   // const enlace = await pool.query('SELECT * FROM paciente WHERE CedulaProfesional = ?', [CedulaProfesional]);
   await pool.query('SET lc_time_names = "es_ES"');
   const enlace = await pool.query('SELECT medico.CedulaProfesional,NombreMedico,Ciudad,Estado,idDomicilio,ApellidoPaternoMedico,ApellidoMaternoMedico,SexoMedico,CorreoElectronicoMedico,timestampdiff(year,FechaNacimientoMedico,now()) as edad,DATE_FORMAT(FechaNacimientoMedico,"%d de %M de %Y") as  FechaNacimientoMedico,Calle,Colonia,Municipio,NumeroInter,NumeroExt from medico inner join domicilio on medico.CedulaProfesional = domicilio.cedula WHERE medico.CedulaProfesional=?',[CedulaProfesional]);
     
    res.render('links/verMedico', {linkss: enlace[0]});
});

router.get('/verMedico2/:CedulaProfesional', async (req,res)=>{
    const {CedulaProfesional} = req.params;
   // const enlace = await pool.query('SELECT * FROM paciente WHERE CedulaProfesional = ?', [CedulaProfesional]);
   await pool.query('SET lc_time_names = "es_ES"');
   const enlace = await pool.query('SELECT medico.CedulaProfesional,NombreMedico,Ciudad,Estado,idDomicilio,ApellidoPaternoMedico,ApellidoMaternoMedico,SexoMedico,CorreoElectronicoMedico,timestampdiff(year,FechaNacimientoMedico,now()) as edad,DATE_FORMAT(FechaNacimientoMedico,"%d de %M de %Y") as  FechaNacimientoMedico,Calle,Colonia,Municipio,NumeroInter,NumeroExt from medico inner join domicilio on medico.CedulaProfesional = domicilio.cedula WHERE medico.CedulaProfesional=?',[CedulaProfesional]);
    res.render('links/verMedico2', {linkss: enlace[0]});
});
router.get('/Pacientes', async (req,res)=>{
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS ');
     
    res.render('links/Pacientes',{consultados: consulta });
});

/*ANTECEDENTES*************************************************************************/ 
router.get('/AgregarAF/:NSS', async (req,res)=>{
    const {NSS} = req.params;
    await pool.query('SET lc_time_names = "es_ES"');
    const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
    const enlace4 = await pool.query('Select * from diagnostico where NSS=? order by fechad desc limit 1 ',[NSS]);
    res.render('links/AgregarAF', {links: enlace[0],ABC: enlace4[0]});
})
router.get('/Antecedentes', async(req, res) => { //enviar a ruta
    const consulta = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS ');
     
    res.render('links/Antecedentes',{consultados: consulta });
});

router.post('/AgregarAF/:NSS', async (req,res)=>{ //nueva informacion 
     
    const {NSS,NombreAF, ApellidoAPAF,ApellidoAMAF,GeneroAF,Parentesco,FechaNAF,Padecimiento} = req.body;
    const newLink = {
        NSS,
        NombreAF,
        ApellidoAPAF,
        ApellidoAMAF,
        GeneroAF,
        Parentesco,
        FechaNAF,
        Padecimiento
    };
    console.log(newLink);
    pool.query('INSERT INTO AntecedentesF set ?', [newLink]);//petición asincrona y query para insertar usuario
    const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,FechaNacimientoPaciente,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
    const enlace2 = await pool.query('SELECT * FROM AntecedentesF WHERE NSS = ?',[NSS]);
    const enlace3 = await pool.query('SELECT *FROM citas WHERE NSS = ?',[NSS]);
    console.log(enlace2);
    console.log(enlace);
    console.log(enlace3);
    req.flash('success', 'Operación correcta');
    res.render('links/verPerfilP', {links: enlace[0],link: enlace2,linkss: enlace3});
});

router.get('/EditarAF/:IDAF/:NSS', async (req,res)=>{
    const {IDAF} = req.params;
    const {NSS} = req.params; 
      await pool.query('SET lc_time_names = "es_ES"');
      const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
      console.log(enlace)
      await pool.query('SET lc_time_names = "es_ES"');
     const enlace4 = await pool.query('Select IDAF,NombreAF,ApellidoAPAF,ApellidoAMAF,GeneroAF,Parentesco,Padecimiento,DATE_FORMAT(FechaNAF,"%d de %M de %Y") as FechaNAF ,NSS from antecedentesf where IDAF=?',[IDAF]);
    res.render('links/EditarAF', { links:enlace[0], ABC: enlace4[0]});
})
router.post('/EditarAF/:IDAF/:NSS', async (req,res)=>{ //nueva informacion 
    const {IDAF} = req.params;
    const {NSS,NombreAF, ApellidoAPAF,ApellidoAMAF,GeneroAF,Parentesco ,Padecimiento} = req.body;
    const newLink = {
        NSS,
        NombreAF,
        ApellidoAPAF,
        ApellidoAMAF,
        GeneroAF,
        Parentesco,
        Padecimiento
    }; 
    console.log(newLink);
    pool.query('update INTO AntecedentesF set ? WHERE = ?', [newLink,IDAF]);//petición asincrona y query para insertar usuario
    await pool.query('SET lc_time_names = "es_ES"');
    const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
      
        
    await pool.query('SET lc_time_names = "es_ES"');
     const enlace2 = await pool.query('SELECT  NSS,IDAF,NombreAF,ApellidoAPAF,GeneroAF,Parentesco,Padecimiento,ApellidoAMAF,DATE_FORMAT(FechaNAF,"%d de %M de %Y") as FechaNAF from AntecedentesF WHERE NSS = ?',[NSS]);
     const enlace3 = await pool.query('SELECT *FROM citas WHERE NSS = ?',[NSS]);
     const enlace4 = await pool.query('Select * from diagnostico where NSS=? order by fechad desc limit 1 ',[NSS]);
     console.log(enlace2);
    console.log(enlace);
    console.log(enlace3);
    req.flash('success', 'Operación correcta');
    res.render('links/verPerfilP', {links: enlace[0],link: enlace2,linkss: enlace3,ABC: enlace4});
});

router.get('/deleteAF/:IDAF/:NSS', async (req,res)  => {
    const {IDAF} = req.params;
    const {NSS} = req.params; 
    await pool.query('DELETE from AntecedentesF WHERE IDAF = ?', [IDAF]);
    await pool.query('SET lc_time_names = "es_ES"');
    const enlace = await pool.query('SELECT paciente.NSS,NombrePaciente,NumeroInter,idDomicilio,NumeroExt,Ciudad,Estado,ApellidoPaternoPaciente,ApellidoMaternoPaciente,SexoPaciente,DATE_FORMAT(FechaNacimientoPaciente,"%d de %M de %Y") as FechaNacimientoPaciente ,timestampdiff(year,FechaNacimientoPaciente,now()) as edad,CorreoElectronicoPaciente,Calle,Colonia,Municipio from paciente inner join domicilio on paciente.NSS= domicilio.NSS where paciente.NSS = ?',[NSS]);
      
        
    await pool.query('SET lc_time_names = "es_ES"');
     const enlace2 = await pool.query('SELECT  NSS,IDAF,NombreAF,ApellidoAPAF,GeneroAF,Parentesco,Padecimiento,ApellidoAMAF,DATE_FORMAT(FechaNAF,"%d de %M de %Y") as FechaNAF from AntecedentesF WHERE NSS = ?',[NSS]);
     const enlace3 = await pool.query('SELECT *FROM citas WHERE NSS = ?',[NSS]);
     const enlace4 = await pool.query('Select * from diagnostico where NSS=? order by fechad desc limit 1 ',[NSS]);
    console.log(enlace2);
    console.log(enlace);
    console.log(enlace3);
    res.render('links/verPerfilP', {links: enlace[0],link: enlace2,linkss: enlace3,ABC: enlace4[0]});
    
});


router.get('/info', async (req,res)=>{
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta = await pool.query('SELECT idPrevencion,titulo, info, DATE_FORMAT(fecha, "%W, %d de %M de %Y") as fecha, fuente FROM prevencion order by idPrevencion desc');
    res.render('links/info',{consulta: consulta});
});

router.post('/info', async (req,res)=>{
    const fechad = await pool.query('select CURDATE() as fechas');
    const fecha = fechad[0].fechas;
    console.log(fecha);
    const {idPrevencion, titulo, info, fuente} = req.body;
    const nPre = {
        idPrevencion,
        titulo,
        info,
        fecha,
        fuente
    };
    await pool.query('INSERT INTO prevencion set ?',[nPre]);
    res.redirect('/links/info');
});


router.get('/respaldo', (req,res)=>{
    res.render('links/respaldo');
})


router.post('/respaldo', (req,res)=>{
    mysqldump({
        connection: {
            host: 'bzmqnxw59r5edldea2vr',
            user: 'udbo5xxv9wlwqyge',
            password: 'CkPxb1L4vY4b1H2QpRyQ',
            database: 'bzmqnxw59r5edldea2vr',
        },
        dumpToFile: './respaldo.sql',
    });
    req.flash('success','Respaldo realizado, verifica la carpeta base');
    res.redirect('/links/respaldo');
});

router.post('/importar', async (req,res)=>{
    const mydb_importer = mysql_import.config({
        host: 'bzmqnxw59r5edldea2vr',
        user: 'udbo5xxv9wlwqyge',
        password: 'CkPxb1L4vY4b1H2QpRyQ',
        database: 'bzmqnxw59r5edldea2vr_restaurar',
        onerror: err=>console.log(err.message)
    });
    await mydb_importer.import('respaldo.sql');
    req.flash('success','Base de datos cargada');
    res.redirect('/links/respaldo');
});

router.get('/EditR/:idPrevencion',async (req,res)=>{
    const {idPrevencion} = req.params;
    await pool.query('SET lc_time_names = "es_ES"');
    const consulta = await pool.query('SELECT idPrevencion,titulo, info, DATE_FORMAT(fecha, "%W, %d de %M de %Y") as fecha, fuente FROM prevencion  where idPrevencion = ?',[idPrevencion]);
    console.log(consulta)
    res.render('links/EditR',{consulta: consulta[0]});
})
router.post('/editPrev', async (req,res)=>{
    const {idPrevencion, titulo, info, fuente} = req.body;
    const UPrev = {
        titulo,
        info,
        fuente
    };
    await pool.query('UPDATE prevencion set ? where idPrevencion = ?',[UPrev, idPrevencion]);
    req.flash('success','Modificación correcta');
    res.redirect('/links/info');
});


router.post('/deletePrev', async (req,res)=>{
    const {idPrevencion} = req.body;
    await pool.query('DELETE from prevencion where idPrevencion = ?',[idPrevencion]);
    req.flash('success','Eliminación  correcta');
    res.redirect("/links/info");
});
module.exports = router;