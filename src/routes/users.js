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
let User;
let fs = require('fs');
let Status;
let Monitor;
if(config.mongo != null){
    User = require('./../models/mongoose/users');
    Monitor = require('./../models/mongoose/monitor');
}
/**
 * Check if user is connected if connected return next else return login
 **/
function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
        req.flash('error_msg','You are not logged in');
        res.redirect('/auth');
    }
}
/**
 * Check if user is auth and is administrator
 * @param req
 * @param res
 * @param next
 */
function isadmin(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.rank.toLowerCase() === "admin"){
            return next();
        }else{
            req.flash('error_msg',`You don't have here because this a restriced area`);
            return res.redirect('/profile');
        }
    } else {
        req.flash('error_msg','You are not logged in');
        return res.redirect('/auth');
    }
}
//profil of user
router.get('/profile', ensureAuthenticated, function (req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    res.render('profil', {
        titlepage: `Profil of ${req.user.username}`,
        message: req.flash(),
        nameconfig: info.websitename,
        infoconf: info
    });
});
//change info of current user
router.post('/profile', ensureAuthenticated, function (req, res) {
    //update profil of user
    User.getUserById(req.user._id, function (err, user) {
        if(user){
            //user.username = req.body.username;
            //user.email = req.body.email;

            User.getUserByUsername(req.body.username, (err, usr) => {
                if(err){
                    req.flash('error', 'Error db');
                    return res.redirect('/profile');
                }
                if(!usr || usr.username === user.username) {
                    //check if email already exists
                    User.getUserByEmail(req.body.email, (err, useremail) => {
                        if (err) {
                            req.flash('error', 'Error db');
                            return res.redirect('/profile');
                        }
                        if(!useremail || useremail.email === user.email){
                            useremail.username = req.body.username;
                            useremail.email = req.body.email;
                            User.UpdateUser(useremail, req.body, function (err, user) {
                                if(err){
                                    req.flash('error', 'An error has occurred');
                                    return res.redirect('/profile');
                                }else{
                                    req.flash('success_msg', 'Your profile have been updated');
                                    return res.redirect('/profile');
                                }
                            });
                        }else{
                            req.flash('error', 'Email already exists');
                            return res.redirect('/profile');
                        }
                    });
                }else{
                    req.flash('error', 'Username already exists');
                    return res.redirect('/profile');
                }
            });
        }else{
            req.flash('error_msg','User not found');
            return res.redirect('/auth')
        }
    });
});
//list of all users in the website
router.get('/users', isadmin, function (req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    User.findAll((err, users) => {
        if(err){
            //redirect admin in
            req.flash('error', 'No User found');
            return res.redirect("/dashboard");
        }else{
            return res.render('users',{
                titlepage: "User Management",
                message: req.flash(),
                nameconfig: info.websitename,
                users: users,
                infoconf: info
            });
        }
    });
});
/**
 * Create new user (form only)
 **/
router.get('/adduser', isadmin, function (req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    return res.render('adduser',{
        titlepage: "User Add",
        message: req.flash(),
        nameconfig: info.websitename,
        userinfo: null,
        infoconf: info
    })
});
/**
 * Edit current user with ID in the param
 **/
router.get('/edit/:id', isadmin, function (req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    User.getUserById(req.params.id, function (err, user) {
        if(err){
            req.flash('error', 'Error DB');
            return res.redirect('/dashboard');
        }
        if(!user){
            req.flash('error', 'User not found');
            return res.redirect('/dashboard');
        }else{
            return res.render('adduser', {
                titlepage: `Edit Profil of ${user.username}`,
                message: req.flash(),
                nameconfig: info.websitename,
                userinfo : user,
                infoconf: info
            });
        }
    });
});
/**
 * Update user profil
 **/
router.post('/edit/:id', isadmin, function (req, res) {
    //check if user exist
    User.getUserById(req.params.id, function (err, user) {
        if(err){
            req.flash('error', 'Error DB');
            return res.redirect('/dashboard');
        }
        if(!user){
            req.flash('error', 'User not found');
            return res.redirect('/dashboard');
        }else{
            //check if email and username already exists
            User.getUserByUsername(req.body.username, (err, usr) => {
                if(err){
                    req.flash('error', 'Error db');
                    return res.redirect('/dashboard');
                }
                if(!usr || usr.username === user.username) {
                    //check if email already exists
                    User.getUserByEmail(req.body.email, (err, useremail) => {
                        if (err) {
                            req.flash('error', 'Error db');
                            return res.redirect('/adduser');
                        }
                        if(!useremail || useremail.email === user.email){
                            useremail.username = req.body.username;
                            useremail.email = req.body.email;
                            useremail.rank = req.body.level;
                            User.UpdateUser(useremail, req.body, function (err, user) {
                                if(err){
                                    req.flash('error', 'An error has occurred');
                                    return res.redirect('/users');
                                }else{
                                    req.flash('success_msg', 'The account have been updated');
                                    return res.redirect('/users');
                                }
                            });
                        }else{
                            req.flash('error', 'Email already exists');
                            return res.redirect('/users');
                        }
                    });
                }else{
                    req.flash('error', 'Username already exists');
                    return res.redirect('/users');
                }
            });
        }
    });
});
router.post('/adduser', isadmin, function (req, res) {
    //check if all params is here
    if(req.body.password != null && req.body.username != null && req.body.level !=null && req.body.email != null){
        //check if email and username already exists
        User.getUserByUsername(req.body.username, (err, user) =>{
            if(err){
                req.flash('error', 'Error db');
                return res.redirect('/adduser');
            }
            if(!user){
                //check if email already exists
                User.getUserByEmail(req.body.email, (err, user) => {
                    if(err){
                        req.flash('error', 'Error db');
                        return res.redirect('/adduser');
                    }
                    if(!user){
                        let newUser = new User({
                            username: req.body.username,
                            email: req.body.email,
                            password: req.body.password,
                            rank: req.body.level
                        });
                        //create new user
                        User.createUser(newUser, function (err, user) {
                            if(err){
                                req.flash('error', 'An error has occurred');
                                return res.redirect('/adduser');
                            }else{
                                req.flash('success_msg', 'The account have been created');
                                return res.redirect('/adduser');
                            }
                        });
                    }else{
                        req.flash('error', 'Email already exists');
                        return res.redirect('/adduser');
                    }
                });
            }else{
                req.flash('error', 'Username already exists');
                return res.redirect('/adduser');
            }
        });
    }else{
        req.flash('error', 'Missing params');
        return res.redirect('/adduser');
    }
});
module.exports = router;