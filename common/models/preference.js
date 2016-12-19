var _ = require('lodash');
var app = require('../../server/server');
var async = require('async');
var io = require('../../modules/io');
var cache = require('../../modules/cache');
var debug = require('debug')('preference');
var colors = require('colors');



module.exports = function(Preference) {

    var self = this;


    self.sockets = null;
    self.cClient = null;
    self.cConfig = {};

    cache.on('ready', function(client, config) {

        self.cClient = client;
        self.cConfig = config;
        debug("preference cache connected".green);
        debug("cache config %s", JSON.stringify(config));
    });

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        debug("preference sockets connected.".green);
    });

    Preference.getMailingList = function(cb) {
        app.models.Consumer.find({ fields: { name: true, email: true, id: true } }, function(err, consumers) {
            if (err) {
                return cb(err, null);
            } else {
                return cb(null, consumers);
            }
        })
    }

    Preference.sendMailInvite = function(id, cb) {
        if (!self.sockets || !id) {
            debug("sendMailInvite has no sockets or preferenceId is absent".red);
            return cb("sendMailInvite has no sockets", null);
        } else {

            Preference.findById(id, function(err, preference) {
                if (err) {
                    cb(err, null);
                } else {
                    self.sockets.emit("preferenceInviteMail", { id: id });
                    preference.hasSentInvite = true;
                    preference.save();
                    cb(null, preference);
                }
            });

        }
    }

    Preference.sendMailResult = function(id, cb) {
        if (!self.sockets || !id) {
            debug("sendMailResult has no sockets or preferenceId is absent".red);
            return cb("sendMailResult has no sockets", null);
        } else {

            Preference.findById(id, function(err, preference) {
                if (err) {
                    cb(err, null);
                } else {
                    self.sockets.emit("preferenceResultMail", { id: id });
                    preference.hasSentResult = true;
                    preference.save();
                    cb(null, preference);
                }
            });

        }
    }

    Preference.remoteMethod('sendMailInvite', {
        http: {
            path: '/sendMailInvite',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });

    Preference.remoteMethod('getMailingList', {
        http: {
            path: '/getMailingList',
            verb: 'GET'
        },
        accepts: [],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });

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

    Preference.getPointsCache = function(userId, cb) {
        app.models.Consumer.getPointsCache(userId, function(err, data) {
            cb(err, data);
        });
    }

    Preference.getEndorsements = function(id, cb) {
        app.models.Favourite.find({ where: { preferenceId: id } }, function(err, favourites) {
            if (err) {
                return cb(err, []);
            } else {
                async.map(favourites, function(favourite, cb) {
                    favourite.endorsements({}, function(err, endorsements) {
                        endorsements = _.map(endorsements, function(endorsement) {
                            return _.merge(endorsement, {
                                endorsee: {
                                    name: favourite.user.name,
                                    pictureUrl: favourite.user.pictureUrl
                                }
                            });
                        });
                        cb(err, endorsements);
                    });
                }, function(err, results) {
                    return cb(null, _.flatten(results));
                });

            }
        });
    }

    Preference.getContests = function(id, cb) {
        app.models.Favourite.find({ where: { preferenceId: id } }, function(err, favourites) {
            if (err) {
                return cb(err, []);
            } else {
                console.log(favourites.length);
                async.map(favourites, function(favourite, cb) {

                    favourite.contests({}, function(err, contests) {


                        contests = _.map(contests, function(contest) {
                            return _.merge(contest, {
                                contested: {
                                    name: favourite.user.name,
                                    pictureUrl: favourite.user.pictureUrl
                                }
                            });
                        });
                        cb(err, contests);


                    });
                }, function(err, results) {
                    return cb(null, _.flatten(results));
                });

            }
        });
    }

    Preference.getOverbids = function(id, cb) {
        app.models.Favourite.find({ where: { preferenceId: id } }, function(err, favourites) {
            if (err) {
                return cb(err, []);
            } else {
                console.log(favourites.length);
                async.map(favourites, function(favourite, cb) {
                    favourite.overbids({}, function(err, overbids) {
                        cb(err, overbids);
                    });
                }, function(err, results) {
                    return cb(null, _.flatten(results));
                });

            }
        });
    }

    Preference.getUnderbids = function(id, cb) {
        app.models.Favourite.find({ where: { preferenceId: id } }, function(err, favourites) {
            if (err) {
                return cb(err, []);
            } else {
                console.log(favourites.length);
                async.map(favourites, function(favourite, cb) {
                    favourite.underbids({}, function(err, underbids) {
                        cb(err, underbids);
                    });
                }, function(err, results) {
                    return cb(null, _.flatten(results));
                });

            }
        });
    }

    Preference.remoteMethod('getUnderbids', {
        http: {
            path: '/getUnderbids',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });

    Preference.remoteMethod('getOverbids', {
        http: {
            path: '/getOverbids',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });

    Preference.remoteMethod('getEndorsements', {
        http: {
            path: '/getEndorsements',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });

    Preference.remoteMethod('getContests', {
        http: {
            path: '/getContests',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });

    Preference.getManifestVars = function(id, cb) {
        Preference.findById(id, {
            fields: {
                maxEndorsementValue: 1,
                minEndorsementValue: 1,
                maxContestValue: 1,
                minContestValue: 1,
                maxOverbidValue: 1,
                minOverbidValue: 1,
                maxUnderbidValue: 1,
                minUnderbidValue: 1,
                endorsementInterval: 1,
                contestInterval: 1,
                overbidInterval: 1,
                underbidInterval: 1,
                stepsOfEndorsement: 1,
                stepsOfContest: 1,
                stepsOfOverbid: 1,
                stepsOfUnderbid: 1,
                expiresManifestIn: 1,
                maxEndorsementCount: 1,
                maxOverbidCount: 1,
                maxContestCount: 1,
                maxUnderbidCount: 1
            }
        }, function(err, vars) {
            cb(err, vars);
        });
    };

    function validCacheValues(array, length) {

        if (array.length != length) {
            return false;
        }
        for (var i = 0; i < array.length; i++) {
            if (array[i] == undefined || array[i] == null) {
                return false;
            }
        }
        return true;
    }

    function objectifyCacheValues(array, keysArray) {
        var obj = {};
        for (var i = 0; i < array.length; i++) {
            obj[keysArray[i]] = array[i];
        };
        debug(obj);
        return obj;
    }

    Preference.getManifestVarsCache = function(id, cb) {
        if (!self.cClient) {
            debug("cache client not found".red);
            Preference.getManifestVars.apply(null, arguments);
        } else {

            var key = ["manifest-vars-preference", id].join("-");
            var keys = [
                "maxEndorsementValue",
                "minEndorsementValue",
                "maxEndorsementCount",
                "endorsementInterval",
                "stepsOfEndorsement",
                "maxContestValue",
                "minContestValue",
                "maxContestCount",
                "contestInterval",
                "stepsOfContest",
                "maxOverbidValue",
                "minOverbidValue",
                "maxOverbidCount",
                "overbidInterval",
                "stepsOfOverbid",
                "maxUnderbidValue",
                "minUnderbidValue",
                "maxUnderbidCount",
                "underbidInterval",
                "stepsOfUnderbid",
                "expiresManifestIn"
            ];
            self.cClient.hmget(key, keys, function(err, vars) {
                if (!err && validCacheValues(vars, 21)) {

                    debug('PreferenceManifestVarsCache'.blue);
                    debug("key : %s", key);
                    debug(vars.toString());
                    cb(null, objectifyCacheValues(vars, keys));
                } else {
                    Preference.getManifestVars(id, function(err, vars) {
                        if (!err) {
                            debug('PreferenceManifestVarsDisc'.red);
                            self.cClient.hmset(key,
                                keys[0], vars[keys[0]],
                                keys[1], vars[keys[1]],
                                keys[2], vars[keys[2]],
                                keys[3], vars[keys[3]],
                                keys[4], vars[keys[4]],
                                keys[5], vars[keys[5]],
                                keys[6], vars[keys[6]],
                                keys[7], vars[keys[7]],
                                keys[8], vars[keys[8]],
                                keys[9], vars[keys[9]],
                                keys[10], vars[keys[10]],
                                keys[11], vars[keys[11]],
                                keys[12], vars[keys[12]],
                                keys[13], vars[keys[13]],
                                keys[14], vars[keys[14]],
                                keys[15], vars[keys[15]],
                                keys[16], vars[keys[16]],
                                keys[17], vars[keys[17]],
                                keys[18], vars[keys[18]],
                                keys[19], vars[keys[19]],
                                keys[20], vars[keys[20]]);
                            self.cClient.expire(key, self.cConfig.MANIFEST_VARS_PREFERENCE);
                            cb(null, vars);
                        } else {
                            cb(err, vars);
                        }
                    });
                }
            })
        }
    };

    Preference.setManifestVarsCache = function(preference) {
        if (!self.cClient) {
            debug("no cache client".red);
            return;
        } else {
            var key = ["manifest-vars-preference", preference.id].join("-");
            var keys = [
                "maxEndorsementValue",
                "minEndorsementValue",
                "maxEndorsementCount",
                "endorsementInterval",
                "stepsOfEndorsement",
                "maxContestValue",
                "minContestValue",
                "maxContestCount",
                "contestInterval",
                "stepsOfContest",
                "maxOverbidValue",
                "minOverbidValue",
                "maxOverbidCount",
                "overbidInterval",
                "stepsOfOverbid",
                "maxUnderbidValue",
                "minUnderbidValue",
                "maxUnderbidCount",
                "underbidInterval",
                "stepsOfUnderbid",
                "expiresManifestIn"
            ];
            self.cClient.hmset(key,
                keys[0], preference[keys[0]],
                keys[1], preference[keys[1]],
                keys[2], preference[keys[2]],
                keys[3], preference[keys[3]],
                keys[4], preference[keys[4]],
                keys[5], preference[keys[5]],
                keys[6], preference[keys[6]],
                keys[7], preference[keys[7]],
                keys[8], preference[keys[8]],
                keys[9], preference[keys[9]],
                keys[10], preference[keys[10]],
                keys[11], preference[keys[11]],
                keys[12], preference[keys[12]],
                keys[13], preference[keys[13]],
                keys[14], preference[keys[14]],
                keys[15], preference[keys[15]],
                keys[16], preference[keys[16]],
                keys[17], preference[keys[17]],
                keys[18], preference[keys[18]],
                keys[19], preference[keys[19]],
                keys[20], preference[keys[20]]);

            debug('setManifestVarsCache %s'.green, preference.id);
            self.cClient.expire(key, self.cConfig.MANIFEST_VARS_PREFERENCE);

        }
    }


    Preference.observe('after save', function(ctx, next) {
        if (!ctx.isNewInstance) {
            Preference.setManifestVarsCache(ctx.instance);
            next();
        } else {
            next();
        }
    });

    Preference.remoteMethod('getManifestVars', {
        http: {
            path: '/getManifestVars',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });

    Preference.remoteMethod('getManifestVarsCache', {
        http: {
            path: '/getManifestVarsCache',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });





    Preference.getResultRandom = function(id, cb) {
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

    Preference.getStats = function(cb) {
        async.parallel({
            endorsementsCount: function(cb) {
                app.models.Endorsement.count({}, function(err, count) {
                    cb(err, count);
                });
            },
            contestsCount: function(cb) {
                app.models.Contest.count({}, function(err, count) {
                    cb(err, count);
                });
            },
            overbidsCount: function(cb) {
                app.models.Overbid.count({}, function(err, count) {
                    cb(err, count);
                });
            },
            underbidsCount: function(cb) {
                app.models.Underbid.count({}, function(err, count) {
                    cb(err, count);
                });
            }
        }, function(err, results) {
            return cb(err, results);
        });
    }

    Preference.remoteMethod('getStats', {
        http: {
            path: '/stats',
            verb: 'get'
        },
        accepts: [],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });

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
                app.models.Favourite.rank(id, function(err, data) {
                    preference.products({}, function(err, products) {
                        if (err) {
                            return cb(err, null);
                        }

                        var productsWinnersCount = [];

                        for (var i = 0; i < products.length; i++) {
                            productsWinnersCount[products[i].id] = products[i].winnersCount;
                        }
                        preference.favourites({}, function(err, favourites) {
                            if (!err) {
                                var groups = _.groupBy(favourites, 'product.id');

                                for (var productId in groups) {
                                    var winnersCount = productsWinnersCount[productId];
                                    var group = groups[productId];
                                    console.log("***");
                                    console.log(group);
                                    group = group.sort(function(a, b) {
                                        return parseInt(a.rank) - parseInt(b.rank);
                                    });
                                    //console.log("sorted group");
                                    //console.log(group);
                                    for (var i = 0; i < winnersCount; i++) {
                                        winners.push(group[i] || {});
                                    }
                                    console.log("winners");
                                    console.log(winners);
                                }
                                preference.winners = winners;
                                preference.save();
                                return cb(err, winners);
                            } else {
                                return cb(err, null);
                            }
                        });
                    });

                });

            } else {
                logger.log('error', err);
                return cb(err, []);
            }
        })
    }

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
            type: 'Array'
        }
    });

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

    Preference.remoteMethod('getResultRandom', {
        http: {
            path: '/resultrandom',
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

    Preference.remoteMethod('getResultNoRepeat', {
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

    Preference.remoteMethod('getPointsCache', {
        http: {
            path: '/pointsCache',
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
