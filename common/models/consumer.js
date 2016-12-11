var queue = require('../../modules/queue');
var _ = require('lodash');
var stats = require("stats-lite");
var cache = require('../../modules/cache');
var debug = require('debug')('consumer');
var colors = require('colors');




module.exports = function(Consumer) {
    var self = this;

    self.sockets = null;
    self.cClient = null;
    self.cConfig = {};

    cache.on('ready', function(client, config) {
        self.cClient = client;
        self.cConfig = config;
        debug('cache connected'.green);
    });

    Consumer.getFacebookUser = function(id, cb) {
        cb(true, true);
    };

    Consumer.getTwitterUser = function(twitterId, cb) {};
    Consumer.getGoogleUser = function(googleId, cb) {};
    Consumer.getLinkedinUser = function(linkedinId, cb) {};
    Consumer.observe('after save', function(ctx, next) {
        next();
    });

    Consumer.getPoints = function(id, cb) {
        Consumer.findById(id, function(err, consumer) {
            if (!err && consumer) {
                return cb(null, consumer.points);
            } else {
                return cb(err, null);
            }
        });
    }

    Consumer.getPointsCache = function(id, cb) {
        if (!self.cClient) {
            debug("no cache client".red);
            Consumer.getPoints.apply(null, arguments);
        } else {
            var key = ["user-points", id].join("-");
            self.cClient.get(key, function(err, points) {
                if (!err && points != null) {
                    debug("getPointsCache".green);
                    debug("points", points);
                    cb(null, points);
                } else {
                    Consumer.getPoints(id, function(err, points) {
                        if (!err) {
                            debug("getPointsDisc".red);
                            debug("points %d", points);
                            self.cClient.set(key, points);
                            self.cClient.expire(key, 60);
                            cb(null, points);
                        } else {
                            cb(err, null);
                        }
                    });
                }

            });

        }
    }



    Consumer.updatePoints = function(id, points, cb) {
        debug("updatePoints %d", points);
        if (isNaN(points)) {
            return cb(true, null);
        }
        Consumer.findById(id, function(err, consumer) {
            points = Math.max(0, parseInt(consumer.points) + parseInt(points));
            consumer.points = points;
            consumer.save();
            cb(null, points);

        });
    }

    Consumer.updatePointsCache = function(id, points, cb) {
        if (!self.cClient) {
            debug("no cache client".red);
            Consumer.updatePoints.apply(null, arguments);
        } else {
            Consumer.updatePoints(id, points, function(err, points) {
                debug(err);
                debug(points);
                if (!err) {
                    var key = ["user-points", id].join("-");
                    self.cClient.set(key, points);
                    self.cClient.expire(key, self.cConfig.POINTS_CONSUMER);
                    cb(null, points);
                } else {
                    cb(err, null);
                }
            });
        }
    }

    Consumer.cleanupPoints = function() {
        Consumer.find({}, { fields: { name: true, points: true } }, function(err, consumers) {
            _.forEach(consumers, function(consumer) {
                if (consumer.points < 0) {
                    consumer.points = 0;
                    consumer.save();
                }

            });
        });
    }


    Consumer.statsPoints = function(cb) {
        Consumer.find({}, { fields: { name: true, points: true } }, function(err, consumers) {
            var points = [];
            for (var i = 0; i < consumers.length; i++) {
                points.push(parseInt(consumers[i].points));
            }
            cb(err, { mean: stats.mean(points), median: stats.median(points), mode: stats.mode(points) });
        });
    }



    Consumer.remoteMethod('getPoints', {
        http: {
            path: '/points',
            verb: 'get'
        },
        accepts: {
            arg: 'id',
            type: 'string'
        },
        returns: {
            arg: 'data',
            type: 'object'
        }
    });



    Consumer.remoteMethod('statsPoints', {
        http: {
            path: '/statsPoints',
            verb: 'get'
        },
        accepts: [],
        returns: {
            arg: 'stats',
            type: 'object'
        }
    });

    Consumer.remoteMethod('getFacebookUser', {
        http: {
            path: '/getFacebookUser',
            verb: 'get'
        },
        accepts: {
            arg: 'id',
            type: 'string'
        },
        returns: {
            arg: 'user',
            type: 'object'
        }
    });



}
