var io = require('../../modules/io');

module.exports = function(Answer) {
    io.on('ready', function(socket) {
        socket.on('addModel:Answer', function(data) {
            console.log(data);
        });
    });


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
