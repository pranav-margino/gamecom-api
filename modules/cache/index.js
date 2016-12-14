var events = require('events');
var colors = require('colors');

var redis = require("redis");
var debug = require('debug')('cache');
var RedisNotifier = require('redis-notifier');
var _ = require('lodash');



var cache = cache || function(config) {
    var self = this;
    self.config = _.merge({
        MANIFEST_VARS_PREFERENCE: 180,
        MANIFEST_VARS_FAVOURITE: 180,
        MODEL_STATS_FAVOURITE: 180,
        RANK_FAVOURITE: 180,
        POINTS_CONSUMER: 180,
        USER_STATS_FAVOURITE:60
    }, config);
}




cache.prototype.init = function() {
    var self = this;
    self.client = redis.createClient();
    self.client.on('ready', function() {
        debug("Redis connected".green);
        debug("Cache ready".green);
        var eventNotifier = new RedisNotifier(redis, {
            redis: { host: '127.0.0.1', port: 6379 },
            expired: true,
            evicted: true,
            //logLevel: 'DEBUG' //Defaults To INFO 
        });
        self.client.notifier = eventNotifier;

        self.emit('ready', self.client, self.config);
    });


}

cache.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = new cache;
