var winston = require('winston');
var cron = require('../../modules/cron');
var _ = require('lodash');
var moment = require('moment');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({ filename: 'somefile.log' })
    ]
});
module.exports = function(First) {


    function getResult(firsts, winnersCount) {
        var winners = [];
        if (winnersCount >= firsts.length) {
            winners = firsts;
            return winners;
        }

        for (var i = 0; i < winnersCount; i++) {
            var index = parseInt(Math.random() * firsts.length);
            winners.push(firsts[index]);
            firsts.splice(index, 1);
        }

        return winners;

    }


    First.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            logger.log('info', ctx.instance);
        }
        next();
    });

    cron.addTask('getResult', new Date(moment().add(1, 'minute').format()), function() {
        console.log("cron just ran");
        First.find({}, function(err, firsts) {
            var winners = getResult(firsts, 2);
            console.log(winners);

        });
    });
}
