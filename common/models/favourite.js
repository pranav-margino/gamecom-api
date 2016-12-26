var app = require('../../server/server');
var io = require('../../modules/io');
var cache = require('../../modules/cache');
var _ = require('lodash');
var async = require('async');
var debug = require('debug')('favourite');
var colors = require('colors');


module.exports = function(Favourite) {
    var self = this;


    self.sockets = null;
    self.cClient = null;
    self.cConfig = {};

    cache.on('ready', function(client, config) {

        self.cClient = client;
        self.cConfig = config;
        debug("Favourite cache connected".green);


        if (self.cClient) {
            self.cClient.notifier.on('message', function(pattern, channelPattern, emittedKey) {
                var channel = this.parseMessageChannel(channelPattern);
                if (channel.key == 'expired') {

                    if (/preference-.*-rank/.test(emittedKey)) {

                        Favourite.rankFromDb(emittedKey.split("-")[1], function() {});
                    }
                }
            });
        }

    });

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        debug("Favourite sockets connected.".green);
    });



    Favourite.findByIdCache = function(id, cb) {
        if (!self.cClient) {
            debug("no cache client".red);
            Favourite.findById.apply(null, arguments);
        } else {
            self.cClient.hget("favourite", id, function(err, favourite) {
                if (!err && favourite != null) {
                    debug('findByIdCache'.blue);
                    cb(null, favourite);
                } else {
                    Favourite.findById(id, function(err, favourite) {
                        if (!err) {
                            self.cClient.hset("favourite", id, JSON.stringify(favourite));
                            cb(null, favourite);
                        } else {
                            cb(err, null);
                        }

                    });
                }
            });
        }
    }




    Favourite.peopleEndorsements = function(preferenceId, userId, cb) {
        Favourite.find({
            where: { preferenceId: preferenceId },
            fields: { 'product.comments': 0, 'product.description': 0 }
        }, function(err, favourites) {

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
        Favourite.find({
            where: { preferenceId: preferenceId },
            fields: { 'product.comments': 0, 'product.description': 0 }
        }, function(err, favourites) {

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
        Favourite.find({
            where: { preferenceId: preferenceId },
            fields: { 'product.comments': 0, 'product.description': 0 }
        }, function(err, favourites) {
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
        Favourite.find({
            where: { preferenceId: preferenceId },
            fields: { 'product.comments': 0, 'product.description': 0 }
        }, function(err, favourites) {
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
        Favourite.find({
            where: { preferenceId: preferenceId },
            fields: { 'product.comments': 0, 'product.description': 0, 'user.facebookId': 0 }
        }, function(err, favourites) {
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
        Favourite.find({
            where: { preferenceId: preferenceId },
            fields: { 'product.comments': 0, 'product.description': 0 }
        }, function(err, favourites) {
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

    Favourite.getManifestVars = function(id, cb) {
        Favourite.findById(id, { fields: { userId: 1, preferenceId: 1, productId: 1, bid: 1, xtimeValue: 1, xtimeExpiresOn: 1 } }, function(err, vars) {
            cb(err, vars);
        });
    }

    Favourite.getManifestVarsCache = function(id, cb) {
        if (!self.cClient) {
            debug("no cache client");
            Favourite.getManifestVars.apply(null, arguments);
        } else {
            var key = ["manifest-vars-favourite", id].join("-");

            self.cClient.hmget(key, [
                "preferenceId",
                "productId",
                "userId",
                "bid",
                "xtimeValue",
                "xtimeExpiresOn"
            ], function(err, vars) {
                if (!err && vars.length == 4 && vars[0] != null && vars[1] != null && vars[2] != null && vars[3] != null && vars[4] != null && vars[5] != null) {
                    debug('FavouriteManifestVarsCache'.blue);
                    debug('key: %s', key);

                    cb(null, { preferenceId: vars[0], productId: vars[1], userId: vars[2], bid: vars[3], xtimeValue: vars[4], xtimeExpiresOn: vars[5] });
                } else {
                    Favourite.getManifestVars(id, function(err, vars) {
                        if (!err) {
                            debug('FavouriteManifestVarsDisc'.red);

                            self.cClient.hmset(key, 'preferenceId', vars.preferenceId.toString(), 'productId', vars.productId, 'userId', vars.userId, 'bid', vars.bid, 'xtimeValue', vars.xtimeValue, 'xtimeExpiresOn', vars.xtimeExpiresOn);
                            self.cClient.expire(key, self.cConfig.MANIFEST_VARS_FAVOURITE);
                            cb(null, vars);
                        } else {
                            cb(err, null);
                        }
                    });
                }
            });
        }
    }

    Favourite.setManifestVarsCache = function(favourite) {
        if (!self.cClient) {
            debug("no cache client".red);
            return;
        } else {
            var key = ["manifest-vars-favourite", favourite.id].join("-");
            //preferenceId = (typeof preferenceId == "string") preferenceId
            if (!favourite.preferenceId || !favourite.userId || !favourite.bid || !favourite.productId || !favourite.xtimeValue || !favourite.xtimeExpiresOn) {
                return;
            }
            self.cClient.hmset(key, 'preferenceId', favourite.preferenceId.toString(), 'productId', favourite.productId, 'userId', favourite.userId, 'bid', favourite.bid, 'xtimeValue', favourite.xtimeValue, 'xtimeExpiresOn', favourite.xtimeExpiresOn);
            self.cClient.expire(key, self.cConfig.MANIFEST_VARS_FAVOURITE);
            debug('setManifestVarsCache %s'.green, favourite.id);
        }
    };

    Favourite.unsetManifestVarsCache = function(favourite) {
        if (!self.cClient) {
            debug("no cache client".red);
            return;
        } else {
            var key = ["manifest-vars-favourite", favourite.id].join("-");

            self.cClient.del(key);


            debug('unsetManifestVarsCache %s'.green, favourite.id);
        }
    }

    Favourite.getActionStats = function(id, cb) {
        Favourite.findById(id, function(err, favourite) {
            if (!err) {
                async.parallel({
                    endorsements: function(callback) {
                        favourite.endorsements({}, function(err, endorsements) {
                            if (!err && endorsements != null && endorsements.length > 0) {
                                callback(null, { count: endorsements.length, lastAt: _.sortBy(endorsements, 'createdAt').pop().createdAt });
                            } else {
                                callback(null, { count: 0, lastAt: null });
                            }
                        })
                    },
                    contests: function(callback) {
                        favourite.contests({}, function(err, contests) {
                            if (!err && contests != null && contests.length > 0) {
                                callback(null, { count: contests.length, lastAt: _.sortBy(contests, 'createdAt').pop().createdAt });
                            } else {
                                callback(null, { count: 0, lastAt: null });
                            }
                        })
                    },
                    overbids: function(callback) {
                        favourite.overbids({}, function(err, overbids) {
                            if (!err && overbids != null && overbids.length > 0) {
                                callback(null, { count: overbids.length, lastAt: _.sortBy(overbids, 'createdAt').pop().createdAt });
                            } else {
                                callback(null, { count: 0, lastAt: null });
                            }
                        })
                    },
                    underbids: function(callback) {
                        favourite.underbids({}, function(err, underbids) {
                            if (!err && underbids != null && underbids.length > 0) {
                                callback(null, { count: underbids.length, lastAt: _.sortBy(underbids, 'createdAt').pop().createdAt });
                            } else {
                                callback(null, { count: 0, lastAt: null });
                            }

                        })
                    }
                }, function(err, results) {
                    cb(err, results);
                });
            } else {
                cb(err, null);
            }
        });
    }

    Favourite.getModelStats = function(id, modelName, cb) {
        var _modelName = modelName.toLowerCase() + "s";
        Favourite.findById(id, function(err, favourite) {
            if (!err) {
                favourite[_modelName]({}, function(err, docs) {
                    if (!err && docs != null && docs.length > 0) {
                        cb(null, { count: docs.length, lastAt: _.sortBy(docs, 'createdAt').pop().createdAt });
                    } else {
                        //very old date is needed
                        cb(null, { count: 0, lastAt: new Date("1 Jan 1970") });
                    }
                })

            } else {
                cb(err, null)
            }
        });
    }

    Favourite.getModelStatsCache = function(id, modelName, cb) {
        if (!self.cClient) {
            Favourite.getModelStats.apply(null, arguments);
        } else {
            var key = ['favourite', id, modelName.toLowerCase() + "s"].join("-");
            debug(key);

            self.cClient.hmget(key, 'count', 'lastAt', function(err, stats) {
                if (!err && stats.length == 2 && stats[0] != null) {

                    debug("FavouriteModelStatsCache".blue);
                    debug('key: %s', key);

                    cb(null, { count: parseInt(stats[0]), lastAt: new Date(stats[1]) });
                } else {
                    Favourite.getModelStats(id, modelName, function(err, stats) {
                        if (!err) {
                            debug("FavouriteModelStatsDisc".red);

                            self.cClient.hmset(key, 'count', stats.count, 'lastAt', stats.lastAt);
                            self.cClient.expire(key, self.cConfig.MODEL_STATS_FAVOURITE);
                            cb(null, stats);
                        } else {
                            cb(err, null);
                        }

                    });
                }
            })
        }
    }

    Favourite.setModelStatsCache = function(favourite, modelName) {
        if (!self.cClient) {
            debug("no cache client".red);
            return;
        } else {
            var key = ['favourite', favourite.id, modelName.toLowerCase() + "s"].join("-");
            self.cClient.hincrby(key, 'count', 1);
            self.cClient.hset(key, 'lastAt', new Date());
            self.cClient.expire(key, self.cConfig.MODEL_STATS_FAVOURITE);


        }
    }


    Favourite.remoteMethod('getModelStatsCache', {
        http: {
            path: '/getModelStatsCache',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }, {
            arg: 'modelName',
            type: "string"
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });

    Favourite.getBid = function(id, cb) {
        Favourite.findById(id, function(err, favourite) {
            if (err) {
                cb(err, null);
            } else {
                cb(null, favourite.bid);
            }
        });
    }

    Favourite.remoteMethod('getBid', {
        http: {
            path: '/getBid',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Number'
        }
    });



    Favourite.remoteMethod('getModelStats', {
        http: {
            path: '/getModelStats',
            verb: 'GET'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }, {
            arg: 'modelName',
            type: "string"
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });



    Favourite.remoteMethod('getActionStats', {
        http: {
            path: '/getActionStats',
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

    Favourite.remoteMethod('getManifestVars', {
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

    Favourite.remoteMethod('getManifestVarsCache', {
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



    Favourite.userStatsCache = function(preferenceId, userId, cb) {

        //check if preferenceId AND userId EXIST

        var key = ["user-stats", preferenceId, userId].join("-");
        debug(key.green);

        if (!self.cClient) {
            debug("no cache client".red);
            Favourite.userStats.apply(self, arguments);
        } else {
            self.cClient.hmget(key, [
                "endorsedByCount",
                "endorsedCount",
                "contestedByCount",
                "contestsCount",
                "overbidsCount",
                "underbidsCount"
            ], function(err, stats) {
                if (!err && stats.length == 6 && stats[0] != null && stats[1] != null && stats[2] != null && stats[3] != null && stats[4] != null && stats[5] != null) {
                    debug('FavouriteUserStatsCache'.blue);
                    cb(null, {
                        endorsedByCount: stats[0],
                        endorsedCount: stats[1],
                        contestedByCount: stats[2],
                        contestsCount: stats[3],
                        overbidsCount: stats[4],
                        underbidsCount: stats[5]
                    });
                } else {
                    Favourite.userStats(preferenceId, userId, function(err, stats) {
                        debug('FavouriteUserStatsDisc'.red);
                        if (!err && stats != null) {
                            self.cClient.hmset(key,
                                'endorsedByCount',
                                stats.endorsedByCount,
                                'endorsedCount',
                                stats.endorsedCount,
                                'contestedByCount',
                                stats.contestedByCount,
                                'contestsCount',
                                stats.contestsCount,
                                'overbidsCount',
                                stats.overbidsCount,
                                'underbidsCount',
                                stats.underbidsCount);
                            self.cClient.expire(key, self.cConfig.USER_STATS_FAVOURITE);
                            cb(null, stats);
                        } else {
                            cb(err, null);
                        }

                    });
                }
            });
        }



    };
    Favourite.setInRankCache = function(favourite) {
        debug("setInRankCache".blue);
        if (!self.cClient) {
            return;
        }
        var key = ['preference', favourite.preferenceId.toString(), 'rank'].join("-");
        debug("key %s", key);
        self.cClient.hset(key, favourite.id.toString(), [favourite.bid, favourite.createdAt, favourite.rank, favourite.productId].join("$"));
        self.cClient.expire(key, self.cConfig.RANK_FAVOURITE);

    }

    Favourite.setInUsersSetCache = function(favourite) {
        debug("setInUsersSetCache".blue);
        if (!self.cClient) {
            return;
        }
        var key = ['preference', favourite.preferenceId.toString(), 'favourites', 'list'].join("-");
        debug("key %s", key);
        self.cClient.sadd(key, favourite.user.id.toString());
        self.cClient.expire(key, self.cConfig.USERS_SET_FAVOURITE);
    }

    Favourite.unsetInUsersSetCache = function(favourite) {
        debug("unsetInUsersSetCache".blue);
        if (!self.cClient) {
            return;
        }
        var key = ['preference', favourite.preferenceId.toString(), 'favourites', 'list'].join("-");
        debug("key %s", key);
        self.cClient.srem(key, favourite.user.id.toString());
    }



    Favourite.getRankFromCache = function() {

    }


    Favourite.rankFunction = function(favourites) {
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
        return rankedFavourites;
    }

    Favourite.rankFromCache = function(preferenceId, cb) {
        debug("rankFromCacheStart".blue);
        if (!self.cClient) {
            return cb("no cache client", null);
        } else {
            var key = ['preference', preferenceId, 'rank'].join("-");
            self.cClient.hgetall(key, function(err, obj) {
                if (err) {
                    return cb(err, null);
                } else {
                    var favourites = [];
                    for (var key in obj) {
                        var propsArray = obj[key].split("$");
                        favourites.push({
                            id: key,
                            bid: parseInt(propsArray[0]),
                            createdAt: propsArray[1],
                            rank: parseInt(propsArray[2]),
                            productId: propsArray[3],
                            preferenceId: preferenceId
                        });
                    }
                    var rankedFavourites = Favourite.rankFunction(favourites);
                    for (var i = 0; i < rankedFavourites.length; i++) {
                        Favourite.setInRankCache(rankedFavourites[i]);
                    }
                    debug("rankFromCacheEnd".blue);
                    cb(null, true);
                }
            });
        }
    }



    Favourite.rankFromDb = function(preferenceId, cb) {
        debug('rankFromDbStart'.red);
        Favourite.find({
            where: { preferenceId: preferenceId }

        }, function(err, favourites) {
            if (err) {
                return cb(err, null);
            }
            var rankedFavourites = Favourite.rankFunction(favourites);
            async.each(rankedFavourites, function(favourite, callback) {
                favourite.updateAttribute('rank', favourite.rank, function(err, instance) {
                    Favourite.setInRankCache(instance);
                    callback(err);
                })
            }, function(err) {
                if (err) {
                    return cb(err, null)
                } else {

                    debug('rankFromDbEnd'.red);
                    return cb(null, true);
                }
            });
        });
    }



    Favourite.rank = function(preferenceId, cb) {
        var key = ['preference', preferenceId, 'rank'].join("-");
        var args = arguments;
        if (self.cClient) {

            Favourite.count({ preferenceId: preferenceId }, function(err, count) {
                if (err) {
                    Favourite.rankFromDb.apply(null, args);
                } else {
                    self.cClient.hlen(key, function(err, length) {
                        if (err) {
                            Favourite.rankFromDb.apply(null, args);
                        } else {
                            //db and cache are in sync
                            if (parseInt(length) == parseInt(count)) {
                                Favourite.rankFromCache.apply(null, args);
                            } else {
                                Favourite.rankFromDb.apply(null, args);
                            }
                        }
                    })
                }
            });


        } else {
            Favourite.rankFromDb.apply(null, arguments);
        }
    }

    Favourite.getRankHashFromDb = function(preferenceId, cb) {
        debug("getRankHashFromDb".red);
        Favourite.find({ where: { preferenceId: preferenceId }, fields: { rank: true, id: true } }, function(err, favourites) {
            var rankHash = [];
            for (var i = 0; i < favourites.length; i++) {
                rankHash.push({ id: favourites[i].id, rank: parseInt(favourites[i].rank) });
            }
            return cb(err, rankHash);
        });
    }
    Favourite.getRankHashFromCache = function(preferenceId, cb) {
        debug("getRankHashFromCache".blue);
        var key = ['preference', preferenceId, 'rank'].join("-");
        if (!self.cClient) {
            return cb("no cache client", null);
        } else {
            self.cClient.hgetall(key, function(err, obj) {
                if (err) {
                    return cb(err, null);
                } else {
                    var favourites = [];
                    for (var key in obj) {
                        var propsArray = obj[key].split("$");
                        favourites.push({
                            id: key,
                            bid: propsArray[0],
                            createdAt: propsArray[1],
                            rank: propsArray[2],
                            productId: propsArray[3],
                            preferenceId: preferenceId
                        });


                    }

                    var rankHash = [];
                    for (var i = 0; i < favourites.length; i++) {
                        rankHash.push({ id: favourites[i].id, rank: parseInt(favourites[i].rank) });
                    }
                    return cb(err, rankHash);

                }
            })
        }
    }

    Favourite.getRankHash = function(preferenceId, cb) {
        var args = arguments;
        var key = ['preference', preferenceId, 'rank'].join("-");
        if (self.cClient) {
            self.cClient.hlen(key, function(err, length) {
                if (err) {
                    Favourite.getRankHashFromDb.apply(null, args);
                } else {
                    if (length > 0) {
                        Favourite.getRankHashFromCache.apply(null, args);
                    } else {
                        Favourite.getRankHashFromDb.apply(null, args);
                    }
                }
            });
        } else {
            Favourite.getRankHashFromDb.apply(null, args);
        }
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
        debug("after save favourite");
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
                                        app.models.Favourite.setInUsersSetCache(favourite);
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
            //cache manifest vars
            var instance = ctx.instance;

            if (!self.cClient) {
                next();
            } else {

                Favourite.setManifestVarsCache(ctx.instance);

                next();
            }


        }
    });



    Favourite.observe('before delete', function(ctx, next) {
        var instance = ctx.instance;
        var value = 0;
        if (instance.product && instance.product.value) {
            value = instance.product.value;
        }
        app.models.Consumer.updatePointsCache(instance.user.id, value, function(err, cb) {
            next();
        });
    });

    Favourite.observe('after delete', function(ctx, next) {

        Favourite.unsetManifestVarsCache(ctx.instance);
        app.models.Favourite.unsetInUsersSetCache(ctx.instance);

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












    Favourite.remoteMethod('userStatsCache', {
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


    Favourite.remoteMethod('userStatsCache', {
        http: {
            path: '/userStatsCache',
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
