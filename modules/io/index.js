var logger = require('../logger');
var events = require('events');

var io = io || function(app, config) {
    var self = this;
    self.socket = null;
    self._io = null;
    //events.EventEmitter.call(this);

}

io.prototype.init = function(app, config) {
    var self = this;
    self._io = require('socket.io')(app.start(), config || { path: '/socket.io-client' });
    self._io.on('connection', function(socket) {
        logger.log('Socket connected to ' + socket.request.connection.remoteAddress);
	    self.socket = socket;
	    self.emit('ready',self.socket);
        self.socket.on('disconnect', function() {
            logger.log('Socket disconnected from ' + socket.request.connection.remoteAddress);
        });
    });
}

io.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = new io;
