var logger = require('../logger');
var events = require('events');


var event = event || function() {

}

event.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = new event;
