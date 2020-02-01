const express = require('express');
const router = express.Router();
const helpers = require("../lib/helpers");
const pool = require('../database'); //conexion bd

router.get('/perfil/:NSS', async (req,res)=>{
  const {NSS} = req.params;
  const citas = await pool.query('SELECT idCitas, DATE_FORMAT(fecha, "%d/%m/%Y") as fecha, Estado from citas where NSS = ?', [NSS]);
  await pool.query('SET lc_time_names = "es_ES"');
  const consulta = await pool.query('SELECT idPrevencion,titulo, info, DATE_FORMAT(fecha, "%W, %d de %M de %Y") as fecha, fuente FROM prevencion order by idPrevencion desc');
 
  res.render('pacientes/perfil', {cita: citas,consulta:consulta});
});



router.get('/Forum', async (req,res)=>{
  const consulta = await pool.query('SELECT forocomentario.Comentario, NombrePaciente, ApellidoPaternoPaciente, idForoComentario FROM forocomentario inner join paciente on paciente.NSS = forocomentario.NSS ORDER BY idForoComentario DESC');
  const consulta2 =await pool.query('SELECT idForoRespuesta as y, Respuesta, NombrePaciente as nom FROM fororespuesta inner join paciente on paciente.NSS = fororespuesta.NSS');
  res.render('pacientes/Forum',{links: consulta, cons: consulta2});
})

router.post('/Forum', async (req,res)=>{
  const {NSS, Comentario, idForoComentario} = req.body;
  const newC = {
    idForoComentario,
    Comentario,
    NSS
  };
  await pool.query('INSERT INTO ForoComentario set ?', [newC]);
  req.flash('success','Publicado');
  res.redirect('/pacientes/Forum');
})

router.post('/respuesta', async (req,res)=>{
  const {idForoComentario, NSS, Respuesta} = req.body;
  const idForoRespuesta = 0;
  const newR = {
    idForoRespuesta,
    Respuesta,
    NSS,
    idForoComentario
  };
  
  await pool.query('INSERT INTO ForoRespuesta set ?', [newR]);
  res.redirect('/pacientes/forum');
})

router.get('/contacto/:NSS',  (req,res)=>{
  const {NSS} = req.params; 
  res.render('pacientes/contacto',{NSS});
}); 

router.post('/contacto/', async (req,res)=>{
  const {IDC, NombreC, ApellidoPC, ApellidoMC, CorreoC,Telefono,Contra,NSS} = req.body;
  const newContacto = {
      IDC,
      NombreC,
      ApellidoPC,
      ApellidoMC,
      CorreoC,
      Telefono,
      Contra,
      NSS
  };
  newContacto.Contra = await helpers.encryptPassword(Contra); //encriptar contraseña
  await pool.query('INSERT INTO contacto set ?',[newContacto]);
  req.flash('Sucess','contacto Agregado');
  res.redirect('/profileP');
});

router.get('/verContacto/:NSS', async (req,res)=>{
  const {NSS} = req.params;
  const enlace = await pool.query('SELECT * FROM contacto WHERE NSS=? ',[NSS]);
  res.render('pacientes/verContacto', {links: enlace[0]});
});

router.post('/editC/:IDC', async (req,res)=>{ //nueva informacion 
  const { IDC } = req.params;
  const {NombreC, ApellidoPC, ApellidoMC, CorreoC,Telefono} = req.body;
  const newLink = {
      NombreC,
      ApellidoPC,
      ApellidoMC,
      CorreoC,
      Telefono,
  };
  await pool.query('UPDATE contacto set ? WHERE IDC = ?', [newLink, IDC]);
  req.flash('success', 'Modificación correcta');
  res.redirect('/profileP');
});

router.get('/deleteC/:IDC', async (req,res)=>{
  const {IDC} = req.params;
  await pool.query('DELETE from contacto where IDC = ?',[IDC]);
  res.redirect("/profileP");
});




var natural = require('natural');
var classifier = new natural.BayesClassifier();

router.get('/pruebaBayes', async (req,res)=>{

//Using External dataset
 const data = require('./data.json');

data.forEach(item=>{
classifier.addDocument([item.Sintoma1,item.Sintoma2,item.Sintoma3,item.Sintoma4,item.Sintoma5,item.Sintoma6,item.Sintoma7,item.Sintoma8,item.Sintoma9],item.Enfermedad);
})

// Train
classifier.train();
const A="Mareos";
const B="sudoracion";
const C="desmayos";
const D="";
const E="";
const F=";"
// Apply/Predict
const resultado = classifier.classify([A,B,C,D,E,F]);

console.log(resultado);
// Persisting /Save
classifier.save('./ClasificadorBayes.json',function(err,classifier){});


// Using Your Saved Classifier
//var natural = require('natural');

 
   
  res.render('profile' );
})
  module.exports = router;

