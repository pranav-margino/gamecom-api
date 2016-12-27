var app = require('../../server/server');
var io = require('../../modules/io');
var cache = require('../../modules/cache');
var _ = require('lodash');
var async = require('async');
var debug = require('debug')('bboost');
var colors = require('colors');



module.exports = function(Bboost) {

    var self = this;


    self.sockets = null;

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        debug("bboost sockets connected.".green);
    });

    Bboost.getName = function() {
        var names = [
            "Amelia Bloomer boost",
            "Simone de Beauvoir boost",
            "Alice Paul boost",
            "Lucy Stone boost",
            "Betty Friedan boost",
            "Sojourner Truth boost",
            "Susan B. Anthony boost",
            "Elizabeth Stanton boost",
            "Gloria Steinem boost"
        ];
        return names[parseInt(Math.random() * names.length)]
    }

    Bboost.getValue = function() {
        var values = [-1000, -900, -800, -700, -600, -500, -400, -300, -200, -100, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 5000, 10000];
        return values[parseInt(Math.random() * values.length)];
    }

    Bboost.issueBoosts = function(preferenceId) {
        debug('boosting preference %s', preferenceId);
        app.models.Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            debug("Error %s".red, err);
            debug("favourites count %d".green, favourites.length);
            async.each(favourites, function(favourite, cb) {
                debug('issued on favourite id %s', favourite.id);
                favourite.bboosts.create({ value: Bboost.getValue(), name: Bboost.getName() }, function(err, bboost) {
                    if (!err) {
                        debug(JSON.stringify(bboost));

                        Bboost.broadcastBboost(bboost);
                    }
                    cb(err);
                });
            }, function(err) {
                debug(err);
            });
        });

    }

    Bboost.calcTemp = function(favourite) {
        var delta;
        var d = new Date();
        if (favourite.bboostTempLastMeasured) {
            delta = d.getTime() - favourite.bboostTempLastMeasured.getTime();

        } else {
            delta = Number.POSITIVE_INFINITY;
        }
        debug("delta %d", delta);
        var tempDelta = 2 * (Math.pow(Math.E, (-(delta / 1000))));
        debug('tempDelta %d', tempDelta);
        favourite.bboostTemp = Math.pow(Math.E, (-(delta / 10000))) * favourite.bboostTemp + tempDelta;
        favourite.bboostTempLastMeasured = d;
        return favourite;
    }

    

    Bboost.redeemBboost = function(id, cb) {
        Bboost.findById(id, function(err, bboost) {
            if (!err) {
                if (bboost.isUsed) {
                    cb('BOOST_USED', null);
                } else {
                    app.models.Favourite.findById(bboost.favouriteId, function(err, favourite) {
                        if (!err) {
                            app.models.Blacklist.isListedCache(favourite.user.id, function(err, flag) {
                                if (flag) {
                                    return cb("BLACKLISTED_USER", null);
                                } else {
                                    favourite.bid = Math.max(0, parseInt(favourite.bid) + parseInt(bboost.value));
                                    bboost.isUsed = true;
                                    bboost.save();
                                    favourite = Bboost.calcTemp(favourite);
                                    debug('bboost temp %d', favourite.bboostTemp);
                                    debug('bboostTempLastMeasured %s', favourite.bboostTempLastMeasured.getTime());
                                    favourite.save(function(err, instance) {
                                        if (err) {
                                            cb(err, null);
                                        } else {
                                            app.models.Favourite.setInRankCache(instance);
                                            app.models.Favourite.rank(favourite.preferenceId, function(err, data) {
                                                if (err) {
                                                    cb(err, null);
                                                } else {
                                                    app.models.Favourite.broadcastRank(favourite.preferenceId, function(err, data) {
                                                        if (err) {
                                                            cb(err, null);
                                                        } else {
                                                            app.models.Favourite.findById(favourite.id, function(err, favourite) {
                                                                if (err) {
                                                                    cb(err, null);
                                                                    app.models.Favourite.broadcastFavouriteUpdate(favourite);
                                                                } else {
                                                                    app.models.Favourite.broadcastFavouriteUpdate(favourite);

                                                                    cb(null, bboost.value);
                                                                }

                                                            })
                                                        }

                                                    });
                                                }
                                            });


                                        }
                                    });
                                }
                            })

                        } else {
                            cb(err, null);
                        }
                    });
                }
            } else {
                cb(err, null);
            }
        })
    }

    Bboost.broadcastBboost = function(bboost) {
        if (!self.sockets) {
            console.warn("No Favourite sockets.");
            return;
        }
        self.sockets.emit("readModel:Bboost", bboost);
    }

    Bboost.getBboosts = function(favouriteId, cb) {
        async.parallel({
            items: function(cb) {
                Bboost.find({ where: { isUsed: false, favouriteId: favouriteId }, limit: 50, order: 'createdAt DESC' }, function(err, bboosts) {
                    cb(err, bboosts);
                })
            },
            count: function(cb) {
                Bboost.count({ isUsed: false, favouriteId: favouriteId }, function(err, count) {
                    cb(err, count)
                })
            }
        }, function(err, result) {
            cb(err, result);
        });

    };

    Bboost.remoteMethod('getBboosts', {
        http: {
            path: '/getBboosts',
            verb: 'GET'
        },
        accepts: [{
            arg: 'favouriteId',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });

    Bboost.remoteMethod('redeemBboost', {
        http: {
            path: '/redeemBboost',
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

}
