var io = require('../../modules/io');
var logger = require('../../modules/logger');
var queue = require('../../modules/queue');
var cron = require('../../modules/cron');


module.exports = function(Answer) {
    /*io.on('ready', function(socket, sockets) {
        socket.on('addModel:Answer', function(data) {
            logger.log('addModel:Answer');
            logger.log('debug', data);
            queue.push('test', data);
        });
    });


    Answer.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            logger.log(ctx.instance);
            producer.send([{
                topic: 'test',
                messages: [JSON.stringify(ctx.instance)]
            }], function(err, data) {
                logger.log(err);
                logger.log(data);
            });
        }
        next();
    });
    */
}
