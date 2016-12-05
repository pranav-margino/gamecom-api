var queue = require('../../modules/queue');
var _ = require('lodash');
var stats = require("stats-lite");
var cache = require('../../modules/cache');
var debug = require('debug')('consumer');
var colors = require('colors');




module.exports = function(Consumer) {
    var self = this;

    cache.on('ready', function(client) {
        self.cClient = client;
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
            Consumer.getPoints.call(null, id, cb);
        } else {
            self.cClient.hget('points', id, function(err, points) {
                if (!err && points != null) {
                    debug("from cache".green);
                    cb(null, points);
                } else {
                    Consumer.getPoints(id, function(err, points) {
                        if (!err) {
                            self.cClient.hset('points', id, points);
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
        if (isNaN(points)) {
            return cb(true, null);
        }
        Consumer.findById(id, function(err, consumer) {
            consumer.points = Math.max(0, parseInt(consumer.points) + parseInt(points));
            consumer.save();
            return cb(null, consumer.points);
        });
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
