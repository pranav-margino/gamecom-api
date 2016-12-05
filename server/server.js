var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
var queue = require('../modules/queue');
var logger = require('../modules/logger');
var io = require('../modules/io');
var cache = require('../modules/cache');
var cron = require('../modules/cron');
var fs = require('fs');
var _ = require('lodash');
var stats = require("stats-lite");
var debug = require('debug')('server');
var colors = require('colors');


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
    if (require.main === module) {
        app.start();
        io.init(app);
        cache.init();

        app.models.Consumer.find({}, function(err, consumers) {
            if (!err) {
                _.forEach(consumers, function(consumer) {});

            }

        });
        app.models.Consumer.find({}, function(err, consumers) {
            if (!err) {
                var points = [];
                _.forEach(consumers, function(consumer) {
                    points.push(consumer.points);

                });
                debug("mode " + stats.mode(points));
                debug("mean " + stats.mean(points));
                debug("median " + stats.median(points));
            }
        });
    }
});
