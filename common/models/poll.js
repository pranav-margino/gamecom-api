var io = require('../../modules/io');
var logger = require('../../modules/logger');
var queue = require('../../modules/queue');
var cron = require('../../modules/cron');
var event = require('../../modules/event');

function run(pollId) {
    var self = this;
    self.model.findOne({ where: { id: pollId } }, function(err, doc) {
        if (!err) {
            var questions = doc._questions || [];
            var index = 0;
            setInterval(function() {
                if (index < (questions.length - 1)) {
                    if (self.sockets !== null) {
                        self.sockets.emit('readModel:Question', { pollId: pollId, question: questions[index] });
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
    cron.on('poll:start', function(data) {
        logger.log('executing startPoll');
        run.bind(self)(data, modelId);
    });
    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
    });
    event.on('poll:start', function(data) {
        logger.log("poll:start");
        run.bind(self)(data.modelId);
    });

}
