/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
let { Curl } = require('node-libcurl');

/**
 * Shortcut to curl
 *
 * @param {string} href
 * @param {boolean} header return headers?
 * @param {boolean} body return body?
 * @param {number} timeout connection timeout in seconds. defaults to CURL_TIMEOUT (10 secs).
 * @param {string|boolean} website_username Username website
 * @param {string|boolean} website_password Password website
 * @param {Function} callback return information results
 * @return Curl cURL result
 */
module.exports.curl_get = function(href, header = false, body = true, timeout = null, website_username = false, website_password = false, callback) {
    const curl = new Curl();
    //default timeout for curl is 1sec define to 10s
    let CURL_TIMEOUT = 10;
    //check if timeout is int
    timeout = timeout == null ? CURL_TIMEOUT : parseInt(timeout);
    curl.setOpt('URL', href);
    curl.setOpt('HEADER', header);
    curl.setOpt('NOBODY', (!body));
    curl.setOpt('FOLLOWLOCATION', true);
    curl.setOpt('SSL_VERIFYHOST', false);
    curl.setOpt('SSL_VERIFYPEER', false);
    curl.setOpt('CONNECTTIMEOUT', timeout);
    curl.setOpt('FOLLOWLOCATION', true);
    curl.setOpt('TIMEOUT', timeout);

    //curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    //curl_setopt($ch, CURLOPT_ENCODING, '');
    if(website_username !== false && website_password !== false && (website_username != null) && (website_password != null)) {
        curl.setOpt('USERPWD', website_username + ":" + website_password);
    }
    //custom user agent
    curl.setOpt('USERAGENT', 'Mozilla/5.0 (compatible; sekarion; https://sekarion.tk)');
    //just once because on = memory leak...
    curl.once('end', callback);
    curl.once('error', callback);
    curl.perform();
    //close the request after
    //curl.close();
};

/**
 * Check the current servers ping status
 * @param {Number|String} ip
 * @param {Number} max_runs
 * @param {Number} run default run 1
 * @param {Function} callback return function Error , target
 */
module.exports.Ping = function(ip, max_runs, run = 1, callback) {
    const tcpie = require('tcpie');
    const pie = tcpie(ip, 80, {count: 1, interval: 500, timeout: 2000});
    pie.on('connect', function(stats) {
       // console.info('connect', stats);
    }).on('error', function(err, stats) {
       // console.error(err, stats);
    }).on('timeout', function(stats) {
       // console.info('timeout', stats);
    }).on('end', callback).start();
    /*if (!status && run < max_runs) {
        return Ping(ip, max_runs, run + 1);
    }*/
};