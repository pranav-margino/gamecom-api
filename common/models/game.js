var logger = require('../../modules/logger');
var cron = require('../../modules/cron');
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
                    console.log(doc.title);
                    console.log(doc.scheduledAt);
                    doc.scheduledAt = true;
                    doc.save();
                });
            }
        });
    }
    cron.addEvent('game:heartbeat', '10sec');
    cron.on('game:heartbeat', function(data) {
        logger.log('game:heartbeat');
        schedule();
    });
}
