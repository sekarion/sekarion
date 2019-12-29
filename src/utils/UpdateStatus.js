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
        return new Promise(async (resolve, reject) => {
            //if error default is false and calculate the time and resolve
            try{
                await curl.PingService(ip, port,function(inUse) {
                    self.time = self.msToMS(Date.now()-timestart);
                    self.status = inUse;
                });
            }catch (e) {
                self.time= self.msToMS(Date.now()-timestart);
                self.status = false;
            }
            resolve(self.status);
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