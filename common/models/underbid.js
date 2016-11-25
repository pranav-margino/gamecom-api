 var app = require('../../server/server');
 var io = require('../../modules/io');


 module.exports = function(Underbid) {

     var self = this;

     Underbid.observe('after save', function(ctx, next) {
         if (ctx.isNewInstance) {
             app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                 if (!err) {
                     app.models.Consumer.getPoints(ctx.instance.user.id, function(err, points) {
                         favourite.bid = Math.max(0, parseInt(favourite.bid) - parseInt(ctx.instance.value));
                         favourite.save();
                         app.models.Favourite.rank(favourite.preferenceId);
                         console.log(ctx.instance);
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

 }
