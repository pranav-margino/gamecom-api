var app = require('../../server/server');
var io = require('../../modules/io');
var _ = require('lodash');
var async = require('async');
var debug = require('debug')('favourite');
var colors = require('colors');


module.exports = function(Favourite) {
    var self = this;


    self.sockets = null;




    Favourite.peopleEndorsements = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { 'product.comments': 0, 'product.description': 0 } }, function(err, favourites) {

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
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { 'product.comments': 0, 'product.description': 0 } }, function(err, favourites) {

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





    Favourite.userEndorsements = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { 'product.comments': 0, 'product.description': 0 } }, function(err, favourites) {
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
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { 'product.comments': 0, 'product.description': 0 } }, function(err, favourites) {
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
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { 'product.comments': 0, 'product.description': 0, 'user.facebookId': 0 } }, function(err, favourites) {
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

    Favourite.userUnderbids = function(preferenceId, userId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { 'product.comments': 0, 'product.description': 0 } }, function(err, favourites) {
            if (!err) {
                async.map(favourites, function(favourite, cb) {
                    favourite.underbids({}, function(err, underbids) {
                        cb(err, _.filter(underbids, function(underbid) {
                            return underbid.user.id == userId;
                        }));
                    });
                }, function(err, result) {
                    return cb(err, _.flatten(result));
                });
            }

        })
    };

    Favourite.userStats = function(preferenceId, userId, cb) {
        var self = this;
        async.parallel({
            endorsedByCount: function(callback) {
                self.peopleEndorsements(preferenceId, userId, function(err, data) {
                    callback(err, data.length);
                });
            },
            endorsedCount: function(callback) {
                self.userEndorsements(preferenceId, userId, function(err, data) {
                    callback(err, data.length);
                });
            },
            contestedByCount: function(callback) {
                self.peopleContests(preferenceId, userId, function(err, data) {
                    callback(err, data.length);
                });
            },
            contestsCount: function(callback) {
                self.userContests(preferenceId, userId, function(err, data) {
                    callback(err, data.length);
                });
            },
            overbidsCount: function(callback) {
                self.userOverbids(preferenceId, userId, function(err, data) {
                    callback(err, data.length);
                });
            },
            underbidsCount: function(callback) {
                self.userUnderbids(preferenceId, userId, function(err, data) {
                    callback(err, data.length);
                });
            }
        }, function(err, results) {
            return cb(err, results);
        });
    };



    Favourite.rank = function(preferenceId, cb) {
        Favourite.find({
            where: { preferenceId: preferenceId },
            fields: {
                id: true,
                productId: true,
                bid: true,
                createdAt: true
            }
        }, function(err, favourites) {
            if (err) {
                return cb(err, null);
            }
            var favouriteGroups = _.groupBy(favourites, function(favourite) {
                return favourite.productId;
            });
            var rankedFavourites = [];
            for (var key in favouriteGroups) {
                var group = favouriteGroups[key];
                group.sort(function(a, b) {
                    if (parseInt(a.bid) != parseInt(b.bid)) {
                        return parseInt(a.bid) - parseInt(b.bid);
                    } else {
                        if (parseInt(new Date(a.createdAt).getTime()) != parseInt(new Date(b.createdAt).getTime())) {
                            var val = parseInt(new Date(b.createdAt).getTime()) - parseInt(new Date(a.createdAt).getTime());
                            return val;
                        } else {
                            return 1;
                        }
                    }
                });

                for (var i = 0; i < group.length; i++) {
                    group[i].rank = group.length - i;
                    rankedFavourites.push(group[i]);
                }
            }
            async.each(rankedFavourites, function(favourite, callback) {
                favourite.updateAttribute('rank', favourite.rank, function(err, instance) {
                    callback(err);
                })
            }, function(err) {
                if (err) {
                    return cb(err, null)
                } else {
                    return cb(null, true);
                }
            });
        });
    }

    Favourite.getRankHash = function(preferenceId, cb) {
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { rank: true, id: true } }, function(err, favourites) {
            var rankHash = [];
            for (var i = 0; i < favourites.length; i++) {
                rankHash.push({ id: favourites[i].id, rank: favourites[i].rank });
            }
            return cb(err, rankHash);
        });
    }

    Favourite.broadcastFavourite = function(favouriteObj) {
        if (!self.sockets) {
            console.warn("No Favourite sockets.");
            return;
        }
        self.sockets.emit("readModel:Favourite", favouriteObj);
    }

    Favourite.broadcastFavouriteUpdate = function(favouriteObj) {
        if (!self.sockets) {
            console.warn("No Favourite sockets.");

            return;
        }
        console.log('broadcastFavouriteUpdate');
        self.sockets.emit("updateModel:Favourite", favouriteObj);
    }

    Favourite.broadcastUnfavourite = function(favouriteObj) {
        if (!self.sockets) {
            console.warn("No Favourite sockets.");
            return;
        }
        self.sockets.emit("deleteModel:Favourite", favouriteObj);
    }

    Favourite.broadcastRank = function(preferenceId, cb) {
        if (!self.sockets) {
            console.warn("No Favourite sockets.");
            return cb("No sockets available", null);
        }
        Favourite.getRankHash(preferenceId, function(err, rankHash) {
            if (!err) {
                self.sockets.emit("updateModelAttr:Favourite:Rank", rankHash);
                return cb(null, true);
            } else {
                return cb(err, null);
            }
        });
    }












    Favourite.observe('before save', function(ctx, next) {
        var instance = ctx.instance;
        if (ctx.isNewInstance) {
            instance.bid = 0;
            instance.productId = instance.product.id;
            instance.userId = instance.user.id;
            next();
        } else {
            next();
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
                    Favourite.rank(instance.preferenceId, function(err, data) {
                        if (!err) {
                            Favourite.broadcastRank(instance.preferenceId, function(err, data) {
                                if (err) {
                                    next();
                                }
                                Favourite.findById(instance.id, function(err, favourite) {
                                    if (!err) {
                                        app.models.Favourite.broadcastFavourite(favourite);
                                    }
                                    next();
                                })

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



    Favourite.observe('before delete', function(ctx, next) {
        var instance = ctx.instance;
        var value = 0;
        if (instance.product && instance.product.value) {
            value = instance.product.value;
        }
        app.models.Consumer.updatePoints(instance.user.id, value, function(err, cb) {
            next();
        });
    });

    Favourite.observe('after delete', function(ctx, next) {

        Favourite.rank(ctx.instance.preferenceId, function(err, data) {
            if (err) {
                next();
            } else {
                Favourite.broadcastRank(ctx.instance.preferenceId, function(err, data) {
                    Favourite.broadcastUnfavourite(ctx.instance);
                    next();
                });
            }

        });
    });




    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        //console.log(sockets);
        //debug("Favourite sockets connected.".green);

    });








    Favourite.remoteMethod('userStats', {
        http: {
            path: '/userStats',
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
            type: 'Object'
        }
    });




    Favourite.remoteMethod('getRankHash', {
        http: {
            path: '/getRankHash',
            verb: 'GET'
        },
        accepts: [{
            arg: 'preferenceId',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });

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

    Favourite.remoteMethod('userUnderbids', {
        http: {
            path: '/userUnderbids',
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






}
