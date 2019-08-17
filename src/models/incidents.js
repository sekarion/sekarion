/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/

let mongoose = require('mongoose');
//config only for ping or service (no configured request for moment )
let IncidentSchema = mongoose.Schema({
    name: {
        type: String
    },
    impact: {
        type: Number, default: 0
    },
    curentstatus: {
        type: String
    },
    date: {
        type: Number, default: new Date().getTime()
    },
    updateAt:{
        type: Number, default: new Date().getTime()
    },
    infosstatus: [new mongoose.Schema({
        createAt: {
            type: Number, default: new Date().getTime()
        },
        description: {
            type: String
        },
        status: {
            type: String
        }
    })],
    //don't populate because overloop just need ID
    monitorid: {
        type: String
    },
    //component affected
    affected: {
        type: String
    }
});
let Incident = module.exports = mongoose.model('Incidents', IncidentSchema);

/**
 * Create status with params
 * @param {Object} newIncident
 * @param {function} callback
 **/
module.exports.createIncident = function(newIncident, callback) {
    return newIncident.save(callback);
};
/**
 * Find all Incident
 * @param {Function} callback
 * @return function
 **/
module.exports.findAll = async function(callback) {
    return await Incident.find({}).exec(callback);
};
/**
 * Find Status by ID
 * @param {Number|String} id
 * @param {Function} callback
 **/
module.exports.getStatusById = function(id, callback) {
    Incident.findById(id, callback);
};
/**
 * Find Incident by ID Monitor
 * @param {Number|String} id
 * @param {Function} callback
 **/
module.exports.getByMonitorID = async function (id, callback) {
    return Incident.find({ "monitorid": id}, callback);
};
/**
 * Delete all results in current Monitor selection
 **/
module.exports.deleteIncident = function(currenttodelete, callback){
    return Incident.deleteMany({ "monitorid": currenttodelete}, callback);
};