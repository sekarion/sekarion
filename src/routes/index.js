/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2020 Joris Dugué
 **/
let express = require("express");
let router = express.Router();
let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let config = require("../config/config");
let User,Monitor,Status,Incident;
let fs = require("fs");
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
    let UpdateStatus = require("./../utils/UpdateStatus");
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
                    console.log(err);// eslint-disable-line no-console
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
        req.flash("error_msg", res.__("NotLogin"));
        res.redirect("/auth");
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
            req.flash("error_msg", res.__("RestrictArea"));
            return res.redirect("/profile");
        }
    } else {
        req.flash("error_msg", res.__("NotLogin"));
        return res.redirect("/auth");
    }
}
if(config.mongo != null){
    User = require("./../models/mongoose/users");
    Monitor = require("./../models/mongoose/monitor");
    Status = require("./../models/mongoose/status");
    Incident = require("./../models/mongoose/incidents");
    passport.use(new LocalStrategy(
        function(username, password, done) {
            User.getUserByUsername(username, function(err, user) {
                if (err) throw err;
                if (!user) {
                    return done(null, false, {
                        message: "Unknown User"
                    });
                }
                User.comparePassword(password, user.password, function(err, isMatch) {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, {
                            message: "Invalid password"
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
router.get("/auth", function(req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    res.render("auth", {
        locale: req.locale,
        titlepage: res.__("Authentication"),
        message: req.flash(),
        nameconfig: info.websitename,
        infoconf: info
    });
});
router.post("/auth", passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/auth",
        failureFlash: true,
    })
);
router.get("/lang/:lang", function (req, res) {
    res.cookie("langcookie", req.params.lang, { maxAge: 900000, httpOnly: true });
    res.setLocale(req, req.params.lang);
    res.redirect("back");
});
/**
 * Main route
 **/
router.get("/", async (req, res) => {
    let infoconf =  JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    await Monitor.findPublic(async(err, monit) => {
        if(monit.length === 0){
            res.render("home", {
                locale: req.locale,
                titlepage: res.__("Welcome"),
                message: req.flash(),
                nameconfig: infoconf.websitename,
                monitor: monit,
                infoconf: infoconf
            });
        }else{
            let monit2 = [];
            let today = [];
            let infosincidentspastday = [];
            //construct new object with data incidents and monitor if exists
            for (let i=0; i < monit.length; i++) {
                let sts = [];
                await Status.getByMonitorID(monit[i].id, async (er, status) => {
                    if (er) {
                        req.flash("error_msg", res.__("MonitorNotExist"));
                        return res.redirect("/dashboard");
                    }
                    for (let i = 0; i < status.length; i++) {
                        await sts.push([status[i].datecheck, status[i].latency]);
                    }
                });
                    await monit2.push({monit: monit[i], incident: await getIncident(monit[i].id, 90)});
                    await today.push({monit: monit[i], incident: await getIncident(monit[i].id, 1)});
                    //show monitor with infos for monitor ,incident and status ping etc....
                    await infosincidentspastday.push({monit: monit[i], incident: await getIncident(monit[i].id, 15), statusmonitor: sts});
            }
            return res.render("home", {
                locale: req.locale,
                titlepage: res.__("Welcome"),
                message: req.flash(),
                nameconfig: infoconf.websitename,
                monitor: monit2,
                todaystatus: today,
                infoconf: infoconf,
                infosincidentspastday: infosincidentspastday
            });
        }
    });
});
router.get("/settings", isadmin, async (req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    res.render("settings", {
        locale: req.locale,
        titlepage: res.__("Settings"),
       message: req.flash(),
       nameconfig: info.websitename,
       config : info,
       infoconf: info
    });
});
//get stats by days
router.get("/days/:id", async(req, res) =>{
    Monitor.getMonitorById(req.params.id, async (er, status) => {
        if(er || !status){
            return res.json({
               "err": true,
               "message" : res.__("NoFound"),
               "metric": []
            });
        }else{
            let infos= [];
            let nb =0,last =0;
            //get by days
            await Status.getByMonitorIDByDays(req.params.id, (err, monit) =>{
                if(monit.length > 0) {
                    for (let isn = 0; isn < monit.length; isn++) {
                        infos.push([monit[isn].datecheck, parseFloat(monit[isn].latency)]);
                        nb += parseInt(monit[isn].latency, 10);
                        last = monit[isn].latency;
                    }
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time": new Date(new Date().setDate(new Date().getDate()-1)).getTime()
                    });
                }else{
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time": new Date(new Date().setDate(new Date().getDate()-1)).getTime()
                    });
                }
            });
        }
    });
});
router.get("/hours/:id", async(req, res) => {
    Monitor.getMonitorById(req.params.id, async (er, status) => {
        if(er || !status){
            return res.json({
                "err": true,
                "message" : res.__("NoFound"),
                "metric": []
            });
        }else{
            let infos= [];
            let nb =0,last =0;
            //convert datetime to date (timestamp and UTC )
            let datetime = parseInt((new Date()).getTime() / 300000, 10) * 300000;
            //delete 1 hours without function
            datetime = datetime- 3600000;
            //get by days
            await Status.getByMonitorIDByHours(req.params.id, (err, monit) =>{
                //get date now
                if(monit.length > 0) {
                    for (let isn = 0; isn < monit.length; isn++) {
                        infos.push([monit[isn].datecheck, parseFloat(monit[isn].latency)]);
                        nb += parseInt(monit[isn].latency, 10);
                        last = monit[isn].latency;
                    }
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time" : datetime
                    });
                }else{
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time" : datetime
                    });
                }
            });
        }
    });
});
router.get("/weeks/:id", async (req, res)=> {
    Monitor.getMonitorById(req.params.id, async (er, status) => {
        if(er || !status){
            return res.json({
                "err": true,
                "message" : res.__("NoFound"),
                "metric": []
            });
        }else{
            let infos= [];
            let nb =0,last =0;
            //get by days
            await Status.getByMonitorIDByWeeks(req.params.id, (err, monit) =>{
                let infodate = null;
                //get date now
                if(monit.length > 0) {
                    if (monit.length > 0) {
                        infodate = monit[0].datecheck + (1800 * 60 * 60);
                    }
                    for (let isn = 0; isn < monit.length; isn++) {
                        if (isn === 0) {
                            infos.push([monit[isn].datecheck, parseFloat(monit[isn].latency)]);
                            nb += parseInt(monit[isn].latency, 10);
                            last = monit[isn].latency;
                        } else {
                            if (infodate - monit[isn].datecheck < 0) {
                                infos.push([monit[isn].datecheck, parseFloat(monit[isn].latency)]);
                                nb += parseInt(monit[isn].latency, 10);
                                last = monit[isn].latency;
                                infodate = monit[isn].datecheck + (1800 * 60 * 60);
                            }
                        }
                    }
                    //need here for send sure data because if not here (1/3 script return null unknow)
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time": new Date(new Date().setDate(new Date().getDate()-7)).getTime()
                    });
                }else{
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time": new Date(new Date().setDate(new Date().getDate()-7)).getTime()
                    });
                }
            });

        }
    });
});
//get information for metric
router.get("/months/:id", async(req, res) => {
    await Monitor.getMonitorById(req.params.id, async (er, status) => {
        if(er || !status){
            return res.json({
                "err": true,
                "message" : res.__("NoFound"),
                "metric": []
            });
        }else{
            let infos= [];
            let nb =0,last =0;
            //get by month
            await Status.getByMonitorIDByMonths(req.params.id, (err, monit) =>{
                let infodate = null;
                if(monit.length > 0){
                    if(monit[0].datecheck){
                        infodate = monit[0].datecheck+ 7200* 60*60;
                    }
                    for (let isn=0; isn < monit.length; isn++){
                        if(isn === 0){
                            infos.push([monit[0].datecheck, parseFloat(monit[isn].latency)]);
                            nb += parseInt(monit[isn].latency, 10);
                            last = monit[isn].latency;
                        }else{
                            if(monit[isn].datecheck - infodate < 0){
                                infos.push([monit[isn].datecheck, parseFloat(monit[isn].latency)]);
                                nb += parseInt(monit[isn].latency, 10);
                                last = monit[isn].latency;
                                infodate = monit[isn].datecheck+ 7200* 60*60;
                            }
                        }
                    }
                    //return response after for each and query if no monitor return null
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time" : new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime()
                    });
                }else{
                    return res.json({
                        "err" : false,
                        "metric": {
                            "data": infos
                        },
                        "count": infos.length,
                        "summary":{
                            "average": nb > 0 ? nb/infos.length: 0,
                            "sum": nb,
                            "last": last
                        },
                        "time" : new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime()
                    });
                }
            });
        }
    });
});
router.post("/settings", isadmin, async(req, res) =>{
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    info.websitename = req.body.websitename;
    info.baseurl = req.body.baseurl;
    info.headershow = req.body.publicheader === "on";
    info.footershow = req.body.publicfooter === "on";
    info.secretsession = req.body.secretsession;
    info.websiteport = req.body.websiteport;
    info.customstyle = req.body.customstyle === "on";
    info.customcss = req.body.customcss;
    info.showlogin = req.body.showlogin === "on";
    info.checkinterval = req.body.checkinterval;
    // Write a string to another file and set the file mode to 0755
    try {
        fs.writeFileSync(__dirname + "/../config/config.json", JSON.stringify(info, null, 4), { mode: 0o755 });
    } catch(err) {
        console.error(err);
        req.flash("error_msg", err);
    }
    req.flash("success", res.__("SettingsUpdated"));
    return res.redirect("/settings");
});
/*Dashboard route*/
router.get("/dashboard", ensureAuthenticated, async(req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    await Monitor.findAll((err, monit) =>{
        if(err){
            req.flash("error_msg", res.__("ErrorDB"));
            return res.redirect("/");
        }
        res.render("dashboard", {
            locale: req.locale,
            titlepage: res.__("Status"),
            message: req.flash(),
            nameconfig: info.websitename,
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
    /* eslint-disable*/
    return new Promise(async (resolve, reject) => {
        /* eslint-enable*/
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
/*async function getDaysPing(id, days){
    return new Promise(async (resolve, reject) =>{
        let dt = new Date(new Date().setHours(0, 0, 0, 0));
        let del;
        let ino = [];
        let ip = 0;
        for (let i = 0; i < days; i++) {
            let inc =[];
            if(i===0){
                dt = delDays(dt, 0);
            }else{
                dt = delDays(dt, 1);
            }
            del = addDays(dt, 1);

            ino.push({date: dt, inc: inc});
            ip++;

        }
        if (ip === days) {
            return resolve(ino);
        }
    });
}*/

router.get("/monitor/:id", ensureAuthenticated, async(req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    await Monitor.getMonitorById(req.params.id, (err, monit) =>{
      if(err){
          req.flash("error_msg", res.__("MonitorNotExist"));
          return res.redirect("/dashboard");
      }
      if(!monit){
          req.flash("error_msg", res.__("MonitorNotExist"));
          return res.redirect("dashboard");
      }
      Status.getByMonitorID(req.params.id, async (er, status) =>{
          if(er){
              req.flash("error_msg", res.__("MonitorNotExist"));
              return res.redirect("/dashboard");
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
          res.render("monitor",{
              locale: req.locale,
              titlepage: res.__("Monitor", {name:`${monit.label ? monit.label : monit.ip}`}),
              message: req.flash(),
              nameconfig: info.websitename,
              monitor: monit,
              totalpercent: totalinfo,
              infosStatus: sts,
              incedent: incidents,
              infoconf: info
          });
      });

   });
});
/**
 * Route for edit params monitor
 **/
router.get("/monitor/:id/edit", ensureAuthenticated, async(req, res)=> {
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    await Monitor.getMonitorById(req.params.id, (err, monit) => {
        if(err){
            req.flash("error_msg", res.__("MonitorNotExist"));
            return res.redirect("/dashboard");
        }
        return res.render("editmonitor", {
            locale: req.locale,
            titlepage: res.__("EditMonitor", {name: `${monit.label ? monit.label : monit.ip}`}),
            message: req.flash(),
            nameconfig: info.websitename,
            monitor: monit,
            infoconf: info
        });
    });
});
/***
 * Save date for edit monitor
 **/
router.post("/monitor/:id/edit", ensureAuthenticated, async (req, res) =>{
    await Monitor.getMonitorById(req.params.id, (err, monit) => {
        if(err){
            req.flash("error_msg", res.__("MonitorNotExist"));
            return res.redirect("/dashboard");
        }
        if(req.body.label != null && req.body.domain != null && req.body.warning_threshold != null && req.body.privacymonitor != null && req.body.showmonitor != null){
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
                        monit.showmonitor = req.body.showmonitor === "yes";
                        monit.description = req.body.description;
                        Monitor.updateMonitor(monit, (err, monitor) =>{
                            if(err){
                                console.log(err);// eslint-disable-line no-console
                                req.flash("error", res.__("Error"));
                                return res.redirect("/addmonitor");
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
                        monit.showmonitor = req.body.showmonitor === "yes";
                        monit.description = req.body.description;
                        Monitor.updateMonitor(monit,(error, monitor) => {
                            if(error){
                                console.log(error);// eslint-disable-line no-console
                                req.flash("error", res.__("Error"));
                                return res.redirect("/addmonitor");
                            }else{
                                return res.redirect(`/monitor/${monitor._id}`);
                            }
                        });
                    }
                }else{
                    req.flash("error_msg", "Missing Port !");
                    return res.redirect("/dashboard");
                }

            }else if(req.body.type.toLowerCase() === "ping"){
                monit.label = req.body.label;
                monit.ip = req.body.domain;
                monit.type = req.body.type;
                monit.warning_threshold = req.body.warning_threshold;
                monit.privacy = req.body.privacymonitor === "public";
                monit.showmonitor = req.body.showmonitor === "yes";
                monit.description = req.body.description;
                Monitor.updateMonitor(monit, (error, monitor) => {
                    if(error){
                        console.log(error);// eslint-disable-line no-console
                        req.flash("error", res.__("Error"));
                        return res.redirect("/addmonitor");
                    }else{
                        return res.redirect(`/monitor/${monitor._id}`);
                    }
                });
            }
        }
    });
});

/**
 * Create Incident with monitor
 **/
router.get("/monitor/:id/addincident", ensureAuthenticated, async (req,res) =>{
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    await Monitor.getMonitorById(req.params.id, (err, monit) =>{
       if(err){
           req.flash("error_msg", res.__("MonitorNotExist"));
           return res.redirect("/dashboard");
       }
       return res.render("addincident", {
           locale: req.locale,
           titlepage: `Add Incident for ${monit.label ? monit.label : monit.ip}`,
           message: req.flash(),
           nameconfig: info.websitename,
           monitor: monit,
           infoconf: info
       });
   });
});

router.post("/monitor/:id/delete", ensureAuthenticated, async(req, res)=>{
    if(req.body.delete === "yes"){
        let number =0;
        await Monitor.getMonitorById(req.params.id, (err, monit)=>{
            if(err){
                req.flash("error_msg", res.__("MonitorNotExist"));
                return res.redirect("/dashboard");
            }
            //delete all incident with id current and delete current monitor
            Status.deleteStatus(monit.id, (err, message) => { // eslint-disable-line no-unused-vars
                if(err){
                    number = number +1 ;
                    req.flash("error_msg", err);
                }
            });
            Incident.deleteIncident(monit.id, (err, message) => { // eslint-disable-line no-unused-vars
                if(err){
                    number = number +1 ;
                    req.flash("error_msg", err);
                }
            });
            Monitor.getMonitorById(monit.id, (err, message)=>{
                //for to delete monitor
                message.remove();
            });
            if(number=== 0){
                req.flash("success", "The monitor has been successfully removed with its components link");
            }
            return res.redirect("/dashboard");
        });
    }else{
        req.flash("error_msg", "Can not delete monitor. Please retry later!");
        return res.redirect("/monitor/:id");
    }
});
/**
 * Save params in db
 **/
router.post("/monitor/:id/addincident", ensureAuthenticated, async (req, res) =>{
   await Monitor.getMonitorById(req.params.id, (err, monit) => {
       if(err){
           req.flash("error_msg", res.__("MonitorNotExist"));
           return res.redirect("/dashboard");
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
                    req.flash("error_msg", err);
                    return res.redirect(`/monitor/${req.params.id}/addincident`);
                }
                return res.redirect(`/monitor/${req.params.id}/incident/${incident.id}`);
           });
       }else{
           req.flash("error_msg", "Missing params");
           return res.redirect(`/monitor/${req.params.id}/addincident`);
       }
   });
});

/**
 * Update Status Impact
 **/
router.post("/monitor/:id/incident/:idincident/impact", ensureAuthenticated, async(req, res) =>{
    //check if id exist
    await Monitor.getMonitorById(req.params.id, async (err, monit) =>{
        if (err) {
            return res.json({"error": res.__("MonitorNotExist")});
        }
        if(!monit){
            return res.json({"error": res.__("MonitorNotExist")});
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
                               "css": "BgNone", "Message": res.__("ImpactUpdated")
                           };
                           break;
                       case 1:
                           css= {
                               "css": "BgMinor", "Message": res.__("ImpactUpdated")
                           };
                           break;
                       case 2:
                           css= {
                               "css": "BgMajor", "Message": res.__("ImpactUpdated")
                           };
                           break;
                       case 3:
                           css= {
                               "css": "BgCritical", "Message": res.__("ImpactUpdated")
                           };
                           break;

                   }
                   return res.json({css});
               }
           });
        });
    });
});
/**
 * Show incident by monitor
 **/
router.get("/monitor/:id/incident/:idincident", ensureAuthenticated, async(req, res)=>{
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    await Monitor.getMonitorById(req.params.id, async(err, monit) => {
        if (err) {
            req.flash("error_msg", res.__("MonitorNotExist"));
            return res.redirect("/dashboard");
        }
        await Incident.getStatusById(req.params.idincident, (error, status) =>{
            if (error) {
                req.flash("error_msg", res.__("StatusNotExist"));
                return res.redirect("/dashboard");
            }
            return res.render("incidentpage", {
                locale: req.locale,
                titlepage: res.__("IncidentName", {name: `${monit.label ? monit.label : monit.ip}`}),
                message: req.flash(),
                nameconfig: info.websitename,
                monitor: monit,
                status: status,
                infoconf: info
            });
        });
    });
});

/**
 * update the status whith new status
 **/
router.post("/monitor/:id/incident/:idincident", ensureAuthenticated, async(req, res)=> {
    if(req.body.message != null && req.body.status != null && req.body.affected != null){
        await Monitor.getMonitorById(req.params.id, async(err, monit) => { // eslint-disable-line no-unused-vars
            if (err) {
                req.flash("error_msg", res.__("MonitorNotExist"));
                return res.redirect("/dashboard");
            }
            await Incident.getStatusById(req.params.idincident, (error, status) => {
                if (error) {
                    req.flash("error_msg", res.__("StatusNotExist"));
                    return res.redirect("/dashboard");
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
                        req.flash("error_msg", err);
                        return res.redirect(`/monitor/${req.params.id}/addincident`);
                    }else{
                        return res.redirect(`/monitor/${req.params.id}/incident/${incident.id}`);
                    }
                });
            });
        });
    }else{
        //if missing params return error
        req.flash("error_msg", res.__("MissingParams"));
        return res.redirect("/dashboard");
    }

});
/**
 * route for add monitor
 */
router.get("/addmonitor", isadmin, function (req, res) {
    let info = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", "utf8"));
    res.render("addmonitor", {
        locale: req.locale,
        titlepage: res.__("MonitorAdd"),
       message: req.flash(),
       nameconfig: info.websitename,
       infoconf: info
   });
});

/**
 * Route for add monitor why post data for create monitor
 **/
router.post("/addmonitor", isadmin, function (req, res) {
    if(req.body.label != null && req.body.domain != null && req.body.warning_threshold != null && req.body.privacymonitor != null && req.body.showmonitor != null){
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
                        privacy: req.body.privacymonitor === "public",
                        showmonitor : req.body.showmonitor === "yes",
                        description : req.body.description
                });
                    Monitor.createMonitor(newMonitor, (error, monitor) => {
                        if(error){
                            console.log(error);// eslint-disable-line no-console
                            req.flash("error", res.__("Error"));
                            return res.redirect("/addmonitor");
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
                        privacy: req.body.privacymonitor === "public",
                        showmonitor : req.body.showmonitor === "yes",
                        description : req.body.description
                    });
                    //save the monitor and create
                    Monitor.createMonitor(newMonitor,(error, monitor) => {
                        if(error){
                            console.log(error);// eslint-disable-line no-console
                            req.flash("error", res.__("Error"));
                            return res.redirect("/addmonitor");
                        }else{
                            return res.redirect(`/monitor/${monitor._id}`);
                        }
                    });
                }
            }else{
                req.flash("error", res.__("MissingPort"));
                return res.redirect("/addmonitor");
            }

        }else if(req.body.type.toLowerCase() === "ping"){
            let newMonitor = new Monitor({
                label: req.body.label,
                ip: req.body.domain,
                type: req.body.type,
                warning_threshold: req.body.warning_threshold,
                privacy: req.body.privacymonitor === "public",
                showmonitor : req.body.showmonitor === "yes",
                description : req.body.description
            });
            Monitor.createMonitor(newMonitor, (error, monitor) => {
                if(error){
                    console.log(error);// eslint-disable-line no-console
                    req.flash("error", res.__("Error"));
                    return res.redirect("/addmonitor");
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
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success_msg", res.__("LoggedOut"));
    res.redirect("/auth");
});
module.exports = router;