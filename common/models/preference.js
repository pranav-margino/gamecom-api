var _ = require('lodash');

/*
var cron = require('../../modules/cron');
var moment = require('moment');
var fs = require('fs');
var winston = require('winston');
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({ filename: 'file.log' })
    ]
});
*/


module.exports = function(Preference) {

    Preference.setResult = function(id, result, cb) {
        if (id == null || id == undefined) {
            return cb(null, []);
        }
        Preference.findById(id, function(err, preference) {
            if (!err) {
                preference.winners = result;
                preference.save();
                cb(null, preference.winners);
            } else {
                return cb(err, null);
            }
        })
    }


    Preference.getResult = function(id, cb) {
        if (id == null || id == undefined) {
            return cb(null, []);
        }
        Preference.findById(id, function(err, preference) {
            if (!err) {
                if (!preference.scheduledAt || new Date().getTime() < new Date(preference.scheduledAt).getTime()) {
                    return cb(null, []);
                }
                //if no favourites return empty array
                if (!preference.favourites) {
                    return cb(null, []);
                }
                //if winners already exist
                if (preference.winners && preference.winners.length > 0) {
                    return cb(null, preference.winners);
                }
                //choose winners randomly
                var winners = [];
                preference.favourites({}, function(err, favourites) {

                    if (preference.winnersCount >= favourites.length) {
                        winners = favourites;
                    } else {
                        for (var i = 0; i < preference.winnersCount; i++) {
                            var index = parseInt(Math.random() * favourites.length);
                            winners.push(favourites[index]);
                            favourites.splice(index, 1);
                        }
                    }
                    preference.winners = winners;
                    preference.save();
                    return cb(err, preference.winners);
                });
            } else {
                logger.log('error', err);
                return cb(err, []);
            }
        })
    };


    Preference.remoteMethod('getResult', {
        http: {
            path: '/result',
            verb: 'get'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'object'
        }
    });
    Preference.remoteMethod('setResult', {
        http: {
            path: '/result',
            verb: 'post'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }, {
            arg: 'result',
            type: 'array'
        }],
        returns: {
            arg: 'result',
            type: 'object'
        }
    });

    /*function getResultTrendiest(favourites, winnersCount, title) {
        var winnersFile = title + ' winners.json';
        if (fs.existsSync(winnersFile)) {
            return JSON.parse(fs.readFileSync(winnersFile, 'utf-8'));
        }
        var winners = [];
        if (winnersCount >= favourites.length) {
            winners = favourites;

        } else {
            var productUserCountHash = [];
            _.forEach(favourites, function(favourite) {
                productUserCountHash[favourite.product.id] = parseInt(productUserCountHash[favourite.product.id] || "0");
                productUserCountHash[favourite.product.id] = productUserCountHash[favourite.product.id] + 1;
                console.log("product ids " + favourite.product.id);
            });
            for (var key in productUserCountHash) {
                console.log(key + " " + productUserCountHash[key]);
            }
            var userCount = [];
            for (var key in productUserCountHash) {
                userCount.push(productUserCountHash[key]);
            }
            console.log(userCount);
            var maxUserCount = _.uniq(userCount).sort(function(p, q) {
                return p - q
            }).pop();
            console.log("maxUserCount " + maxUserCount);
            var probableProductIds = [];
            for (var key in productUserCountHash) {
                if (productUserCountHash[key] == maxUserCount) {
                    probableProductIds.push(key);
                }
            }
            console.log("probableProductsCount " + probableProductIds.length);
            var probableWinners = [];
            for (var i = 0; i < favourites.length; i++) {
                for (var j = 0; j < probableProductIds.length; j++) {
                    if (favourites[i].product.id == probableProductIds[j]) {
                        probableWinners.push(favourites[i]);
                    }
                }
            }
            console.log("probableWinnersCount " + probableWinners.length);
            for (var i = 0; i < winnersCount; i++) {
                var index = parseInt(Math.random() * probableWinners.length);
                winners.push(probableWinners[index]);
                probableWinners.splice(index, 1);
            }
        }
        fs.writeFileSync(winnersFile, JSON.stringify(winners), 'utf-8');
        return winners;
    }*/

}
