var queue = require("../queue")();

function answer(socket) {
    socket.on('addModel:Answer', function(data) {
        console.log(data);
        queue.push('game0', data);
    });
}

module.exports = answer;
