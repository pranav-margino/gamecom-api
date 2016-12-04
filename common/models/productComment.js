

var io = require('../../modules/io');

module.exports = function(ProductComment){
	var self = this;

	ProductComment.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            var instance = ctx.instance;
            broadcastProductComment(instance);
            next();
        } else {
            next();
        }
    });


    function broadcastProductComment(commentObj) {
        if (!self.sockets) {
            
            return;
        }
        self.sockets.emit("readModel:ProductComment", commentObj);
    }

    io.on('ready', function(socket, sockets) {
        self.sockets = sockets;
        //console.log("ProductComment sockets working.");

    });
	
}