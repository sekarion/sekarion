/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
let mongoose = require("mongoose");
//encrypt the password with bcrypt
let bcrypt = require("bcryptjs");

let UserSchema = mongoose.Schema({
    username: {
        type: String
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    rank: {
        type: String, default: "User"
    },
    enable: {
        type: Boolean, default: true
    }
});

/**
 * Export model schema
 **/
let User = module.exports = mongoose.model("User", UserSchema);

/**
 * Create user with params
 * @param {Object} newUser
 * @param {function} callback
 **/
module.exports.createUser = function(newUser, callback) {
    return bcrypt.genSalt(10, function(err, salt) {
        return bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            return newUser.save(callback);
        });
    });
};

/**
 * Update user with params
 * @param {Object} updateUser Object user
 * @param {Object} data
 * @param {function} callback
 **/
module.exports.UpdateUser = function(updateUser, data, callback) {
    if(data.password.length > 0){
        return bcrypt.genSalt(10, function(err, salt) {
            return bcrypt.hash(data.password, salt, function(err, hash) {
                updateUser.password = hash;
                return updateUser.save(callback);
            });
        });
    }else{
        return updateUser.save(callback);
    }
};
/**
 * Find user by username
 * @param {String} username
 * @param {function} callback
 **/
module.exports.getUserByUsername = function(username, callback) {
    let query = {
        username: username
    };
    User.findOne(query, callback);
};
/**
 * Find user by email
 * @param {String} email
 * @param {function} callback
 */

module.exports.getUserByEmail = function(email, callback){
    let query = {
        email: email
    };
    User.findOne(query, callback);
};
/**
 * Find user by ID
 * @param {Number|String} id
 * @param {Function} callback
 **/
module.exports.getUserById = function(id, callback) {
    User.findById(id, callback);
};

/**
 * Find all users
 * @param {Function} callback
 * @return function
 **/
module.exports.findAll = function(callback) {
    User.find({}, callback);
};
/**
 * Compare password with string
 * @param {String} candidatePassword
 * @param {string} hash
 * @param {function} callback
 **/
module.exports.comparePassword = function(candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });
};