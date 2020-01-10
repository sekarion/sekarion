/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/

let mongoose = require("mongoose");
//config only for ping or service (no configured request for moment )
let StatusSchema = mongoose.Schema({
    latency: {
        type: String
    },
    status: {
        type: String
    },
    datecheck: {
        type: Number, default: new Date().getTime()
    },
    error: {
        type: String
    },
    //don't populate because overloop just need ID
    monitorid: {
        type: String
    }
});
let Status = module.exports = mongoose.model("Status", StatusSchema);

/**
 * Create status with params
 * @param {Object} newStatus
 * @param {function} callback
 **/
module.exports.createStatus = function(newStatus, callback) {
    return newStatus.save(callback);
};
/**
 * Find all monitor
 * @param {Function} callback
 * @return function
 **/
module.exports.findAll = async function(callback) {
    return await Status.find({}).exec(callback);
};
/**
 * Find Status by ID
 * @param {Number|String} id
 * @param {Function} callback
 **/
module.exports.getStatusById = function(id, callback) {
    Status.findById(id, callback);
};
/**
 * Find Status by ID Monitor
 * @param {Number|String} id
 * @param {Function} callback
 **/
module.exports.getByMonitorID = function (id, callback) {
    return Status.find({ "monitorid": id}, callback);
};

/**
 * Find Status by Id Monitor by Days
 * @param {Number} id
 * @param {function} callback
 **/
module.exports.getByMonitorIDByDays = function(id, callback){
    return Status.find(
        {
            "monitorid": id,
            datecheck: {
                $lt: new Date(),
                $gte: new Date(new Date().setDate(new Date().getDate()-1))
            }
        },
        //exclude fields
        {
            "_id": false,
            "__v": 0,
            "monitorid": 0
        }, callback
    );
};
module.exports.getByMonitorIDByHours = function(id, callback){
    let filtertime = new Date();
    filtertime.setHours(filtertime.getHours() - 2);
    return Status.find(
        {
            "monitorid": id,
            datecheck: {
                $lt: new Date(),
                $gte: filtertime
            }
        },
        //exclude fields
        {
            "_id": false,
            "__v": 0,
            "monitorid": 0
        }, callback
    );
};
/**
 * Find Status by Id Monitor by months
 * @param {Number} id
 * @param {function} callback
 **/
module.exports.getByMonitorIDByMonths = function(id, callback){
  return Status.find(
      {
          "monitorid": id,
          datecheck: {
              $lt: new Date(),
              $gte: new Date(new Date().setDate(new Date().getMonth()-1))
          }
      }, //exclude fields
      {
          "_id": false,
          "__v": 0,
          "monitorid": 0
      }, callback
  );
};
module.exports.getByMonitorIDByWeeks = function(id, callback){
    return Status.find(
        {
            "monitorid": id,
            datecheck: {
                $lt: new Date(),
                $gte: new Date(new Date().setDate(new Date().getDay()-7))
            }
        }, //exclude fields
        {
            "_id": false,
            "__v": 0,
            "monitorid": 0
        }, callback
    );
};
/**
 * Delete all results in current Monitor selection
 **/
module.exports.deleteStatus = function(currenttodelete, callback){
    return Status.deleteMany({ "monitorid": currenttodelete}, callback);
};