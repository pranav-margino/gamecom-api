var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
var queue = require('../modules/queue');
var logger = require('../modules/logger');
var io = require('../modules/io');
var cron = require('../modules/cron');
var fs = require('fs');
var _ = require('lodash');
var stats = require("stats-lite")

//var consumerAcls = require('./acls/consumer.json');

app.start = function() {
    // start the web server
    return app.listen(function() {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        logger.log('Web server listening at: ' + baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            logger.log('Browse your REST API at ' + baseUrl + '/' + explorerPath);
        }
    });
};
// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
    if (err) throw err;
    // start the server if `$ node server.js`
    if (require.main === module) { //app.start();
        io.init(app);
        //cron.addEvent('startPoll', '15 10 * * *', {});
        //app.models.Game.resetSchedule();
        //app.models.Preference.listConsumers();
        //app.models.Consumer.assignPoints();
        //app.models.Poll.getQuestion();
        //app.models.Preference.cleanup();
        //app.models.Consumer.cleanupPoints();
        //app.models.Consumer.statsPoints(function(err,data){
        //    console.log(err);
        //    console.log(data);
        //});
        app.models.PollAnswer.cleanup();
        app.models.Consumer.find({}, function(err, consumers) {
            console.log(err);
            if (!err) {
                _.forEach(consumers, function(consumer) {
                    if (consumer.points < 5000) {
                        consumer.points += 5000;
                        consumer.save();
                    }
                });

            }

        });
        app.models.Consumer.find({}, function(err, consumers) {
            console.log(err);
            if (!err) {
                var points = [];
                _.forEach(consumers, function(consumer) {
                    console.log(consumer.points);
                    points.push(consumer.points);

                });

                console.log("mode" + stats.mode(points));

            }

        });
    }
});
