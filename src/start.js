/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
let config;
//les logs
let log = require('./utils/logger');
try{
    config = require("./config/config.json");
    let express = require('express');
    let helmet = require('helmet');
    let compression = require('compression');
    let cookieParser = require('cookie-parser');
    let flash = require('connect-flash');
    let path = require('path');
    let IndexRouter = require('./routes/index');
    let passport = require('passport');
//let LocalStrategy = require('passport-local').Strategy;
    let port = config.websiteport || 3000;
//lance express
    let app = express();

    let servicelaunch = 0;
    log.draft("start", "[Sekarion] Lancement des services");
    function shouldCompress(req, res) {
        //ne renvoie pas d'headers si il n'y a pas de compression (pris en charge)
        if (req.headers['x-no-compression']) {
            return false
        }
        //sinon utilise la compression pour charger le site en plus rapide
        return compression.filter(req, res)
    }
//secu contre les failles
    app.use(helmet());
//bloque les attaques XSS

//fix la rapidité avec la compression
    app.use(compression({
        filter: shouldCompress
    }));
    app.enable('trust proxy');
//app.use(passport.initialize());
//app.use(passport.session());
// Setup de la vue de js
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(cookieParser());
//charge le dossier entier de public pour l'avoir n'importe où
    app.use(express.static(path.join(__dirname, 'public')));
//renvoie du json
    app.use(express.json());
//encore l'url pour un peux plus de sécu et permet de se co avec passport
    app.use(express.urlencoded({
        extended: true
    }));
    /*create session*/
    app.use(require('express-session')({
        secret: config.secretsession,
        resave: true,
        cookie: {
            httpOnly: true
        },
        saveUninitialized: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    /*init flash*/
    app.use(flash());
    /*define session and sitename*/
    app.use(function(req, res, next) {
        res.locals.sitename = config.websitename;
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.error = req.flash('error');
        res.locals.user = req.user || null;
        next();
    });
    /*Route Index*/
    if(config.websiteconfigured){
        app.use('/', IndexRouter);
        //users route
        let UserRouter = require('./routes/users');
        app.use('/', UserRouter);
    }else{
        let SetupRouter = require('./routes/setup');
        app.use('/', SetupRouter);
    }
    if(config.mongo != null){
        let mongoose = require('mongoose');
        log.draft("launchdb", "[Sekarion] Lancement de la base de données");
//init mongoose and connect
        let mongourl = "";
        if (config.mongo.db_user && config.mongo.db_user) {
            mongourl = `mongodb://${config.mongo.db_user}:${config.mongo.db_passwd}@${config.mongo.db_host ? config.mongo.db_host : '127.0.0.1'}/${config.mongo.db_name ? config.mongo.db_name : 'sekarion'}`

        }else if (config.mongo.db_user) {
            mongourl  = `mongodb://${config.mongo.db_user}@${config.mongo.db_host ? config.mongo.db_host : '127.0.0.1'}:${config.mongo.db_port}/${config.mongo.db_name}`;
        } else {
            mongourl = `mongodb://${config.mongo.db_host ? config.mongo.db_host : '127.0.0.1'}:${config.mongo.db_port}/${config.mongo.db_name}`
        }
        mongoose.connect(mongourl, {useNewUrlParser: true});
        let db = mongoose.connection;
        db.on('error', function  callback() {
            log.endDraft("launchdb", "[Sekarion] Lancement de la base de données : error", false)
        });
        db.once('open', function callback () {
            log.endDraft("launchdb", "[Sekarion] Lancement de la base de données : réussie");
            servicelaunch += 1;
            if(config.websiteconfigured != null) {
                if(config.websiteconfigured){
                    if (servicelaunch === 2) {
                        log.endDraft("start", `[Sekarion] Tous les services sont lancé`);
                    } else {
                        log.endDraft("start", `[Sekarion] 1/2 des services sont lancé `, false);
                    }
                }
            }
        });
    }
//si on a le https d'actif ou pas si oui on demande les clés (on les load sinon non)
    log.draft("launch", "[Sekarion] Lancement du serveur web");
    if(config.httpsenable){
        let https = require('https');
        let fs = require('fs');
        https.createServer(app).listen(port,function() {
            if(!config.websiteconfigured) {
                log.endDraft("launch", `[Sekarion] Serveur lancé sur le port ${port}`);
                log.endDraft("start", `[Sekarion] SETUP Pour continuer rendez vous sur https://127.0.0.1:${port}/install/setup`);
            }else{
                servicelaunch += 1;
                log.endDraft("launch", `[Sekarion] Serveur lancé sur le port ${port} : rendez vous sur http://127.0.0.1:${port}/auth`);
            }
        });
    }else{
        let http = require('http');
        http.createServer(app).listen(port,function() {
            if(!config.websiteconfigured) {
                log.endDraft("launch", `[Sekarion] Serveur lancé sur le port ${port}`);
                log.endDraft("start", `[Sekarion] SETUP Pour continuer rendez vous sur http://127.0.0.1:${port}/install/setup`);
            }else{
                servicelaunch += 1;
                log.endDraft("launch", `[Sekarion] Serveur lancé sur le port ${port} : rendez vous sur http://127.0.0.1:${port}/auth`);
            }
        });
    }
}catch (e) {
    console.log(e);
   log.draft("errconfig", "[Sekarion] wait");
   log.endDraft("errconfig", "[Sekarion] Missing config.json", false);
}