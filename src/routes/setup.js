/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
let express = require('express');
let router = express.Router();
let config = require('../config/config');
let { spawn } = require('child_process');
let fs = require('fs');
//test for mongoose
router.get('/', function (req, res) {
    return res.redirect('/install/setup');
});
let http = "http://";
if(config.httpsenable){
    http = "https://";
}
router.get('/install/setup', function(req, res) {
    res.render('install/setup', {
        titlepage: "Installation de Sekarion",
        message: req.flash(),
        url: `${http}${req.headers.host}`,
        err: false,
        infoconf : null
    })
});
/*router.post('/install/setup', function (req, res) {

if(req.body.db_type === "rethink"){

    }else if(req.body.db_type === "mysql"){

    }else if(req.body.db_type === "enmap"){

    }else if(req.body.db_type === "sqlite"){

    }
});*/
//create the user
router.get('/setupuser', function(req, res){
  res.render("install/createuser",{
      titlepage: "Create User of Sekarion",
      message: req.flash(),
      err: false,
      messagecode: null,
      infoconf: null
  });
});
router.post('/setupuser', function(req, res){
    //use fs for update json automatic no need reboot
    let configforceupdate = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    if(configforceupdate.dbtype === "mongo") {
        let mongoose = require('mongoose');
        mongoose.Promise = global.Promise;
        let User = require('../models/users');
        let mongourl = "";
        if (configforceupdate.mongo.db_user && configforceupdate.mongo.db_user) {
            mongourl = `mongodb://${configforceupdate.mongo.db_user}:${configforceupdate.mongo.db_passwd}@${configforceupdate.mongo.db_host ? configforceupdate.mongo.db_host : '127.0.0.1'}/${configforceupdate.mongo.db_name ? configforceupdate.mongo.db_name : 'sekarion'}`
        }else if (configforceupdate.mongo.db_user) {
            mongourl  = `mongodb://${configforceupdate.mongo.db_user}@${configforceupdate.mongo.db_host ? configforceupdate.mongo.db_host : '127.0.0.1'}:${configforceupdate.mongo.db_port}/${configforceupdate.mongo.db_name}`;
        } else {
            mongourl = `mongodb://${configforceupdate.mongo.db_host ? configforceupdate.mongo.db_host : '127.0.0.1'}:${configforceupdate.mongo.db_port}/${configforceupdate.mongo.db_name}`
        }

        //init mongoose and connect
        mongoose.connect(mongourl, { useUnifiedTopology: true });
        let db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function callback () {
            console.log("h");
        });

        let newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.passwd,
            rank: "Admin"
        });
        User.createUser(newUser, function (err, user) {
            if(err){
                res.render("install/createuser",{
                    titlepage: "Create User of Sekarion",
                    message: req.flash(),
                    err: false,
                    messagecode: err
                });
            }else{
                res.render("install/createuser",{
                    titlepage: "Create User of Sekarion",
                    message: req.flash(),
                    err: false,
                    messagecode: "The user has been created please restart the site to login"
                });
            }
        });
    }else{
        return res.status(400).json({
            err: true,
            data: "No method for this use mongo for moment"
        })
    }
});
router.post('/testdb', function (req, res) {
    if(req.body.db_type === "mongo") {
        //install the package mongoose
        let mongoose = require('mongoose');
        if (req.body.db_user && req.body.db_passwd) {
            mongoose.createConnection(`mongodb://${req.body.db_user}:${req.body.db_passwd}@${req.body.db_host ? req.body.db_host : '127.0.0.1'}/${req.body.db_name ? req.body.db_name : 'sekarion'}`, {useNewUrlParser: true}, (err) => {
                if (err) {
                    return res.status(400).json({
                        data: req.body,
                        err: true,
                        errmess: err
                    });
                } else {
                    //copie the config
                    return res.json({
                        data: req.body,
                        err: false
                    });
                    /*return res.render('install/success',{
                        data: req.body,
                        message: req.flash(),
                        err: false
                    });*/
                }
            });
        } else if (req.body.db_user) {
            mongoose.createConnection(`mongodb://${req.body.db_user}@${req.body.db_host ? req.body.db_host : '127.0.0.1'}:${req.body.db_port}/${req.body.db_name}`, {useNewUrlParser: true}, (err) => {
                if (err) {
                    return  res.status(400).json({
                        data: req.body,
                        err: true,
                        errmess: err
                    });
                } else {
                    return res.json({
                        data: req.body,
                        err: false
                    });
                }
            });
        } else {
            mongoose.createConnection(`mongodb://${req.body.db_host ? req.body.db_host : '127.0.0.1'}:${req.body.db_port}/${req.body.db_name}`, {useNewUrlParser: true}, (err) => {
                if (err) {
                    //return data why  error message
                    return res.status(400).json({
                        data: req.body,
                        err: true,
                        errmess: err
                    });
                } else {
                    //copie the config
                    return res.json({
                        data: req.body,
                        err: false
                    });
                }
            });
        }
    }
});
/**
 * Test the connexion of website
 **/
router.post('/installlib', function (req, res) {
    try {
        if(req.body.db_type ==="mongo"){
            const os = require('os');
            //detect if windows or other
            let cmd;
            if (os.platform() === 'win32' || os.platform() === 'win64') {
                cmd = 'npm.cmd'
            } else {
                cmd = 'npm'
            }
            const ls =  spawn(cmd, ['i', 'mongoose', '-s']);
            //send the response
            ls.on('close', (code) => {
                if (code === 0) {
                    return res.json({
                        success: true,
                        dep: "mongoose",
                        message: "Install of dependencies (mongoose): Success"
                    });
                }else{
                    return  res.status(400).json({
                        success: false,
                        dep: "mongoose",
                        message: "Install of dependencies (mongoose): ERRROR"
                    });
                }
            });
        }
    }catch (e) {
        return res.json({
            success: false,
            message: e
        })
    }

});
module.exports = router;