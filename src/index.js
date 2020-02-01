const express = require('express');
const morgan = require ('morgan');
const exphbs = require ('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require("express-mysql-session");
const { database } = require('./keys');
const passport = require('passport');
var helpers = require('handlebars-helpers')();
// Initialization Inicializa la conexion a la base de datos
const app= express();
require('./lib/passport');


// setting configuraciones del servidor
app.set('port',process.env.port || 4000);
app.set('views', path.join(__dirname, 'views'));//ayuda a node a saber donde esta la carpeta views

app.engine('.hbs', exphbs({ //da un objeto como el nombre de la plantilla y las direcciones de las vistas, las funciones, etc.
    defaultLayout: 'main', //nombre de la plantilla principal
    layoutsDir: path.join(app.get('views'), 'layouts'),//para que la app sepa donde esta el layout 
    partialsDir: path.join(app.get('views'), 'partials'),//para que la app sepa donde esta el codigo reutilizable
    extname: '.hbs', //es para decirle la extension de los archivos handlebars
    helpers: require('./lib/handlebars')//ejecutar funciones de handlebars 
}));
app.set('view engine', '.hbs');

// Middlewares (Morgan - peticiones usuarios)
app.use(session({
    secret: "holi",
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));//sirve para aceptar la info de los formularios con informacion sencilla
app.use(express.json());//para enviar y recibir jsons.
app.use(passport.initialize());
app.use(passport.session());



//Global variables para almacenar nombre de app para acceder desde cualquier archivo
app.use((req, res, next) =>{// toma info del usuario, resp del servidor y codigo
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
})



// Routes URLS del servidor
app.use(require('./routes/'));//acceder al index de routes
app.use(require('./routes/authentication'));
app.use('/links',require('./routes/links'));
app.use('/medicos',require('./routes/medicos'));
app.use('/pacientes',require('./routes/pacientes'));
app.use('/reportes',require('./routes/reportes'));


// Archivos publicos (Codigo Navegador puede acceder)
app.use(express.static(path.join(__dirname, 'public')));


//Starting the server
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'))
});
