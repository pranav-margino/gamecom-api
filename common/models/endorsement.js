var app = require('../../server/server');
var io = require('../../modules/io');

module.exports = function(Endorsement) {
    var self = this;
    Endorsement.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            app.models.Favourite.findById(ctx.instance.favouriteId, function(err, favourite) {
                if (!err) {
                    app.models.Consumer.getPoints(ctx.instance.user.id, function(err, points) {
                        if (points >= ctx.instance.value) {
                            favourite.overbid = Math.max(0, parseInt(favourite.overbid) + parseInt(ctx.instance.value));
                            favourite.save();
                            app.models.Consumer.updatePoints(ctx.instance.user.id, -ctx.instance.value, function(err, data) {
                                broadcastEndorsement({
                                    endorser: ctx.instance.user,
                                    endorsee: favourite.user,
                                    value: ctx.instance.value,
                                    product: favourite.product,
                                    message: ctx.instance.message,
                                    createdAt: ctx.instance.createdAt || null
                                });
                            });
                        }
                    });
                }
                next();
            });
        }
    });

    Endorsement.addReply = function(id, reply, cb) {
        Endorsement.findById(id, function(err, endorsement) {
            if (!err) {
                if (!endorsement.message) {
                    return cb("Endorsement does not have a message.", null);
                }
                endorsement.reply = reply;
                endorsement.save();
                return cb(null, endorsement);
            } else {
                return cb(err, null);
            }
        })
    }

    Endorsement.remoteMethod('addReply', {
        http: {
            path: '/:id/addReply',
            verb: 'POST'
        },
        accepts: [{
            arg: 'id',
            type: 'string'
        }, {
            arg: 'reply',
            type: 'string'
        }],
        returns: {
            arg: 'result',
            type: 'Object'
        }
    });

    function broadcastEndorsement(endorsementObj) {
        if (!self.sockets) {
            console.warn("No Endorsement sockets.");
            return;
        }
        self.sockets.emit("readModel:Endorsement", endorsementObj);
    }

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        console.log("Endorsement sockets working.");
    });
}
