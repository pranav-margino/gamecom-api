var app = require('../../server/server');

module.exports = function(Favourite) {
    Favourite.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            var instance = ctx.instance;
            var value = 0;
            if (instance.product && instance.product.value) {
                value = instance.product.value;
            }
            app.models.Consumer.updatePoints(instance.user.id, -value, function(err, cb) {

            });
            next();
        }
    });

    Favourite.observe('before delete', function(ctx, next) {
        var instance = ctx.instance;
        var value = 0;
        if (instance.product && instance.product.value) {
            value = instance.product.value;
        }
        app.models.Consumer.updatePoints(instance.user.id, value, function(err, cb) {

        });
        next();
    });

}
