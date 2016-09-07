var kafka = require('kafka-node');
var Producer = kafka.Producer;
var client = new kafka.Client("192.168.0.3:2181");
var producer = new Producer(client);
var isReady = false;
producer.on('ready', function() {
    isReady = true;
    console.log('ready');
});
producer.on('error', function(err) {
    isReady = false;
    console.log(err);
});
module.exports = function(Answer) {
    Answer.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
        	console.log(ctx.instance);
            producer.send([{
                topic: 'game0',
                messages: [JSON.stringify(ctx.instance)]
            }], function(err, data) {
                console.log(err);
                console.log(data);
            });
        }
        next();
    });
}