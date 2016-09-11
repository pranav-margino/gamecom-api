var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
var queue = require('../modules/queue');
var logger = require('../modules/logger');
var io = require('../modules/io');
var cron = require('../modules/cron');

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
        


    }
});
