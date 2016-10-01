var winston = require('winston');
var cron = require('../../modules/cron');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({ filename: 'somefile.log' })
    ]
});
module.exports = function(First) {


    function getResult(firsts, winnersCount) {

        if (fs.existsSync('winners.json')) {
            var w = fs.readFileSync('winners.json', 'utf-8');
            return JSON.parse(w);
        }
        var winners = [];
        if (winnersCount >= firsts.length) {
            winners = firsts;

        } else {
            for (var i = 0; i < winnersCount; i++) {
                var index = parseInt(Math.random() * firsts.length);
                winners.push(firsts[index]);
                firsts.splice(index, 1);
            }
        }
        fs.writeFileSync('winners.json', JSON.stringify(winners), 'utf-8');
        return winners;
    }

    First.result = function(cb) {
        if (new Date().getTime() < new Date("2016-09-25T19:55:00+05:30").getTime()) {
            return cb(null, []);
        }
        First.find({}, function(err, firsts) {
            if (!err) {
                var winners = getResult(firsts, 3);
                logger.log('info', winners);
                return cb(null, winners);
            } else {
                logger.log('error', err);
                return cb(err, null);
            }
        })

    };


    First.remoteMethod('result', {
        http: {
            path: '/result',
            verb: 'get'
        },
        accepts: [],
        returns: {
            arg: 'data',
            type: 'object'
        }
    });

    //
    First.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            logger.log('info', ctx.instance);
        }
        next();
    });

    //new Date("2016-09-25T20:00:00+05:30")

    cron.addTask('getResult', new Date("2016-09-25T19:55:00+05:30"), function() {
        logger.log('info', 'getting result');
        First.find({}, function(err, firsts) {
            if (!err) {
                var winners = getResult(firsts, 3);
                logger.log('info', winners);
            } else {
                logger.log('error', err);
            }
        });
    });
}
