var app = require('../../server/server');
var io = require('../../modules/io');
var _ = require('lodash');
var async = require('async');

module.exports = function(Favourite) {
    var self = this;


    Favourite.overbid = function(id, value, cb) {
        Favourite.findById(id, function(err, favourite) {
            if (!err) {
                favourite.overbid = favourite.overbid + Math.abs(value);
                favourite.overbidAt = new Date();
                favourite.save();
                app.models.Consumer.updatePoints(favourite.user.id, -value, function(err, points) {
                    if (!err) {
                        broadcastOverbid({
                            user: favourite.user,
                            product: favourite.product,
                            value: value
                        });
                        cb(null, favourite);

                    } else {
                        cb(err, null);
                    }

                });
            } else {
                return cb(err, null);
            }
        })
    };

    Favourite.peopleEndorsements = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            //cb(err, favourites);
            var userFavourites = [];

            if (!err) {
                userFavourites = _.partition(favourites, function(favourite) {
                    if (favourite.user.id == userId) {
                        return true;
                    } else {
                        return false;
                    }
                })[0];

                async.map(userFavourites, function(userFavourite, cb) {
                    userFavourite.endorsements({}, function(err, endorsements) {
                        var productEndorsements = [];
                        _.forEach(endorsements, function(endorsement) {
                            var product = userFavourite.product;
                            if (product.description) {
                                delete product.description;
                            }
                            endorsement.product = product;
                            productEndorsements.push(endorsement);
                        });

                        cb(err, productEndorsements);
                    })
                }, function(err, result) {
                    return cb(err, _.flatten(result));
                });


            } else {
                return cb(err, null);
            }
        });
    }

    Favourite.userEndorsements = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            async.map(favourites,function(favourite,cb){

            },function(err,result){
                
            });
        });
    }



    Favourite.remoteMethod('peopleEndorsements', {
        http: {
            path: '/peopleEndorsements',
            verb: 'GET'
        },
        accepts: [{
            arg: 'preferenceId',
            type: 'string'
        }, {
            arg: 'userId',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });


    Favourite.remoteMethod('overbid', {
        http: {
            path: '/overbid',
            verb: 'POST'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }, {
            arg: 'value',
            type: 'Number'
        }],
        returns: {
            arg: 'result',
            type: 'object'
        }
    });


    Favourite.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            var instance = ctx.instance;
            var value = 0;
            if (instance.product && instance.product.value) {
                value = instance.product.value;
            }
            app.models.Consumer.updatePoints(instance.user.id, -value, function(err, cb) {
                if (!err) {
                    broadcastFavourite(instance);
                }
            });
            next();
        } else {
            next();
        }
    });

    Favourite.observe('before delete', function(ctx, next) {
        var instance = ctx.instance;
        var value = 0;
        if (instance.product && instance.product.value) {
            value = instance.product.value;
        }
        app.models.Consumer.updatePoints(instance.user.id, value, function(err, cb) {

        });
        next();
    });

    function broadcastOverbid(overbidObj) {
        if (!self.sockets) {
            console.warn("No overbid sockets.");
            return;
        }
        self.sockets.emit("readModel:Overbid", overbidObj);
    }

    function broadcastFavourite(favouriteObj) {
        if (!self.sockets) {
            console.warn("No Favourite sockets.");
            return;
        }
        self.sockets.emit("readModel:Favourite", favouriteObj);
    }

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        console.log("Favourite sockets working.");

    });

}
