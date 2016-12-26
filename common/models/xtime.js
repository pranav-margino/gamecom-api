var app = require('../../server/server');
var io = require('../../modules/io');
var cache = require('../../modules/cache');
var _ = require('lodash');
var async = require('async');
var debug = require('debug')('xtime');
var colors = require('colors');
var moment = require('moment');

module.exports = function(Xtime) {

    var self = this;


    self.sockets = null;



    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        debug("bboost sockets connected.".green);
    });

    Xtime.getName = function() {
        var names = [
            "Engineering special",
            "Medical special"
        ];
        return names[parseInt(Math.random() * names.length)];
    }

    Xtime.getValue = function() {
        var values = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 5, 5, 5, 5, 10, 10, 10, 30];
        return values[parseInt(Math.random() * values.length)];
    }

    Xtime.issueXtimes = function(preferenceId) {
        debug('xtiming preference %s', preferenceId);
        app.models.Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            debug("Error %s".red, err);
            debug("favourites count %d".green, favourites.length);
            async.each(favourites, function(favourite, cb) {
                debug('issued on favourite id %s', favourite.id);
                debug(Xtime.getValue());
                favourite.xtimes.create({
                    value: Xtime.getValue(),
                    name: Xtime.getName(),
                    expiresOn: moment().add(60, 's')
                }, function(err, xtime) {
                    //debug(JSON.stringify(xtime));
                    if (!err) {
                        Xtime.broadcastXtime(xtime);
                    }
                    cb(err);
                });
            }, function(err) {
                debug(err);
            });
        });
    }

    Xtime.redeemXtime = function(id, cb) {
        Xtime.findById(id, function(err, xtime) {
            if (!err) {
                if (xtime.isUsed) {
                    cb('XTIME_USED', null);
                } else {
                    app.models.Favourite.findById(xtime.favouriteId, function(err, favourite) {
                        if (!err) {
                            app.models.Blacklist.isListedCache(favourite.user.id, function(err, flag) {
                                if (flag) {
                                    return cb("BLACKLISTED_USER", null);
                                } else {




                                    favourite.xtimeValue = xtime.value;
                                    favourite.xtimeExpiresOn = xtime.expiresOn;
                                    xtime.isUsed = true;
                                    xtime.save();



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

                                                                    cb(null, true);
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

    Xtime.broadcastXtime = function(xtime) {
        if (!self.sockets) {
            console.warn("No Xtime sockets.");
            return;
        }
        self.sockets.emit("readModel:Xtime", xtime);
    }

    Xtime.remoteMethod('redeemXtime', {
        http: {
            path: '/redeemXtime',
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