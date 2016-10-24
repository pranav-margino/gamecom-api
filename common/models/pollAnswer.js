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
    PollAnswer.cleanup = function() {
        PollAnswer.find({}, function(err, docs) {
            console.log(docs.length);
            var userqusetionidhash = [];
            var repeats = [];
            for (var i = 0; i < docs.length; i++) {
                var slug = docs[i].user.id + docs[i].question.id;
                if (userqusetionidhash.indexOf(slug) == -1) {
                    userqusetionidhash.push(slug);
                } else {
                    //console.log("repeat" + slug);
                    repeats.push(slug);
                }

            }
            console.log(repeats.length);
        })
    }
}
