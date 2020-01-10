/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/

let mongoose = require("mongoose");
//config only for ping or service (no configured request for moment )
let MonitorSchema = mongoose.Schema({
    label: {
        type: String
    },
    ip: {
        type: String
    },
    type: {
        type: String
    },
    port: {
        type: Number
    },
    warning_threshold: {
        type: Number, default: 1
    },
    privacy: {
        type: Boolean, default: false
    },
    showmonitor: {
        type: Boolean, default: false
    },
    description: {
        type: String
    },
    laststatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Status"
    },
});

/**
 * Export model schema
 **/
let Monitor = module.exports = mongoose.model("Monitor", MonitorSchema);
/**
 * Find Monitor by ID
 * @param {Number|String} id
 * @param {Function} callback
 **/
module.exports.getMonitorById = async function(id, callback) {
    await Monitor.findById(id).populate("laststatus").exec(callback);
};
/**
 * Create monitor with params
 * @param {Object} newMonitor
 * @param {function} callback
 **/
module.exports.createMonitor = function(newMonitor, callback) {
    return newMonitor.save(callback);
};
/**
 * Update Monitor with current params
 * @param {Object} updateMonitor
 * @param {function} callback
 **/
module.exports.updateMonitor = function(updateMonitor, callback){
    return updateMonitor.save(callback);
};
/**
 * Find all monitor
 * @param {Function} callback
 * @return function
 **/
module.exports.findAll = async function(callback) {
    return await Monitor.find().populate("laststatus").exec(callback);
};

/**
 * Find all monitor public
 * @param {function} callback
 * @return function
 **/
module.exports.findPublic = async function(callback){
    return await Monitor.find({"privacy": true}).populate("laststatus").exec(callback);
};
/**
 * Delete all results in current Monitor selection
 **/
module.exports.deleteMonitor = function(currenttodelete, callback){
    return Monitor.deleteOne(({"monitorid": currenttodelete})).then(callback).catch(function(error) {
        throw error;
    });
};