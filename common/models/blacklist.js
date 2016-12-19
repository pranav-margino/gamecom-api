var _ = require('lodash');
var cache = require('../../modules/cache');
var async = require('async');
var debug = require('debug')('blacklist');
var colors = require('colors');


module.exports = function(Blacklist) {

    var self = this;

    self.cClient = null;
    self.cConfig = {};

    cache.on('ready', function(client, config) {

        self.cClient = client;
        self.cConfig = config;
        debug("Blacklist cache connected".green);
    });

    Blacklist.add = function(data, cb) {
        Blacklist.count({ userId: data.userId }, function(err, count) {
            if (err || count == 0) {
                Blacklist.create(data, function(err, data) {
                    return cb(err, data);
                });

            } else {
                return cb(null, count);
            }
        });
    }

    Blacklist.setInCache = function(userIds) {
        if (!self.cClient) {
            return;
        }
        if (userIds.length > 0) {
            self.cClient.set('blacklisted-ids', userIds.join("-"));
            self.cClient.expire('blacklisted-ids', self.cConfig.BLACKLIST);
        }

        if (userIds.length == 0) {
            self.cClient.del('blacklisted-ids');
            //self.cClient.expire('blacklisted-ids', self.cConfig.BLACKLIST);
        }


    }

    Blacklist.observe('after save', function(ctx, next) {
        debug('blacklist added');
        Blacklist.list(function(err, ids) {
            if (err) {
                next();
            } else {
                Blacklist.setInCache(ids);
                next();
            }
        });
    });

    Blacklist.observe('after delete', function(ctx, next) {
        debug('blacklist deleted');
        Blacklist.list(function(err, ids) {
            if (err) {
                next();
            } else {
                Blacklist.setInCache(ids);
                next();
            }
        });
    });


    Blacklist.list = function(cb) {
        Blacklist.find({}, function(err, blacklists) {
            if (err) {
                return cb(err, null);

            } else {
                var ids = _.map(blacklists, function(blacklist) {
                    return blacklist.userId;
                });
                return cb(null, ids);
            }
        });
    }

    Blacklist.isListed = function(userId, cb) {
        Blacklist.count({ userId: userId }, function(err, count) {
            console.log(count);
            if (err) {
                return cb(null, false);
            } else {
                if (count > 0) {
                    return cb(null, true);
                } else {
                    return cb(null, false);
                }
            }
        });
    }

    Blacklist.isListedCache = function(userId, cb) {
        var args = arguments;
        if (!self.cClient) {
            Blacklist.isListed.apply(null, args);
        } else {
            debug("cache client exists");
            self.cClient.get('blacklisted-ids', function(err, ids) {
                if (!err && ids != null) {
                    debug("isListedCache".green);
                    ids = ids.split("-");
                    if (ids.indexOf(userId) > -1) {
                        cb(null, true);
                    } else {
                        cb(null, false);
                    }

                } else {
                    Blacklist.list(function(err, ids) {
                        debug("isListedDisc".red);
                        if (err) {
                            cb(null, false);
                        } else {
                            if (ids.length && ids.length > 0) {
                                Blacklist.setInCache(ids);
                                Blacklist.isListed.apply(null, args);
                            } else {
                                cb(null, false);
                            }
                        }
                    });

                }
            });

        }

    }

    Blacklist.remoteMethod('isListed', {
        http: {
            path: '/isListed',
            verb: 'GET'
        },
        accepts: [{
            arg: 'userId',
            type: 'String'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });

    Blacklist.remoteMethod('list', {
        http: {
            path: '/list',
            verb: 'GET'
        },
        accepts: [],
        returns: {
            arg: 'result',
            type: 'Array'
        }
    });



    Blacklist.remoteMethod('add', {
        http: {
            path: '/add',
            verb: 'POST'
        },
        accepts: [{
            arg: 'data',
            type: 'object'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });


}
