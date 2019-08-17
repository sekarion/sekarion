/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
let curl = require('./curl');
class UpdateStatus {
    constructor() {
        this.status = "";
        this.run = 1;
        this.error = "";
        this.time = 0;
    }
    /**
     * Update Ping
     * @param {String} serverid
     * @param {String} ip server
     * @param {Number} maxrun how many times should the script recheck the server if unavailable.
     * @param {String} type of service
     * @param {String} port
     **/
    async update(serverid, ip, maxrun, type, port = null){
        this.error = '';
        if (!ip) {
            return false;
        }
        switch (type) {
            case 'ping':
                this.status = await this.updatePing(maxrun, ip);
                break;
            case 'service':
                this.status = await this.updateService(maxrun, ip, port);
                break;
            case 'website':
                this.status = await this.updateWebsite(maxrun, ip);
                break;
        }
        return {status: this.status, run: this.run, time: this.time, error: this.error}
    }

    msToMS( ms ) {
        // 1- Convert to seconds:
        return ms / 1000;
    }
    /**
     * @param {Number} maxrun how many times should the script recheck the server if unavailable.
     * @param {String} ip
     * @param {String} port
     * @return {Boolean}
     **/
    async updateService(maxrun, ip, port){
        let timestart = new Date().getTime();
        let self = this;
        return new Promise(function(resolve, reject) {
            let link;
            switch (port) {
                case 21:
                    //add ftp if doesn't exist
                    if(!/^((ftp):\/\/)/.test(ip)) {
                        link = `ftp://${ip}:${port}`;
                    }else{
                        link = ip;
                    }
                    break;
                case 23:
                    //add ftp if doesn't exist
                    if(!/^((smtp):\/\/)/.test(ip)) {
                        link = `ftp://${ip}:${port}`;
                    }else{
                        link = ip;
                    }
                    break;
                case 80:
                    //add http if doesn't exist
                    let pt = /^((http):\/\/)/;
                    if(!pt.test(ip)) {
                        link = `http://${ip}`;
                    }else{
                        link = ip;
                    }
                    break;
                case 110:
                    //add http if doesn't exist
                    if(!/^((pop3):\/\/)/.test(ip)) {
                        link = `pop3://${ip}`;
                    }else{
                        link = ip;
                    }
                    break;
                case 443:
                    //replace if https doesn't exist
                    let pattern = /^((https):\/\/)/;
                    if(!pattern.test(ip)) {
                        link = `https://${ip}`;
                    }else{
                        link = ip;
                    }
                    break;
                case 465:
                    //add http if doesn't exist
                    if(!/^((smtps):\/\/)/.test(ip)) {
                        link = `smtps://${ip}`;
                    }else{
                        link = ip;
                    }
                    break;
                case 995:
                    //add http if doesn't exist
                    if(!/^((pop3):\/\/)/.test(ip)) {
                        link = `pop3://${ip}:${port}`;
                    }else{
                        link = `${ip}:${port}`;
                    }
                    break;
                default:
                    link = `${ip}:${port}`;
                    break;
            }
            curl.curl_get(link, false, true, null, false, false,async(statusCode, data, headers) => {
                self.time = self.msToMS(new Date().getTime() - timestart);
                //close curl
                if(statusCode.toString() === "Error: Couldn't resolve host name"){
                    //return false because false host
                    self.error = statusCode;
                    self.status = false;
                    resolve(self.status);
                }else{
                    self.status = statusCode >= 200 && statusCode <= 399;
                }
                if (!self.status && self.run < maxrun) {
                    self.run = self.run + 1;
                    return await self.updateService(maxrun, ip, port);
                }
                return resolve(self.status);
            });
        });
    }
    /**
     * @param {Number} maxrun how many times should the script recheck the server if unavailable.
     * @return {Boolean}
     **/
    async updateWebsite(maxrun, ip) {
        let timestart = new Date().getTime();
        let self = this;
        return new Promise(async (resolve, reject) => {
            await curl.curl_get(ip, false, true, null, false, false, (statusCode, data, headers) => {
                self.time = self.msToMS(new Date().getTime() - timestart);
                //close curl
                //exclude error page if error page return down
                this.status = !(statusCode < 200 && statusCode < 400);
            });
        })
    }

    /**
     * Ping Ip or website with Ping
     * @param {Number} maxrun how many times should the script recheck the server if unavailable.
     * @param {String} ip
     * @return {Boolean}
     **/
    async updatePing(maxrun, ip) {
        let timestart = new Date().getTime();
        let self = this;
        return new Promise(async (resolve, reject) =>{
            curl.Ping(ip, maxrun, this.run, async (infos) => {
                self.time = self.msToMS(new Date().getTime() - timestart);
                if(infos.success > 0){
                    self.status= true;
                    resolve(self.status);
                }else{
                    if (!self.status && self.run < maxrun) {
                        self.run = self.run + 1;
                        return await self.updatePing(maxrun, ip);
                    }else{
                        self.status = false;
                    }
                    resolve(self.status);
                }
            });
        });
    }
}
module.exports = UpdateStatus;