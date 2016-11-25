var app = require('../../server/server');
var io = require('../../modules/io');

module.exports = function(Contest) {
    var self = this;
    Contest.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                if (!err) {
                    app.models.Consumer.getPoints(ctx.instance.user.id, function(err, points) {
                        if (points >= ctx.instance.value) {
                            favourite.bid = Math.max(0, parseInt(favourite.bid) - parseInt(ctx.instance.value));
                            favourite.save();
                            app.models.Favourite.rank(favourite.preferenceId);
                            app.models.Consumer.updatePoints(ctx.instance.user.id, -ctx.instance.value, function(err, data) {
                                broadcastContest({
                                    contestant: ctx.instance.user,
                                    contested: favourite.user,
                                    value: ctx.instance.value,
                                    product: favourite.product,
                                    createdAt: ctx.instance.createdAt || null
                                });
                                next();
                            });
                        }else{
                            next();
                        }
                    });
                }else{
                    next();
                }
                
            });
        }else{
            next();
        }
    });


    function broadcastContest(contestObj) {
        if (!self.sockets) {
            console.warn("No Contest sockets.");
            return;
        }
        self.sockets.emit("readModel:Contest", contestObj);
    }

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        console.log("Contest sockets working.");
    });

}
