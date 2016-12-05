var events = require('events');
var colors = require('colors');

var redis = require("redis");
var debug = require('debug')('cache');


var cache = cache || function(config) {
    var self = this;
    self.config = config || {};

}




cache.prototype.init = function() {
    var self = this;
    self.client = redis.createClient();
    self.client.on('ready', function() {
        debug("Redis connected".green);
        debug("Cache ready".green);
        self.emit('ready', self.client);
    });


}

cache.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = new cache;
