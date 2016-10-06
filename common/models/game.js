var logger = require('../../modules/logger');
var cron = require('../../modules/cron');
var io = require('../../modules/io');

var event = require('../../modules/event');
var _ = require('lodash');
var moment = require('moment');
module.exports = function(Game) {

    var self = this;

    //scheduler
    var schedule = function() {
        var gt = { scheduledAt: { gt: moment() } };
        var lt = { scheduledAt: { lt: moment().add('hour', 10) } };
        var unscheduled = { isScheduled: false };
        Game.find({ where: { and: [gt, lt, unscheduled] } }, function(err, games) {
            if (!err) {
                _.forEach(games, function(game) {
                    logger.log("game:schedule:" + game.title + game.id + "@" + game.scheduledAt);
                    cron.addEvent('game:start', game.scheduledAt, game);
                    game.isScheduled = true;
                    game.save();
                });
            }
        });
    };
    //game runner 
    var run = function(game) {
        var eventName = "";
        var eventData = null;
        switch (game.type) {
            case 'poll':
                if (self.sockets) {
                    self.sockets.emit('readModel:Game', { type: game.type, id: game.id, pollId: game.pollId });
                }
                game.hasStarted = true;
                game.save();
                event.emit("poll:start", { id: game.pollId, gameId: game.id });
                break;
            case 'fpa':
                event.emit("fpa:start", { id: game.fpaId, gameId: game.id });
                break;
            default:
        }

    };

    //cron.addEvent('game:heartbeat', '10sec');
    cron.on('game:heartbeat', function(data) {
        logger.log('game:heartbeat');
        schedule();
    });
    cron.on('game:start', function(game) {
        logger.log('game:start' + game.title + game.id);
        run.bind(self)(game);
    });
    event.on('poll:end', function(poll) {
        Game.findOne({ where: { id: poll.gameId } }, function(err, game) {
            if (!err) {
                game.hasStarted = false;
                game.save();
            }
        });

    });
    io.on('ready', function(socket, sockets) {
        self.socket = socket;
        self.sockets = sockets;
        socket.on('updateModelAttr:Game:Contestants', function(data) {
            console.log(data);
            self.sockets.emit('updateModelAttr:Game:Contestants', data);
        });
    });
    Game.resetSchedule = function() {
        var self = this;
        self.find({}, function(err, games) {
            if (!err) {
                var index = 8;
                _.forEach(games, function(game) {
                    if (game.type == 'poll' && game.pollId) {
                        game.isScheduled = false;
                        game.hasStarted = false;
                        game.scheduledAt = moment(new Date()).add(index, 'second').format();
                        index = index + 8;
                        game.save();
                    }

                })
            }
        })
    };
}
