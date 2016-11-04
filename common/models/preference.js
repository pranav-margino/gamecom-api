var _ = require('lodash');
var app = require('../../server/server');
var async = require('async');

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


    Preference.getPoints = function(userId, cb) {
        app.models.Consumer.getPoints(userId, function(err, data) {
            cb(err, data);
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

    //winners && products do not repeat
    Preference.getResultNoRepeat = function(id, cb) {
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

                            var winner = favourites[index];
                            winners.push(winner);
                            var remainingFavourites = (_.partition(favourites, function(favourite) {
                                return (favourite.product.id.toString() == winner.product.id.toString() || favourite.user.id.toString() == winner.user.id.toString())
                            })[1]);
                            favourites = remainingFavourites;
                        }
                        console.log("###");
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

    Preference.getProductsComments = function(id, cb) {
        Preference.findById(id, function(err, preference) {
            if (!err) {
                //var products = [];
                preference.products({}, function(err, products) {

                    async.map(products, function(product, cb) {
                        product.comments({}, function(err, comments) {
                            cb(null, comments);
                        })
                    }, function(err, results) {
                        return cb(null, _.flattenDeep(results));
                    });
                });
            } else {
                return cb(err, null);
            }
        });

    };


    Preference.remoteMethod('getProductsComments', {
        http: {
            path: '/:id/getProductsComments',
            verb: 'get'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'comments',
            type: 'Array'
        }
    });

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

    Preference.remoteMethod('getResult', {
        http: {
            path: '/resultnorepeat',
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

    Preference.remoteMethod('getPoints', {
        http: {
            path: '/points',
            verb: 'get'
        },
        accepts: [{
            arg: 'userId',
            type: 'string'
        }],
        returns: {
            arg: 'points',
            type: 'number'
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

    Preference.listConsumers = function() {
        Preference.find({}, function(err, preferences) {
            _.forEach(preferences, function(preference) {
                //console.log(preference);
                preference.favourites({}, function(err, favourites) {
                    var consumerIds = [];
                    _.forEach(favourites, function(favourite) {
                        consumerIds.push(favourite.user.id);
                    })
                    console.log(_.uniq(consumerIds));
                });
            });
        });
    }

    Preference.cleanup = function() {
        app.models.Favourite.find({}, { fields: { 'product.title': true, 'user.name': true } }, function(err, favourites) {
            //console.log(favourites);
            var preferenceProducts = [];
            Preference.find({}, function(err, preferences) {
                //console.log(preferences);
                _.forEach(preferences, function(preference) {
                    preference.products(function(err, products) {
                        //console.log(product);
                        _.forEach(products, function(product) {
                            preferenceProducts.push(product);
                        });
                    });
                })
                setTimeout(function() {
                    //console.log(preferenceProducts);
                    for (var i = 0; i < favourites.length; i++) {
                        for (var j = 0; j < preferenceProducts.length; j++) {
                            if (favourites[i].product.title == preferenceProducts[j].title) {
                                console.log("matched");
                                console.log(favourites[i].product.title);
                                console.log(favourites[i].product.id);
                                console.log(preferenceProducts[j].id);
                                console.log("###");
                                favourites[i].product = preferenceProducts[j];
                                favourites[i].save();
                            }
                        }
                    }
                }, 2000);

            });
        });
    }

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
