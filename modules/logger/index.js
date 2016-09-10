var winston = require('winston');

var logger = function() {
    var self = this;
    self.level = 'info';
    self._logger = new(winston.Logger)({
        transports: [
            new(winston.transports.Console)(),
        ]
    });
}

logger.prototype.log = function(msg) {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    self._logger.log(args.length == 1 ? self.level : args[0], args.length == 1 ? args[0] : args[1]);
}




module.exports = new logger;
