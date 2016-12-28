var app = require('../../server/server');
var io = require('../../modules/io');
var cache = require('../../modules/cache');
var _ = require('lodash');
var async = require('async');
var debug = require('debug')('manifest');
var colors = require('colors');


module.exports = function(Manifest) {

    var self = this;


    self.sockets = null;
    self.cClient = null;
    self.cConfig = {};


    cache.on('ready', function(client, config) {
        self.cClient = client;
        self.cConfig = config;
        debug("Manifest cache connected".green);
    });

    Manifest.observe('after save', function(ctx, next) {
        //cache manifest
        if (ctx.isNewInstance) {
            if (self.cClient) {
                var instance = ctx.instance;
                var key = ['manifest', instance.id.toString()].join("-");
                self.cClient.hmset(key,
                    'hasRecent', instance.hasRecent,
                    'userId', instance.userId,
                    'productId', instance.productId,
                    'favouriteId', instance.favouriteId,
                    'values', (instance.values || []).toString(),
                    'createdAt', instance.createdAt,
                    'expiresIn', instance.expiresIn);
                self.cClient.expire(key, instance.expiresIn);
                next();
            } else {
                next();
            }
        } else {
            next();
        }
    });


    Manifest.findByIdCache = function(id, cb) {
        var args = arguments;
        if (!self.cClient) {
            debug("no cache client".red);
            Manifest.findById.apply(Manifest, args);
        } else {
            var key = ['manifest', id].join("-");

            self.cClient.hmget(key, [
                'hasRecent',
                'userId',
                'productId',
                'favouriteId',
                'values',
                'createdAt',
                'expiresIn'
            ], function(err, vals) {
                if (!err && vals[0] != null && vals[1] != null && vals[2] != null && vals[3] != null && vals[4] != null && vals[5] != null && vals[6] != null) {
                    debug('findByIdCache'.blue);
                    //debug(vals[4]);
                    cb(null, {
                        hasRecent: (vals[0] == 'true') ? true : false,
                        userId: vals[1],
                        productId: vals[2],
                        favouriteId: vals[3],
                        values: vals[4],
                        createdAt: vals[5],
                        expiresIn: vals[6]
                    });
                } else {
                    debug('findByIdDisc'.red);
                    Manifest.findById.apply(Manifest, args);
                }
            });
        }
    }









}
