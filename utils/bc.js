var bcrypt = require("bcryptjs");

exports.hashPassword = function hashPassword(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject("error1:", err.message);
            }
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject("error2: ", err.message);
                }
                resolve(hash);
            });
        });
    });
};

exports.checkPassword = function checkPassword(
    textEnteredInLoginForm,
    hashedPasswordFromDatabase
) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(
            textEnteredInLoginForm,
            hashedPasswordFromDatabase,
            function(err, doesMatch) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doesMatch);
                }
            }
        );
    });
};
