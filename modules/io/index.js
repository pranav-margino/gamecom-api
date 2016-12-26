var logger = require('../logger');
var events = require('events');
var colors = require('colors');

var redis = require("redis");
var debug = require('debug')('io');


var io = io || function(app, config) {
    var self = this;
    self.socket = null;
    self._io = null;

}

function sockets(client) {
    var self = this;
    self.client = client;

}

sockets.prototype.emit = function(event, data) {
    debug('event %s : data %s'.white.bgBlue, event, JSON.stringify(data));
    debug(this.client.ping());
    this.client.publish('testfav', JSON.stringify({ data: data, event: event }));
}



io.prototype.init = function(app, config) {
    var self = this;
    self.client = redis.createClient();
    self.client.on('ready', function() {
        debug("Redis connected".green);
        self.emit('ready', null, new sockets(self.client));
    });


}

io.prototype.__proto__ = events.EventEmitter.prototype;

io.prototype.setMaxListeners(0);
module.exports = new io;
