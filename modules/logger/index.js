var winston = require('winston');

function logger() {
    var self = this;
    self.level = 'info';
    self._logger = new(winston.Logger)({
        transports: [
            new(winston.transports.Console)(),
        ]
    });
    return {
        log: function(msg) {
            var args = Array.prototype.slice.call(arguments);
            self._logger.log(args.length == 1 ? self.level : args[0], msg);
        }
    };

}


module.exports = logger;
