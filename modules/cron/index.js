var logger = require('../logger');
var events = require('events');
var CronJob = require('cron').CronJob;


var cron = function() {};

cron.prototype.parseCronTime = function(cronTime) {
    var parsedCronTime = null;
    switch (cronTime) {
        case '1sec':
            parsedCronTime = '* * * * * *';
            break;
        case '5sec':
            parsedCronTime = '*/5 * * * * *';
            break;
        case '30sec':
            parsedCronTime = '*/30 * * * * *';
            break;
        case '1min':
            parsedCronTime = '* * * * *';
            break;
        case '2min':
            parsedCronTime = '*/2 * * * *';
            break;    
        case '3min':
            parsedCronTime = '*/3 * * * *';
            break;
        case '5min':
            parsedCronTime = '*/5 * * * *';
            break;
        case '10min':
            parsedCronTime = '*/10 * * * *';
            break;
        case '15min':
            parsedCronTime = '*/15 * * * *';
            break;
        case '30min':
            parsedCronTime = '*/30 * * * *';
            break;
        case '45min':
            parsedCronTime = '*/45 * * * *';
            break;
        case '1hr':
            parsedCronTime = '* * * *';
            break;
        case '3hr':
            parsedCronTime = '*/3 * * *';
            break;
        case '6hr':
            parsedCronTime = '*/6 * * *';
            break;
        case '9hr':
            parsedCronTime = '*/9 * * *';
            break;
        case '12hr':
            parsedCronTime = '*/12 * * *';
            break;
        case '24hr':
            parsedCronTime = '* * *';
            break;
        default:
            parsedCronTime = cronTime;
            break;
    }
    return parsedCronTime;
}

cron.prototype.addEvent = function(cronEvent, cronTime, payload) {
    var self = this;
    var job = new CronJob({
        cronTime: self.parseCronTime(cronTime),
        onTick: function() {
            logger.log('Cron event ' + cronEvent + ' emitting @' + cronTime);
            self.emit(cronEvent, payload || {});
        },
        start: false
    });
    job.start();
}

cron.prototype.addTask = function(cronTask, cronTime, cb) {
    var self = this;

    if (typeof cb !== 'function') {
        logger.log('warning', 'Cron task ' + cronTask + 'is not a function');
        return;
    }
    var job = new CronJob({
        cronTime: self.parseCronTime(cronTime),
        onTick: function() {
            logger.log('Cron task ' + cronTask + ' running @' + cronTime);
            cb();
        },
        start: true
    });
    job.start();
}

cron.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = new cron;
