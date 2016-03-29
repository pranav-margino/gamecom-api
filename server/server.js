var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
var survey = require('../modules/survey');
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
        app.io = require('socket.io')(app.start());
        app.io.on('connection', function(socket) {
            console.log('Connected to ' + socket.request.connection.remoteAddress);
            survey(socket);
            var initialPrice = 10000;
            setInterval(function() {
                if (initialPrice < 1000) {
                    initialPrice = 10000
                } else {
                    initialPrice = initialPrice - parseInt(Math.random() * 100);
                }
                socket.emit('hello', {
                    price: initialPrice,
                    timestamp: new Date().getTime()
                });
            }, 1700);
            socket.on('chat message', function(msg) {
                console.log('message: ' + msg);
                app.io.emit('chat message', msg);
            });
            socket.on('disconnect', function() {
                console.log('user disconnected');
            });
        });
    }
});