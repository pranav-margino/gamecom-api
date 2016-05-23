var loopback = require('loopback');
var app = require('../../server/server');
var kafka = require('kafka-node');
var _ = require('lodash');

function getProducer() {
    var Producer = kafka.Producer,
        client = new kafka.Client(),
        producer = new Producer(client);
    return producer;
};

function survey(socket) {
    var index = 0;
    app.models.Survey.find({}, function(err, data) {
        /*var questions = data[0]._questions;
        setInterval(function setQuesion() {
            socket.emit('question', questions[index % (questions.length)]);
            index++;
            return setQuesion;
        }(), 4000);
        */
    });
    socket.on('answer', function(answerData) {
        var producer = getProducer();
        payloads = [{
            'topic': 'test',
            'messages': (_.values(answerData.answer)).toString()
        }];
        producer.on('ready', function() {
            producer.send(payloads, function(err, data) {
                console.log(err);
                console.log(data);
            });
        });
        console.log(answerData);
    });
};
module.exports = survey;