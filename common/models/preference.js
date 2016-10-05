var winston = require('winston');
var cron = require('../../modules/cron');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({ filename: 'blsp-favourites.log' })
    ]
});


module.exports = function(Preference) {


    
    var winnersCount = 1;

    function getResult(favourites, winnersCount, title) {
    	var winnersFile = title + 'winners.json';
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
            console.log(productUserCountHash);
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
    }



    Preference.result = function(id, cb) {
        /*if (new Date().getTime() < new Date("2016-10-01T23:00:00+05:30").getTime()) {
            return cb(null, []);
        }
        */
        Preference.findById(id, function(err, preference) {
            if (!err) {
                preference.favourites({}, function(err, favourites) {
                    var winners = getResult(favourites, winnersCount, preference.title);
                    logger.log('info', winners);
                    return cb(null, winners);
                });

            } else {
                logger.log('error', err);
                return cb(err, null);
            }
        })

    };


    Preference.remoteMethod('result', {
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

}
