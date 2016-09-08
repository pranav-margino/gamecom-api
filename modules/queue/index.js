var kafka = require('kafka-node');
var _ = require('lodash');

function getProducer() {
    var Producer = kafka.Producer,
        client = new kafka.Client("192.168.0.3:2181"),
        producer = new Producer(client);
    return producer;
};

function queue() {
    var isReady = false;
    var producer = getProducer();

    producer.on('ready', function() {
        isReady = true;
    });

    producer.on('error', function(error) {
        isReady = false;
    });

    return {
        push: function(topic, data) {
            if (!producer) {
                console.log('Failed to get producer');
                return;
            }
            if (isReady) {
                producer.send([{ topic: topic, messages: [data] }], function(err, data) {
                    console.log(err);
                    console.log(data);
                });
            }
        }
    }
}
module.exports = queue;
