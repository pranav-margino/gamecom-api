var queue = require("../queue")();
var logger = require('../logger')();


function answer(socket) {
    socket.on('addModel:Answer', function(data) {
        logger.log('addModel:Answer');
        logger.log('debug', data);
        queue.push('game0', data);
    });
}

module.exports = answer;
