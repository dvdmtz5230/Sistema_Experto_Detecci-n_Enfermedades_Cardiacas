const express = require('express');
const router = express.Router();
const pool = require('../database'); //conexion bd
const puppeteer = require('puppeteer');
const hbs = require('handlebars');
const path = require('path');
const fs = require('fs-extra');

const compile = async function(templateName, link){
    const filePath = path.join(process.cwd(), 'src/views/reportes', `${templateName}.hbs`);
    const html = await fs.readFile(filePath,'utf-8');
    return hbs.compile(html)(link);
};

router.get('/GenRepo', async (req,res)=>{
    const link = await pool.query('SELECT NSS, NombrePaciente, ApellidoPaternoPaciente, ApellidoMaternoPaciente, SexoPaciente, timestampdiff(year,paciente.FechaNacimientoPaciente,now()) as edad from paciente Paciente');
    res.render('reportes/GenRepo', {links: link});
});

router.post('/GenRepo', async (req,res)=>{
    const {NSS} = req.body;
    const link = await pool.query('SELECT Paciente.NSS, NombrePaciente, ApellidoPaternoPaciente, ApellidoMaternoPaciente, SexoPaciente, timestampdiff(year,paciente.FechaNacimientoPaciente,now()) as edad, NombreC, ApellidoPC, ApellidoMC, Telefono from paciente inner join contacto on paciente.NSS = contacto.NSS WHERE paciente.NSS=?',[NSS]);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = await compile('SoloR',{link});

    await page.setContent(content);
    await page.emulateMedia('screen');
    await page.pdf({
        path: 'Solo.pdf',
        format: 'Letter',
        printBackground: true,
    });
    await browser.close();
    req.flash('success','Reporte descargado, verificar carpeta raiz');
    res.redirect('/reportes/GenRepo');
});


router.get('/reporta', async (req,res)=>{
    const link = await pool.query('SELECT * FROM paciente where SexoPaciente = "Masculino"');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = await compile('RGenero', {link});
    console.log(content)
    await page.setContent(content);
    await page.emulateMedia('screen');
    await page.pdf({
        path: 'mypdf.pdf',
        format: 'Letter',
        printBackground: true,
    });
    console.log('Done');
    await browser.close();
    req.flash('success','Reporte descargado, verificar carpeta raiz');
    res.redirect('/reportes/GenRepo');
});


router.get('/reportaF', async (req,res)=>{
    const link = await pool.query('SELECT * FROM paciente where SexoPaciente = "Femenino"');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = await compile('RGeneroF', {link});

    await page.setContent(content);
    await page.emulateMedia('screen');
    await page.pdf({
        path: 'mypdf.pdf',
        format: 'Letter',
        printBackground: true,
    });
    await browser.close();
    /*var tempFile="C:/Users/DELL/Desktop/ESTADIA/mypdf.pdf";
    fs.readFile(tempFile, function (err,data){
       res.contentType("application/pdf");
       res.send(data);
      
    });*/
    req.flash('success','Reporte descargado, verificar carpeta raiz');
    res.redirect('/reportes/GenRepo');
});


router.get('/reportaT', async (req,res)=>{
    const link = await pool.query('SELECT * FROM paciente');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = await compile('RGenero', {link});

    await page.setContent(content);
    await page.emulateMedia('screen');
    await page.pdf({
        path: 'mypdf.pdf',
        format: 'Letter',
        printBackground: true,
    });
    await browser.close();
    req.flash('success','Reporte descargado, verificar carpeta raiz');
    res.redirect('/reportes/GenRepo');
});

module.exports = router;