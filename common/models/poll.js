var io = require('../../modules/io');
var logger = require('../../modules/logger');
var queue = require('../../modules/queue');
var cron = require('../../modules/cron');
var event = require('../../modules/event');
var _ = require('lodash');
var app = require('../../server/server');


function run(data) {
    var self = this;
    self.data = data;
    self.model.findOne({ where: { id: data.id } }, function(err, poll) {
        if (!err) {

            var questions = poll._questions || [];
            var index = 0;
            readQuestion.bind(self)(questions, index);
            var ticker = setInterval(function() {
                if (index < (questions.length - 1)) {
                    index++;
                    readQuestion.bind(self)(questions, index);
                    logger.log("Running question no " + index);
                } else {
                    event.emit('poll:end', data);
                    clearInterval(ticker);
                }
            }, 5000);
        }
    });
}

function readQuestion(questions, index) {
    var data = this.data;
    if (this.sockets !== null) {
        this.sockets.emit('readModel:Question', { pollId: data.id, question: questions[index], questionIndex: index, questionsCount: questions.length });
    }
}

module.exports = function(Poll) {
    var self = this;
    self.sockets = null;
    self.model = Poll;
    //io
    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
    });
    //poll:start by cron
    cron.on('poll:start', function(data) {
        logger.log('poll:start');
        run.bind(self)(data);
    });

    //poll:start
    event.on('poll:start', function(data) {
        logger.log("poll:start");
        if (self.sockets) {
            self.sockets.emit('startModel:Poll', data);
        }
        run.bind(self)(data);
    });
    //poll:end
    event.on('poll:end', function(data) {
        logger.log("poll:end " + data.id);

        if (self.sockets) {
            self.sockets.emit('endModel:Poll', data);
        }
    });

    Poll.nextQuestion = function(id, userId, cb) {
        //var questionData = {points:0, question:[], hasCompleted:true, index:1, count:0};
        Poll.findById(id, function(err, poll) {
            poll.questions({}, function(err, questions) {
                poll.answers({}, function(err, answers) {
                    var answered = _.uniq(_.map(_.partition(answers, function(answer) {
                        return answer.user.id.toString() == userId;
                    })[0], function(obj) {
                        return obj.question.id;
                    }));
                    var unanswered = _.partition(questions, function(question) {
                        return answered.indexOf(question.id.toString()) == -1;
                    })[0];
                    var hasCompleted = (unanswered && unanswered.length > 0) ? false : true;
                    app.models.Consumer.getPoints(userId, function(err, data) {
                        return cb(err, {
                            points: data,
                            question: unanswered[0],
                            hasCompleted: hasCompleted,
                            index: (questions.length - unanswered.length) + 1,
                            count: questions.length
                        });
                    })
                });
            });
        })
    };

    Poll.remoteMethod('nextQuestion', {
        http: {
            path: '/question',
            verb: 'get'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }, {
            arg: 'userId',
            type: 'string'
        }],
        returns: {
            arg: 'questionData',
            type: 'object'
        }
    });

}
