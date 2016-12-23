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
            "Narendra Modi Mitron ko boost",
            "Virat Kohli BC boost",
            "KKR 2 Rupees ka boost",
            "Sunny Leone Big boost",
            "Rajnikant Yenna Rascala boost",
            "RaGa Chhota bhim boost",
            "Nucleya Bass boost",
            "Kejriwal Honest boost",
            "Sundar Pichai Google boost",
            "Baba Ramdev Karne se hoga boost",
            "Mahi Maar reha hai boost"
        ];
        return names[parseInt(Math.random() * names.length)]
    }

    Bboost.getValue = function() {
        var values = [-1000, -900, -800, -700, -600, -500, -400, -300, -200, -100, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
        return values[parseInt(Math.random() * values.length)];
    }

    Bboost.issueBoosts = function(preferenceId) {
        debug('boosting preference %s', preferenceId);
        app.models.Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            debug("Error %s".red, err);
            debug("favourites count %d".green, favourites.length);
            async.each(favourites, function(favourite, cb) {
                debug('favourite id %s', favourite.id);
                favourite.bboosts.create({ value: Bboost.getValue(), name: Bboost.getName() }, function(err, bboost) {
                	if(!err){
                		Bboost.broadcastBboost(bboost);
                	}
                    cb(err);
                });
            }, function(err) {
                debug(err);
            });
        });

    }

    Bboost.redeemBoost = function(id, cb) {
        Bboost.findById(id, function(err, bboost) {
            if (!err) {
                if (bboost.isUsed) {
                    cb('BOOST_USED', null);
                } else {
                    app.models.Favourite.findById(bboost.favouriteId, function(err, favourite) {
                        if (!err) {
                            favourite.bid = Math.max(0, parseInt(favourite.bid) + parseInt(bboost.value));
                            bboost.isUsed = true;
                            bboost.save();
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

    Bboost.remoteMethod('redeemBoost', {
        http: {
            path: '/redeemBoost',
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
