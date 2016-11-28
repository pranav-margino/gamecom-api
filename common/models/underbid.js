 var app = require('../../server/server');
 var io = require('../../modules/io');
 var util = require('../../modules/util');



 module.exports = function(Underbid) {

     var self = this;
     self.sockets = null;



     Underbid.validate('hasManifestId', function(err) {
        if (!this.manifestId) {
            err();
        }
    }, { message: 'manifestId is missing' });

    Underbid.validateAsync('validManifest', function(err, done) {
        var self = this;
        
        app.models.Manifest.findById(this.manifestId, function(error, manifest) {
            if (error || !manifest) {
                err();
                done();
            } else {
                //has recent overbid
                if (manifest.hasRecent) {
                    err();
                }
                //check if user id is matched
                if (manifest.userId !== self.user.id) {
                    err();
                }
                //check if productId is matched
                if (manifest.productId !== self.product.id) {
                    err();
                }
                //check if favouriteId is matched
                if (manifest.favouriteId != self.favouriteId) {
                    err();
                }
                // check if values are in range
                if (manifest.values.indexOf(self.value) == -1) {
                    err();
                }

                if (new Date(manifest.createdAt).getTime() < (new Date().getTime() - (manifest.expiresIn * 1000))) {
                    err();
                }
                done();
            }
        });
    }, { message: 'invalid manifest values' });

    Underbid.getManifest = function(favouriteId, userId, cb) {
        util.getManifest(favouriteId, userId, "Underbid", function(err, data) {
            return cb(err, data);
        });

    }

    Underbid.remoteMethod('getManifest', {
        http: {
            path: '/getManifest',
            verb: 'GET'
        },
        accepts: [{
            arg: 'favouriteId',
            type: 'string'
        }, {
            arg: 'userId',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });





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
