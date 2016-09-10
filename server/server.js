var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
var queue = require('../modules/queue');
var answer = require('../modules/answer');
var logger = require('../modules/logger');
var io = require('../modules/io');
app.start = function() {
    // start the web server
    return app.listen(function() {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
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
        /*app.io = require('socket.io')(app.start(),{
            path:'/socket.io-client'
        });
        app.io.on('connection', function(socket) {
            logger.log('Socket connected to ' + socket.request.connection.remoteAddress);
            //answer(socket);
            socket.on('disconnect', function() {
                logger.log('Socket disconnected from ' + socket.request.connection.remoteAddress);
            });
        });
        */

        io

    }
});