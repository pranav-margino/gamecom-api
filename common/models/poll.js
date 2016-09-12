var io = require('../../modules/io');
var logger = require('../../modules/logger');
var queue = require('../../modules/queue');
var cron = require('../../modules/cron');


function PollRunner() {
    var self = this;
    self.model.findOne({ where: { id: '57caa2b27da100df2661eb0d' } }, function(err, doc) {
        if (!err) {
            var questions = doc._questions || [];
            var index = 0;

            setInterval(function() {
                if (index < 3) {
                    if (self.sockets !== null) {
                        self.sockets.emit('readModel:Question', questions[index]);
                    }
                    logger.log("Running question no " + index);
                    index++;
                }
            }, 3000);

        }
    });
}

module.exports = function(Poll) {
    var self = this;
    self.sockets = null;
    self.model = Poll;
    cron.addEvent('startPoll', '30sec');
    cron.on('startPoll', function() {
        logger.log('executing startPoll');
        PollRunner.bind(self)();
    });
    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
    });
}
