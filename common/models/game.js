var logger = require('../../modules/logger');
var cron = require('../../modules/cron');
var event = require('../../modules/event');
var _ = require('lodash');
var moment = require('moment');
module.exports = function(Game) {

    var schedule = function() {
        var gt = { scheduledAt: { gt: moment() } };
        var lt = { scheduledAt: { lt: moment().add('hour', 10) } };
        var unscheduled = { isScheduled: false };
        Game.find({ where: { and: [gt, lt, unscheduled] } }, function(err, docs) {
            if (!err) {
                _.forEach(docs, function(doc) {
                    logger.log("game:schedule:" + doc.title + "@" + doc.scheduledAt);
                    cron.addEvent('game:start', doc.scheduledAt, doc);
                    doc.isScheduled = true;
                    doc.save();
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
                eventName = "poll:start";
                eventData = { modelId: game.pollId };
                break;
            case 'fpa':
                eventName = "fpa:start";
                eventData = { modelId: game.fpaId };
                break;
            default:
        }
        event.emit(eventName, eventData);
    };

    cron.addEvent('game:heartbeat', '10sec');
    cron.on('game:heartbeat', function(data) {
        logger.log('game:heartbeat');
        schedule();
    });
    cron.on('game:start', function(game) {
        logger.log('starting game ' + game.title);
        run(game);
    });
    Game.resetSchedule = function() {
        var self = this;
        self.find({}, function(err, docs) {
            if (!err) {
                _.forEach(docs, function(doc) {
                    doc.isScheduled = false;
                    doc.save();
                })
            }
        })
    };
}
