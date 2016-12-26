var app = require('../../server/server');
var io = require('../../modules/io');
var util = require('../../modules/util');
module.exports = function(Endorsement) {
    var self = this;
    self.sockets = null;



    Endorsement.validate('hasManifestId', function(err) {
        if (!this.manifestId) {
            err();
        }
    }, { message: 'manifestId is missing' });

    Endorsement.validateAsync('validManifest', function(err, done) {
        var self = this;
        app.models.Manifest.findById(this.manifestId, function(error, manifest) {
            if (error || !manifest) {
                err();
                done();
            } else {
                //has recent
                if (manifest.hasRecent) {
                    err();
                }
                //check if user id is matched
                if (manifest.userId !== self.user.id) {
                    err();
                }
                //check if productId is matched
                if (manifest.productId !== self.product.id) {
                    err();
                }
                //check if favouriteId is matched
                if (manifest.favouriteId != self.favouriteId) {
                    err();
                }
                // check if values are in range
                if (manifest.values.indexOf(self.value) == -1) {
                    err();
                }

                if (new Date(manifest.createdAt).getTime() < (new Date().getTime() - (manifest.expiresIn * 1000))) {
                    err();
                }
                done();
            }
        });
    }, { message: 'invalid manifest values' });



    Endorsement.getManifest = function(favouriteId, userId, cb) {
        util.getManifestCache(favouriteId, userId, "Endorsement", function(err, data) {
            return cb(err, data);
        });

    }

    Endorsement.broadcastEndorsement = function(endorsementObj) {
        if (!self.sockets) {
            console.warn("No Endorsement sockets.");
            return;
        }
        self.sockets.emit("readModel:Endorsement", endorsementObj);
    }




    Endorsement.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                if (!err && favourite != null) {
                    app.models.Favourite.setModelStatsCache(favourite, "Endorsement");

                    app.models.Consumer.getPointsCache(ctx.instance.user.id, function(err, points) {
                        if (err) {
                            next();
                        }
                        if (points >= ctx.instance.value) {
                            app.models.Consumer.updatePointsCache(ctx.instance.user.id, -parseInt(ctx.instance.value / favourite.xtimeValue), function(err, data) {
                                if (err) {
                                    next();
                                } else {
                                    favourite.bid = Math.max(0, parseInt(favourite.bid) + parseInt(ctx.instance.value));
                                    favourite.save(function(err, instance) {
                                        if (err) {
                                            next();
                                        } else {
                                            app.models.Favourite.setInRankCache(instance);
                                            app.models.Favourite.rank(favourite.preferenceId, function(err, data) {
                                                if (err) {
                                                    next();
                                                } else {
                                                    app.models.Favourite.broadcastRank(favourite.preferenceId, function(err, data) {
                                                        if (err) {
                                                            next();
                                                        }
                                                        app.models.Favourite.findById(favourite.id, function(err, favourite) {
                                                            if (!err) {
                                                                app.models.Favourite.broadcastFavouriteUpdate(favourite);
                                                            }
                                                            next();
                                                        })

                                                    });
                                                }
                                            });


                                        }

                                    });
                                }
                            });
                        } else {
                            next();
                        }
                    });
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    });

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
    });



    Endorsement.remoteMethod('getManifest', {
        http: {
            path: '/getManifest',
            verb: 'GET'
        },
        accepts: [{
            arg: 'favouriteId',
            type: 'string'
        }, {
            arg: 'userId',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });
}
