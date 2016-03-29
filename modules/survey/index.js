module.exports = survey;

function survey(socket) {
    var questions = [{
        body: "Have you owned a PS platform before?",
        options: ["Yes","No"],
    }, {
        body: "How many PS games do you own?",
        options: ["None", "1-5", "5-10","More than 10"]
    }, {
        body: "How excited are you about PS4?",
        options: ["Meh","Mildly excited","Yayyyy", "I shot a hobo"]
    }, {
        body: "In your honest opinion does PS4 beat XBOX?",
        options: ["You kiddiing me?","Not a chance","Maybe", "Like hell it does."]
    }];
    var index = 0;
    setInterval(function() {
        socket.emit('survey', questions[index % (questions.length)]);
        index++;
    }, 9000);
};