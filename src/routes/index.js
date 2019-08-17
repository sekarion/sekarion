/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
let express = require('express');
let router = express.Router();
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let config = require('../config/config');
let User;
let Monitor;
let Status;
let fs = require('fs');
let Incident;
/**
 * Delete days for create auto calendar
 **/
function delDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}
/**
 * ADD days for create auto calendar
 **/
function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
async function UpdateInfo() {
    let UpdateStatus = require('./../utils/UpdateStatus');
    Monitor.findAll(async (err, monit) => {
        if(err){
            return false;
        }
        for (let i=0; i < monit.length; i++){
            let StatusCreate = new UpdateStatus();
            let info = await StatusCreate.update(monit[i]._id, monit[i].ip, monit[i].warning_threshold+1, monit[i].type, monit[i].port);
            let newStatus = new Status({
                latency: info.time,
                status: info.status === true ? "online": "offline",
                error: info.error ? info.error : null,
                monitorid: monit[i]._id,
                datecheck: new Date().getTime()
            });
            Status.createStatus(newStatus, function (err, stats) {
                if(err){
                    console.log(err);
                }else{
                    monit[i].laststatus = stats;
                    monit[i].save();
                }
            });
        }
    });
}
//check every 5 min status of website/service/ping
setInterval(UpdateInfo, 300000);//300000
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
if(config.mongo != null){
    User = require('./../models/users');
    Monitor = require('./../models/monitor');
    Status = require('./../models/status');
    Incident = require('./../models/incidents');
    passport.use(new LocalStrategy(
        function(username, password, done) {
            User.getUserByUsername(username, function(err, user) {
                if (err) throw err;
                if (!user) {
                    return done(null, false, {
                        message: 'Unknown User'
                    });
                }
                User.comparePassword(password, user.password, function(err, isMatch) {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, {
                            message: 'Invalid password'
                        });
                    }
                });
            });
        }));
    /*
     *
     */
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    /*
     *
     */
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}
router.get('/auth', function(req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    res.render('auth', {
        titlepage: "Authentification",
        message: req.flash(),
        nameconfig: config.websitename,
        infoconf: info
    })
});
router.post('/auth', passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/auth',
        failureFlash: true,
    })
);

/**
 * Main route
 **/
router.get('/', async (req, res) =>{
    let infoconf =  JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    await Monitor.findPublic(async(err, monit) => {
        if(monit.length === 0){
            res.render('home', {
                titlepage: "Accueil",
                message: req.flash(),
                nameconfig: config.websitename,
                monitor: monit,
                infoconf : infoconf
            });
        }else{
            let monit2 = [];
            let today = [];
            //construct new object with data incidents and monitor if exists
            for (let i=0; i < monit.length; i++) {
                await monit2.push({monit: monit[i], incident: await getIncident(monit[i].id, 90)});
                await today.push({monit: monit[i], incident: await getIncident(monit[i].id, 1)});
                }
            console.log(today);
            res.render('home', {
                titlepage: "Accueil",
                message: req.flash(),
                nameconfig: config.websitename,
                monitor: monit2,
                todaystatus: today,
                infoconf: infoconf
            });
        }

    });
});
router.get('/settings', isadmin, async (req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    res.render('settings', {
       titlepage: "Settings",
       message: req.flash(),
       nameconfig: config.websitename,
       config : info,
       infoconf: info
    });
});
router.post('/settings', isadmin, async(req, res) =>{
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    info.websitename = req.body.websitename;
    info.baseurl = req.body.baseurl;
    info.headershow = req.body.publicheader === "on";
    info.footershow = req.body.publicfooter === "on";
    info.secretsession = req.body.secretsession;
    info.websiteport = req.body.websiteport;
    info.customstyle = req.body.customstyle === "on";
    info.customcss = req.body.customcss;
    // Write a string to another file and set the file mode to 0755
    try {
        fs.writeFileSync(__dirname + '/../config/config.json', JSON.stringify(info, null, 4), { mode: 0o755 });
    } catch(err) {
        console.error(err);
        req.flash('error_msg', err);
    }
    req.flash('success', "Settings have been updated");
    return res.redirect('/settings');
});
/*Dashboard route*/
router.get('/dashboard', ensureAuthenticated, async(req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    await Monitor.findAll((err, monit) =>{
        //console.log(monit);
        if(err){
            req.flash('error_msg', "Error BDD");
            return res.redirect('/');
        }
        res.render('dashboard', {
            titlepage: "Status",
            message: req.flash(),
            nameconfig: config.websitename,
            monitor: monit,
            infoconf: info
        });
    });
});
/**
 * Get Incident why ID Monitor
 * @param {number} id monitor
 * @param {Number} days of limit
 * @return Object
 **/
async function getIncident(id, days){
    //init date to 0h EUROPEEN
    return new Promise(async (resolve, reject) => {
        let dt = new Date(new Date().setHours(0, 0, 0, 0));
        let del;
        let ino = [];
        let ip = 0;
        for (let i = 0; i < days; i++) {
            //show only before 15 days
            let inc = [];
            if(i === 0){
                dt = delDays(dt, 0);
            }else{
                dt = delDays(dt, 1);
            }
            del = addDays(dt, 1);

            await Incident.getByMonitorID(id, (ers, inceden) => {
                if (ers) {
                    return reject([{"err": ers}]);
                }
                if (inceden.length === 0) {
                    inc = [];
                } else {
                    for (let is = 0; is < inceden.length; is++) {
                        //check if date include in time
                        if (del.getTime() >= Number(inceden[is].date) && dt.getTime() <= Number(inceden[is].date)) {
                            inc.push(inceden[is]);
                        }
                    }
                }
            });
            ino.push({date: dt, inc: inc});
            ip++;
        }
        if (ip === days) {
            return resolve(ino);
        }
    });
}


router.get('/monitor/:id', ensureAuthenticated, async(req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    await Monitor.getMonitorById(req.params.id, (err, monit) =>{
      if(err){
          req.flash('error_msg', "The monitor does not exist");
          return res.redirect('/dashboard');
      }
      if(!monit){
          req.flash('error_msg', "The monitor doesn't exist . ");
          return res.redirect('dashboard');
      }
      Status.getByMonitorID(req.params.id, async (er, status) =>{
          if(er){
              req.flash('error_msg', "The monitor does not exist");
              return res.redirect('/dashboard');
          }
          let totalinfo;
          let sts = [];
          let incidents = [];
          if(status.length === 0){
              totalinfo = 100;
          }else{
              let err = 0;
              let success = 0;
              for (let i= 0; i <status.length; i++){
                  if(status[i].status === "online"){
                     success = success+1;
                  }else{
                      err = err+1;
                  }
                  sts.push([status[i].datecheck, status[i].latency]);
              }
              totalinfo = err === 0 ? 100 : (success - err)/success === Number.NEGATIVE_INFINITY ?  0 : ((success - err)/success)*100;
          }
          incidents = await getIncident(req.params.id, 15);
          res.render('monitor',{
              titlepage: `Monitor ${monit.label ? monit.label : monit.ip}`,
              message: req.flash(),
              nameconfig: config.websitename,
              monitor: monit,
              totalpercent: totalinfo,
              infosStatus: sts,
              incedent: incidents,
              infoconf: info
          })
      });

   });
});
/**
 * Route for edit params monitor
 **/
router.get('/monitor/:id/edit', ensureAuthenticated, async(req, res)=> {
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    await Monitor.getMonitorById(req.params.id, (err, monit) => {
        if(err){
            req.flash('error_msg', "The monitor does not exist");
            return res.redirect('/dashboard');
        }
        return res.render('editmonitor', {
            titlepage: `Edit Monitor ${monit.label ? monit.label : monit.ip}`,
            message: req.flash(),
            nameconfig: config.websitename,
            monitor: monit,
            infoconf: info
        })
    });
});
/***
 * Save date for edit monitor
 **/
router.post('/monitor/:id/edit', ensureAuthenticated, async (req, res) =>{
    await Monitor.getMonitorById(req.params.id, (err, monit) => {
        if(err){
            req.flash('error_msg', "The monitor doesn't exist");
            return res.redirect('/dashboard');
        }
        if(req.body.label != null && req.body.domain != null && req.body.warning_threshold != null && req.body.privacymonitor != null){
            //type == website
            if(req.body.type.toLowerCase() === "service"){
                if(req.body.port != null){
                    //if port is custom
                    if(req.body.port.toLowerCase() === "custom"){
                        monit.label = req.body.label;
                        monit.ip = req.body.domain;
                        monit.type = req.body.type;
                        monit.port = req.body.customport;
                        monit.warning_threshold = req.body.warning_threshold;
                        monit.privacy = req.body.privacymonitor === "public";
                        Monitor.updateMonitor(monit, (err, monitor) =>{
                            if(err){
                                console.log(err);
                                req.flash('error', 'An error has occurred');
                                return res.redirect('/addmonitor');
                            }else{
                                return res.redirect(`/monitor/${monitor._id}`);
                            }
                        });
                    }else{
                        monit.label = req.body.label;
                        monit.ip = req.body.domain;
                        monit.type = req.body.type;
                        monit.port = req.body.port;
                        monit.warning_threshold = req.body.warning_threshold;
                        monit.privacy = req.body.privacymonitor === "public";
                        Monitor.updateMonitor(monit,(error, monitor) => {
                            if(error){
                                console.log(error);
                                req.flash('error', 'An error has occurred');
                                return res.redirect('/addmonitor');
                            }else{
                                return res.redirect(`/monitor/${monitor._id}`);
                            }
                        });
                    }
                }else{
                    req.flash('error_msg', "Missing Port !");
                    return res.redirect('/dashboard');
                }

            }else if(req.body.type.toLowerCase() === "ping"){
                monit.label = req.body.label;
                monit.ip = req.body.domain;
                monit.type = req.body.type;
                monit.warning_threshold = req.body.warning_threshold;
                monit.privacy = req.body.privacymonitor === "public";
                Monitor.updateMonitor(monit, (error, monitor) => {
                    if(error){
                        console.log(error);
                        req.flash('error', 'An error has occurred');
                        return res.redirect('/addmonitor');
                    }else{
                        return res.redirect(`/monitor/${monitor._id}`);
                    }
                });
            }
        }
    })
});

/**
 * Create Incident with monitor
 **/
router.get('/monitor/:id/addincident', ensureAuthenticated, async (req,res) =>{
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    await Monitor.getMonitorById(req.params.id, (err, monit) =>{
       if(err){
           req.flash('error_msg', "The monitor doesn't exist");
           return res.redirect('/dashboard');
       }
       return res.render('addincident', {
           titlepage: `Add Incident for ${monit.label ? monit.label : monit.ip}`,
           message: req.flash(),
           nameconfig: config.websitename,
           monitor: monit,
           infoconf: info
       });
   });
});

router.post('/monitor/:id/delete', ensureAuthenticated, async(req, res)=>{
    if(req.body.delete === "yes"){
        let number =0;
        await Monitor.getMonitorById(req.params.id, (err, monit)=>{
            if(err){
                req.flash('error_msg', "The monitor doesn't exist");
                return res.redirect('/dashboard');
            }
            //delete all incident with id current and delete current monitor
            Status.deleteStatus(monit.id, (err, message) => {
                if(err){
                    number = number +1 ;
                    req.flash('error_msg', err);
                }
            });
            Incident.deleteIncident(monit.id, (err, message) => {
                if(err){
                    number = number +1 ;
                    req.flash('error_msg', err);
                }
            });
            Monitor.getMonitorById(monit.id, (err, message)=>{
                //for to delete monitor
                message.remove();
            });
            if(number=== 0){
                req.flash('success', "The monitor has been successfully removed with its components link");
            }
            return res.redirect("/dashboard");
        });
    }else{
        req.flash('error_msg', "Can not delete monitor. Please retry later!");
        return res.redirect('/monitor/:id');
    }
});
/**
 * Save params in db
 **/
router.post('/monitor/:id/addincident', ensureAuthenticated, async (req, res) =>{
   await Monitor.getMonitorById(req.params.id, (err, monit) => {
       if(err){
           req.flash('error_msg', "The monitor doesn't exist");
           return res.redirect('/dashboard');
       }
       if(req.body.message != null && req.body.nameincident != null && req.body.status != null && req.body.affected != null) {
           let incident = new Incident({
               curentstatus: req.body.status,
               name: req.body.nameincident,
               monitorid: monit.id,
               date : new Date().getTime(),
               infosstatus: [{
                   createAt: new Date().getTime(),
                   status: req.body.status,
                   description: req.body.message
               }],
               affected: req.body.affected
           });
           Incident.createIncident(incident, (err, incident) => {
                if(err){
                    req.flash('error_msg', err);
                    return res.redirect(`/monitor/${req.params.id}/addincident`);
                }
                return res.redirect(`/monitor/${req.params.id}/incident/${incident.id}`);
           });
       }else{
           req.flash('error_msg', "Missing params");
           return res.redirect(`/monitor/${req.params.id}/addincident`);
       }
   });
});

/**
 * Update Status Impact
 **/
router.post('/monitor/:id/incident/:idincident/impact', ensureAuthenticated, async(req, res) =>{
    //check if id exist
    await Monitor.getMonitorById(req.params.id, async (err, monit) =>{
        if (err) {
            return res.json({"error": "monitor not found"});
        }
        //check if the incident exist if true define the impact
        await Incident.getStatusById(req.params.idincident, (error, status) => {
            switch (req.body.impact) {
                case "None":
                    status.impact = 0;
                    break;
                case "Minor":
                    status.impact = 1;
                    break;
                case "Major" :
                    status.impact = 2;
                    break;
                case "Critical":
                    status.impact = 3;
                    break;
            }
           Incident.createIncident(status, (err, incident) => {
               if(err){
                   return res.json({"error": err});
               }else{
                   //return css to views
                   let css;
                   //if impact is defined return json with css
                   switch (incident.impact) {
                       case 0:
                           css= {
                               "css": "BgNone", "Message":"The impact have been updated"
                           };
                           break;
                       case 1:
                           css= {
                               "css": "BgMinor", "Message":"The impact have been updated"
                           };
                           break;
                       case 2:
                           css= {
                               "css": "BgMajor", "Message":"The impact have been updated"
                           };
                           break;
                       case 3:
                           css= {
                               "css": "BgCritical", "Message":"The impact have been updated"
                           };
                           break;

                   }
                   return res.json({css});
               }
           });
        });
    })
});
/**
 * Show incident by monitor
 **/
router.get('/monitor/:id/incident/:idincident', ensureAuthenticated, async(req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    await Monitor.getMonitorById(req.params.id, async(err, monit) => {
        if (err) {
            req.flash('error_msg', "The monitor doesn't exist");
            return res.redirect('/dashboard');
        }
        await Incident.getStatusById(req.params.idincident, (error, status) =>{
            if (error) {
                req.flash('error_msg', "The Status doesn't exist");
                return res.redirect('/dashboard');
            }
            return res.render('incidentpage', {
                titlepage: `Incident for ${monit.label ? monit.label : monit.ip}`,
                message: req.flash(),
                nameconfig: config.websitename,
                monitor: monit,
                status: status,
                infoconf: info
            });
        })
    });
});

/**
 * update the status whith new status
 **/
router.post('/monitor/:id/incident/:idincident', ensureAuthenticated, async(req, res)=> {
    if(req.body.message != null && req.body.status != null && req.body.affected != null){
        await Monitor.getMonitorById(req.params.id, async(err, monit) => {
            if (err) {
                req.flash('error_msg', "The monitor doesn't exist");
                return res.redirect('/dashboard');
            }
            await Incident.getStatusById(req.params.idincident, (error, status) => {
                if (error) {
                    req.flash('error_msg', "The Status doesn't exist");
                    return res.redirect('/dashboard');
                }
                //reconfigure the status
                status.curentstatus = req.body.status;
                status.updateAt = new Date().getTime();
                status.infosstatus.push({
                    createAt : new Date().getTime(),
                    description: req.body.message,
                    status: req.body.status
                });
                status.affected = req.body.affected;
                Incident.createIncident(status, (err, incident) => {
                    if(err){
                        req.flash('error_msg', err);
                        return res.redirect(`/monitor/${req.params.id}/addincident`);
                    }else{
                        return res.redirect(`/monitor/${req.params.id}/incident/${incident.id}`);
                    }
                });
            });
        });
    }else{
        //if  missing params return error
        req.flash('error_msg', "Missing params");
        return res.redirect('/dashboard');
    }

});
/**
 * route for add monitor
 */
router.get('/addmonitor', isadmin, function (req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + '/../config/config.json', 'utf8'));
    res.render('addmonitor', {
       titlepage: "Monitor Add",
       message: req.flash(),
       nameconfig: config.websitename,
       infoconf: info
   })
});

/**
 * Route for add monitor why post data for create monitor
 **/
router.post('/addmonitor', isadmin, function (req, res) {
    if(req.body.label != null && req.body.domain != null && req.body.warning_threshold != null && req.body.privacymonitor != null){
        //Part of service
        if(req.body.type.toLowerCase() === "service"){
            if(req.body.port != null){
                //if port is custom
                if(req.body.port.toLowerCase() === "custom"){
                    //req.body.customport;
                    let newMonitor = new Monitor({
                        label: req.body.label,
                        ip: req.body.domain,
                        type: req.body.type,
                        port: req.body.customport,
                        warning_threshold: req.body.warning_threshold,
                        privacy: req.body.privacymonitor === "public"
                    });
                    Monitor.createMonitor(newMonitor, (error, monitor) => {
                        if(error){
                            console.log(error);
                            req.flash('error', 'An error has occurred');
                            return res.redirect('/addmonitor');
                        }else{
                            return res.redirect(`/monitor/${monitor._id}`);
                        }
                    });
                }else{
                    //create New object Monitor
                    let newMonitor = new Monitor({
                        label: req.body.label,
                        ip: req.body.domain,
                        type: req.body.type,
                        port: req.body.port,
                        warning_threshold: req.body.warning_threshold,
                        privacy: req.body.privacymonitor === "public"
                    });
                    //save the monitor and create
                    Monitor.createMonitor(newMonitor,(error, monitor) => {
                        if(error){
                            console.log(error);
                            req.flash('error', 'An error has occurred');
                            return res.redirect('/addmonitor');
                        }else{
                            return res.redirect(`/monitor/${monitor._id}`);
                        }
                    });
                }
            }else{
                req.flash('error', 'Missing Port');
                return res.redirect('/addmonitor');
            }

        }else if(req.body.type.toLowerCase() === "ping"){
            let newMonitor = new Monitor({
                label: req.body.label,
                ip: req.body.domain,
                type: req.body.type,
                warning_threshold: req.body.warning_threshold,
                privacy: req.body.privacymonitor === "public"
            });
            Monitor.createMonitor(newMonitor, (error, monitor) => {
                if(error){
                    console.log(error);
                    req.flash('error', 'An error has occurred');
                    return res.redirect('/addmonitor');
                }else{
                    return res.redirect(`/monitor/${monitor._id}`);
                }
            });
        }
    }
    // return res.redirect(`/status/`);
});
/**
 * Disconnect the user and redirect to main route with message disconnect
 **/
router.get('/logout', function(req, res){
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth');
});
module.exports = router;