var app = require('../../server/server');
module.exports = function(PollAnswer) {
    PollAnswer.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            var instance = ctx.instance;
            app.models.Consumer.findById(instance.user.id, function(err, consumer) {
                if (!err) {
                    consumer.points = instance.question.points + consumer.points;
                    consumer.save();
                }
            })
            next();
        }
    });
}
