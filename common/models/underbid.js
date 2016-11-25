 var app = require('../../server/server');
 var io = require('../../modules/io');


 module.exports = function(Underbid) {

     var self = this;
     self.sockets = null;

     Underbid.observe('after save', function(ctx, next) {
         if (ctx.isNewInstance) {
             app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                 if (!err) {
                     app.models.Consumer.getPoints(ctx.instance.user.id, function(err, points) {
                         favourite.bid = Math.max(0, parseInt(favourite.bid) - parseInt(ctx.instance.value));
                         favourite.save();
                         app.models.Favourite.rank(favourite.preferenceId);
                         broadcastFavouriteUpdate(favourite);
                         //console.log(ctx.instance);
                         app.models.Consumer.updatePoints(ctx.instance.user.id, ctx.instance.value, function(err, data) {
                             console.log(err);
                             console.log(data);
                             next();
                         });

                     });
                 } else {
                     next();
                 }
             });
         } else {
             next();
         }
     });

     function broadcastFavouriteUpdate(favouriteObj){
        if (!self.sockets) {
            console.warn("No Favourite sockets.");
            return;
        }
        //console.log('broadcastFavouriteUpdate');
        self.sockets.emit("updateModel:Favourite", favouriteObj);
    }

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        console.log("Contest sockets working.");
    });

 }
