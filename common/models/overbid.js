var app = require('../../server/server');
var io = require('../../modules/io');
var moment = require('moment');
var _ = require('lodash');


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
        app.models.Manifest.findById(this.manifestId, function(error, manifest) {
            if (error || !manifest) {
                err();
                done();
            } else {
                console.log(manifest);
                //has recent overbid
                if(manifest.hasRecent){
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

                // check if values are in range
                if (manifest.values.indexOf(self.value) == -1) {
                    err();
                }
                 
                done();
            }
        });
    }, { message: 'invalid manifest' });







    Overbid.observe('before save', function(ctx, next) {
        //console.log(ctx.instance);
        next();
    });

    Overbid.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                if (!err) {
                    app.models.Consumer.getPoints(ctx.instance.user.id, function(err, points) {
                        if (points >= ctx.instance.value) {
                            favourite.bid = Math.max(0, parseInt(favourite.bid) + parseInt(ctx.instance.value));
                            favourite.save();
                            app.models.Favourite.rank(favourite.preferenceId);
                            //self.sockets
                            broadcastFavouriteUpdate(favourite);
                            app.models.Favourite.rank(favourite.preferenceId);
                            app.models.Consumer.updatePoints(ctx.instance.user.id, -ctx.instance.value, function(err, data) {
                                next();
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

    function getValues(points, maxOverbidValue, minOverbidValue, stepsOf) {
        var range;
        var values = [];
        if (points < minOverbidValue) {
            range = null;
        }
        if (points > maxOverbidValue) {
            range = [minOverbidValue, maxOverbidValue];
        }

        if (points >= minOverbidValue && points <= maxOverbidValue) {
            range = [minOverbidValue, points];
        }
        if (range) {
            values.push(range[0]);
            while (values[values.length - 1] < range[1]) {
                values.push(values[values.length - 1] + stepsOf);
            }
        }

        return values;

    }

    Overbid.getManifest = function(favouriteId, userId, cb) {
        app.models.Favourite.findById(favouriteId, function(err, favourite) {
            if (err) {
                return cb(err, null);
            }
            if (favourite.user.id !== userId) {
                return cb("mismatched favourite and user", null);
            }
            app.models.Preference.findById(favourite.preferenceId, function(err, preference) {
                if (err) {
                    return cb(err, null);
                }
                var maxOverbidValue = preference.maxOverbidValue;
                var minOverbidValue = preference.minOverbidValue;
                var overbidInterval = preference.overbidInterval;
                var stepsOfOverbid = preference.stepsOfOverbid;

                favourite.overbids({ where: { 'user.id': userId } }, function(err, overbids) {
                    if (err) {
                        return cb(err, null);
                    }
                    app.models.Consumer.getPoints(userId, function(err, points) {
                        if (err) {
                            return cb(err, null);
                        }

                        if (overbids.length == 0) {
                            //has no overbids
                            app.models.Manifest.create({

                                context: "overbid",
                                userId: userId,
                                productId: favourite.product.id,
                                favouriteId: favouriteId,
                                values: getValues(points, maxOverbidValue, minOverbidValue, stepsOfOverbid)
                            }, function(err, manifest) {
                                return cb(err, manifest);
                            });

                        }

                        if (overbids.length > 0) {
                            var lastOverbid = _.sortBy(overbids, 'createdAt').pop();
                            if (new Date(lastOverbid.createdAt).getTime() > new Date().getTime() - (overbidInterval * 1000)) {
                                var nextPossible = moment(moment(lastOverbid.createdAt).add((overbidInterval / 60), 'minutes')).toDate();
                                //has recent overbid
                                app.models.Manifest.create({
                                    hasRecent: true,
                                    context: "overbid",
                                    userId: userId,
                                    productId: favourite.product.id,
                                    favouriteId: favouriteId,
                                    values: [],
                                    nextPossible: nextPossible
                                }, function(err, manifest) {
                                    return cb(err, manifest);
                                });



                            } else {
                                // does not have recent overbid
                                app.models.Manifest.create({

                                    context: "overbid",
                                    userId: userId,
                                    productId: favourite.product.id,
                                    favouriteId: favouriteId,
                                    values: getValues(points, maxOverbidValue, minOverbidValue, stepsOfOverbid)
                                }, function(err, manifest) {
                                    return cb(err, manifest);
                                });


                            }

                        }




                    });

                    //return cb(null, { maxOverbidValue: maxOverbidValue, minOverbidValue: minOverbidValue });
                    //return cb(err, overbids);
                });

                //return cb(null, { maxOverbidValue: maxOverbidValue, minOverbidValue: minOverbidValue });
            });
        });
        //return cb(null, { hasRecentOverbid: false });
    }

    function broadcastFavouriteUpdate(favouriteObj) {
        if (!self.sockets) {
            console.warn("No Favourite sockets.");
            return;
        }
        //console.log('broadcastFavouriteUpdate');
        self.sockets.emit("updateModel:Favourite", favouriteObj);
    }

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        console.log("Overbid sockets working.");

    });

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


}
