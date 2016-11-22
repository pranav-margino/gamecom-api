var app = require('../../server/server');
var io = require('../../modules/io');
var _ = require('lodash');
var async = require('async');

module.exports = function(Favourite) {
    var self = this;






    Favourite.peopleEndorsements = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {

            if (!err) {
                var userFavourites = _.partition(favourites, function(favourite) {
                    if (favourite.user.id == userId) {
                        return true;
                    } else {
                        return false;
                    }
                })[0];

                async.map(userFavourites, function(userFavourite, cb) {
                    userFavourite.endorsements({}, function(err, endorsements) {
                        //var productEndorsements = [];
                        var productEndorsements = _.map(endorsements, function(endorsement) {
                            var product = userFavourite.product;
                            if (product.description) {
                                delete product.description;
                            }
                            endorsement.product = product;
                            return endorsement;
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

    Favourite.peopleContests = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {

            if (!err) {
                var userFavourites = _.partition(favourites, function(favourite) {
                    if (favourite.user.id == userId) {
                        return true;
                    } else {
                        return false;
                    }
                })[0];

                async.map(userFavourites, function(userFavourite, cb) {
                    userFavourite.contests({}, function(err, contests) {
                        //var productEndorsements = [];
                        var productContests = _.map(contests, function(contest) {
                            var product = userFavourite.product;
                            if (product.description) {
                                delete product.description;
                            }
                            contest.product = product;
                            return contest;
                        });

                        cb(err, productContests);
                    })
                }, function(err, result) {
                    return cb(err, _.flatten(result));
                });


            } else {
                return cb(err, null);
            }
        });
    }

    Favourite.remoteMethod('peopleContests', {
        http: {
            path: '/peopleContests',
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

    Favourite.userEndorsements = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            async.map(favourites, function(favourite, cb) {
                favourite.endorsements({}, function(err, endorsements) {

                    var endorsementsObj = [];
                    var endorsedByUser = _.filter(endorsements, function(endorsement) {
                        return endorsement.user.id == userId;

                    });

                    _.forEach(endorsedByUser, function(e) {
                        delete e.user;
                        e.user = favourite.user;
                        e.product = favourite.product;
                        endorsementsObj.push(e);
                    });


                    cb(err, endorsementsObj);



                })
            }, function(err, result) {
                return cb(err, _.flatten(result));
            });
        });
    }

    Favourite.userContests = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            async.map(favourites, function(favourite, cb) {
                favourite.contests({}, function(err, contests) {
                    var contestsArray = [];
                    var contestedByUser = _.filter(contests, function(contest) {
                        return contest.user.id == userId;
                    });
                    _.forEach(contestedByUser, function(e) {
                        delete e.user;
                        e.user = favourite.user;
                        e.product = favourite.product;
                        contestsArray.push(e);
                    });
                    cb(err, contestsArray);
                })
            }, function(err, result) {
                return cb(err, _.flatten(result));
            });
        });
    }

    Favourite.userOverbids = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            if (!err) {
                async.map(favourites, function(favourite, cb) {
                    favourite.overbids({}, function(err, overbids) {
                        cb(err, _.filter(overbids, function(overbid) {
                            return overbid.user.id == userId;
                        }));
                    });
                }, function(err, result) {
                    return cb(err, _.flatten(result));
                });
            }

        })
    };


    Favourite.rank = function(preferenceId) {
        Favourite.find({ where: { preferenceId: preferenceId } }, function(err, favourites) {
            //console.log(favourites);
            var favouriteGroups = _.groupBy(favourites, function(favourite) {
                return favourite.product.id;
            });

            for (var key in favouriteGroups) {
                var group = favouriteGroups[key];
                group.sort(function(a, b) {
                    if (a.bid > b.bid) {
                        return 1;
                    } else if (a.bid < b.bid) {
                        return -1;
                    } else {
                        //both bid are equal
                        if (new Date(a.createdAt).getTime() < new Date(b.createdAt).getTime()) {
                            return 1;
                        } else if (new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime()) {
                            return -1;
                        } else {
                            return 0;
                        }

                    }
                });

                
                for (var i = 0; i < group.length; i++) {
                    group[i].rank = group.length - i;
                    group[i].save();
                }

                console.log("ranked favourites");


            }



        });
    }



    Favourite.remoteMethod('userOverbids', {
        http: {
            path: '/userOverbids',
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


    Favourite.remoteMethod('userContests', {
        http: {
            path: '/userContests',
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


    Favourite.remoteMethod('userEndorsements', {
        http: {
            path: '/userEndorsements',
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
                    Favourite.rank(instance.preferenceId);
                    broadcastFavourite(instance);
                    //calculateRank(instance);
                }
            });
            next();
        } else {
            next();
        }
    });



    Favourite.observe('before delete', function(ctx, next) {
        var instance = ctx.instance;
        console.log(instance);
        var value = 0;
        if (instance.product && instance.product.value) {
            value = instance.product.value;
        }
        
        app.models.Consumer.updatePoints(instance.user.id, value, function(err, cb) {

        });
        next();
    });

    Favourite.observe('after delete', function(ctx, next){
        Favourite.rank(ctx.instance.preferenceId);
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
