var app = require('../../server/server');

module.exports = function(Endorsement) {
    Endorsement.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                if (!err) {
                    app.models.Consumer.getPoints(ctx.instance.user.id, function(err, points) {
                        if (points >= ctx.instance.value) {
                            favourite.overbid = Math.max(0, parseInt(favourite.overbid) + parseInt(ctx.instance.value));
                            favourite.save();
                            app.models.Consumer.updatePoints(ctx.instance.user.id, -ctx.instance.value, function(err, data) {
                            });
                        }
                    });
                }
                next();
            });
        }
    });
}
