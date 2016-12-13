var app = require('../../server/server');
var io = require('../../modules/io');
var util = require('../../modules/util');
var _ = require('lodash');
var debug = require('debug')('overbid');
var colors = require('colors');

module.exports = function(Overbid) {

    var self = this;
    self.sockets = null;


    Overbid.validate('hasManifestId', function(err) {
        if (!this.manifestId) {
            err();
        }
    }, { message: 'manifestId is missing' });

    Overbid.validateAsync('validManifest', function(err, done) {
        var self = this;

        app.models.Manifest.findByIdCache(this.manifestId, function(error, manifest) {
            if (error || !manifest) {
                err();
                done();
            } else {
                //has recent overbid
                if (manifest.hasRecent) {
                    debug('manifest hasRecent'.red);
                    err();
                }
                //check if user id is matched
                if (manifest.userId !== self.user.id) {
                    debug('manifest userId not matched'.red);
                    err();
                }
                //check if productId is matched
                if (manifest.productId !== self.product.id) {
                    debug('manifest productId not matched'.red);
                    err();
                }
                //check if favouriteId is matched
                if (manifest.favouriteId != self.favouriteId) {
                    debug('manifest favouriteId not matched'.red);
                    err();
                }
                // check if values are in range
                debug(manifest.values);
                if (manifest.values.indexOf(self.value) == -1) {
                    debug('manifest values not in range'.red);
                    err();
                }

                if (new Date(manifest.createdAt).getTime() < (new Date().getTime() - (manifest.expiresIn * 1000))) {
                    debug('manifest expired'.red);
                    err();
                }
                done();
            }
        });
    }, { message: 'invalid manifest values' });

    Overbid.getManifest = function(favouriteId, userId, cb) {
        util.getManifestCache(favouriteId, userId, "Overbid", function(err, data) {
            return cb(err, data);
        });

    }

    Overbid.remoteMethod('getManifest', {
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










    Overbid.observe('after save', function(ctx, next) {
        debug('after save overbid');
        if (ctx.isNewInstance) {
            debug('new instance');
            debug('instance id %s', ctx.instance.id);
            app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                if (!err && favourite != null) {
                    app.models.Favourite.setModelStatsCache(favourite, "Overbid");
                    app.models.Consumer.getPointsCache(ctx.instance.user.id, function(err, points) {
                        if (points >= ctx.instance.value) {
                            app.models.Consumer.updatePointsCache(ctx.instance.user.id, -ctx.instance.value, function(err, data) {
                                if (err) {
                                    next();
                                } else {
                                    favourite.bid = Math.max(0, parseInt(favourite.bid) + parseInt(ctx.instance.value));
                                    favourite.save(function(err, instance) {
                                        if (err) {
                                            next();
                                        } else {
                                            //push favourite to cache
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





    function broadcastFavouriteUpdate(favouriteObj) {
        if (!self.sockets) {
            debug("No Favourite sockets.".red);
            return;
        }
        self.sockets.emit("updateModel:Favourite", favouriteObj);
    }

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;

    });




}
