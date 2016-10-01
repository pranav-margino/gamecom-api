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

module.exports = function(Favourite) {

    var winnersFile = 'blsp-winners.json';
    var winnersCount = 1;

    function getResult(favourites, winnersCount) {
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
            console.log("productUserCount " + JSON.stringify(productUserCountHash));
            var userCount = [];
            for (var key in productUserCountHash) {
                userCount.push(productUserCountHash[key]);
            }
            var maxUserCount = _.uniq(userCount.sort()).pop();
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


    Favourite.result = function(cb) {
        /*if (new Date().getTime() < new Date("2016-09-25T19:55:00+05:30").getTime()) {
            return cb(null, []);
        }*/
        Favourite.find({}, function(err, favourites) {
            if (!err) {
                var winners = getResult(favourites, winnersCount);
                logger.log('info', winners);
                return cb(null, winners);
            } else {
                logger.log('error', err);
                return cb(err, null);
            }
        })

    };


    Favourite.remoteMethod('result', {
        http: {
            path: '/result',
            verb: 'get'
        },
        accepts: [],
        returns: {
            arg: 'data',
            type: 'object'
        }
    });



    Favourite.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            var favourite = ctx.instance;
            logger.log('info', { user: favourite.user.name, product: favourite.product.title });
        }
        next();
    });

}
